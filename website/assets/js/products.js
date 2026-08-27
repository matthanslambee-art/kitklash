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
,
  {
    slug: "bayern-munich-away",
    name: "Bayern Munich Away",
    team: "Bayern Munich", year: 2026, player: "",
    league: "bundesliga", country: "Germany", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/bayern-munich-away-1.jpg",
    gallery: ["assets/img/bayern-munich-away-1.jpg", "assets/img/bayern-munich-away-2.jpg"],
    story: "The Bayern Munich away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "bayern-munich-home",
    name: "Bayern Munich Home",
    team: "Bayern Munich", year: 2026, player: "",
    league: "bundesliga", country: "Germany", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/bayern-munich-home-1.jpg",
    gallery: ["assets/img/bayern-munich-home-1.jpg", "assets/img/bayern-munich-home-2.jpg", "assets/img/bayern-munich-home-3.jpg", "assets/img/bayern-munich-home-4.jpg"],
    story: "The Bayern Munich home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "borussia-dortmund-home",
    name: "Borussia Dortmund Home",
    team: "Borussia Dortmund", year: 2026, player: "",
    league: "bundesliga", country: "Germany", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/borussia-dortmund-home-1.jpg",
    gallery: ["assets/img/borussia-dortmund-home-1.jpg", "assets/img/borussia-dortmund-home-2.jpg", "assets/img/borussia-dortmund-home-3.jpg", "assets/img/borussia-dortmund-home-4.jpg"],
    story: "The Borussia Dortmund home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Puma", authenticity: "Verified Original"
  },
  {
    slug: "rb-leipzig-home",
    name: "RB Leipzig Home",
    team: "RB Leipzig", year: 2026, player: "",
    league: "bundesliga", country: "Germany", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/rb-leipzig-home-1.jpg",
    gallery: ["assets/img/rb-leipzig-home-1.jpg", "assets/img/rb-leipzig-home-2.jpg", "assets/img/rb-leipzig-home-3.jpg", "assets/img/rb-leipzig-home-4.jpg"],
    story: "The RB Leipzig home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "atletico-madrid-away",
    name: "Atletico Madrid Away",
    team: "Atletico Madrid", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/atletico-madrid-away-1.jpg",
    gallery: ["assets/img/atletico-madrid-away-1.jpg", "assets/img/atletico-madrid-away-2.jpg", "assets/img/atletico-madrid-away-3.jpg", "assets/img/atletico-madrid-away-4.jpg"],
    story: "The Atletico Madrid away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "atletico-madrid-home",
    name: "Atletico Madrid Home",
    team: "Atletico Madrid", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/atletico-madrid-home-1.jpg",
    gallery: ["assets/img/atletico-madrid-home-1.jpg", "assets/img/atletico-madrid-home-2.jpg", "assets/img/atletico-madrid-home-3.jpg"],
    story: "The Atletico Madrid home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "atletico-madrid-third",
    name: "Atletico Madrid Third",
    team: "Atletico Madrid", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/atletico-madrid-third-1.jpg",
    gallery: ["assets/img/atletico-madrid-third-1.jpg", "assets/img/atletico-madrid-third-2.jpg", "assets/img/atletico-madrid-third-3.jpg"],
    story: "The Atletico Madrid third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "barcelona-away",
    name: "Barcelona Away",
    team: "Barcelona", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/barcelona-away-1.jpg",
    gallery: ["assets/img/barcelona-away-1.jpg", "assets/img/barcelona-away-2.jpg", "assets/img/barcelona-away-3.jpg", "assets/img/barcelona-away-4.jpg", "assets/img/barcelona-away-5.jpg", "assets/img/barcelona-away-6.jpg"],
    story: "The Barcelona away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "barcelona-fourth",
    name: "Barcelona Fourth",
    team: "Barcelona", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Fourth",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/barcelona-fourth-1.jpg",
    gallery: ["assets/img/barcelona-fourth-1.jpg", "assets/img/barcelona-fourth-2.jpg", "assets/img/barcelona-fourth-3.jpg", "assets/img/barcelona-fourth-4.jpg"],
    story: "The Barcelona fourth shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "barcelona-home",
    name: "Barcelona Home",
    team: "Barcelona", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/barcelona-home-1.jpg",
    gallery: ["assets/img/barcelona-home-1.jpg", "assets/img/barcelona-home-2.jpg", "assets/img/barcelona-home-3.jpg", "assets/img/barcelona-home-4.jpg"],
    story: "The Barcelona home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "barcelona-third",
    name: "Barcelona Third",
    team: "Barcelona", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/barcelona-third-1.jpg",
    gallery: ["assets/img/barcelona-third-1.jpg", "assets/img/barcelona-third-2.jpg", "assets/img/barcelona-third-3.jpg", "assets/img/barcelona-third-4.jpg", "assets/img/barcelona-third-5.jpg"],
    story: "The Barcelona third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "real-madrid-away",
    name: "Real Madrid Away",
    team: "Real Madrid", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/real-madrid-away-1.jpg",
    gallery: ["assets/img/real-madrid-away-1.jpg", "assets/img/real-madrid-away-2.jpg", "assets/img/real-madrid-away-3.jpg", "assets/img/real-madrid-away-4.jpg"],
    story: "The Real Madrid away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "real-madrid-home",
    name: "Real Madrid Home",
    team: "Real Madrid", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/real-madrid-home-1.jpg",
    gallery: ["assets/img/real-madrid-home-1.jpg", "assets/img/real-madrid-home-2.jpg", "assets/img/real-madrid-home-3.jpg", "assets/img/real-madrid-home-4.jpg"],
    story: "The Real Madrid home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "real-madrid-third",
    name: "Real Madrid Third",
    team: "Real Madrid", year: 2026, player: "",
    league: "la-liga", country: "Spain", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/real-madrid-third-1.jpg",
    gallery: ["assets/img/real-madrid-third-1.jpg", "assets/img/real-madrid-third-2.jpg", "assets/img/real-madrid-third-3.jpg", "assets/img/real-madrid-third-4.jpg"],
    story: "The Real Madrid third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "lyon-home",
    name: "Lyon Home",
    team: "Lyon", year: 2026, player: "",
    league: "ligue-1", country: "France", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/lyon-home-1.jpg",
    gallery: ["assets/img/lyon-home-1.jpg", "assets/img/lyon-home-2.jpg"],
    story: "The Lyon home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "marseille-home",
    name: "Marseille Home",
    team: "Marseille", year: 2026, player: "",
    league: "ligue-1", country: "France", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/marseille-home-1.jpg",
    gallery: ["assets/img/marseille-home-1.jpg", "assets/img/marseille-home-2.jpg", "assets/img/marseille-home-3.jpg"],
    story: "The Marseille home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "psg-away",
    name: "PSG Away",
    team: "PSG", year: 2026, player: "",
    league: "ligue-1", country: "France", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/psg-away-1.jpg",
    gallery: ["assets/img/psg-away-1.jpg", "assets/img/psg-away-2.jpg", "assets/img/psg-away-3.jpg", "assets/img/psg-away-4.jpg"],
    story: "The PSG away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "psg-home",
    name: "PSG Home",
    team: "PSG", year: 2026, player: "",
    league: "ligue-1", country: "France", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/psg-home-1.jpg",
    gallery: ["assets/img/psg-home-1.jpg", "assets/img/psg-home-2.jpg", "assets/img/psg-home-3.jpg", "assets/img/psg-home-4.jpg"],
    story: "The PSG home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "psg-third",
    name: "PSG Third",
    team: "PSG", year: 2026, player: "",
    league: "ligue-1", country: "France", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/psg-third-1.jpg",
    gallery: ["assets/img/psg-third-1.jpg", "assets/img/psg-third-2.jpg", "assets/img/psg-third-3.jpg", "assets/img/psg-third-4.jpg"],
    story: "The PSG third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "stade-rennais-home",
    name: "Stade Rennais Home",
    team: "Stade Rennais", year: 2026, player: "",
    league: "ligue-1", country: "France", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/stade-rennais-home-1.jpg",
    gallery: ["assets/img/stade-rennais-home-1.jpg", "assets/img/stade-rennais-home-2.jpg", "assets/img/stade-rennais-home-3.jpg"],
    story: "The Stade Rennais home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Macron", authenticity: "Verified Original"
  },
  {
    slug: "al-hilal-away",
    name: "Al Hilal Away",
    team: "Al Hilal", year: 2026, player: "",
    league: "other-clubs", country: "Saudi Arabia", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/al-hilal-away-1.jpg",
    gallery: ["assets/img/al-hilal-away-1.jpg", "assets/img/al-hilal-away-2.jpg", "assets/img/al-hilal-away-3.jpg", "assets/img/al-hilal-away-4.jpg"],
    story: "The Al Hilal away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "al-hilal-home",
    name: "Al Hilal Home",
    team: "Al Hilal", year: 2026, player: "",
    league: "other-clubs", country: "Saudi Arabia", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/al-hilal-home-1.jpg",
    gallery: ["assets/img/al-hilal-home-1.jpg", "assets/img/al-hilal-home-2.jpg", "assets/img/al-hilal-home-3.jpg", "assets/img/al-hilal-home-4.jpg", "assets/img/al-hilal-home-5.jpg"],
    story: "The Al Hilal home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "al-nassr-home",
    name: "Al Nassr Home",
    team: "Al Nassr", year: 2026, player: "",
    league: "other-clubs", country: "Saudi Arabia", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/al-nassr-home-1.jpg",
    gallery: ["assets/img/al-nassr-home-1.jpg", "assets/img/al-nassr-home-2.jpg", "assets/img/al-nassr-home-3.jpg", "assets/img/al-nassr-home-4.jpg"],
    story: "The Al Nassr home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "boca-juniors-home",
    name: "Boca Juniors Home",
    team: "Boca Juniors", year: 2026, player: "",
    league: "other-clubs", country: "Argentina", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/boca-juniors-home-1.jpg",
    gallery: ["assets/img/boca-juniors-home-1.jpg", "assets/img/boca-juniors-home-2.jpg", "assets/img/boca-juniors-home-3.jpg"],
    story: "The Boca Juniors home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "inter-miami-away",
    name: "Inter Miami Away",
    team: "Inter Miami", year: 2026, player: "",
    league: "other-clubs", country: "USA", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/inter-miami-away-1.jpg",
    gallery: ["assets/img/inter-miami-away-1.jpg", "assets/img/inter-miami-away-2.jpg", "assets/img/inter-miami-away-3.jpg"],
    story: "The Inter Miami away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "inter-miami-home",
    name: "Inter Miami Home",
    team: "Inter Miami", year: 2026, player: "",
    league: "other-clubs", country: "USA", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/inter-miami-home-1.jpg",
    gallery: ["assets/img/inter-miami-home-1.jpg", "assets/img/inter-miami-home-2.jpg", "assets/img/inter-miami-home-3.jpg"],
    story: "The Inter Miami home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "inter-miami-third",
    name: "Inter Miami Third",
    team: "Inter Miami", year: 2026, player: "",
    league: "other-clubs", country: "USA", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/inter-miami-third-1.jpg",
    gallery: ["assets/img/inter-miami-third-1.jpg", "assets/img/inter-miami-third-2.jpg", "assets/img/inter-miami-third-3.jpg", "assets/img/inter-miami-third-4.jpg"],
    story: "The Inter Miami third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "river-plate-away",
    name: "River Plate Away",
    team: "River Plate", year: 2026, player: "",
    league: "other-clubs", country: "Argentina", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/river-plate-away-1.jpg",
    gallery: ["assets/img/river-plate-away-1.jpg", "assets/img/river-plate-away-2.jpg", "assets/img/river-plate-away-3.jpg"],
    story: "The River Plate away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "river-plate-home",
    name: "River Plate Home",
    team: "River Plate", year: 2026, player: "",
    league: "other-clubs", country: "Argentina", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/river-plate-home-1.jpg",
    gallery: ["assets/img/river-plate-home-1.jpg", "assets/img/river-plate-home-2.jpg"],
    story: "The River Plate home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "ajax-away",
    name: "Ajax Away",
    team: "Ajax", year: 2026, player: "",
    league: "other-european", country: "Netherlands", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/ajax-away-1.jpg",
    gallery: ["assets/img/ajax-away-1.jpg", "assets/img/ajax-away-2.jpg"],
    story: "The Ajax away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "ajax-home",
    name: "Ajax Home",
    team: "Ajax", year: 2026, player: "",
    league: "other-european", country: "Netherlands", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/ajax-home-1.jpg",
    gallery: ["assets/img/ajax-home-1.jpg", "assets/img/ajax-home-2.jpg"],
    story: "The Ajax home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "benfica-home",
    name: "Benfica Home",
    team: "Benfica", year: 2026, player: "",
    league: "other-european", country: "Portugal", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/benfica-home-1.jpg",
    gallery: ["assets/img/benfica-home-1.jpg", "assets/img/benfica-home-2.jpg", "assets/img/benfica-home-3.jpg"],
    story: "The Benfica home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Puma", authenticity: "Verified Original"
  },
  {
    slug: "celtic-home",
    name: "Celtic Home",
    team: "Celtic", year: 2026, player: "",
    league: "other-european", country: "Scotland", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/celtic-home-1.jpg",
    gallery: ["assets/img/celtic-home-1.jpg", "assets/img/celtic-home-2.jpg"],
    story: "The Celtic home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "porto-home",
    name: "Porto Home",
    team: "Porto", year: 2026, player: "",
    league: "other-european", country: "Portugal", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/porto-home-1.jpg",
    gallery: ["assets/img/porto-home-1.jpg", "assets/img/porto-home-2.jpg"],
    story: "The Porto home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "New Balance", authenticity: "Verified Original"
  },
  {
    slug: "sporting-lisbon-home",
    name: "Sporting Lisbon Home",
    team: "Sporting Lisbon", year: 2026, player: "",
    league: "other-european", country: "Portugal", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/sporting-lisbon-home-1.jpg",
    gallery: ["assets/img/sporting-lisbon-home-1.jpg", "assets/img/sporting-lisbon-home-2.jpg"],
    story: "The Sporting Lisbon home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Puma", authenticity: "Verified Original"
  },
  {
    slug: "arsenal-away",
    name: "Arsenal Away",
    team: "Arsenal", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/arsenal-away-1.jpg",
    gallery: ["assets/img/arsenal-away-1.jpg", "assets/img/arsenal-away-2.jpg", "assets/img/arsenal-away-3.jpg", "assets/img/arsenal-away-4.jpg"],
    story: "The Arsenal away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "arsenal-home",
    name: "Arsenal Home",
    team: "Arsenal", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/arsenal-home-1.jpg",
    gallery: ["assets/img/arsenal-home-1.jpg", "assets/img/arsenal-home-2.jpg", "assets/img/arsenal-home-3.jpg", "assets/img/arsenal-home-4.jpg"],
    story: "The Arsenal home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "arsenal-third",
    name: "Arsenal Third",
    team: "Arsenal", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/arsenal-third-1.jpg",
    gallery: ["assets/img/arsenal-third-1.jpg", "assets/img/arsenal-third-2.jpg", "assets/img/arsenal-third-3.jpg"],
    story: "The Arsenal third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "aston-villa-home",
    name: "Aston Villa Home",
    team: "Aston Villa", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/aston-villa-home-1.jpg",
    gallery: ["assets/img/aston-villa-home-1.jpg", "assets/img/aston-villa-home-2.jpg", "assets/img/aston-villa-home-3.jpg", "assets/img/aston-villa-home-4.jpg"],
    story: "The Aston Villa home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "chelsea-away",
    name: "Chelsea Away",
    team: "Chelsea", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/chelsea-away-1.jpg",
    gallery: ["assets/img/chelsea-away-1.jpg", "assets/img/chelsea-away-2.jpg", "assets/img/chelsea-away-3.jpg"],
    story: "The Chelsea away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "chelsea-home",
    name: "Chelsea Home",
    team: "Chelsea", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/chelsea-home-1.jpg",
    gallery: ["assets/img/chelsea-home-1.jpg", "assets/img/chelsea-home-2.jpg", "assets/img/chelsea-home-3.jpg", "assets/img/chelsea-home-4.jpg"],
    story: "The Chelsea home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "chelsea-third",
    name: "Chelsea Third",
    team: "Chelsea", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/chelsea-third-1.jpg",
    gallery: ["assets/img/chelsea-third-1.jpg", "assets/img/chelsea-third-2.jpg", "assets/img/chelsea-third-3.jpg", "assets/img/chelsea-third-4.jpg"],
    story: "The Chelsea third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "liverpool-away",
    name: "Liverpool Away",
    team: "Liverpool", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/liverpool-away-1.jpg",
    gallery: ["assets/img/liverpool-away-1.jpg", "assets/img/liverpool-away-2.jpg", "assets/img/liverpool-away-3.jpg", "assets/img/liverpool-away-4.jpg"],
    story: "The Liverpool away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "liverpool-home",
    name: "Liverpool Home",
    team: "Liverpool", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/liverpool-home-1.jpg",
    gallery: ["assets/img/liverpool-home-1.jpg", "assets/img/liverpool-home-2.jpg", "assets/img/liverpool-home-3.jpg", "assets/img/liverpool-home-4.jpg"],
    story: "The Liverpool home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "liverpool-third",
    name: "Liverpool Third",
    team: "Liverpool", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/liverpool-third-1.jpg",
    gallery: ["assets/img/liverpool-third-1.jpg", "assets/img/liverpool-third-2.jpg"],
    story: "The Liverpool third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "manchester-city-stock-away",
    name: "Manchester City Away",
    team: "Manchester City", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/manchester-city-stock-away-1.jpg",
    gallery: ["assets/img/manchester-city-stock-away-1.jpg", "assets/img/manchester-city-stock-away-2.jpg", "assets/img/manchester-city-stock-away-3.jpg"],
    story: "The Manchester City away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Puma", authenticity: "Verified Original"
  },
  {
    slug: "manchester-city-stock-home",
    name: "Manchester City Home",
    team: "Manchester City", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/manchester-city-stock-home-1.jpg",
    gallery: ["assets/img/manchester-city-stock-home-1.jpg", "assets/img/manchester-city-stock-home-2.jpg", "assets/img/manchester-city-stock-home-3.jpg"],
    story: "The Manchester City home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Puma", authenticity: "Verified Original"
  },
  {
    slug: "manchester-city-stock-third",
    name: "Manchester City Third",
    team: "Manchester City", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/manchester-city-stock-third-1.jpg",
    gallery: ["assets/img/manchester-city-stock-third-1.jpg", "assets/img/manchester-city-stock-third-2.jpg", "assets/img/manchester-city-stock-third-3.jpg"],
    story: "The Manchester City third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Puma", authenticity: "Verified Original"
  },
  {
    slug: "manchester-united-stock-away",
    name: "Manchester United Away",
    team: "Manchester United", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/manchester-united-stock-away-1.jpg",
    gallery: ["assets/img/manchester-united-stock-away-1.jpg", "assets/img/manchester-united-stock-away-2.jpg", "assets/img/manchester-united-stock-away-3.jpg"],
    story: "The Manchester United away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "manchester-united-stock-home",
    name: "Manchester United Home",
    team: "Manchester United", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/manchester-united-stock-home-1.jpg",
    gallery: ["assets/img/manchester-united-stock-home-1.jpg", "assets/img/manchester-united-stock-home-2.jpg", "assets/img/manchester-united-stock-home-3.jpg", "assets/img/manchester-united-stock-home-4.jpg"],
    story: "The Manchester United home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "manchester-united-stock-third",
    name: "Manchester United Third",
    team: "Manchester United", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/manchester-united-stock-third-1.jpg",
    gallery: ["assets/img/manchester-united-stock-third-1.jpg", "assets/img/manchester-united-stock-third-2.jpg", "assets/img/manchester-united-stock-third-3.jpg"],
    story: "The Manchester United third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "newcastle-away",
    name: "Newcastle United Away",
    team: "Newcastle United", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/newcastle-away-1.jpg",
    gallery: ["assets/img/newcastle-away-1.jpg", "assets/img/newcastle-away-2.jpg", "assets/img/newcastle-away-3.jpg", "assets/img/newcastle-away-4.jpg"],
    story: "The Newcastle United away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "newcastle-home",
    name: "Newcastle United Home",
    team: "Newcastle United", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/newcastle-home-1.jpg",
    gallery: ["assets/img/newcastle-home-1.jpg", "assets/img/newcastle-home-2.jpg", "assets/img/newcastle-home-3.jpg"],
    story: "The Newcastle United home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "tottenham-hotspur-away",
    name: "Tottenham Hotspur Away",
    team: "Tottenham Hotspur", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/tottenham-hotspur-away-1.jpg",
    gallery: ["assets/img/tottenham-hotspur-away-1.jpg", "assets/img/tottenham-hotspur-away-2.jpg", "assets/img/tottenham-hotspur-away-3.jpg"],
    story: "The Tottenham Hotspur away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "tottenham-hotspur-home",
    name: "Tottenham Hotspur Home",
    team: "Tottenham Hotspur", year: 2026, player: "",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/tottenham-hotspur-home-1.jpg",
    gallery: ["assets/img/tottenham-hotspur-home-1.jpg", "assets/img/tottenham-hotspur-home-2.jpg", "assets/img/tottenham-hotspur-home-3.jpg"],
    story: "The Tottenham Hotspur home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "ac-milan-stock-away",
    name: "AC Milan Away",
    team: "AC Milan", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/ac-milan-stock-away-1.jpg",
    gallery: ["assets/img/ac-milan-stock-away-1.jpg", "assets/img/ac-milan-stock-away-2.jpg", "assets/img/ac-milan-stock-away-3.jpg"],
    story: "The AC Milan away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Puma", authenticity: "Verified Original"
  },
  {
    slug: "ac-milan-stock-home",
    name: "AC Milan Home",
    team: "AC Milan", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/ac-milan-stock-home-1.jpg",
    gallery: ["assets/img/ac-milan-stock-home-1.jpg", "assets/img/ac-milan-stock-home-2.jpg"],
    story: "The AC Milan home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Puma", authenticity: "Verified Original"
  },
  {
    slug: "inter-milan-away",
    name: "Inter Milan Away",
    team: "Inter Milan", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/inter-milan-away-1.jpg",
    gallery: ["assets/img/inter-milan-away-1.jpg", "assets/img/inter-milan-away-2.jpg", "assets/img/inter-milan-away-3.jpg"],
    story: "The Inter Milan away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "inter-milan-home",
    name: "Inter Milan Home",
    team: "Inter Milan", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/inter-milan-home-1.jpg",
    gallery: ["assets/img/inter-milan-home-1.jpg", "assets/img/inter-milan-home-2.jpg", "assets/img/inter-milan-home-3.jpg", "assets/img/inter-milan-home-4.jpg"],
    story: "The Inter Milan home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "inter-milan-third",
    name: "Inter Milan Third",
    team: "Inter Milan", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/inter-milan-third-1.jpg",
    gallery: ["assets/img/inter-milan-third-1.jpg", "assets/img/inter-milan-third-2.jpg", "assets/img/inter-milan-third-3.jpg"],
    story: "The Inter Milan third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "juventus-away",
    name: "Juventus Away",
    team: "Juventus", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Away",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/juventus-away-1.jpg",
    gallery: ["assets/img/juventus-away-1.jpg", "assets/img/juventus-away-2.jpg", "assets/img/juventus-away-3.jpg", "assets/img/juventus-away-4.jpg"],
    story: "The Juventus away shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "juventus-home",
    name: "Juventus Home",
    team: "Juventus", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/juventus-home-1.jpg",
    gallery: ["assets/img/juventus-home-1.jpg", "assets/img/juventus-home-2.jpg", "assets/img/juventus-home-3.jpg", "assets/img/juventus-home-4.jpg"],
    story: "The Juventus home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "juventus-third",
    name: "Juventus Third",
    team: "Juventus", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Third",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/juventus-third-1.jpg",
    gallery: ["assets/img/juventus-third-1.jpg", "assets/img/juventus-third-2.jpg", "assets/img/juventus-third-3.jpg"],
    story: "The Juventus third shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "roma-home",
    name: "Roma Home",
    team: "Roma", year: 2026, player: "",
    league: "serie-a", country: "Italy", kitType: "Home",
    category: "modern", condition: "Excellent", price: 449,
    pricing: { fan: { short: 449, long: 499 }, player: { short: 649, long: 699 } },
    customizable: true,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    img: "assets/img/roma-home-1.jpg",
    gallery: ["assets/img/roma-home-1.jpg", "assets/img/roma-home-2.jpg", "assets/img/roma-home-3.jpg", "assets/img/roma-home-4.jpg"],
    story: "The Roma home shirt for the 2026/27 season, available in Fan or Player version with short or long sleeve options.",
    brand: "New Balance", authenticity: "Verified Original"
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
  return p.pricing.fan.short;
}

function sleeveLabel(s) {
  return s === "long" ? "Long Sleeve" : "Short Sleeve";
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
