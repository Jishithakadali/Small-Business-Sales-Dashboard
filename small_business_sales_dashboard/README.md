# Small Business Sales Dashboard

A beginner-friendly full-stack MVP starter for managing products and recording sales.

## Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Database: Supabase (PostgreSQL)
- Version control: Git and GitHub

## Folder structure
```text
small_business_sales_dashboard/
├── frontend/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── .gitignore
├── database/schema.sql
├── README.md
└── .gitignore
```

## Setup
1. Install a current LTS version of Node.js and Git.
2. Create a Supabase project.
3. In Supabase SQL Editor, run `database/schema.sql`.
4. Open a terminal in `backend/` and run:
   ```bash
   npm install
   ```
5. Copy `backend/.env.example` to `backend/.env`.
6. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`. Keep these values private. Never commit `.env`.
7. Start the API from `backend/`:
   ```bash
   npm run dev
   ```
8. Serve `frontend/` using VS Code Live Server, typically at `http://127.0.0.1:5500`. If Live Server uses a different port, update `FRONTEND_ORIGIN` in `backend/.env` and restart the API.
9. Visit the frontend URL in your browser.

## Environment variables
- `PORT`: Express server port (default 3000)
- `FRONTEND_ORIGIN`: frontend origin allowed by CORS
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: privileged server-side key; keep secret

## API endpoints
- `GET /api/health` — check server
- `GET /api/products` — list products
- `POST /api/products` — add product (`name`, `price`)
- `PUT /api/products/:id` — update product (`name`, `price`)
- `DELETE /api/products/:id` — delete product
- `GET /api/sales` — list sales
- `POST /api/sales` — record sale (`product_id`, `quantity`)
- `DELETE /api/sales/:id` — delete sale

## Testing
- Check `http://localhost:3000/api/health` for `{"status":"ok"}`.
- Add a product through the frontend and verify it appears in Supabase.
- Record a sale and verify it appears in the `sales` table.
- Refresh the frontend to check persistence.
- Try invalid prices and quantities and confirm the app displays an error.
- Test layout at desktop and mobile widths.

## Important notes
- This is a starter project and has not been executed against your Supabase instance.
- The service-role key bypasses Row Level Security. It is kept server-side in this starter, but you must never expose it in frontend code or GitHub.
- The starter has no authentication and is intended for local development. Do not deploy it publicly as-is.
- Sales store a total at the time of recording. Editing a product's price later does not rewrite historical sales.
- Deleting products linked to sales is restricted by the database relationship.

## Developer
Add your name and individual contribution before submission.

## Screenshots
Add screenshots of the running dashboard here after testing.
