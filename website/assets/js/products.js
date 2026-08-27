/* KITKLASH product catalog — backed by a real database (Cloudflare D1) via /api/products.
   DEFAULT_PRODUCTS below is kept only as an offline fallback if the API is ever unreachable,
   not the live source of truth. */

/* League is the primary browsing category. Each jersey stores a `league` slug
   from this list; team-level filtering within a league is derived from the
   catalog at runtime, so adding a new team never requires touching this file. */
const LEAGUES = [
  { slug: "premier-league", label: "Premier League" },
  { slug: "la-liga", label: "La Liga" },
  { slug: "serie-a", label: "Serie A" },
  { slug: "bundesliga", label: "Bundesliga" },
  { slug: "ligue-1", label: "Ligue 1" },
  { slug: "other-european", label: "Other European Leagues" },
  { slug: "international", label: "International / National Teams" },
  { slug: "other-clubs", label: "Other Clubs" }
];

function getLeagueLabel(slug) {
  const league = LEAGUES.find(l => l.slug === slug);
  return league ? league.label : "Other Clubs";
}

function getEra(year) {
  if (!year) return "";
  return `${Math.floor(year / 10) * 10}s`;
}

/* Scans the live catalog so team lists always reflect current stock —
   this is what lets new teams/jerseys appear without any code changes. */
function getTeamsForLeagues(leagueSlugs) {
  const scope = leagueSlugs && leagueSlugs.length ? new Set(leagueSlugs) : null;
  const teams = new Set();
  PRODUCTS.forEach(p => {
    if (!scope || scope.has(p.league)) teams.add(p.team);
  });
  return Array.from(teams).sort();
}

function getAllTeams() {
  return getTeamsForLeagues(null);
}

/* Forgiving, multi-field search: every whitespace-separated word in the query
   must appear somewhere in the product's combined searchable text, so word
   order and exact phrasing don't matter (e.g. "united manchester" still hits
   "Manchester United"). Searches team, league, country, player, jersey name,
   season/year, era, kit type, and brand. */
