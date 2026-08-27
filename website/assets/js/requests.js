/* KITKLASH jersey requests — backed by a real database (Cloudflare D1) via /api/requests,
   and sent directly to the shop's WhatsApp as the real notification channel. */

const WHATSAPP_NUMBER = "27608006616";

async function getRequests() {
  const res = await fetch("/api/requests", { headers: { "X-Admin-Key": getAdminKey() } });
  if (!res.ok) {
    console.error("Failed to load jersey requests", await res.text().catch(() => ""));
    return [];
  }
  return res.json();
}

async function saveNewRequest(request) {
  const res = await fetch("/api/requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request)
  });
  if (!res.ok) throw new Error("Failed to save request");
  return res.json();
}

async function updateRequestStatus(id, status) {
  await fetch(`/api/requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Admin-Key": getAdminKey() },
    body: JSON.stringify({ status })
  });
}

async function deleteRequest(id) {
  await fetch(`/api/requests/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { "X-Admin-Key": getAdminKey() }
  });
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
