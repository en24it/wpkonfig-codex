/* ─── Load saved estimate ─── */
const stored = sessionStorage.getItem("energie24nextEstimate");

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
const modelCopy = {
  "250": "Für Modernisierungen mit höherer Vorlauftemperatur und bestehender Heizkörperstruktur.",
  "200": "Ausgewogene Lösung für gut vorbereitete Einfamilienhäuser mit gemischter Wärmeverteilung.",
  "150": "Attraktiver Einstieg für kleinere Gebäude, Reihenhäuser und effiziente Sanierungsfälle."
};

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/* ─── Compute net price after BEG grant ─── */
function computeNet(gross) {
  const rate = estimate.fit === "Planung nötig" ? 0.3 : 0.35;
  return Math.round((gross * (1 - rate)) / 500) * 500;
}

/* ─── Populate page ─── */
function render() {
  const { model, modelKey, fit, minKw, maxKw, costLow, costHigh, area, city, state } = estimate;
  const loc = [city, state].filter(Boolean).join(", ") || "Deutschland";

  setText("estimateAddress", `${area} m² · ${loc}`);
  setText("estimatePower",   `${minKw}–${maxKw} kW`);
  setText("estimateFit",     fit);
  setText("estimateModel",   model);
  setText("estimateModelCopy", modelCopy[modelKey] || "");
  setText("estimateCost",    `${currency.format(costLow)}–${currency.format(costHigh)}`);
  setText("estimateNetCost", `${currency.format(computeNet(costLow))}–${currency.format(computeNet(costHigh))}`);

  const img = document.getElementById("estimateModelImage");
  if (img) { img.src = modelImages[modelKey] || modelImages["200"]; img.alt = model; }

  /* summary sidebar */
  setText("summaryModel",    model);
  setText("summaryNetCost",  `${currency.format(computeNet(costLow))}–${currency.format(computeNet(costHigh))}`);
  setText("estimateBuilding",`${area} m² · ${state || "DE"}`);
  setText("refinedCost",     `${currency.format(costLow)}–${currency.format(costHigh)}`);
  setText("scopeSummary",    "Standardumfang ausgewählt.");
}

/* ─── Live scope update ─── */
const optionInputs = Array.from(document.querySelectorAll(".est-option input"));

function updateRefined() {
  const { costLow, costHigh } = estimate;
  const addon = optionInputs
    .filter(i => i.checked)
    .reduce((s, i) => s + Number(i.dataset.cost || 0), 0);

  const rLow  = costLow  + addon;
  const rHigh = costHigh + addon;

  setText("refinedCost",    `${currency.format(rLow)}–${currency.format(rHigh)}`);
  setText("summaryNetCost", `${currency.format(computeNet(rLow))}–${currency.format(computeNet(rHigh))}`);

  const labels = optionInputs
    .filter(i => i.checked && Number(i.dataset.cost || 0) > 0)
    .map(i => i.closest(".est-option")?.querySelector("strong")?.textContent)
    .filter(Boolean);

  setText("scopeSummary", labels.length
    ? `Enthält: ${labels.join(", ")}.`
    : "Standardumfang ausgewählt.");

  /* persist refined for consultation page */
  sessionStorage.setItem("energie24nextEstimate", JSON.stringify({ ...estimate, refinedLow: rLow, refinedHigh: rHigh }));
}

optionInputs.forEach(i => i.addEventListener("change", updateRefined));

render();
updateRefined();
