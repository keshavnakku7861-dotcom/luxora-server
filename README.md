# luxora-server

Dependency-free Node (>=18) API behind the Luxora assistant. No secrets, no database.

- `POST /api/chat` with `{ "message": "...", "last": ["product-id"] }` returns `{ reply, products, ... }`
- `GET /api/products`, `GET /api/deals`, `GET /healthz`
- CORS: allows `https://keshavnakku7861-dotcom.github.io` (add more with the `ALLOWED_ORIGINS` env var, comma separated)
- Listens on `PORT`

Render (free web service): Build command `npm install`, Start command `npm start`, health check path `/healthz`.

Products and prices are real and were checked on Nov 3, 2026; they can change. Luxora sells nothing; see the retailer links in `products.js`.
