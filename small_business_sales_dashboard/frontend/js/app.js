const API_BASE = "http://localhost:3000/api";

const productForm = document.querySelector("#productForm");
const saleForm = document.querySelector("#saleForm");
const productsTable = document.querySelector("#productsTable");
const salesTable = document.querySelector("#salesTable");
const saleProduct = document.querySelector("#saleProduct");
const globalMessage = document.querySelector("#globalMessage");
let products = [];
let sales = [];

function showMessage(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed. Check that the backend is running.");
  return data;
}

function money(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(Number(value || 0));
}

async function loadProducts() {
  productsTable.innerHTML = '<tr><td colspan="3">Loading products…</td></tr>';
  try {
    products = await apiRequest("/products");
    renderProducts();
    renderProductOptions();
    document.querySelector("#productCount").textContent = products.length;
  } catch (error) {
    productsTable.innerHTML = '<tr><td colspan="3">Could not load products.</td></tr>';
    showMessage(globalMessage, error.message, true);
  }
}

function renderProducts() {
  if (!products.length) {
    productsTable.innerHTML = '<tr><td colspan="3">No products yet. Add one above.</td></tr>';
    return;
  }
  productsTable.innerHTML = products.map(product => `
    <tr>
      <td>${escapeHtml(product.name)}</td>
      <td>${money(product.price)}</td>
      <td>
        <button class="secondary" data-edit-product="${product.id}">Edit</button>
        <button class="delete" data-delete-product="${product.id}">Delete</button>
      </td>
    </tr>`).join("");
}

function renderProductOptions() {
  saleProduct.innerHTML = '<option value="">Choose a product</option>' +
    products.map(p => `<option value="${p.id}">${escapeHtml(p.name)} — ${money(p.price)}</option>`).join("");
}

async function loadSales() {
  salesTable.innerHTML = '<tr><td colspan="5">Loading sales…</td></tr>';
  try {
    sales = await apiRequest("/sales");
    renderSales();
    document.querySelector("#salesCount").textContent = sales.length;
    document.querySelector("#totalRevenue").textContent = money(sales.reduce((sum, sale) => sum + Number(sale.total), 0));
  } catch (error) {
    salesTable.innerHTML = '<tr><td colspan="5">Could not load sales.</td></tr>';
    showMessage(globalMessage, error.message, true);
  }
}

function renderSales() {
  const term = document.querySelector("#salesSearch").value.trim().toLowerCase();
  const filtered = sales.filter(s => String(s.product_name || "").toLowerCase().includes(term));
  if (!filtered.length) {
    salesTable.innerHTML = '<tr><td colspan="5">No matching sales found.</td></tr>';
    return;
  }
  salesTable.innerHTML = filtered.map(sale => `
    <tr>
      <td>${escapeHtml(sale.product_name || "Product")}</td>
      <td>${sale.quantity}</td>
      <td>${money(sale.total)}</td>
      <td>${new Date(sale.created_at).toLocaleString()}</td>
      <td><button class="delete" data-delete-sale="${sale.id}">Delete</button></td>
    </tr>`).join("");
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[char]);
}

productForm.addEventListener("submit", async event => {
  event.preventDefault();
  const name = document.querySelector("#productName").value.trim();
  const price = Number(document.querySelector("#productPrice").value);
  if (!name || !Number.isFinite(price) || price <= 0) {
    showMessage(document.querySelector("#productMessage"), "Enter a product name and a price greater than zero.", true);
    return;
  }
  try {
    await apiRequest("/products", { method: "POST", body: JSON.stringify({ name, price }) });
    productForm.reset();
    showMessage(document.querySelector("#productMessage"), "Product added successfully.");
    await loadProducts();
  } catch (error) {
    showMessage(document.querySelector("#productMessage"), error.message, true);
  }
});

productsTable.addEventListener("click", async event => {
  const editId = event.target.dataset.editProduct;
  const deleteId = event.target.dataset.deleteProduct;
  if (editId) {
    const product = products.find(p => String(p.id) === editId);
    const name = prompt("Product name:", product.name);
    if (name === null) return;
    const priceText = prompt("Selling price:", product.price);
    if (priceText === null) return;
    const price = Number(priceText);
    if (!name.trim() || !Number.isFinite(price) || price <= 0) {
      showMessage(globalMessage, "Enter a name and a price greater than zero.", true);
      return;
    }
    try {
      await apiRequest(`/products/${editId}`, { method: "PUT", body: JSON.stringify({ name: name.trim(), price }) });
      showMessage(globalMessage, "Product updated.");
      await loadProducts();
    } catch (error) { showMessage(globalMessage, error.message, true); }
  }
  if (deleteId && confirm("Delete this product? Products linked to sales may not be deletable.")) {
    try {
      await apiRequest(`/products/${deleteId}`, { method: "DELETE" });
      showMessage(globalMessage, "Product deleted.");
      await loadProducts();
    } catch (error) { showMessage(globalMessage, error.message, true); }
  }
});

saleForm.addEventListener("submit", async event => {
  event.preventDefault();
  const product_id = Number(saleProduct.value);
  const quantity = Number(document.querySelector("#saleQuantity").value);
  if (!product_id || !Number.isInteger(quantity) || quantity < 1) {
    showMessage(document.querySelector("#saleMessage"), "Choose a product and enter a whole-number quantity of at least 1.", true);
    return;
  }
  try {
    await apiRequest("/sales", { method: "POST", body: JSON.stringify({ product_id, quantity }) });
    showMessage(document.querySelector("#saleMessage"), "Sale recorded successfully.");
    await loadSales();
  } catch (error) {
    showMessage(document.querySelector("#saleMessage"), error.message, true);
  }
});

salesTable.addEventListener("click", async event => {
  const id = event.target.dataset.deleteSale;
  if (!id || !confirm("Delete this sale record?")) return;
  try {
    await apiRequest(`/sales/${id}`, { method: "DELETE" });
    showMessage(globalMessage, "Sale deleted.");
    await loadSales();
  } catch (error) { showMessage(globalMessage, error.message, true); }
});

document.querySelector("#salesSearch").addEventListener("input", renderSales);
document.querySelector("#refreshButton").addEventListener("click", async () => {
  await loadProducts();
  await loadSales();
});

loadProducts();
loadSales();
