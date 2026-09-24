/* KITKLASH orders — backed by a real database (Cloudflare D1) via /api/orders.
   Checkout payment runs through Yoco's hosted Checkout API (createYocoCheckout);
   an order is only marked "paid" once the Worker's Yoco webhook confirms it
   server-side (website/worker.js), never from the client-side redirect alone. */

async function getOrders() {
  const res = await fetch("/api/orders", { headers: { "X-Admin-Key": getAdminKey() } });
  if (!res.ok) {
    console.error("Failed to load orders", await res.text().catch(() => ""));
    return [];
  }
  return res.json();
}

async function saveNewOrder(order) {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(order)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to save order");
  }
  return res.json();
}

async function updateOrderStatus(id, status) {
  await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Admin-Key": getAdminKey() },
    body: JSON.stringify({ status })
  });
}

async function deleteOrder(id) {
  await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-Admin-Key": getAdminKey() }
  });
}

/* Creates a Yoco hosted checkout session for an already-saved order and
   returns its redirectUrl. The Worker looks up the order's server-computed
   total itself — it never trusts a client-supplied amount. */
async function createYocoCheckout(orderId) {
  const res = await fetch("/api/yoco/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId })
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to start Yoco checkout");
  }
  return res.json();
}
