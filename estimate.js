const storedEstimate = JSON.parse(sessionStorage.getItem("heatnextEstimate") || "null");

const fallbackEstimate = {
  area: 150,
  city: "Köln",
  state: "Nordrhein-Westfalen",
  model: "Vitocal 200-A ie",
  modelKey: "200",
  fit: "Gut",
  minKw: 7,
  maxKw: 10,
  costLow: 31000,
  costHigh: 39000
};

const estimate = storedEstimate || fallbackEstimate;
const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

const modelDetails = {
  250: {
    image: "assets/vitocal-250-a-unit.png",
    imageAlt: "Vitocal 250-A Außengerät",
    copy: "Die robuste Sanierungsrichtung für höhere Vorlauftemperaturen und bestehende Heizkörper."
  },
  200: {
    image: "assets/vitocal-200-a-ie-unit.png",
    imageAlt: "Vitocal 200-A ie Außengerät",
    copy: "Die Intelligent-Energy-Richtung für gut vorbereitete Einfamilienhäuser und gemischte Wärmeverteilung."
  },
  150: {
    image: "assets/vitocal-150-a-unit.png",
    imageAlt: "Vitocal 150-A Außengerät",
    copy: "Die Einstiegslösung für kleinere oder effizientere Gebäude mit moderatem Wärmebedarf."
  }
};

const detail = modelDetails[estimate.modelKey] || modelDetails[200];
const scopeInputs = Array.from(document.querySelectorAll(".hg-details input"));

function updateBaseView() {
  const grantRate = estimate.fit === "Planung nötig" ? 0.3 : 0.35;
  const netLow = Math.round((estimate.costLow * (1 - grantRate)) / 500) * 500;
  const netHigh = Math.round((estimate.costHigh * (1 - grantRate)) / 500) * 500;

  document.querySelector("#estimateAddress").textContent = `${estimate.area} m² Wohnfläche in ${estimate.city || "deinem Ort"}${estimate.state ? `, ${estimate.state}` : ""}`;
  document.querySelector("#estimateFit").textContent = estimate.fit;
  document.querySelector("#estimateModel").textContent = estimate.model;
  document.querySelector("#estimateModelCopy").textContent = detail.copy;
  document.querySelector("#estimateModelImage").src = detail.image;
  document.querySelector("#estimateModelImage").alt = detail.imageAlt;
  document.querySelector("#estimateCost").textContent = `${currency.format(estimate.costLow)}-${currency.format(estimate.costHigh)}`;
  document.querySelector("#estimateNetCost").textContent = `${currency.format(netLow)}-${currency.format(netHigh)}`;
  document.querySelector("#estimatePower").textContent = `${estimate.minKw}-${estimate.maxKw} kW`;
  document.querySelector("#estimateBuilding").textContent = `${estimate.area} m²`;
}

function updateScopeEstimate() {
  const selected = scopeInputs.filter((input) => input.checked);
  const addonCost = selected.reduce((sum, input) => sum + Number(input.dataset.cost || 0), 0);
  const refinedLow = estimate.costLow + addonCost;
  const refinedHigh = estimate.costHigh + addonCost;
  const labels = selected
    .filter((input) => Number(input.dataset.cost || 0) > 0)
    .map((input) => input.closest(".hg-option")?.querySelector("strong")?.textContent)
    .filter(Boolean);

  document.querySelector("#refinedCost").textContent = `${currency.format(refinedLow)}-${currency.format(refinedHigh)}`;
  document.querySelector("#scopeSummary").textContent = labels.length
    ? `Zusätzlich berücksichtigt: ${labels.join(", ")}.`
    : "Standardumfang ausgewählt.";
}

scopeInputs.forEach((input) => input.addEventListener("change", updateScopeEstimate));
updateBaseView();
updateScopeEstimate();
