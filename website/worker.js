/* KITKLASH API worker — handles /api/* only (see wrangler.jsonc assets.run_worker_first).
   Every other request is served directly from static assets, never touching this file. */

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "geolocation=(), microphone=(), camera=()",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...SECURITY_HEADERS }
  });
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

/* Fixed-window counter in KV. Not a hard security boundary — KV is eventually
   consistent across Cloudflare's edge, so this is a deterrent against casual
   single-source scripted abuse, not a guarantee against a determined,
   distributed attacker. */
async function rateLimit(env, bucket, key, limit, windowSeconds) {
  const kvKey = `rl:${bucket}:${key}`;
  const current = Number(await env.RATE_LIMIT.get(kvKey)) || 0;
  if (current >= limit) return false;
  await env.RATE_LIMIT.put(kvKey, String(current + 1), { expirationTtl: windowSeconds });
  return true;
}

async function isAdmin(request, env) {
  const key = request.headers.get("X-Admin-Key");
  if (!key) return false;

  // Per-IP lockout after repeated failures — checked before the real key is
  // even fetched, so a scripted brute-force attempt against any admin route
  // gets throttled. Threshold is generous (10 failures / 15 min) because
  // admin.html itself calls this on every page load and login attempt.
  const lockKey = `rl:admin-fail:${getClientIp(request)}`;
  const fails = Number(await env.RATE_LIMIT.get(lockKey)) || 0;
  if (fails >= 10) return false;

  const adminKey = await env.ADMIN_KEY.get();
  const ok = !!adminKey && key.length === adminKey.length && timingSafeEqual(key, adminKey);
  if (!ok) await env.RATE_LIMIT.put(lockKey, String(fails + 1), { expirationTtl: 900 });
  return ok;
}

function rowToProduct(row) {
  return {
    ...row,
    pricing: row.pricing ? JSON.parse(row.pricing) : undefined,
    customizable: !!row.customizable,
    onHand: !!row.onHand,
    latestDrop: !!row.latestDrop,
    soldOut: !!row.soldOut,
    sizes: row.sizes ? JSON.parse(row.sizes) : [],
    gallery: row.gallery ? JSON.parse(row.gallery) : [],
    versions: row.versions ? JSON.parse(row.versions) : undefined
  };
}

