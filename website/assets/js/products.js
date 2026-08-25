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
    category: "modern", condition: "Mint Condition", price: 350,
    badge: "Rare", onHand: true, latestDrop: false, soldOut: false,
    sizes: ["M", "L"],
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
    slug: "france-90s-track-top",
    name: "France '90s Adidas Track Top",
    team: "France", year: 1994, player: "Adidas Eqpt",
    league: "international", country: "France", kitType: "Training",
    category: "vintage", condition: "Deadstock", price: 210,
    badge: "Deadstock", onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M", "L"],
    img: "assets/img/france-1990s-folded.png",
    gallery: ["assets/img/france-1990s-folded.png"],
    story: "A deadstock Adidas Equipment-era France track top, never worn, still carrying the sharp geometric striping of the early '90s national team kit line. A cornerstone piece for any terrace archive.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "ac-milan-1992-home",
    name: "AC Milan 1992 Home",
    team: "AC Milan", year: 1992, player: "Van Basten #9",
    league: "serie-a", country: "Italy", kitType: "Home",
    category: "vintage", condition: "Good", price: 420,
    badge: "Sold Out", onHand: true, latestDrop: false, soldOut: true,
    sizes: ["XL"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAacOuUI94pOJFwvGKIEqZg7OaI8juZAwGknz9Zv2jLXIm0YKXlNNY8Kn1OZWGglEsNsCr0DwaYwkfk5A15enQwXoup32K8pY6rNdJqGLjXZLnZOpBx_FN7LPvNVfuZxvovSSMqL5hUoDlqdqa7Rk9aWe_6DzthyLRfan6OXb3DZPluFzF9Aw2ZZMrbqBuXTuDsvR8PH8XU72wI7_epC58so6H8oroSQelt7IQ29GZf9hCxBVblCZE",
    gallery: [],
    story: "The iconic red-and-black stripes of Milan's dominant early-90s side, worn in the era of Van Basten, Baresi and Sacchi's press. A grail for Serie A collectors.",
    brand: "Mediolanum", authenticity: "Verified Original"
  },
  {
    slug: "japan-1998-home",
    name: "Japan 1998 Home",
    team: "Japan", year: 1998, player: "Nakata #8",
    league: "international", country: "Japan", kitType: "Home",
    category: "vintage", condition: "Excellent", price: 280,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["S", "M"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAWETUYPJobs26oAF_dIW3PhXDlOx1Tw9xrtaU9uGls0v1RQM0jpY92mpHYVhyDsoo4eoL7khvTZHZxUxvn5cvxDvvoWgkO7NAneElKym4GDOLssPK1dO1O81bLfID_42MyHatkwuOtTuLpO1xIYtB1Ce0HLcpqB5ImfdE5Dq0Mrmlr1G_tkA1Ef31LKVZrGuZ8uKCDfGEU0xvBdye7DDGcqNDP81KfNCLWPso_z-btj_9WZ0rfpE4",
    gallery: [],
    story: "Japan's flame-sleeved 1998 World Cup debut shirt, worn by a young Hidetoshi Nakata. Bold, era-defining graphic design on a deep indigo base.",
    brand: "Asics", authenticity: "Verified Original"
  },
  {
    slug: "man-utd-1998-home",
    name: "Manchester United 1998/99 Home",
    team: "Manchester United", year: 1998, player: "Sharp",
    league: "premier-league", country: "England", kitType: "Home",
    category: "vintage", condition: "Excellent", price: 250,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["M", "L", "XL"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVajJVT7WEf94JG-SjIQgEobJfawW2tWPQITO8N3ZjlID0Pvp11rTnMWLYiI9QI7m41iDuDxBeOqRzXMQkm5dH3FWh72oP_QUsT43xS9313GBFrzVxJbMrrajlwb7ZbMW8Xm6nsNTkCpn_YvBcguN_CjJaXG8mP_GKgaHxFSmZXxFF4vOhpN3i5e8MYPIagD_eOCLfgVd9dx2GKtA85JTb0-bCpACUhzIzPsS3gY1EeSKSIi0UGTg",
    gallery: [],
    story: "The treble-winning season. United's 1998/99 home shirt, carried through the Premier League, FA Cup and that Camp Nou night in the Champions League final.",
    brand: "Umbro", authenticity: "Verified Original"
  },
  {
    slug: "west-germany-1990-home",
    name: "West Germany 1990 Home",
    team: "West Germany", year: 1990, player: "World Cup Winners",
    league: "international", country: "West Germany", kitType: "Home",
    category: "vintage", condition: "Near Mint", price: 320,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["M"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfoAOYP2kxWaSmpmnKbwswPeN6Am4VtOt2obnlpwMSnIr02yDE_omWNV9nLpuhtaiQDIvrlYZm0_sfqqUU1K7XUswjogHsZAUmvK3hjwsR60KiaGg-uM-iovlFdItoc1x-rgB363KtISnvHKsNZJnV7j6XJG88hwW0vPfYf2kTWZRcCLRJJKdlJ9OkFS_xKYWcN0HkYU0mlJ19TmBHU7NrgOljcMPUnavknzdOm7ipiCDOxpPzOzw",
    gallery: [],
    story: "The geometric masterpiece worn to World Cup glory in Italia '90. One of the most instantly recognisable kits in the game's history.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "brazil-2002-home",
    name: "Brazil 2002 Home",
    team: "Brazil", year: 2002, player: "Ronaldo #9",
    league: "international", country: "Brazil", kitType: "Home",
    category: "modern", condition: "Good", price: 190,
    badge: null, onHand: true, latestDrop: false, soldOut: false,
    sizes: ["XL"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDlkoopw411RB7vp_GO3unp-r8Sm9poYTXkV66MyWaafBfr0lJ-DlYhR77cT1Pwj0gWuOftqfx5y9tC-7rziQnDZYxdbDxx9_EOs79sUkcAUOCQ0i2Rrhpv-UDVwkCwqK3Q1ZwQRq6-svIb2Z4vHLNxMimF7H6HV5SOqnxup3lhNLNEq31tvUx2V6gE91oMLCQ75IKuTcrG5R55z4SCro1ODTKvtUGf2WjX0rPCpmBgCpyHZd-1MZ4",
    gallery: [],
    story: "The canary yellow of the Pentacampeões. Ronaldo, Rivaldo and Ronaldinho's front three wore this to a fifth World Cup star in Yokohama.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "arsenal-0506-highbury",
    name: "Arsenal 05/06 'Highbury'",
    team: "Arsenal", year: 2005, player: "Highbury Farewell",
    league: "premier-league", country: "England", kitType: "Home",
    category: "modern", condition: "Mint Condition", price: 450,
    badge: "Grail", onHand: false, latestDrop: true, soldOut: false,
    sizes: ["L"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxD2SNTVis8mmLnEzlxSKul4XTn7Cw3-VA_c2P6Ih3QEsShKciaGadv38O1298AeMKeOzRONmwnbu8O6QJ_voN9K2hTvrTi5cwBqDFYStaiEkv02jl0p7b65v4OE_9r-0CMSiEMKBXXE9AWfFMxyiQm8Bs8LkTcCYeO_S50LjIWvI5gEKy94UizfI1bNmRBYtM_lVM2vQgFaynoc2Dwa5t8fnrkKCMeU3-0Tph-NO_6HUSmMsz2iw",
    gallery: [],
    story: "The commemorative maroon strip marking Arsenal's final season at Highbury before the move to the Emirates. Golden sponsor detailing throughout.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "juventus-9798-away",
    name: "Juventus 97/98 Away",
    team: "Juventus", year: 1997, player: "Del Piero Era",
    league: "serie-a", country: "Italy", kitType: "Away",
    category: "vintage", condition: "Excellent", price: 280,
    badge: null, onHand: false, latestDrop: true, soldOut: false,
    sizes: ["S", "M", "L"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuANzO0pZNRkiNmAlIfaKugJfIPcX8i89Jde-spHkU3KPsbT1rOI7tLwO6c1gkqgNJaV-ZZ4bXN_QUKZg8pHh1I-1Rc3pTyZRnCNOdgEE9DojdHLGiktXlcoJpQnsTz3dWkA6W2ciNCU4M-NJxKMDPqzgkvklyWwRV8PfvcJ9DbzFlLO1kxzClzveUdpHEMHTpuHFtAOLBulO95LPHYSCzzfGbszvdrAlGnIErnQiquRCSb07Jm81hY",
    gallery: [],
    story: "The pink-and-black away kit from Juve's back-to-back Champions League final run. A cult favourite among Serie A archivists.",
    brand: "Lotto", authenticity: "Verified Original"
  },
  {
    slug: "ac-milan-0607-home",
    name: "AC Milan 06/07 Home",
    team: "AC Milan", year: 2006, player: "Maldini Era",
    league: "serie-a", country: "Italy", kitType: "Home",
    category: "modern", condition: "Excellent", price: 210,
    badge: null, onHand: false, latestDrop: true, soldOut: false,
    sizes: ["M", "L"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfK_RjutWhgESEyoTct2W8ZQm8VvX4lwgVrR8YDOt5IjAIXnG8WHIZ14-hFB50x1MxqQM_cNd40lCwRSTtOtNBzH3sLFeEkShNqmGWU_ljsROITEpvcS2RQxfsIC6tKC0_4h1ibRG0MZvbvrFym3DJIxbfS9UQzVPeBRczncYNQn5_HqzTJLlkh8jpIRUOHIb6IjCean0XRAQ0Xf_w8dc7QbUuMbewHBRLH_y0FoUA75XeNznHE_c",
    gallery: [],
    story: "The Champions League-winning strip from Milan's 2007 Athens triumph over Liverpool. Clean lines, classic red-and-black.",
    brand: "Adidas", authenticity: "Verified Original"
  },
  {
    slug: "ac-milan-1990-home",
    name: "AC Milan 1990 Home",
    team: "AC Milan", year: 1990, player: "Van Basten #9",
    league: "serie-a", country: "Italy", kitType: "Home",
    category: "vintage", condition: "Excellent", price: 320,
    badge: "Rare", onHand: false, latestDrop: false, soldOut: false,
    sizes: ["M"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuClbcthu0JEt3p4rMRpw6R2y2C8z3d3vpQ43fdw7o682C5da81Wq2E38oqcOi5P38iEPf5QjQXHpVnw-8s5betD0LDVGLwn366-x8sKIUQ1R9PZjrubRzNJEJhME7PnaG31_oBktBQ4CE902n31XQpqFAaUW8Jik2B21EJW2fOSD34znC7O40fL4hRXSMea6TFN1Mix-h7PJi4XOB_AeKemdtDr2BhBbA-oLEGxR6li6eyoZMmTtUc",
    gallery: [],
    story: "Sacchi's European Cup winners. Deep reds and blacks from the peak of Milan's late-80s/early-90s dynasty.",
    brand: "Mediolanum", authenticity: "Verified Original"
  },
  {
    slug: "arsenal-2002-away",
    name: "Arsenal 2002 Away",
    team: "Arsenal", year: 2002, player: "Henry #14",
    league: "premier-league", country: "England", kitType: "Away",
    category: "modern", condition: "Good", price: 180,
    badge: null, onHand: false, latestDrop: false, soldOut: false,
    sizes: ["M", "L"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Il75WLhHvTo3kiAIUtfvVgPtj81tU547Zu9xNldVDrtb9IGM6Xs8ontwEcGkzWIdeSHecXfWgTVT0HEiUTM2CfW3EGBiZBCBXSSb7fZSlftZBLLUg0RId0moXQsba1mrSj91Py1moNfUgsQgfTSQwJLd1ClyRVlT6PUQ-5fekeYbFD3BP8EpxNlTrtqeH38nwmiSPUSF6Zc1eVwzGHxr6sMXWavMspf5b5O2DY_K6qbYduT6asw",
    gallery: [],
    story: "The gold-on-navy away kit from the Invincibles build-up era, worn by Thierry Henry at his rampaging best.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "boca-juniors-1997-home",
    name: "Boca Juniors 1997 Home",
    team: "Boca Juniors", year: 1997, player: "Maradona #10",
    league: "other-clubs", country: "Argentina", kitType: "Home",
    category: "vintage", condition: "Very Good", price: 290,
    badge: null, onHand: false, latestDrop: false, soldOut: false,
    sizes: ["L", "XL"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAu6KaSPG79VcUfvQMh-BapGmDo1lcZ-vdKMgWj_1JdbJZWtaAj4E7_XgIPk4LbBurpTdnO6JjI3AQhBe30hz2JQLlzUS_aKVfBgRdigjhRGUdPhRlTFF9_aQ3AYNeoh4EPJXIqOQNI6iSrMwYkYcxWS-0M6PT2u5pghi26rQwRhXK4UMJdeythn9XvppczdJOjBGhigAQI0SZWbmsqbrzcz45FrCt4AK5j1499tryZHFt8HoCroy4",
    gallery: [],
    story: "La Bombonera's blue and gold, worn during Maradona's emotional homecoming years at the club he loved.",
    brand: "Umbro", authenticity: "Verified Original"
  },
  {
    slug: "fiorentina-1994-home",
    name: "Fiorentina Home",
    team: "Fiorentina", year: 1994, player: "Batistuta #9",
    league: "serie-a", country: "Italy", kitType: "Home",
    category: "vintage", condition: "Excellent", price: 345,
    badge: "Rare", onHand: false, latestDrop: false, soldOut: false,
    sizes: ["L"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6U2TrDHLn8ZxkfezroVzHENF98Xs36MUERZLZh5yb0k7kauKIC-h0hmvvsLL45hSrMzWbQ0dqysxT86J-gLqYvsEoi-fQb6PDmiG0H6MBe3bhObM4gjQBFLT3K_FwGIF-nUnWaPUee05gLQV19qsywgbXtY_NhJAfZeWVd6xjgICvri33vcT2QFt_uWZRculQ2gZp1JEaOctmS4YAYGzUdGtOOjhZ6sDbMMBIPMCi0h2HrSLv1bY",
    gallery: [],
    story: "The viola shirt of Batistuta's pomp — a Serie A icon whose free-kicks and finishing made this shirt legendary in Florence.",
    brand: "Fila", authenticity: "Verified Original"
  },
  {
    slug: "brazil-2002-away-worldcup",
    name: "Brazil Away World Cup",
    team: "Brazil", year: 2002, player: "Ronaldo #9",
    league: "international", country: "Brazil", kitType: "Away",
    category: "modern", condition: "Mint", price: 280,
    badge: null, onHand: false, latestDrop: false, soldOut: false,
    sizes: ["M"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDt9cRw5QFi8klmZEz1Mfz6neFTSUx49CH2UokTM8WcAkz0PUea5gdi2iu0m3ABRsAM_JzkuoHDhj5yiwFfZrjxzvzPibcuz3IZf2krvXKGg-LlK8aiqO9IDZqQqMxfifkbFkFhIxVC6WQMRVYHeWVv5H45Qx99pm4CfKGxYHG_EWMJQYTXfSQ8Cl9Ub7mACKKSXvlST5es73Ct9Pll2hvnvJRN5SMuZCiw7IyDbxvXDBWZGp5rRls",
    gallery: [],
    story: "The blue away change kit from Brazil's 2002 World Cup campaign — a quieter cousin to the famous yellow home shirt.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "croatia-1998-home",
    name: "Croatia Home",
    team: "Croatia", year: 1998, player: "Suker #9",
    league: "international", country: "Croatia", kitType: "Home",
    category: "vintage", condition: "Very Good", price: 410,
    badge: "Sold Out", onHand: false, latestDrop: false, soldOut: true,
    sizes: ["XL"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCFG6TuODXOdiiCMFbeD8TN8YxObrp46N8c_fTXg9ZUcIanaB8SbCPg4_fGnZfByeI4bNTReTCpWzfZiAvfhUlmAs7uxx_bEBl8KIZLQukCL5_OC346fWTrepDEEheW59YHCEw1vFUfGpyN4S3z8EAMRbDMIPP9133EXo89w6-O2Guu3CaAsL3cS8iWGdmNYi_6vjLlUS_OMNsqO3MwvryPt7cCNFOW4JEfem_6gpRhVO_C__1Ja8",
    gallery: [],
    story: "The chequerboard shirt of Croatia's fairytale run to third place at France '98, with Davor Suker's golden boot campaign.",
    brand: "Lotto", authenticity: "Verified Original"
  },
  {
    slug: "brazil-1998-home",
    name: "Brazil Home",
    team: "Brazil", year: 1998, player: "Ronaldo #9",
    league: "international", country: "Brazil", kitType: "Home",
    category: "vintage", condition: "Excellent", price: 320,
    badge: "Archival", onHand: false, latestDrop: false, soldOut: false,
    sizes: ["M", "L"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBey8WQglEok3n_BkWhRymMQ-cFutnsq7WDWpiXSa94QYJ-ilsnsAdVZVD6mSkIVE0B_FB-LLSKtk3YZid2qOnjFAcV9TMNnOQ2ZMUWPBnzWXUU9zvosL8OMqdnCRni4Ngc9LQW90sJ4D0a-X4Uj7xPoeoXYllgnua0A-ffox9pTYqds-Y_6hFCC0E15MpCZwCmcXC1Yylvnp5HvRbE6GzbichNVdyRemwy8ULQlkrAw86FCikywBk",
    gallery: [],
    story: "The 1998 home shirt worn during Ronaldo's ill-fated but iconic World Cup final appearance in Paris.",
    brand: "Nike", authenticity: "Verified Original"
  },
  {
    slug: "england-2002-home-ls",
    name: "England Home LS",
    team: "England", year: 2002, player: "Beckham #7",
    league: "international", country: "England", kitType: "Home",
    category: "modern", condition: "Excellent", price: 240,
    badge: null, onHand: false, latestDrop: false, soldOut: false,
    sizes: ["M", "L", "XL"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBAImmO4cua2kEEqBfz64V2KU3l2PI05SwLfl8LDTKrJdjtNkJUgXUzdk3La237fFWdBuVCQn3Gg_OpakdptWYoit59V-qUbHhBWqadIX2LwYkgchLCt7FqGBXpimQEm50--ZApxfRBvMaRPwf7PxhXl3G0X2XwOysuALxkF-TxCAfoOK-T9wXysv1_htpoTH4bYLoM_-yvkU__7FsDHLUZ-EzO2v-RbexCwql5T-xJ73HGvguPvV8",
    gallery: [],
    story: "The long-sleeve England shirt of the 2002 Japan/Korea campaign — Beckham's redemption tournament after 1998.",
    brand: "Umbro", authenticity: "Verified Original"
  },
  {
    slug: "italy-1994-away",
    name: "Italy Away",
    team: "Italy", year: 1994, player: "Baggio #10",
    league: "international", country: "Italy", kitType: "Away",
    category: "vintage", condition: "Excellent", price: 480,
    badge: "Rare", onHand: false, latestDrop: false, soldOut: false,
    sizes: ["L"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA12rx3TFxXnzsYT1ugaYTdCy7O5qkq8qLugEAL99-pHXprw0uY5iyLorkx7-a5u-IKpB0smCEnbnDUWj-K1hxz_Epb8yFx3qiuJ5JN4EOeSJ0SNwQ6cfaWITllUkSJrKU3esj8BYokHJSsWyAI5boVPQwjqASG0sTwsi7t5jFost8cXHOZO-gVRxMg2LyodrJNjJyaG2YSQ_dRJAWdi2OW6wFoYyzZCJVtzccBs6GzZIT989ExaxU",
    gallery: [],
    story: "Worn by Roberto Baggio through Italy's 1994 World Cup run to the final in Pasadena. One of the most storied number 10 shirts in the archive.",
    brand: "Diadora", authenticity: "Verified Original"
  },
  {
    slug: "france-2004-home",
    name: "France Home",
    team: "France", year: 2004, player: "Henry #12",
    league: "international", country: "France", kitType: "Home",
    category: "modern", condition: "Excellent", price: 220,
    badge: null, onHand: false, latestDrop: false, soldOut: false,
    sizes: ["M", "L"],
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCn-0dzI4ry5EWzAeNcCr4LthbuxzCuKBaPg09pqKnfeWS6_JTaEIaMuCpaMRXT4pRDgV3KOziCn84MeNal7eo4xquqWbKF3B9rI4nXy4U272FeJ2eaVsL28W7wCOnQ0Z5KGodVZg-ANwKVclTtr7o17ysuvIu9X4Hg_a2a6qSmUc3wR491rwHM5Z9lMxOXbM0Bi65Nq7I0cabTKBiEpmMRIzaTz7x4gH7M34HXF5ZQSMvy31YfGfQ",
    gallery: [],
    story: "France's Euro 2004 home shirt, worn by the golden generation's second wave headed by Thierry Henry and Zinedine Zidane.",
    brand: "Adidas", authenticity: "Verified Original"
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

