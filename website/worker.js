/* KITKLASH API worker — handles /api/* only (see wrangler.jsonc assets.run_worker_first).
   Every other request is served directly from static assets, never touching this file. */

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function isAdmin(request, env) {
  const key = request.headers.get("X-Admin-Key");
  return !!key && key === env.ADMIN_KEY;
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // ---------------- Products ----------------
      if (path === "/api/products" && method === "GET") {
        const { results } = await env.DB.prepare("SELECT * FROM products").all();
        return json(results.map(rowToProduct));
      }

      if (path === "/api/products" && (method === "POST" || method === "PUT")) {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
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
          p.brand || "", p.authenticity || "Verified Original", p.versions ? JSON.stringify(p.versions) : null
        ).run();
        return json({ ok: true });
      }

      const productSlugMatch = path.match(/^\/api\/products\/([^/]+)$/);
      if (productSlugMatch && method === "DELETE") {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
        await env.DB.prepare("DELETE FROM products WHERE slug = ?").bind(decodeURIComponent(productSlugMatch[1])).run();
        return json({ ok: true });
      }

      // ---------------- Orders ----------------
      if (path === "/api/orders" && method === "GET") {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
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
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
        const { status } = await request.json();
        await env.DB.prepare("UPDATE orders SET status = ? WHERE id = ?").bind(status, decodeURIComponent(orderIdMatch[1])).run();
        return json({ ok: true });
      }
      if (orderIdMatch && method === "DELETE") {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
        await env.DB.prepare("DELETE FROM orders WHERE id = ?").bind(decodeURIComponent(orderIdMatch[1])).run();
        return json({ ok: true });
      }

      // ---------------- Jersey Requests ----------------
      if (path === "/api/requests" && method === "GET") {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
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
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
        const { status } = await request.json();
        await env.DB.prepare("UPDATE requests SET status = ? WHERE id = ?").bind(status, decodeURIComponent(reqIdMatch[1])).run();
        return json({ ok: true });
      }
      if (reqIdMatch && method === "DELETE") {
        if (!isAdmin(request, env)) return json({ error: "Unauthorized" }, 401);
        await env.DB.prepare("DELETE FROM requests WHERE id = ?").bind(decodeURIComponent(reqIdMatch[1])).run();
        return json({ ok: true });
      }

      return json({ error: "Not found" }, 404);
    } catch (err) {
      return json({ error: err.message || "Server error" }, 500);
    }
  }
};
