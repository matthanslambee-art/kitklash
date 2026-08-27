/* KITKLASH product catalog — demo data for the local prototype. */

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
  },
  {
    slug: "ac-milan-2023-pleasures",
    name: "AC Milan 2023/24 x PLEASURES",
    team: "AC Milan", year: 2023, player: "",
    league: "serie-a", country: "Italy", kitType: "Special Edition",
    category: "modern", condition: "Excellent", price: 650,
    badge: null, onHand: true, latestDrop: false, soldOut: true,
    sizes: ["M"],
    img: "assets/img/ac-milan-2023-pleasures-1.jpg",
    gallery: ["assets/img/ac-milan-2023-pleasures-1.jpg", "assets/img/ac-milan-2023-pleasures-2.jpg", "assets/img/ac-milan-2023-pleasures-3.jpg"],
    story: "A limited streetwear collaboration kit, blending Milan's iconic red-and-black with PLEASURES' distinct graphic identity — a modern archive piece for collectors beyond the terrace.",
    brand: "PUMA", authenticity: "Verified Original"
  },
  {
    slug: "argentina-2026-away",
    name: "Argentina 2026 Away",
    team: "Argentina", year: 2026, player: "",
    league: "international", country: "Argentina", kitType: "Away",
    category: "modern", condition: "Excellent", price: 650,
    badge: null, onHand: true, latestDrop: true, soldOut: true,
    sizes: ["L"],
    img: "assets/img/argentina-2026-away-1.jpg",
    gallery: ["assets/img/argentina-2026-away-1.jpg", "assets/img/argentina-2026-away-2.jpg"],
    story: "The current Argentina away shirt, carrying the World Champions crest into a new era.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "barcelona-2008-home",
    name: "Barcelona 2008/09 Home",
    team: "Barcelona", year: 2008, player: "Messi #10",
    league: "la-liga", country: "Spain", kitType: "Home",
    category: "vintage", condition: "Excellent", price: 750,
    badge: "Rare", onHand: true, latestDrop: false, soldOut: false,
    sizes: ["L"],
    img: "assets/img/barcelona-2008-home-1.jpg",
    gallery: ["assets/img/barcelona-2008-home-1.jpg", "assets/img/barcelona-2008-home-2.jpg", "assets/img/barcelona-2008-home-3.jpg", "assets/img/barcelona-2008-home-4.jpg", "assets/img/barcelona-2008-home-5.jpg"],
    story: "The historic treble-winning season shirt, worn by a 21-year-old Messi during Barcelona's dominant 2008/09 Champions League, La Liga, and Copa del Rey sweep.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "brazil-2002-home",
    name: "Brazil 2002 Home",
    team: "Brazil", year: 2002, player: "Ronaldo #9",
    league: "international", country: "Brazil", kitType: "Home",
    category: "vintage", condition: "Excellent", price: 750,
    badge: "Rare", onHand: true, latestDrop: false, soldOut: false,
    sizes: ["L"],
    img: "assets/img/brazil-2002-home-1.jpg",
    gallery: ["assets/img/brazil-2002-home-1.jpg", "assets/img/brazil-2002-home-2.jpg", "assets/img/brazil-2002-home-3.jpg"],
    story: "The canary yellow of the Pentacampeões. Ronaldo, Rivaldo and Ronaldinho's front three wore this to a fifth World Cup star in Yokohama.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "man-city-2026-away",
    name: "Manchester City 2026/27 Away",
    team: "Manchester City", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Excellent", price: 650,
    badge: null, onHand: true, latestDrop: true, soldOut: true,
    sizes: ["M"],
    img: "assets/img/man-city-2026-away-1.jpg",
    gallery: ["assets/img/man-city-2026-away-1.jpg"],
    story: "Manchester City's current away kit, fresh into the archive for the 2026/27 season.",
    brand: "PUMA", authenticity: "Verified Original"
  },
  {
    slug: "man-utd-2007-home",
    name: "Manchester United 2007/08 'Final Moscow' Home",
    team: "Manchester United", year: 2007, player: "Ronaldo #7",
    league: "premier-league", country: "England", kitType: "Home",
    category: "vintage", condition: "Excellent", price: 850,
    badge: "Grail", onHand: true, latestDrop: false, soldOut: true,
    sizes: ["L"],
    img: "assets/img/man-utd-2007-home-1.jpg",
    gallery: ["assets/img/man-utd-2007-home-1.jpg", "assets/img/man-utd-2007-home-2.jpg", "assets/img/man-utd-2007-home-3.jpg", "assets/img/man-utd-2007-home-4.jpg", "assets/img/man-utd-2007-home-5.jpg"],
    story: "The commemorative long-sleeve edition marking United's 2008 Champions League Final win over Chelsea in Moscow, embroidered with 'Final Moscow 2008 — 21st May, Luzhniki Stadium'. The crowning shirt of Cristiano Ronaldo's 2007/08 season, in which he scored 42 goals and claimed his first Ballon d'Or.",
    brand: "Nike", authenticity: "Verified Original"
  }
];

const PRODUCTS_STORAGE_KEY = "kitklash_products";

function getProductsList() {
  // No localStorage in a Node/serverless context (e.g. Vercel functions importing
  // this file) — fall back to the canonical catalog, which is the correct behavior
  // there anyway since the server can't see any individual browser's local edits.
  if (typeof localStorage === "undefined") return DEFAULT_PRODUCTS;
  const saved = localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved products catalog", e);
    }
  }
  return DEFAULT_PRODUCTS;
}

let PRODUCTS = getProductsList();

function refreshProductsMemory() {
  PRODUCTS = getProductsList();
}

function saveProductsList(list) {
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(list));
  refreshProductsMemory();
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

function saveProductItem(product) {
  const list = getProductsList();
  const index = list.findIndex(p => p.slug === product.slug);
  if (index >= 0) {
    list[index] = { ...list[index], ...product };
  } else {
    list.unshift(product);
  }
  saveProductsList(list);
}

function deleteProductItem(slug) {
  const list = getProductsList().filter(p => p.slug !== slug);
  saveProductsList(list);
}

function resetProductsCatalog() {
  localStorage.removeItem(PRODUCTS_STORAGE_KEY);
  refreshProductsMemory();
}

function exportProductsCode() {
  const current = getProductsList();
  return `/* KITKLASH product catalog — demo data for the local prototype. */\nconst DEFAULT_PRODUCTS = ${JSON.stringify(current, null, 2)};\n\n${getProductsList.toString()}\n\nlet PRODUCTS = getProductsList();\n\n${refreshProductsMemory.toString()}\n\n${saveProductsList.toString()}\n\n${getProductBySlug.toString()}\n\n${saveProductItem.toString()}\n\n${deleteProductItem.toString()}\n\n${resetProductsCatalog.toString()}\n\n${exportProductsCode.toString()}\n`;
}

/* Lets Vercel serverless functions (Node, e.g. api/create-checkout.js) import the
   canonical catalog to validate order prices server-side. No effect in the browser,
   where `module` doesn't exist. */
if (typeof module !== "undefined" && module.exports) {
  module.exports = { DEFAULT_PRODUCTS, getVersions, getLeagueLabel, LEAGUES };
}
