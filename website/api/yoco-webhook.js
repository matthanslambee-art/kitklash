/* Vercel Serverless Function (Node.js runtime): website/api/yoco-webhook.js

   Receives Yoco's webhook the moment a payment actually succeeds, verifies it
   really came from Yoco, then emails the order details to the shop. This is
   the ONLY reliable "an order was paid for" signal — never trust the browser
   redirect back to checkout-success.html on its own, since a customer could
   land there without actually paying (closed tab, network issue, etc.).

   Setup (once you have a Yoco account):
     1. In the Yoco dashboard, add a webhook subscription pointing to:
          https://<your-domain>/api/yoco-webhook
        for the payment-succeeded event. Yoco will give you a signing secret
        that looks like "whsec_...".
     2. Set these environment variables in the Vercel project dashboard:
          YOCO_SECRET_KEY        — same key used by create-checkout.js
          YOCO_WEBHOOK_SECRET    — the whsec_... secret from step 1
          WEB3FORMS_ACCESS_KEY   — free key from https://web3forms.com
                                   (enter kitklashshop@gmail.com, no account needed)
          NOTIFICATION_EMAIL     — kitklashshop@gmail.com

   Note: Yoco's webhook "ping" payload isn't guaranteed to carry the full order
   details inline, so this handler re-fetches the authoritative checkout record
   by ID from Yoco's API after verifying the signature, rather than trusting
   whatever fields happen to be on the webhook body itself. Double-check the
   GET /api/checkouts/{id} endpoint against Yoco's API explorer once you have
   real test keys — it wasn't confirmable from the public docs during this
   build and is the one piece of this integration worth verifying by hand.
*/

const crypto = require("crypto");

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const webhookSecret = process.env.YOCO_WEBHOOK_SECRET;
  const yocoSecretKey = process.env.YOCO_SECRET_KEY;
  if (!webhookSecret || !yocoSecretKey) {
    console.error("Yoco webhook received but YOCO_WEBHOOK_SECRET / YOCO_SECRET_KEY isn't set.");
    res.status(500).end();
    return;
  }

  const rawBody = await readRawBody(req);

  const webhookId = req.headers["webhook-id"];
  const webhookTimestamp = req.headers["webhook-timestamp"];
  const webhookSignature = req.headers["webhook-signature"];

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    res.status(400).end();
    return;
  }

  try {
    const secretBytes = Buffer.from(webhookSecret.replace(/^whsec_/, ""), "base64");
    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const expectedSignature = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");

    const receivedSignatures = webhookSignature.split(" ").map(s => s.split(",")[1]).filter(Boolean);
    const isValid = receivedSignatures.some(sig => {
      try {
        return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSignature));
      } catch {
        return false;
      }
    });

    if (!isValid) {
      res.status(401).end();
      return;
    }

    const event = JSON.parse(rawBody);
    const checkoutId = event.payload?.id || event.payload?.checkoutId || event.id;

    if (!checkoutId) {
      res.status(200).end(); // acknowledge — nothing actionable
      return;
    }

    // Fetch the authoritative checkout record rather than trusting the ping's own fields.
    const checkoutRes = await fetch(`https://payments.yoco.com/api/checkouts/${checkoutId}`, {
      headers: { Authorization: `Bearer ${yocoSecretKey}` }
    });
    const checkout = await checkoutRes.json();

    if (checkout.status !== "completed" && checkout.status !== "succeeded") {
      res.status(200).end(); // not a successful payment — nothing to notify
      return;
    }

    await notifyOrderPaid(checkout);
    res.status(200).end();
  } catch (err) {
    console.error("Yoco webhook error:", err);
    res.status(500).end();
  }
}

/* Signature verification needs the exact bytes Yoco sent, so we take over body
   parsing ourselves instead of using Vercel's default JSON parsing — re-serializing
   an already-parsed object would not byte-for-byte match the original request and
   would make every signature check fail. This must be set on the function that's
   actually exported below, not reassigned afterward, or Vercel won't see it. */
handler.config = {
  api: { bodyParser: false }
};

module.exports = handler;

async function notifyOrderPaid(checkout) {
  const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
  const notifyEmail = process.env.NOTIFICATION_EMAIL || "kitklashshop@gmail.com";
  if (!accessKey) {
    console.error("Order paid but WEB3FORMS_ACCESS_KEY isn't set — no notification sent.", checkout.id);
    return;
  }

  const meta = checkout.metadata || {};
  const amount = ((checkout.amount || 0) / 100).toFixed(2);

  await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: accessKey,
      subject: `New Paid Order — R${amount}`,
      to: notifyEmail,
      from_name: meta.customerName || "KITKLASH Order",
      email: meta.customerEmail || notifyEmail,
      Phone: meta.customerPhone || "—",
      "Delivery Address": meta.deliveryAddress || "—",
      Order: meta.orderSummary || "—",
      Amount: `R${amount}`,
      "Checkout ID": checkout.id
    })
  }).catch(err => console.error("Failed to send order notification email:", err));
}
