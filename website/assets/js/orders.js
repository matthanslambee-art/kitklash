/* KITKLASH orders — backed by a real database (Cloudflare D1) via /api/orders, and also
   sent directly to the shop's WhatsApp as the real-time order notification channel.
   Mirrors assets/js/requests.js. Payment is arranged manually over WhatsApp for now. */

const ORDERS_WHATSAPP_NUMBER = "27608006616";

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
  if (!res.ok) throw new Error("Failed to save order");
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

/* Builds a wa.me link pre-filled with the order details. The customer still
   has to hit Send in WhatsApp themselves — no link can do that automatically. */
function buildOrderWhatsAppLink(order) {
  const lines = [
    "New Order — KITKLASH",
    "",
    `Name: ${order.firstName} ${order.surname}`.trim(),
    `Email: ${order.email}`,
    order.phone ? `Phone: ${order.phone}` : null,
    `Delivery Address: ${order.address}`,
    "",
    "Items:",
    ...order.items.map(line => `- ${line}`),
    "",
    `Total: ${order.total}`
  ].filter(line => line !== null);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${ORDERS_WHATSAPP_NUMBER}?text=${text}`;
}
