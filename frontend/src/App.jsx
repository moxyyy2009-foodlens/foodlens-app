import { useState, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const QUOTES = [
  { text: "Let food be thy medicine and medicine be thy food.", author: "Hippocrates" },
  { text: "You are what you eat. Don't be fast, cheap, easy, or fake.", author: "Unknown" },
  { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
  { text: "The food you eat can be the safest medicine or the slowest poison.", author: "Ann Wigmore" },
];

const CAT_ICONS = {
  "Beverages": "🥤", "Soft drinks": "🥤", "Sodas": "🥤",
  "Snacks": "🍿", "Biscuits": "🍪", "Chocolates": "🍫",
  "Dairy": "🥛", "Cheeses": "🧀", "Yogurts": "🍶",
  "Noodles": "🍜", "Pasta": "🍝", "Cereals": "🥣",
  "Juices": "🧃", "Waters": "💧", "Energy drinks": "⚡",
  "Sauces": "🫙", "Oils": "🫒", "Condiments": "🧂",
  "Chips": "🥔", "Breads": "🍞", "default": "🍽️"
};

const INGREDIENT_CONCERNS = {
  "palm oil": { concern: "High in saturated fat. Excess saturated fat raises LDL cholesterol.", source: "American Heart Association" },
  "sugar": { concern: "Excess sugar intake linked to obesity, type 2 diabetes and tooth decay.", source: "WHO Global Sugar Guidelines 2015" },
  "salt": { concern: "High sodium intake linked to elevated blood pressure. WHO recommends <2000mg/day.", source: "WHO Sodium Guidelines" },
  "sodium": { concern: "High sodium intake linked to elevated blood pressure. WHO recommends <2000mg/day.", source: "WHO Sodium Guidelines" },
  "high fructose corn syrup": { concern: "Linked to increased triglycerides and insulin resistance.", source: "American Journal of Clinical Nutrition" },
  "refined wheat flour": { concern: "High glycemic index — causes rapid blood sugar spikes.", source: "Harvard Medical School" },
  "maida": { concern: "Highly processed flour with low fiber. High glycemic index.", source: "ICMR Dietary Guidelines" },
  "artificial flavour": { concern: "Synthetic flavoring with no nutritional value.", source: "FSSAI Food Additives Guidelines" },
  "artificial color": { concern: "Some artificial colors linked to hyperactivity in children per EFSA studies.", source: "European Food Safety Authority" },
  "ins 150d": { concern: "Caramel color class IV. Some studies suggest health concerns at high doses.", source: "CSPI Food Dye Report" },
  "ins 338": { concern: "Phosphoric acid erodes tooth enamel and may affect calcium absorption.", source: "Journal of Dental Research" },
  "ins 211": { concern: "Sodium benzoate preservative. May form benzene with Vitamin C in some conditions.", source: "FDA Food Additive Studies" },
  "ins 621": { concern: "MSG — flavor enhancer. Generally recognized as safe by FDA at normal consumption levels.", source: "FDA GRAS Database" },
  "ins 635": { concern: "Disodium ribonucleotides — flavor enhancer used to boost savory taste. Safe at regulated amounts.", source: "FSSAI Additive Guidelines" },
  "ins 951": { concern: "Aspartame sweetener. Acceptable daily intake: 40mg/kg body weight per EFSA.", source: "EFSA Aspartame Assessment 2013" },
  "hydrogenated vegetable oil": { concern: "Source of trans fats. WHO recommends eliminating trans fats from diet.", source: "WHO REPLACE Initiative" },
  "trans fat": { concern: "WHO recommends eliminating trans fats — linked to heart disease.", source: "WHO REPLACE Initiative" },
  "caffeine": { concern: "Stimulant. Safe limit: 400mg/day for adults, 100mg/day for adolescents per EFSA.", source: "EFSA Caffeine Safety Assessment" },
};

// ─── SCORING ENGINE ───────────────────────────────────────────────────────────

function scoreProduct(product) {
  let score = 100;
  const factors = [];
  const nutriments = product.nutriments || {};

  const per100 = (key) => parseFloat(nutriments[key + "_100g"] || nutriments[key] || 0);

  // Sugar
  const sugar = per100("sugars");
  if (sugar > 20) { score -= 25; factors.push({ label: "Very high sugar", impact: -25, value: `${sugar.toFixed(1)}g/100g`, source: "WHO: >20g/100g is very high" }); }
  else if (sugar > 10) { score -= 15; factors.push({ label: "High sugar", impact: -15, value: `${sugar.toFixed(1)}g/100g`, source: "WHO: >10g/100g is high" }); }
  else if (sugar > 5) { score -= 5; factors.push({ label: "Moderate sugar", impact: -5, value: `${sugar.toFixed(1)}g/100g`, source: "WHO Sugar Guidelines" }); }
  else if (sugar <= 2) { score += 5; factors.push({ label: "Low sugar", impact: +5, value: `${sugar.toFixed(1)}g/100g`, source: "WHO Sugar Guidelines" }); }

  // Sodium
  const sodium = per100("sodium") * 1000 || per100("salt") * 400;
  if (sodium > 800) { score -= 20; factors.push({ label: "Very high sodium", impact: -20, value: `${sodium.toFixed(0)}mg/100g`, source: "WHO: <2000mg/day recommended" }); }
  else if (sodium > 400) { score -= 10; factors.push({ label: "High sodium", impact: -10, value: `${sodium.toFixed(0)}mg/100g`, source: "WHO Sodium Guidelines" }); }

  // Saturated fat
  const satFat = per100("saturated-fat");
  if (satFat > 10) { score -= 20; factors.push({ label: "Very high saturated fat", impact: -20, value: `${satFat.toFixed(1)}g/100g`, source: "AHA: raises LDL cholesterol" }); }
  else if (satFat > 5) { score -= 10; factors.push({ label: "High saturated fat", impact: -10, value: `${satFat.toFixed(1)}g/100g`, source: "American Heart Association" }); }

  // Fiber (positive)
  const fiber = per100("fiber");
  if (fiber > 6) { score += 15; factors.push({ label: "High fiber", impact: +15, value: `${fiber.toFixed(1)}g/100g`, source: "ICMR: fiber supports digestion & heart health" }); }
  else if (fiber > 3) { score += 8; factors.push({ label: "Good fiber content", impact: +8, value: `${fiber.toFixed(1)}g/100g`, source: "ICMR Dietary Guidelines" }); }

  // Protein (positive)
  const protein = per100("proteins");
  if (protein > 15) { score += 10; factors.push({ label: "High protein", impact: +10, value: `${protein.toFixed(1)}g/100g`, source: "ICMR: protein supports muscle and metabolism" }); }
  else if (protein > 8) { score += 5; factors.push({ label: "Good protein", impact: +5, value: `${protein.toFixed(1)}g/100g`, source: "ICMR Dietary Guidelines" }); }

  // Energy / calories
  const energy = per100("energy-kcal") || per100("energy") / 4.184;
  if (energy > 500) { score -= 10; factors.push({ label: "Very high calorie density", impact: -10, value: `${Math.round(energy)} kcal/100g`, source: "Based on average 2000 kcal/day recommendation" }); }

  score = Math.max(5, Math.min(100, score));

  let stars, label, color;
  if (score >= 86) { stars = 5; label = "Excellent"; color = "#16a34a"; }
  else if (score >= 71) { stars = 4; label = "Great"; color = "#22c55e"; }
  else if (score >= 51) { stars = 3; label = "Good"; color = "#eab308"; }
  else if (score >= 31) { stars = 2; label = "Moderate"; color = "#f97316"; }
  else { stars = 1; label = "Bad"; color = "#ef4444"; }

  return { score, stars, label, color, factors };
}

// ─── API CALLS ────────────────────────────────────────────────────────────────

async function searchProducts(query) {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error("Search failed");
    const data = await response.json();
    return data.products || [];
  } catch (e) {
    console.error(e);
    throw new Error("Could not search products. Check your connection.");
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getIngredientConcerns(ingredientsText) {
  if (!ingredientsText) return [];
  const text = ingredientsText.toLowerCase();
  const found = [];
  for (const [key, val] of Object.entries(INGREDIENT_CONCERNS)) {
    if (text.includes(key)) found.push({ name: key, ...val });
  }
  return found;
}

function getCategoryIcon(category) {
  if (!category) return "🍽️";
  const lower = category.toLowerCase();
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (lower.includes(key.toLowerCase())) return icon;
  }
  return "🍽️";
}

function StarRating({ stars, color }) {
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 18, color: i <= stars ? color : "#e5e7eb" }}>★</span>
      ))}
    </div>
  );
}

