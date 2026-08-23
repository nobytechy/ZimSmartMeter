# Deploying ZimSmartMeter

The repo is deploy-ready: `netlify.toml` carries the build command, publish
directory and SPA redirect. This runbook is everything else, in order.
No secret ever belongs in this repository — secrets live in Netlify env
vars and Supabase's secret store only.

## 1 · Netlify (frontend)

1. Netlify → **Add new site → Import an existing project** → pick
   `nobytechy/ZimSmartMeter` on GitHub.
2. Build settings are read from `netlify.toml` automatically
   (`npm run build`, publish `dist`).
3. **Site settings → Environment variables** — add:

   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | the anon key (safe in the browser — RLS enforces) |

4. Deploy. Note the site URL — call it `https://<site>.netlify.app`.

## 2 · Supabase secrets (Edge Functions)

From the repo root, logged in and linked
(`npx supabase login` · `npx supabase link --project-ref <ref>`):

```bash
npx supabase secrets set \
  PAYNOW_INTEGRATION_ID=<id> \
  PAYNOW_INTEGRATION_KEY=<key> \
  PAYNOW_MERCHANT_EMAIL=<merchant login email> \
  MANISHAPAY_API_KEY=<mp_test_...> \
  APP_URL=https://<site>.netlify.app
```

Test-mode notes: only the PayNow **merchant account** can open the payment
page and fake a success, and `authemail` must be that account's email —
which is why `PAYNOW_MERCHANT_EMAIL` exists. Use an `mp_test_*` ManishaPay
key; both keep the demo's no-real-money promise.

## 3 · Deploy the functions

```bash
npx supabase functions deploy paynow
npx supabase functions deploy manishapay
```

## 4 · Smoke test the live site

1. Open `https://<site>.netlify.app` → landing renders, animation loops.
2. Sign in with a demo number (`+263 77 000 0001` / `123456`).
3. Claim a demo meter → buy **$5 instant** → balance moves, ledger grows.
4. Buy via **cash** → confirm → receipt.
5. Buy via **PayNow · direct** → checkout (merchant login) →
   *[TESTING: Faked Success]* → poller flips to the receipt.
6. Buy via **ManishaPay** → simulated checkout → receipt.
7. Open **Simulator** → Start device → dashboard balance ticks down live.
8. Install the PWA from the browser menu → airplane mode → last-known
   dashboard renders with the offline pill.

## 5 · Afterwards

- Put the live URL in the README (`Live demo` section) and tick the
  Netlify checkbox in the roadmap.
- Rotate any gateway key that ever travelled through a chat or email.
- Revoke the GitHub fine-grained token used during the build sessions.
