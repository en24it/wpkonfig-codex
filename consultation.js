/* ─── Load saved estimate ─── */
const stored = sessionStorage.getItem("heatnextEstimate");

const fallback = {
  area: 150, city: "Köln", state: "Nordrhein-Westfalen",
  model: "Vitocal 200-A ie", modelKey: "200", fit: "Gut",
  minKw: 7, maxKw: 10, costLow: 31000, costHigh: 39000
};

const estimate = stored ? JSON.parse(stored) : fallback;

const currency = new Intl.NumberFormat("de-DE", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0
});

const modelImages = {
  "250": "assets/vitocal-250-a-unit.png",
  "200": "assets/vitocal-200-a-ie-unit.png",
  "150": "assets/vitocal-150-a-unit.png"
};

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function computeNet(gross) {
  const rate = estimate.fit === "Planung nötig" ? 0.3 : 0.35;
  return Math.round((gross * (1 - rate)) / 500) * 500;
}

/* ─── Populate sidebar summary ─── */
function render() {
  const { model, modelKey, fit, minKw, maxKw, costLow, costHigh, refinedLow, refinedHigh, area, city, state } = estimate;
  const low  = refinedLow  || costLow;
  const high = refinedHigh || costHigh;

  const loc = [area ? `${area} m²` : null, city, state].filter(Boolean).join(", ");
  setText("dcAddress", loc || "Deine Angaben");

  setText("consultModel",   model);
  setText("consultPower",   `${minKw}–${maxKw} kW`);
  setText("consultCost",    `${currency.format(low)}–${currency.format(high)}`);
  setText("consultNetCost", `${currency.format(computeNet(low))}–${currency.format(computeNet(high))}`);
  setText("consultFit",     fit);

  const img = document.getElementById("consultModelImage");
  if (img) { img.src = modelImages[modelKey] || modelImages["200"]; img.alt = model; }
}

/* ─── Form submit ─── */
const form    = document.getElementById("consultForm");
const success = document.getElementById("consultSuccess");
const btn     = document.getElementById("submitConsult");

if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    /* Collect data */
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = { ...data, estimate };

    /* In a real app: POST to API. Here we simulate success. */
    btn.disabled = true;
    btn.textContent = "Wird gesendet…";

    setTimeout(() => {
      form.querySelectorAll("input, select, textarea, button").forEach(el => el.disabled = true);
      if (success) success.hidden = false;
    }, 900);
  });
}

render();
