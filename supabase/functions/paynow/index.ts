// ZimSmartMeter · PayNow via ManishaPay
// PayNow's edge filters Supabase's egress IPs, so the PayNow lane routes
// through ManishaPay (provider: "paynow") — which runs on infrastructure
// PayNow accepts. Money moves on PayNow rails; the transport is the
// merchant's own gateway. The raw-protocol reference implementation
// lives in ../paynow-direct.
//
// Secrets: MANISHAPAY_API_KEY (mp_test_* for the demo), optional
// MANISHAPAY_BASE.

import { createClient } from "jsr:@supabase/supabase-js@2";

const MANISHAPAY_BASE =
  Deno.env.get("MANISHAPAY_BASE") ?? "https://manishapay.netlify.app/api";
const MANISHAPAY_API_KEY = Deno.env.get("MANISHAPAY_API_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (!MANISHAPAY_API_KEY) {
    return json({ error: "gateway_not_configured" }, 500);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: {
      headers: { Authorization: req.headers.get("Authorization") ?? "" },
    },
  });
  const svc = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const {
    data: { user },
  } = await anon.auth.getUser();
  if (!user) return json({ error: "not_authenticated" }, 401);

  let body: { action?: string; payment_ref?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "bad_request" }, 400);
  }
  const { action, payment_ref } = body;
  if (!action || !payment_ref) return json({ error: "bad_request" }, 400);

  const { data: payment } = await svc
    .from("payments")
    .select("id, user_id, payment_ref, amount_usd, status, method")
    .eq("payment_ref", payment_ref)
    .maybeSingle();

  if (!payment || payment.user_id !== user.id) {
    return json({ error: "payment_not_found" }, 404);
  }
  if (payment.method !== "paynow") {
    return json({ error: "not_gateway" }, 400);
  }

  if (action === "initiate") {
    if (payment.status !== "pending") {
      return json({ error: "not_pending" }, 409);
    }
    const res = await fetch(`${MANISHAPAY_BASE}/v1/pay`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MANISHAPAY_API_KEY}`,
        "Content-Type": "application/json",
        "Idempotency-Key": payment.payment_ref,
      },
      body: JSON.stringify({
        provider: "paynow",
        reference: payment.payment_ref,
        amount: Number(payment.amount_usd).toFixed(2),
        description: `ZimSmartMeter PayNow credit ${payment.payment_ref}`,
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || !out?.data) {
      // ManishaPay nests reasons: { error: { code, message, resolution } }.
      const e = out?.error ?? {};
      console.error("[gateway] initiate failed", res.status, JSON.stringify(out).slice(0, 500));
      return json(
        {
          error: e.message ?? out?.message ?? "gateway_error",
          code: e.code,
          resolution: e.resolution,
          upstream_status: res.status,
          requestId: out?.requestId,
        },
        502,
      );
    }
    return json({
      ok: true,
      browser_url: out.data.browser_url ?? null,
      instructions: out.data.instructions ?? null,
      status: out.data.status_normalized ?? out.data.status ?? "pending",
    });
  }

  if (action === "status") {
    if (payment.status !== "pending") {
      const { data } = await svc.rpc("settle_gateway_payment", {
        p_payment_ref: payment.payment_ref,
        p_outcome: payment.status === "succeeded" ? "paid" : "failed",
      });
      return json({ settled: true, outcome: payment.status, receipt: data });
    }

    const res = await fetch(
      `${MANISHAPAY_BASE}/v1/pay/${encodeURIComponent(payment.payment_ref)}/status`,
      { headers: { Authorization: `Bearer ${MANISHAPAY_API_KEY}` } },
    );
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      const e = out?.error ?? {};
      console.error("[gateway] status failed", res.status, JSON.stringify(out).slice(0, 500));
      return json(
        {
          error: e.message ?? out?.message ?? "gateway_error",
          code: e.code,
          resolution: e.resolution,
          upstream_status: res.status,
          requestId: out?.requestId,
        },
        502,
      );
    }

    const d = out?.data ?? {};
    const normalized = String(d.status_normalized ?? d.status ?? "pending")
      .toLowerCase();
    const outcome =
      normalized === "paid"
        ? "paid"
        : ["failed", "cancelled", "disputed"].includes(normalized)
          ? "failed"
          : "pending";
    const providerRef: string | null =
      d.paynow_reference ?? d.tracker ?? null;

    if (outcome !== "pending") {
      const { data, error } = await svc.rpc("settle_gateway_payment", {
        p_payment_ref: payment.payment_ref,
        p_outcome: outcome,
        p_provider_ref: providerRef,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ settled: true, outcome, receipt: data });
    }

    return json({ settled: false, outcome: d.status ?? "pending" });
  }

  return json({ error: "unknown_action" }, 400);
}

Deno.serve(async (req) => {
  try {
    return await handle(req);
  } catch (e) {
    return json(
      { error: "unhandled: " + (e instanceof Error ? e.message : String(e)) },
      500,
    );
  }
});
