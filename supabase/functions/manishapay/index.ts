// ZimSmartMeter · ManishaPay Edge Function
// The ONLY holder of the ManishaPay API key. The browser never sees it.
//
// Actions (POST JSON { action, payment_ref }):
//   initiate → verifies the caller owns the pending payment, re-reads the
//              amount from the database (never from the client), creates a
//              ManishaPay checkout with OUR payment_ref as the reference,
//              returns { browser_url }.
//   status   → asks ManishaPay for the canonical status; on paid/failed,
//              settles atomically via settle_gateway_payment (service role)
//              and returns the receipt.
//
// Secrets (set with `supabase secrets set`):
//   MANISHAPAY_API_KEY   — mp_test_* for the demo (simulated mode),
//                          mp_live_* only for a real deployment.
//   MANISHAPAY_BASE      — optional, defaults to the hosted API.

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

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
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

  // Ownership check before anything touches the gateway.
  const { data: payment } = await svc
    .from("payments")
    .select("id, user_id, payment_ref, amount_usd, status, method")
    .eq("payment_ref", payment_ref)
    .maybeSingle();

  if (!payment || payment.user_id !== user.id) {
    return json({ error: "payment_not_found" }, 404);
  }
  if (payment.method !== "manishapay") {
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
        reference: payment.payment_ref,
        amount: Number(payment.amount_usd).toFixed(2),
        description: `ZimSmartMeter demo credit ${payment.payment_ref}`,
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
    // Fast path: already settled locally — return the truthful state.
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
    // A crash must still answer with CORS and a name — never a bare 500.
    return json(
      { error: "unhandled: " + (e instanceof Error ? e.message : String(e)) },
      500,
    );
  }
});
