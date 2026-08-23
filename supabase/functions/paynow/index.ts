// ZimSmartMeter · direct PayNow Edge Function
// The only place PayNow's integration key exists. Implements the raw
// protocol byte-for-byte per developers.paynow.co.zw:
//
//   OUTBOUND hash: join field VALUES in posted order (no URL-encoding),
//   append the integration key, SHA-512, uppercase hex.
//   INBOUND verify: join all values except `hash` in received order
//   (URL-decoded), append the key, SHA-512, uppercase, compare.
//   Never act on a message whose hash doesn't verify.
//
// Test mode notes (why the demo stays no-real-money):
//   · authemail MUST be the merchant account's login email.
//   · Only the merchant account can open browserurl and fake success.
//
// Secrets (supabase secrets set):
//   PAYNOW_INTEGRATION_ID · PAYNOW_INTEGRATION_KEY
//   PAYNOW_MERCHANT_EMAIL (test-mode authemail)
//   APP_URL (return url base, e.g. https://yourapp.netlify.app)

import { createClient } from "jsr:@supabase/supabase-js@2";

const PAYNOW_URL = "https://www.paynow.co.zw/interface/initiatetransaction";
const INTEGRATION_ID = Deno.env.get("PAYNOW_INTEGRATION_ID") ?? "";
const INTEGRATION_KEY = Deno.env.get("PAYNOW_INTEGRATION_KEY") ?? "";
const MERCHANT_EMAIL = Deno.env.get("PAYNOW_MERCHANT_EMAIL") ?? "";
const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";

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

async function sha512Upper(input: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-512",
    new TextEncoder().encode(input),
  );
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/** Outbound: hash = SHA512(values-in-order + key), uppercase. */
async function outboundHash(entries: [string, string][]): Promise<string> {
  return sha512Upper(entries.map(([, v]) => v).join("") + INTEGRATION_KEY);
}

/** Parse a PayNow urlencoded message preserving field order. */
function parseMessage(text: string): [string, string][] {
  return [...new URLSearchParams(text).entries()];
}

function field(entries: [string, string][], name: string): string | null {
  const hit = entries.find(([k]) => k.toLowerCase() === name);
  return hit ? hit[1] : null;
}

/** Inbound: recompute over every value except hash; constant order. */
async function verifyInbound(entries: [string, string][]): Promise<boolean> {
  const given = field(entries, "hash");
  if (!given) return false;
  const concat = entries
    .filter(([k]) => k.toLowerCase() !== "hash")
    .map(([, v]) => v)
    .join("");
  return (await sha512Upper(concat + INTEGRATION_KEY)) === given.toUpperCase();
}

function mapStatus(raw: string): "paid" | "failed" | "pending" {
  const s = raw.toLowerCase();
  if (s === "paid" || s === "awaiting delivery" || s === "delivered") {
    return "paid";
  }
  if (s === "cancelled" || s === "failed" || s === "disputed") {
    return "failed";
  }
  return "pending"; // Created / Sent / anything unknown stays pending
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (!INTEGRATION_ID || !INTEGRATION_KEY) {
    return json({ error: "gateway_not_configured" }, 500);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
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
    .select(
      "id, user_id, payment_ref, amount_usd, status, method, gateway_poll_url",
    )
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
    // Field ORDER is the hash — declared once, used for hash and body.
    const entries: [string, string][] = [
      ["id", INTEGRATION_ID],
      ["reference", payment.payment_ref],
      ["amount", Number(payment.amount_usd).toFixed(2)],
      ["additionalinfo", `ZimSmartMeter demo credit ${payment.payment_ref}`],
      ["returnurl", `${APP_URL}/app`],
      ["resulturl", `${APP_URL}/app`],
      ["authemail", MERCHANT_EMAIL],
      ["status", "Message"],
    ];
    entries.push(["hash", await outboundHash(entries)]);

    const res = await fetch(PAYNOW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(entries).toString(),
    });
    const reply = parseMessage(await res.text());
    const status = (field(reply, "status") ?? "").toLowerCase();

    if (status !== "ok") {
      return json(
        { error: field(reply, "error") ?? "paynow_error" },
        502,
      );
    }
    if (!(await verifyInbound(reply))) {
      // A response we cannot verify is a response we never act on.
      return json({ error: "hash_mismatch" }, 502);
    }

    const browserUrl = field(reply, "browserurl");
    const pollUrl = field(reply, "pollurl");
    await svc
      .from("payments")
      .update({ gateway_poll_url: pollUrl })
      .eq("id", payment.id);

    return json({ ok: true, browser_url: browserUrl, status: "pending" });
  }

  if (action === "status") {
    if (payment.status !== "pending") {
      const { data } = await svc.rpc("settle_gateway_payment", {
        p_payment_ref: payment.payment_ref,
        p_outcome: payment.status === "succeeded" ? "paid" : "failed",
      });
      return json({ settled: true, outcome: payment.status, receipt: data });
    }
    if (!payment.gateway_poll_url) {
      return json({ settled: false, outcome: "not_initiated" });
    }

    const res = await fetch(payment.gateway_poll_url);
    const reply = parseMessage(await res.text());
    if (!(await verifyInbound(reply))) {
      return json({ error: "hash_mismatch" }, 502);
    }

    const outcome = mapStatus(field(reply, "status") ?? "");
    const providerRef = field(reply, "paynowreference");

    if (outcome === "pending") {
      return json({ settled: false, outcome: field(reply, "status") });
    }

    const { data, error } = await svc.rpc("settle_gateway_payment", {
      p_payment_ref: payment.payment_ref,
      p_outcome: outcome,
      p_provider_ref: providerRef,
    });
    if (error) return json({ error: error.message }, 500);
    return json({ settled: true, outcome, receipt: data });
  }

  return json({ error: "unknown_action" }, 400);
});
