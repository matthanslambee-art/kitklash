/* KITKLASH API worker — handles /api/* only (see wrangler.jsonc assets.run_worker_first).
   Every other request is served directly from static assets, never touching this file. */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

async function isAdmin(request, env) {
  const key = request.headers.get("X-Admin-Key");
  if (!key) return false;
  const adminKey = await env.ADMIN_KEY.get();
  return key === adminKey;
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
        const staticPages = ["", "shop", "on-hand", "about", "request-jersey"];
        const { results } = await env.DB.prepare("SELECT slug FROM products").all();
        const urls = [
          ...staticPages.map(p => `https://kitklash.co.za/${p}`),
          ...results.map(r => `https://kitklash.co.za/product?slug=${encodeURIComponent(r.slug)}`)
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
          .map(u => `  <url><loc>${u.replace(/&/g, "&amp;")}</loc></url>`)
          .join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "Content-Type": "application/xml" } });
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
            "Cache-Control": "public, max-age=31536000, immutable"
          }
        });
      }

      // ---------------- One-off: fix mojibake text corruption ----------------
      if (path === "/api/admin/fix-mojibake" && method === "POST") {
        if (!(await isAdmin(request, env))) return json({ error: "Unauthorized" }, 401);
        const fixes = [
          {
            slug: "ac-milan-2023-pleasures",
            story:
              "A limited streetwear collaboration kit, blending Milan's iconic red-and-black with PLEASURES' distinct graphic identity — a modern archive piece for collectors beyond the terrace."
          },
          {
            slug: "brazil-2002-home",
            story:
              "The canary yellow of the Pentacampeões. Ronaldo, Rivaldo and Ronaldinho's front three wore this to a fifth World Cup star in Yokohama."
          },
          {
            slug: "man-utd-2007-home",
            story:
              "The commemorative long-sleeve edition marking United's 2008 Champions League Final win over Chelsea in Moscow, embroidered with 'Final Moscow 2008 — 21st May, Luzhniki Stadium'. The crowning shirt of Cristiano Ronaldo's 2007/08 season, in which he scored 42 goals and claimed his first Ballon d'Or."
          }
        ];
        for (const f of fixes) {
          await env.DB.prepare("UPDATE products SET story = ? WHERE slug = ?").bind(f.story, f.slug).run();
        }
        return json({ ok: true, fixed: fixes.map(f => f.slug) });
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
        const o = await request.json();
        const record = { id: newId("order"), createdAt: new Date().toISOString(), status: "new", ...o };
        await env.DB.prepare(`
          INSERT INTO orders (id, createdAt, status, firstName, surname, email, phone, address, items, total)
          VALUES (?,?,?,?,?,?,?,?,?,?)
        `).bind(
          record.id, record.createdAt, record.status, record.firstName || "", record.surname || "",
          record.email || "", record.phone || "", record.address || "", JSON.stringify(record.items || []), record.total || ""
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
        const { orderId, amount, lineItems } = await request.json();
        if (!orderId || !amount) return json({ error: "Missing orderId or amount" }, 400);

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
            failureUrl: `${url.origin}/checkout.html?payment=failed`,
            ...(lineItems && lineItems.length ? { lineItems } : {})
          })
        });
        if (!yocoRes.ok) {
          const detail = await yocoRes.text().catch(() => "");
          return json({ error: "Failed to create Yoco checkout", detail }, 502);
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
        const r = await request.json();
        const record = { id: newId("req"), createdAt: new Date().toISOString(), status: "new", ...r };
        await env.DB.prepare(`
          INSERT INTO requests (id, createdAt, status, firstName, surname, email, contact, team, year, size, notes)
          VALUES (?,?,?,?,?,?,?,?,?,?,?)
        `).bind(
          record.id, record.createdAt, record.status, record.firstName || "", record.surname || "",
          record.email || "", record.contact || "", record.team || "", record.year || "", record.size || "", record.notes || ""
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

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message || "Server error" }, 500);
    }
  }
};