function rowToRecord(row, arrayFields) {
  const out = { ...row };
  arrayFields.forEach(f => {
    out[f] = row[f] ? JSON.parse(row[f]) : [];
  });
  return out;
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const VERSION_LABELS = { fan: "Fan Version", player: "Player Version", jersey: "Jersey Only", set: "Full Set" };
function versionLabel(v) { return VERSION_LABELS[v] || v; }
function sleeveLabel(s) { return s === "long" ? "Long Sleeve" : "Short Sleeve"; }
function clampStr(v, max) { return String(v ?? "").trim().slice(0, max); }
const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
const SHIPPING_FLAT = 100; // flat nationwide shipping, in Rand, added once per order

/* Recomputes one cart line's price + description from a TRUSTED D1 product row
   (never from client input) — the client-supplied price/description used to be
   trusted verbatim, which let a customer set their own order total. Mirrors
   assets/js/main.js cartItemUnitPrice() and checkout.html's old itemLines
   builder. Throws on any invalid slug/qty/version/sleeve; caller turns that
   into a 400. */
function priceCartItem(item, product) {
  if (!product) throw new Error("One of the items in your bag is no longer available.");
  const qty = Number(item.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > 20) throw new Error("Invalid quantity.");

  let unit;
  const variantParts = [item.size ? clampStr(item.size, 10) : null];
  if (product.pricing) {
    const version = item.version, sleeve = item.sleeve;
    if (!version || !product.pricing[version]) throw new Error("Invalid version selected.");
    if (!sleeve || typeof product.pricing[version][sleeve] !== "number") throw new Error("Invalid sleeve option selected.");
    unit = product.pricing[version][sleeve];
    variantParts.push(versionLabel(version), sleeveLabel(sleeve));
  } else {
    unit = Number(product.price) || 0;
  }

  let patchDesc = null, custom = null;
  if (item.patch && typeof item.patch === "object") {
    const desc = clampStr(item.patch.description, 60);
    if (desc) { unit += 50; patchDesc = desc; }
  }
  if (item.customization && typeof item.customization === "object") {
    const name = clampStr(item.customization.name, 40);
    const number = clampStr(item.customization.number, 10);
    if (name && number) { unit += 100; custom = { name, number }; }
  }

  const addOns = [
    patchDesc ? `Patch: ${patchDesc}` : null,
    custom ? `Name/Number: ${custom.name} / ${custom.number}` : null
  ].filter(Boolean).join(", ");
  const lineTotal = unit * qty;
  const description = `${qty}x ${product.name} (${variantParts.filter(Boolean).join(" / ")})${addOns ? " + " + addOns : ""} — R${lineTotal.toLocaleString("en-ZA")}`;
  return { lineTotal, description };
}

function base64ToBytes(b64) {
  const binStr = atob(b64);
  const bytes = new Uint8Array(binStr.length);
  for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes) {
  let binStr = "";
  bytes.forEach(b => (binStr += String.fromCharCode(b)));
  return btoa(binStr);
}

/* Constant-time-ish comparison of two equal-length base64 signature strings —
   guards against timing attacks on the byte-by-byte compare itself (the
   length check is not constant-time, which is the standard accepted
   simplification since signature length never varies for a fixed algorithm). */
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

/* Verifies a Yoco webhook per their documented scheme: HMAC-SHA256 over
   "{webhook-id}.{webhook-timestamp}.{raw body}", keyed by the base64-decoded
   webhook secret (whsec_ prefix stripped). Rejects stale timestamps (>3 min)
   to block replay attacks. See developer.yoco.com webhook signature docs. */
async function verifyYocoSignature(request, rawBody, env) {
  const webhookId = request.headers.get("webhook-id");
  const timestamp = request.headers.get("webhook-timestamp");
  const signatureHeader = request.headers.get("webhook-signature");
  if (!webhookId || !timestamp || !signatureHeader) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - Number(timestamp)) > 180) return false;

  const secret = await env.YOCO_WEBHOOK_SECRET.get();
  const secretBytes = base64ToBytes(secret.replace(/^whsec_/, ""));
  const signedContent = `${webhookId}.${timestamp}.${rawBody}`;

  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
  const expectedSig = bytesToBase64(new Uint8Array(sigBuffer));

  // header format: space-separated "v1,<base64sig>" entries — check every listed signature
  const candidates = signatureHeader
    .split(" ")
    .map(s => s.split(",")[1])
    .filter(Boolean);
  return candidates.some(c => timingSafeEqual(c, expectedSig));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ---------------- Sitemap ----------------
      if (path === "/sitemap.xml" && method === "GET") {
        const staticPages = ["", "shop", "on-hand", "about", "request-jersey", "privacy", "reviews"];
        const { results } = await env.DB.prepare("SELECT slug FROM products").all();
        const urls = [
          ...staticPages.map(p => `https://kitklash.co.za/${p}`),
          ...results.map(r => `https://kitklash.co.za/product?slug=${encodeURIComponent(r.slug)}`)
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(u => `  <url><loc>${u.replace(/&/g, "&amp;")}</loc></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml", ...SECURITY_HEADERS } });
      }

      // ---------------- Image Uploads (R2) ----------------
      if (path === "/api/admin/upload-image" && method === "POST") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const form = await request.formData();
        const file = form.get("file");
        if (!file || typeof file === "string") return json({ error: "Missing file" }, 400);
        const slug = (form.get("slug") || "misc").toString().replace(/[^a-z0-9-]/gi, "-").toLowerCase() || "misc";
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
        const key = `uploads/${slug}/${Date.now()}-${safeName}`;
        await env.IMAGES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type || "application/octet-stream" } });
        return json({ url: `/${key}` });
      }

      if (path.startsWith("/uploads/") && method === "GET") {
        const key = decodeURIComponent(path.slice(1));
        const obj = await env.IMAGES.get(key);
        if (!obj) return json({ error: "Not found" }, 404);
        return new Response(obj.body, {
          headers: {
            "Content-Type": obj.httpMetadata?.contentType || "application/octet-stream",
            "Cache-Control": "public, max-age=31536000, immutable",
            ...SECURITY_HEADERS
          }
        });
      }

      // ---------------- Products ----------------
      if (path === "/api/products" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM products").all();
        return json(results.map(rowToProduct));
      }

      if (path === "/api/products" && (method === "POST" || method === "PUT")) {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const p = await request.json();
        if (!p.slug) return json({ error: "Missing slug" }, 400);
        await env.DB.prepare(`
          INSERT INTO products (slug, name, team, year, player, league, country, kitType, category, condition, price, pricing, customizable, badge, onHand, latestDrop, soldOut, sizes, img, gallery, story, brand, authenticity, versions)
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
          ON CONFLICT(slug) DO UPDATE SET
            name=excluded.name, team=excluded.team, year=excluded.year, player=excluded.player,
            league=excluded.league, country=excluded.country, kitType=excluded.kitType, category=excluded.category,
            condition=excluded.condition, price=excluded.price, pricing=excluded.pricing, customizable=excluded.customizable,
            badge=excluded.badge, onHand=excluded.onHand, latestDrop=excluded.latestDrop, soldOut=excluded.soldOut,
            sizes=excluded.sizes, img=excluded.img, gallery=excluded.gallery, story=excluded.story,
            brand=excluded.brand, authenticity=excluded.authenticity, versions=excluded.versions
        `).bind(
          p.slug, p.name || "", p.team || "", p.year || null, p.player || "",
          p.league || "other-clubs", p.country || "", p.kitType || "Home", p.category || "modern",
          p.condition || "Excellent", p.price || 0, p.pricing ? JSON.stringify(p.pricing) : null,
          p.customizable ? 1 : 0, p.badge || null, p.onHand ? 1 : 0, p.latestDrop ? 1 : 0, p.soldOut ? 1 : 0,
          JSON.stringify(p.sizes || []), p.img || "", JSON.stringify(p.gallery || []), p.story || "",
          p.brand || "", p.authenticity || "", p.versions ? JSON.stringify(p.versions) : null
        ).run();
        return json({ ok: true });
      }

      const productSlugMatch = path.match(/^\/api\/products\/([^/]+)$/);
      if (productSlugMatch && method === "DELETE") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        await env.DB.prepare("DELETE FROM products WHERE slug = ?").bind(decodeURIComponent(productSlugMatch[1])).run();
        return json({ ok: true });
      }

      // ---------------- Orders ----------------
      if (path === "/api/orders" && method === "GET") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const { results } = await env.DB.prepare("SELECT * FROM orders ORDER BY createdAt DESC").all();
        return json(results.map(r => rowToRecord(r, ["items"])));
      }

      if (path === "/api/orders" && method === "POST") {
        if (!(await rateLimit(env, "orders", getClientIp(request), 5, 300))) {
          return json({ error: "Too many requests. Please try again shortly." }, 429);
        }
        let o;
        try { o = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }

        const firstName = clampStr(o.firstName, 80);
        const surname = clampStr(o.surname, 80);
        const email = clampStr(o.email, 254);
        const phone = clampStr(o.phone, 40);
        const address = clampStr(o.address, 300);
        if (!firstName || !surname || !address) return json({ error: "Please fill in all required fields." }, 400);
        if (!EMAIL_RE.test(email)) return json({ error: "Enter a valid email address." }, 400);

        const cart = Array.isArray(o.items) ? o.items : [];
        if (!cart.length || cart.length > 50) return json({ error: "Your bag is empty or has too many items." }, 400);

        const slugs = [...new Set(cart.map(i => String(i.slug || "")).filter(Boolean))];
        if (!slugs.length) return json({ error: "Invalid item in bag." }, 400);
        const { results: rows } = await env.DB
          .prepare(`SELECT * FROM products WHERE slug IN (${slugs.map(() => "?").join(",")})`)
          .bind(...slugs).all();
        const bySlug = new Map(rows.map(r => [r.slug, rowToProduct(r)]));

        let total = 0;
        const items = [];
        try {
          for (const item of cart) {
            const { lineTotal, description } = priceCartItem(item, bySlug.get(String(item.slug)));
            total += lineTotal;
            items.push(description);
          }
        } catch (err) {
          return json({ error: err.message || "Invalid item in bag." }, 400);
        }

        // Flat nationwide shipping, added once per order regardless of how
        // many items or fulfillment paths it mixes — items ship separately as
        // each becomes ready, but the customer is only charged once.
        items.push(`Shipping (nationwide) — R${SHIPPING_FLAT.toLocaleString("en-ZA")}`);
        total += SHIPPING_FLAT;

        // Built field-by-field — never spread the raw client object here (that
        // previously let a client set its own status/id/createdAt/total).
        const record = {
          id: newId("order"), createdAt: new Date().toISOString(), status: "new",
          firstName, surname, email, phone, address, items, total
        };
        await env.DB.prepare(`
          INSERT INTO orders (id, createdAt, status, firstName, surname, email, phone, address, items, total)
          VALUES (?,?,?,?,?,?,?,?,?,?)
        `).bind(
          record.id, record.createdAt, record.status, record.firstName, record.surname,
          record.email, record.phone, record.address, JSON.stringify(record.items), record.total
        ).run();
        return json(record);
      }

      // Manual order logging (admin only) — for orders taken over WhatsApp/DM/
      // in person that never go through the site's own checkout. Free text,
      // not tied to the product catalog, since some orders are for jerseys not
      // yet listed at all — deliberately bypasses the catalog-priced /api/orders
      // POST above, which is for real checkout traffic only.
      if (path === "/api/admin/orders" && method === "POST") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        let o;
        try { o = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }

        const firstName = clampStr(o.firstName, 80);
        const surname = clampStr(o.surname, 80);
        if (!firstName || !surname) return json({ error: "Please fill in first name and surname." }, 400);

        const items = Array.isArray(o.items) ? o.items.map(i => clampStr(i, 200)).filter(Boolean) : [];
        if (!items.length) return json({ error: "Please add at least one item." }, 400);

        const total = clampStr(o.total, 40);
        if (!total) return json({ error: "Please enter a total." }, 400);

        const status = ["new", "paid", "contacted", "fulfilled"].includes(o.status) ? o.status : "new";

        const record = {
          id: newId("order"), createdAt: new Date().toISOString(), status,
          firstName, surname,
          email: clampStr(o.email, 254), phone: clampStr(o.phone, 40), address: clampStr(o.address, 300),
          items, total
        };
        await env.DB.prepare(`
          INSERT INTO orders (id, createdAt, status, firstName, surname, email, phone, address, items, total)
          VALUES (?,?,?,?,?,?,?,?,?,?)
        `).bind(
          record.id, record.createdAt, record.status, record.firstName, record.surname,
          record.email, record.phone, record.address, JSON.stringify(record.items), record.total
        ).run();
        return json(record);
      }

      const orderIdMatch = path.match(/^\/api\/orders\/([^/]+)$/);
      if (orderIdMatch && method === "PATCH") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const { status } = await request.json();
        await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, decodeURIComponent(orderIdMatch[1])).run();
        return json({ ok: true });
      }
      if (orderIdMatch && method === "DELETE") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(decodeURIComponent(orderIdMatch[1])).run();
        return json({ ok: true });
      }

      // ---------------- Yoco Payments ----------------
      if (path === "/api/yoco/create-checkout" && method === "POST") {
        let body;
        try { body = await request.json(); } catch { return json({ error: "Invalid request." }, 400); }
        const orderId = String(body.orderId || "");
        if (!orderId) return json({ error: "Missing orderId" }, 400);

        // Amount always comes from the order we already priced server-side at
        // creation time — a client-supplied amount used to be trusted directly,
        // which let a customer pay an arbitrary low price for any order.
        const order = await env.DB.prepare("SELECT id, total, status FROM orders WHERE id = ?").bind(orderId).first();
        if (!order) return json({ error: "Order not found" }, 404);
        if (order.status === "paid") return json({ error: "This order has already been paid." }, 400);
        const amount = Number(order.total);
        if (!(amount > 0)) return json({ error: "Order has no payable amount." }, 400);

        const secretKey = await env.YOCO_SECRET_KEY.get();
        const yocoRes = await fetch("https://payments.yoco.com/api/checkouts", {
          method: "POST",
          headers: { "Authorization": `Bearer ${secretKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: Math.round(amount * 100),
            currency: "ZAR",
            metadata: { orderId },
            successUrl: `${url.origin}/checkout-success.html?order=${encodeURIComponent(orderId)}`,
            cancelUrl: `${url.origin}/checkout.html`,
            failureUrl: `${url.origin}/checkout.html?payment=failed`
          })
        });
        if (!yocoRes.ok) {
          console.error("Yoco checkout creation failed", yocoRes.status, await yocoRes.text().catch(() => ""));
          return json({ error: "Failed to start payment. Please try again." }, 502);
        }
        const data = await yocoRes.json();
        return json({ redirectUrl: data.redirectUrl });
      }

      if (path === "/api/yoco/webhook" && method === "POST") {
        const rawBody = await request.text();
        if (!(await verifyYocoSignature(request, rawBody, env))) {
          return json({ error: "Invalid signature" }, 401);
        }
        const event = JSON.parse(rawBody);
        if (event.type === "payment.succeeded") {
          const orderId = event.payload && event.payload.metadata && event.payload.metadata.orderId;
          if (orderId) {
            await env.DB.prepare("UPDATE orders SET status = 'paid' WHERE id = ?").bind(orderId).run();
          }
        }
        return json({ received: true });
      }

      // ---------------- Jersey Requests ----------------
      if (path === "/api/requests" && method === "GET") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const { results } = await env.DB.prepare("SELECT * FROM requests ORDER BY createdAt DESC").all();
        return json(results);
      }

      if (path === "/api/requests" && method === "POST") {
        if (!(await rateLimit(env, "requests", getClientIp(request), 5, 600))) {
          return json({ error: "Too many requests. Please try again shortly." }, 429);
        }
        let r;
        try { r = await request.json(); } catch { return json({ error: "Invalid request body." }, 400); }
        const firstName = clampStr(r.firstName, 80);
        const surname = clampStr(r.surname, 80);
        const email = clampStr(r.email, 254);
        const team = clampStr(r.team, 100);
        if (!firstName || !surname || !team) return json({ error: "Please fill in all required fields." }, 400);
        if (!EMAIL_RE.test(email)) return json({ error: "Enter a valid email address." }, 400);

        // Built field-by-field — never spread the raw client object here (that
        // previously let a client set its own status/id/createdAt).
        const record = {
          id: newId("req"), createdAt: new Date().toISOString(), status: "new",
          firstName, surname, email,
          contact: clampStr(r.contact, 40), team,
          year: clampStr(r.year, 4), size: clampStr(r.size, 20), notes: clampStr(r.notes, 500)
        };
        await env.DB.prepare(`
          INSERT INTO requests (id, createdAt, status, firstName, surname, email, contact, team, year, size, notes)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          record.id, record.createdAt, record.status, record.firstName, record.surname,
          record.email, record.contact, record.team, record.year, record.size, record.notes
        ).run();
        return json(record);
      }

      const reqIdMatch = path.match(/^\/api\/requests\/([^/]+)$/);
      if (reqIdMatch && method === "PATCH") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const { status } = await request.json();
        await env.DB.prepare("UPDATE requests SET status = ? WHERE id = ?").bind(status, decodeURIComponent(reqIdMatch[1])).run();
        return json({ ok: true });
      }
      if (reqIdMatch && method === "DELETE") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        await env.DB.prepare("DELETE FROM requests WHERE id = ?").bind(decodeURIComponent(reqIdMatch[1])).run();
        return json({ ok: true });
      }

      // ---------------- Newsletter ----------------
      if (path === "/api/subscribe" && method === "POST") {
        if (!(await rateLimit(env, "subscribe", getClientIp(request), 5, 600))) {
          return json({ error: "Too many requests. Please try again shortly." }, 429);
        }
        const { email } = await request.json();
        const clean = (email || "").trim().toLowerCase();
        // Deliberately strict (rejects quotes/angle brackets, not just "has an @") — this value
        // gets rendered inside an admin onclick attribute, so a loose check here would leave a
        // second, attribute-context injection path open even after the display-side HTML escaping.
        if (clean.length > 254 || !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(clean)) return json({ error: "Enter a valid email address." }, 400);
        await env.DB.prepare("INSERT INTO subscribers (email, createdAt) VALUES (?, ?) ON CONFLICT(email) DO NOTHING")
          .bind(clean, new Date().toISOString())
          .run();
        return json({ ok: true });
      }

      if (path === "/api/subscribers" && method === "GET") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const { results } = await env.DB.prepare("SELECT * FROM subscribers ORDER BY createdAt DESC").all();
        return json(results);
      }

      const subEmailMatch = path.match(/^\/api\/subscribers\/([^/]+)$/);
      if (subEmailMatch && method === "DELETE") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        await env.DB.prepare("DELETE FROM subscribers WHERE email = ?").bind(decodeURIComponent(subEmailMatch[1])).run();
        return json({ ok: true });
      }

      // ---------------- Reviews ----------------
      if (path === "/api/reviews" && method === "POST") {
        if (!(await rateLimit(env, "reviews", getClientIp(request), 5, 600))) {
          return json({ error: "Too many requests. Please try again shortly." }, 429);
        }
        const r = await request.json();
        if (r.website) return json({ ok: true }); // honeypot field — bots fill it, real visitors never see it
        const name = clampStr(r.name, 80);
        const text = clampStr(r.text, 1000);
        const rating = Math.round(Number(r.rating));
        if (!name || !text) return json({ error: "Please fill in your name and review." }, 400);
        if (!(rating >= 1 && rating <= 5)) return json({ error: "Rating must be between 1 and 5." }, 400);
        const record = { id: newId("rev"), createdAt: new Date().toISOString(), status: "pending", name, rating, text, itemRef: clampStr(r.itemRef, 120) };
        await env.DB.prepare(`
          INSERT INTO reviews (id, createdAt, status, name, rating, text, itemRef)
          VALUES (?,?,?,?,?,?,?)
        `).bind(record.id, record.createdAt, record.status, record.name, record.rating, record.text, record.itemRef).run();
        return json({ ok: true });
      }

      if (path === "/api/reviews" && method === "GET") {
        const admin = await isAdmin(request, env);
        const { results } = admin
          ? await env.DB.prepare("SELECT * FROM reviews ORDER BY createdAt DESC").all()
          : await env.DB.prepare("SELECT * FROM reviews WHERE status = 'approved' ORDER BY createdAt DESC").all();
        return json(results);
      }

      const reviewIdMatch = path.match(/^\/api\/reviews\/([^/]+)$/);
      if (reviewIdMatch && method === "PATCH") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const { status } = await request.json();
        await env.DB.prepare("UPDATE reviews SET status = ? WHERE id = ?").bind(status, decodeURIComponent(reviewIdMatch[1])).run();
        return json({ ok: true });
      }
      if (reviewIdMatch && method === "DELETE") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        await env.DB.prepare("DELETE FROM reviews WHERE id = ?").bind(decodeURIComponent(reviewIdMatch[1])).run();
        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      console.error("Unhandled error on", method, path, err);
      return json({ error: "Something went wrong. Please try again." }, 500);
    }
  }
};
