require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const port = Number(process.env.PORT || 3000);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure backend/.env first.");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://127.0.0.1:5500" }));
app.use(express.json({ limit: "20kb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.get("/api/products", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("products").select("*").order("id");
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
});

app.post("/api/products", async (req, res, next) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const price = Number(req.body.price);
    if (!name || name.length > 100 || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "Name is required (up to 100 characters) and price must be greater than zero." });
    }
    const { data, error } = await supabase.from("products")
      .insert({ name, price }).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
});

app.put("/api/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const price = Number(req.body.price);
    if (!Number.isInteger(id) || id < 1 || !name || name.length > 100 || !Number.isFinite(price) || price <= 0) {
      return res.status(400).json({ error: "Provide a valid product ID, name, and positive price." });
    }
    const { data, error } = await supabase.from("products")
      .update({ name, price }).eq("id", id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Product not found." });
    res.json(data);
  } catch (error) { next(error); }
});

app.delete("/api/products/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid product ID." });
    const { data, error } = await supabase.from("products").delete().eq("id", id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch (error) { next(error); }
});

app.get("/api/sales", async (req, res, next) => {
  try {
    const { data, error } = await supabase.from("sales")
      .select("id, product_id, quantity, total, created_at, products(name)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    res.json(data.map(s => ({
      id: s.id, product_id: s.product_id, quantity: s.quantity,
      total: s.total, created_at: s.created_at,
      product_name: s.products ? s.products.name : "Deleted product"
    })));
  } catch (error) { next(error); }
});

app.post("/api/sales", async (req, res, next) => {
  try {
    const product_id = Number(req.body.product_id);
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(product_id) || product_id < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100000) {
      return res.status(400).json({ error: "Choose a valid product and a whole-number quantity between 1 and 100000." });
    }
    const { data: product, error: productError } = await supabase
      .from("products").select("id, name, price").eq("id", product_id).maybeSingle();
    if (productError) throw productError;
    if (!product) return res.status(400).json({ error: "That product does not exist." });

    const total = Math.round(Number(product.price) * quantity * 100) / 100;
    const { data, error } = await supabase.from("sales")
      .insert({ product_id, quantity, total }).select().single();
    if (error) throw error;
    res.status(201).json({ ...data, product_name: product.name });
  } catch (error) { next(error); }
});

app.delete("/api/sales/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "Invalid sale ID." });
    const { data, error } = await supabase.from("sales").delete().eq("id", id).select().maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: "Sale not found." });
    res.json({ message: "Sale deleted." });
  } catch (error) { next(error); }
});

app.use((req, res) => res.status(404).json({ error: "API route not found." }));

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "Server or database error. Check the backend terminal and Supabase setup." });
});

app.listen(port, () => console.log(`Sales Dashboard API listening on http://localhost:${port}`));
