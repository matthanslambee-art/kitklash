/* KITKLASH jersey requests — captured to localStorage as an admin backup log,
   and sent directly to the shop's WhatsApp as the real notification channel. */

const REQUESTS_STORAGE_KEY = "kitklash_requests";
const WHATSAPP_NUMBER = "27608006616";

function getRequests() {
  try {
    return JSON.parse(localStorage.getItem(REQUESTS_STORAGE_KEY)) || [];
  } catch (e) {
    console.error("Failed to parse saved jersey requests", e);
    return [];
  }
}

function saveRequestsList(list) {
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(list));
}

function saveNewRequest(request) {
  const list = getRequests();
  const record = {
    id: "req-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    status: "new",
    ...request
  };
  list.unshift(record);
  saveRequestsList(list);
  return record;
}

function updateRequestStatus(id, status) {
  const list = getRequests();
  const item = list.find(r => r.id === id);
  if (item) {
    item.status = status;
    saveRequestsList(list);
  }
}

function deleteRequest(id) {
  saveRequestsList(getRequests().filter(r => r.id !== id));
}

/* Builds a wa.me link pre-filled with the request details. The customer still
   has to hit Send in WhatsApp themselves — no link can do that automatically. */
function buildRequestWhatsAppLink(record) {
  const lines = [
    "New Jersey Request — KITKLASH",
    "",
    `Name: ${record.firstName} ${record.surname}`.trim(),
    `Email: ${record.email}`,
    record.contact ? `Contact: ${record.contact}` : null,
    "",
    `Team: ${record.team}`,
    record.year ? `Year: ${record.year}` : null,
    record.size ? `Size: ${record.size}` : null,
    "",
    `Notes: ${record.notes || "—"}`
  ].filter(line => line !== null);

  const text = encodeURIComponent(lines.join("\n"));
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