function ScoreRing({ score, color, size = 80 }) {
  const r = size * 0.37, circ = 2 * Math.PI * r, offset = circ - (score / 100) * circ, c = size / 2;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke="#e5e7eb" strokeWidth={size * 0.09} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={size * 0.09}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 800, color, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

function AdBanner({ text }) {
  return (
    <div style={{ background: "linear-gradient(135deg,#052e16,#14532d)", borderRadius: 12, padding: "11px 16px", margin: "14px 0", textAlign: "center", color: "#86efac", fontSize: 12, fontStyle: "italic", border: "1px solid #16a34a30" }}>
      📢 <span style={{ opacity: 0.5, fontSize: 10 }}>[AD SPACE] </span>{text || "Eat Smarter. Live Longer. 🌿 Your health is your greatest wealth."}
    </div>
  );
}

function NutrientRow({ label, value, unit, warn }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: "1px solid #f0fdf4" }}>
      <span style={{ fontSize: 13, color: "#374151" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: warn ? "#dc2626" : "#14532d" }}>{value}{unit}</span>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────

export default function FoodLens() {
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("nutrition");
  const [scored, setScored] = useState(null);
  const [concerns, setConcerns] = useState([]);
  const [imgError, setImgError] = useState(false);
  const quoteIdx = useState(() => Math.floor(Math.random() * QUOTES.length))[0];

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError("");
    setSearchResults([]);
    try {
      const results = await searchProducts(query.trim());
      setSearchResults(results);
      if (results.length === 0) setSearchError(`No results found for "${query}". Try a different name or brand.`);
    } catch (e) {
      setSearchError("Could not search products. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }, [query]);

  function openProduct(product) {
    const s = scoreProduct(product);
    const ingredientsText = product.ingredients_text || product.ingredients || "";
    const c = getIngredientConcerns(ingredientsText);
    setScored(s);
    setConcerns(c);
    setSelected(product);
    setActiveTab("nutrition");
    setImgError(false);
    setView("detail");
  }

  function goHome() {
    setView("home");
    setSearchResults([]);
    setQuery("");
    setSearchError("");
  }

  const n = selected?.nutriments || {};
  const per100 = (key) => {
    const val = parseFloat(n[key + "_100g"] || n[key] || 0);
    return isNaN(val) ? null : val;
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === "home") return (
    <div style={{ minHeight: "100vh", background: "#f8fdf9", fontFamily: "'DM Sans',sans-serif", color: "#111827" }}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />

      {/* Hero */}
      <div style={{ background: "linear-gradient(155deg,#052e16 0%,#14532d 55%,#166534 100%)", padding: "40px 20px 56px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, background: "#16a34a0d", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: -50, left: -50, width: 200, height: 200, background: "#86efac08", borderRadius: "50%" }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, letterSpacing: 5, color: "#86efac", textTransform: "uppercase", marginBottom: 10 }}>🔍 FoodLens</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(30px,8vw,48px)", color: "#f0fdf4", margin: "0 0 10px", lineHeight: 1.2, fontWeight: 800 }}>
            See Through<br />Your Food
          </h1>
          <p style={{ color: "#bbf7d0", fontSize: 14, margin: "0 0 28px", lineHeight: 1.8, maxWidth: 320 }}>
            Real ingredient data. Factual health scores.<br />
            500+ verified food products with healthier alternatives.
          </p>

          {/* Search */}
          <div style={{ display: "flex", gap: 8, maxWidth: 500 }}>
            <div style={{ flex: 1, display: "flex", background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.25)" }}>
              <span style={{ padding: "0 14px", display: "flex", alignItems: "center", color: "#9ca3af", fontSize: 18 }}>🔍</span>
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                placeholder="Coca-Cola, Maggi, Lays, Cadbury..."
                style={{ flex: 1, border: "none", outline: "none", padding: "14px 8px 14px 0", fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: "#111827", background: "transparent" }}
              />
              {query && <button onClick={() => setQuery("")} style={{ background: "none", border: "none", padding: "0 14px", cursor: "pointer", color: "#9ca3af", fontSize: 20 }}>×</button>}
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !query.trim()}
              style={{ background: searching ? "#d1fae5" : "#16a34a", color: "#fff", border: "none", borderRadius: 14, padding: "0 20px", fontWeight: 700, fontSize: 14, cursor: searching ? "not-allowed" : "pointer", fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>
              {searching ? "..." : "Search"}
            </button>
          </div>

          {/* Search Results */}
          {searching && (
            <div style={{ marginTop: 12, color: "#bbf7d0", fontSize: 14 }}>⏳ Searching database...</div>
          )}
          {searchError && (
            <div style={{ marginTop: 12, background: "rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#fde68a", fontSize: 13 }}>⚠️ {searchError}</div>
          )}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 10, background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 12px 40px rgba(0,0,0,0.25)", maxWidth: 500 }}>
              <div style={{ padding: "10px 16px", background: "#f0fdf4", fontSize: 11, color: "#16a34a", letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>
                {searchResults.length} results found
              </div>
              {searchResults.map((p, i) => {
                const s = scoreProduct(p);
                return (
                  <div key={i} onClick={() => { openProduct(p); }}
                    style={{ padding: "13px 16px", borderBottom: "1px solid #f0fdf4", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, background: "#fff", transition: "background 0.1s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f0fdf4"}
                    onMouseLeave={e => e.currentTarget.style.background = "#fff"}>
                    {p.image_url && !imgError
                      ? <img src={p.image_url} alt="" style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 8, border: "1px solid #e5e7eb", flexShrink: 0 }} onError={() => setImgError(true)} />
                      : <div style={{ width: 44, height: 44, background: "#f0fdf4", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{getCategoryIcon(p.category)}</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: "#111827", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.product_name || p.name}</div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>{p.brands || p.brand || "Unknown brand"}</div>
                    </div>
                    <div style={{ textAlign: "center", flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 18, color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.score}</div>
                      <StarRating stars={s.stars} color={s.color} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        {/* Quote */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", marginTop: -22, boxShadow: "0 4px 20px rgba(0,0,0,0.07)", borderLeft: "4px solid #16a34a", marginBottom: 6 }}>
          <div style={{ fontSize: 14, color: "#14532d", fontStyle: "italic", lineHeight: 1.75 }}>" {QUOTES[quoteIdx].text}"</div>
          <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>— {QUOTES[quoteIdx].author}</div>
        </div>

        <AdBanner />

        {/* How it works */}
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#9ca3af", textTransform: "uppercase", marginBottom: 12 }}>How FoodLens Works</div>
        {[
          { icon: "🔍", title: "Search any product", desc: "Type any food or brand name from our 500+ verified products." },
          { icon: "📊", title: "Real ingredient data", desc: "All data sourced from official databases and verified sources." },
          { icon: "⭐", title: "Transparent star rating", desc: "We score based on WHO/AHA guidelines — see exactly why." },
          { icon: "🥗", title: "Discover better options", desc: "Find healthier alternative brands in the same category." },
        ].map((s, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #dcfce7", borderRadius: 12, padding: "14px 16px", marginBottom: 10, display: "flex", gap: 14, alignItems: "flex-start" }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>{s.icon}</span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14, color: "#14532d", marginBottom: 3 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          </div>
        ))}

        {/* Rating guide */}
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#9ca3af", textTransform: "uppercase", marginBottom: 12, marginTop: 8 }}>FoodLens Star Rating Guide</div>
        <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", border: "1px solid #dcfce7", marginBottom: 20 }}>
          {[
            { stars: 5, label: "Excellent", color: "#16a34a", desc: "Highly nutritious. Great for regular consumption." },
            { stars: 4, label: "Great", color: "#22c55e", desc: "Good nutritional value. Suitable for regular use." },
            { stars: 3, label: "Good", color: "#eab308", desc: "Acceptable nutrition. Fine in balanced amounts." },
            { stars: 2, label: "Moderate", color: "#f97316", desc: "Limited nutritional value. Best consumed occasionally." },
            { stars: 1, label: "Bad", color: "#ef4444", desc: "Very low nutritional value. Consume rarely." },
          ].map((r, i, arr) => (
            <div key={i} style={{ padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid #f0fdf4" : "none", display: "flex", alignItems: "center", gap: 12 }}>
              <StarRating stars={r.stars} color={r.color} />
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: r.color }}>{r.label}</span>
                <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>{r.desc}</span>
              </div>
            </div>
          ))}
        </div>

        <AdBanner text="💚 Stay Healthy — Make informed choices about your food." />

        <div style={{ fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 16, marginBottom: 24, lineHeight: 1.8 }}>
          Data sourced from verified food databases<br />
          Scoring based on WHO, AHA & ICMR official guidelines<br />
          FoodLens provides information only — not medical advice
        </div>
      </div>
    </div>
  );

  // ── DETAIL ────────────────────────────────────────────────────────────────
  const energy = per100("energy-kcal") || (per100("energy") ? (per100("energy") / 4.184) : null);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fdf9", fontFamily: "'DM Sans',sans-serif" }}>
      {/* Product Image Header */}
      <div style={{ background: "linear-gradient(155deg,#052e16,#14532d)", position: "relative" }}>
        <button onClick={goHome} style={{ position: "absolute", top: 16, left: 16, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#f0fdf4", fontSize: 14, cursor: "pointer", padding: "8px 14px", zIndex: 10, fontFamily: "'DM Sans',sans-serif" }}>← Back</button>

        {/* Product image */}
        <div style={{ display: "flex", justifyContent: "center", padding: "50px 20px 20px" }}>
          {selected?.image_url && !imgError
            ? <img src={selected.image_url} alt={selected.product_name || selected.name} onError={() => setImgError(true)}
                style={{ maxHeight: 180, maxWidth: "70%", objectFit: "contain", borderRadius: 12, background: "rgba(255,255,255,0.08)", padding: 10 }} />
            : <div style={{ width: 140, height: 140, background: "rgba(255,255,255,0.1)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 60 }}>
                {getCategoryIcon(selected?.category)}
              </div>
          }
        </div>

        {/* Product info */}
        <div style={{ padding: "0 20px 28px", display: "flex", gap: 16, alignItems: "flex-start" }}>
          <ScoreRing score={scored.score} color={scored.color} size={82} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: "#f0fdf4", fontWeight: 800, lineHeight: 1.25 }}>{selected.product_name || selected.name}</div>
            <div style={{ fontSize: 12, color: "#86efac", marginTop: 3 }}>{selected.brands || selected.brand || "Unknown brand"}{selected.quantity ? ` · ${selected.quantity}` : ""}</div>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <StarRating stars={scored.stars} color={scored.color} />
              <span style={{ fontSize: 14, fontWeight: 700, color: scored.color }}>{scored.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <AdBanner />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 2 }}>
          {[["nutrition","📊 Nutrition"],["ingredients","🧪 Ingredients"],["score","⭐ Score"],["concerns","⚠️ Concerns"]].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: "8px 16px", borderRadius: 20, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: activeTab === tab ? "#16a34a" : "#fff",
              color: activeTab === tab ? "#fff" : "#6b7280",
              fontWeight: activeTab === tab ? 700 : 400,
              fontSize: 13, fontFamily: "'DM Sans',sans-serif",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)"
            }}>{label}</button>
          ))}
        </div>

        {/* NUTRITION TAB */}
        {activeTab === "nutrition" && (
          <div>
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
              <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Per 100g / 100ml</div>
              {energy !== null && <NutrientRow label="Energy" value={Math.round(energy)} unit=" kcal" />}
              {per100("proteins") !== null && <NutrientRow label="Protein" value={per100("proteins").toFixed(1)} unit="g" />}
              {per100("carbohydrates") !== null && <NutrientRow label="Carbohydrates" value={per100("carbohydrates").toFixed(1)} unit="g" />}
              {per100("sugars") !== null && <NutrientRow label="  of which Sugars" value={per100("sugars").toFixed(1)} unit="g" warn={per100("sugars") > 10} />}
              {per100("fat") !== null && <NutrientRow label="Fat" value={per100("fat").toFixed(1)} unit="g" />}
              {per100("saturated-fat") !== null && <NutrientRow label="  of which Saturated" value={per100("saturated-fat").toFixed(1)} unit="g" warn={per100("saturated-fat") > 5} />}
              {per100("fiber") !== null && <NutrientRow label="Fiber" value={per100("fiber").toFixed(1)} unit="g" />}
              {(per100("sodium") !== null || per100("salt") !== null) && (
                <NutrientRow label="Sodium" value={((per100("sodium") || per100("salt") * 0.4) * 1000).toFixed(0)} unit="mg" warn={(per100("sodium") || per100("salt") * 0.4) * 1000 > 400} />
              )}
              {!energy && !per100("proteins") && !per100("carbohydrates") && (
                <div style={{ padding: "14px 0", color: "#9ca3af", fontSize: 13, textAlign: "center" }}>
                  Full nutrition data not available yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* INGREDIENTS TAB */}
        {activeTab === "ingredients" && (
          <div>
            {selected.ingredients_text || selected.ingredients ? (
              <div style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Full Ingredients List</div>
                <div style={{ fontSize: 13, color: "#374151", lineHeight: 2, wordBreak: "break-word" }}>
                  {selected.ingredients_text || selected.ingredients}
                </div>
              </div>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div style={{ fontWeight: 600, color: "#14532d", marginBottom: 6 }}>Ingredient data not available</div>
              </div>
            )}
          </div>
        )}

        {/* SCORE TAB */}
        {activeTab === "score" && (
          <div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 10px rgba(0,0,0,0.04)", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <ScoreRing score={scored.score} color={scored.color} size={70} />
                <div>
                  <StarRating stars={scored.stars} color={scored.color} />
                  <div style={{ fontSize: 20, fontWeight: 800, color: scored.color, fontFamily: "'Playfair Display',serif", marginTop: 4 }}>{scored.label}</div>
                  <div style={{ fontSize: 12, color: "#9ca3af" }}>Score: {scored.score}/100</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 1, textTransform: "uppercase", marginBottom: 14 }}>What affected this score</div>
              {scored.factors.length > 0 ? scored.factors.map((f, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: f.impact < 0 ? "#dc2626" : "#16a34a" }}>{f.impact > 0 ? "+" : ""}{f.impact} pts</span>
                  </div>
                  <div style={{ background: "#f3f4f6", borderRadius: 6, height: 7, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(Math.abs(f.impact) * 2.5, 100)}%`, background: f.impact < 0 ? "#dc2626" : "#16a34a", borderRadius: 6, transition: "width 0.6s ease" }} />
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>📌 {f.value} · {f.source}</div>
                </div>
              )) : (
                <div style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "10px 0" }}>Not enough data to show breakdown.</div>
              )}
            </div>
          </div>
        )}

        {/* CONCERNS TAB */}
        {activeTab === "concerns" && (
          <div>
            {concerns.length > 0 ? (
              <>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 14, lineHeight: 1.6 }}>
                  The following ingredients have been flagged based on official health guidelines.
                </div>
                {concerns.map((c, i) => (
                  <div key={i} style={{ background: "#fff", border: "1px solid #fecaca", borderRadius: 14, padding: 16, marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 6, textTransform: "capitalize" }}>⚠️ {c.name}</div>
                    <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.65, marginBottom: 8 }}>{c.concern}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af", background: "#fef2f2", padding: "5px 10px", borderRadius: 8, display: "inline-block" }}>
                      📌 {c.source}
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ background: "#fff", borderRadius: 14, padding: 24, textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 600, color: "#14532d", marginBottom: 6 }}>No flagged ingredients</div>
              </div>
            )}
          </div>
        )}

        <AdBanner text="🌱 Make informed choices about your food." />
        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
