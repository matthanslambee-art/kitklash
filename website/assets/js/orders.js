/* KITKLASH orders — captured to localStorage as an admin backup log, and sent
   directly to the shop's WhatsApp as the real order notification channel.
   Mirrors assets/js/requests.js. Payment is arranged manually over WhatsApp
   for now; the Yoco-based card checkout (api/create-checkout.js,
   api/yoco-webhook.js) is built and ready for whenever that's switched on. */

const ORDERS_STORAGE_KEY = "kitklash_orders";
const ORDERS_WHATSAPP_NUMBER = "27608006616";

function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_STORAGE_KEY)) || [];
  } catch (e) {
    console.error("Failed to parse saved orders", e);
    return [];
  }
}

function saveOrdersList(list) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
}

function saveNewOrder(order) {
  const list = getOrders();
  const record = {
    id: "order-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    status: "new",
    ...order
  };
  list.unshift(record);
  saveOrdersList(list);
  return record;
}

function updateOrderStatus(id, status) {
  const list = getOrders();
  const item = list.find(o => o.id === id);
  if (item) {
    item.status = status;
    saveOrdersList(list);
  }
}

function deleteOrder(id) {
  saveOrdersList(getOrders().filter(o => o.id !== id));
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
