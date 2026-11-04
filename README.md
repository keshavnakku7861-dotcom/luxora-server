# luxora-server

Luxora's chat API. Runs as a **Cloudflare Worker** (Workers Free plan: email sign-up, no credit card) or as a plain Node server (`npm start`, uses `PORT`).

- `GET /healthz` returns `{"ok":true}`
- `POST /api/chat` with `{ "message": "...", "last": ["product-id"] }` returns `{ reply, products, ... }`
- `GET /api/products`, `GET /api/deals`
- CORS: only `https://keshavnakku7861-dotcom.github.io` (add more with the `ALLOWED_ORIGINS` variable, comma separated)
- No secrets, no database, no runtime dependencies.

## Deploy to Cloudflare Workers (free, no card)

1. Sign up at https://dash.cloudflare.com/sign-up with an email and password, then confirm the verification email. No payment method is asked for the Workers Free plan.
2. Create an API token: dashboard -> Manage account -> Account API tokens -> Create Token -> "Edit Cloudflare Workers" template, limited to your account. Copy the token and your Account ID.
3. From this folder:

```bash
npm install
export CLOUDFLARE_API_TOKEN=...      # the token from step 2
export CLOUDFLARE_ACCOUNT_ID=...     # your account id
npx wrangler deploy                  # prints https://luxora-api.<your-subdomain>.workers.dev
curl https://luxora-api.<your-subdomain>.workers.dev/healthz
```

(The first deploy registers your free `workers.dev` subdomain; with a token you can also do that once in the dashboard under Workers & Pages.)

Local test without an account: `npm run dev` then `curl localhost:8787/healthz`.

Products and prices are real and were checked on Nov 3, 2026; they can change. Luxora sells nothing; see the retailer links in `products.js`.
