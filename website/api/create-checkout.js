/* Vercel Serverless Function (Node.js runtime): website/api/create-checkout.js
   Deployed automatically by Vercel from this file's path — no extra config needed
   as long as the Vercel project's Root Directory is set to `website/`.

   Creates a Yoco hosted checkout for the customer's cart and returns the
   redirect URL. This MUST run server-side (never in the browser) because it
   uses the Yoco secret key. Line-item prices are re-looked-up from the
   canonical product catalog rather than trusted from the browser, so a
   customer can't tamper with prices before paying.

   Required environment variables (set in the Vercel project dashboard):
     YOCO_SECRET_KEY  — from the Yoco dashboard, Developers > API Keys.
                        Use the *test* secret key until you're ready to go live.
*/

const { DEFAULT_PRODUCTS } = require("../assets/js/products.js");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const YOCO_SECRET_KEY = process.env.YOCO_SECRET_KEY;
  if (!YOCO_SECRET_KEY) {
    res.status(500).json({ error: "Payments aren't configured yet — missing YOCO_SECRET_KEY." });
    return;
  }

  try {
    const { items, customer } = req.body || {};

    if (!Array.isArray(items) || !items.length) {
      res.status(400).json({ error: "Your bag is empty." });
      return;
    }
    if (!customer || !customer.firstName || !customer.surname || !customer.email || !customer.address) {
      res.status(400).json({ error: "Missing required customer details." });
      return;
    }

    // Recompute pricing from the canonical catalog — never trust client-sent prices.
    const lineItems = [];
    let amountInCents = 0;
    for (const item of items) {
      const product = DEFAULT_PRODUCTS.find(p => p.slug === item.slug);
      if (!product) {
        res.status(400).json({
          error: `"${item.slug}" isn't in the live catalog yet, so it can't be purchased through card checkout. (Products added via the admin panel need to be exported into products.js and redeployed before they're purchasable here.)`
        });
        return;
      }
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      const priceInCents = Math.round(product.price * 100);
      amountInCents += priceInCents * qty;
      const variant = [item.size, item.version].filter(Boolean).join(" / ");
      lineItems.push({
        displayName: variant ? `${product.name} (${variant})` : product.name,
        quantity: qty,
        pricingDetails: { price: priceInCents }
      });
    }

    const origin = `https://${req.headers.host}`;

    const yocoRes = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${YOCO_SECRET_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: amountInCents,
        currency: "ZAR",
        successUrl: `${origin}/checkout-success.html`,
        cancelUrl: `${origin}/checkout.html`,
        failureUrl: `${origin}/checkout.html`,
        lineItems,
        metadata: {
          customerName: `${customer.firstName} ${customer.surname}`.trim(),
          customerEmail: customer.email,
          customerPhone: customer.phone || "",
          deliveryAddress: customer.address,
          orderSummary: lineItems.map(li => `${li.quantity}x ${li.displayName}`).join(" | ")
        }
      })
    });

    const data = await yocoRes.json();
    if (!yocoRes.ok || !data.redirectUrl) {
      res.status(502).json({ error: (data && data.message) || "Yoco couldn't start this checkout." });
      return;
    }

    res.status(200).json({ redirectUrl: data.redirectUrl });
  } catch (err) {
    res.status(500).json({ error: "Something went wrong starting checkout." });
  }
};