function getSearchText(p) {
  return [
    p.name,
    p.team,
    p.league ? getLeagueLabel(p.league) : "",
    p.country,
    p.player,
    p.year,
    getEra(p.year),
    p.kitType,
    p.category,
    p.brand,
    p.condition
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function searchProducts(query, limit = 40) {
  const tokens = (query || "")
    .toLowerCase()
    .split(/\s+/)
    .map(t => t.trim())
    .filter(Boolean);
  if (!tokens.length) return [];
  const matches = PRODUCTS.filter(p => {
    const text = getSearchText(p);
    return tokens.every(t => text.includes(t));
  });
  return limit ? matches.slice(0, limit) : matches;
}

const DEFAULT_PRODUCTS = [
  {
    slug: "france-2006-away-zidane",
    name: "2006 Zinedine Zidane France",
    team: "France", year: 2006, player: "Zidane #10",
    league: "international", country: "France", kitType: "Away",
    versions: ["fan", "player"],
    category: "vintage", condition: "Mint Condition", price: 750,
    badge: "Rare", onHand: true, latestDrop: false, soldOut: false,
    sizes: ["L"],
    img: "assets/img/zidane-2006-back.png",
    gallery: [
      "assets/img/zidane-2006-back.png",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCCKZA62GFPfayL3jtxFDPf_ow_FXpZL8u7_Ls_tZx9rtl2jpTCFtpBcm7dO7fBMozMzg7Z_gRzXlppAkHZrMPterYBFw9nlG1utwr6uR-6urxu890qiYNhUgSVAWcHYwgd7wEt7jl8c_q39lxFIiVFklH0WdB-fSw66CFqBF7605j5IKbYdulKiI8tJlD37nWPCih7RAjPcA_jrMi2NJ2LwpWuEv1Q4aSnrn4fJw1JTVdD1jZKEg4",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD1qlOcY05eTw7jxjF6a4tuEHyWU2mN_Ba1Dz7C_Od-J2_qUxtjQS6rL59JBxZK5fRyPbBNxJp17TWcYx1vfB26MSf59QWLfIbBtG6mTD2PSLY5UFS5QqWje3zyXDfSNPFpvUAt9yvEBDK9o-JY-6Py00wZ_hclZpdxLNPCfSWjr4F83qXZm2kQEHQf5lTZGq0D6pH9raeK6dQIjfYvUJshZVXIqP1NcTJXZqCwperDTCDZF3RYiAE",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD_hkrXMPclE8V0zuUamlwW39ULiQAeufm-SNjIjFK35_rBbIGH0zZ8mOpX_g-8-luZGBnL9Jp0-sJ4e3lrEM8IVpjBKu3-Ja7rFhJERtwyryyTAyPSIYljCgQG9RhDb5ruCMydm_5L2NWi2lNJJZjHo1yJkkwd6dtZ5tuzu9Hy27WHHplC-xHZukljHpSNlNKAyGGsd-xwsneHzpCgITIZxfodPaaQbDqS1cwm-jM8AW2GvKS1sSU"
    ],
    story: "The white away kit worn by Zinedine Zidane during the 2006 World Cup campaign, culminating in the infamous final. This pristine piece of football history represents the twilight of a maestro's career. Features the distinct typography and chest crest synonymous with that era's French national team design language.",
    brand: "Adidas", authenticity: "Verified Original"
  }
];

const PRODUCTS_STORAGE_KEY = "kitklash_products";

let PRODUCTS = [];
let _productsPromise = null;

/* Loads the live catalog from the API. Every page that reads PRODUCTS must
   `await initProducts()` first (in its DOMContentLoaded handler) since this
   replaces what used to be a synchronous hardcoded array. Memoized because
   both `loadLayout()` (header/cart) and each page's own script call this
   independently — they share one in-flight fetch instead of racing. */
function initProducts() {
  if (!_productsPromise) {
    _productsPromise = (async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Bad response from /api/products");
        PRODUCTS = await res.json();
      } catch (e) {
        console.error("Falling back to bundled catalog — API unreachable", e);
        PRODUCTS = DEFAULT_PRODUCTS;
      }
      return PRODUCTS;
    })();
  }
  return _productsPromise;
}

function getProductBySlug(slug) {
  return PRODUCTS.find(p => p.slug === slug);
}

/* Products without an explicit `versions` array are fan-version only —
   the admin panel sets this explicitly when a product also has a player version. */
function getVersions(p) {
  return p.versions && p.versions.length ? p.versions : ["fan"];
}

function versionLabel(v) {
  return v === "player" ? "Player Version" : "Fan Version";
}

/* Customizable replica-stock products carry a `pricing` object
   ({ fan: {short, long}, player: {short, long} }) instead of relying solely
   on the flat `price` field, since price depends on the version/sleeve the
   customer picks. One-off archive pieces have no `pricing` object and keep
   the simple flat-price behavior untouched. */
function isCustomizable(p) {
  return !!p.pricing;
}

function getBasePrice(p, version, sleeve) {
  return p.pricing[version][sleeve];
}

function getDisplayFromPrice(p) {
  return p.pricing.player.short;
}

function sleeveLabel(s) {
  return s === "long" ? "Long Sleeve" : "Short Sleeve";
}

async function saveProductItem(product) {
  const res = await fetch("/api/products", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Admin-Key": getAdminKey() },
    body: JSON.stringify(product)
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to save product");
  _productsPromise = null;
  await initProducts();
}

async function deleteProductItem(slug) {
  const res = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    headers: { "X-Admin-Key": getAdminKey() }
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed to delete product");
  _productsPromise = null;
  await initProducts();
}

/* Lets Cloudflare's Worker (website/worker.js) import the canonical catalog
   shape if ever needed for server-side validation. No effect in the browser,
   where `module` doesn't exist. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_PRODUCTS, getVersions, getLeagueLabel, LEAGUES };
}
