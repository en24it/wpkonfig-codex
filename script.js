/* ─── DOM refs ─── */
const form           = document.querySelector("#estimateForm");
const steps          = Array.from(document.querySelectorAll(".form-step"));
const progressSteps  = Array.from(document.querySelectorAll(".progress-step"));
const nextBtn        = document.querySelector("#nextBtn");
const backBtn        = document.querySelector("#backBtn");
const zipInput       = form.elements.zip;
const cityInput      = form.elements.city;
const stateInput     = form.elements.state;
const zipHint        = document.querySelector("#zipHint");
const postalCodes    = window.DE_POSTAL_CODES || {};
const modelModal     = document.querySelector("#modelModal");
const modalClose     = document.querySelector(".modal-close");
const modelCards     = Array.from(document.querySelectorAll(".model-card"));
const toEstimateBtn  = document.querySelector("#toEstimateBtn");

let lastFocusedModelCard = null;
let currentStep = 0;

/* ─── Model data ─── */
const modelDetails = {
  250: {
    title:    "Vitocal 250-A",
    image:    "assets/vitocal-250-a-unit.png",
    imageAlt: "Vitocal 250-A Außengerät",
    lead:     "Die Vitocal 250-A ist die stärkste Richtung für viele Sanierungen, wenn vorhandene Heizkörper weiter genutzt werden sollen und höhere Vorlauftemperaturen gefordert sind.",
    use:      "Altbau und Sanierung",
    strength: "Hohe Vorlauftemperaturen",
    planning: "Hydraulik und Heizkörper prüfen",
    body:     "Dieses Modell passt besonders zu Häusern, bei denen der Wechsel von Gas oder Öl auf Wärmepumpe ohne vollständigen Umbau der Wärmeverteilung gelingen soll. In der Planung sind Heizlast, Heizkörperleistung, Schallschutz und Aufstellort entscheidend."
  },
  200: {
    title:    "Vitocal 200-A ie",
    image:    "assets/vitocal-200-a-ie-unit.png",
    imageAlt: "Vitocal 200-A ie Außengerät",
    lead:     "Die Vitocal 200-A ie ist eine ausgewogene Luft-Wasser-Wärmepumpe für gut vorbereitete Einfamilienhäuser und gemischte Wärmeverteilung. Das Kürzel ie steht für Intelligent Energy.",
    use:      "Modernisierte Wohnhäuser",
    strength: "Intelligent Energy",
    planning: "Vorlauf niedrig halten",
    body:     "Sie eignet sich, wenn Gebäudehülle und Heizflächen bereits solide Voraussetzungen bieten. Typisch sind teilmodernisierte Häuser mit Heizkörpern und Fußbodenheizung oder Gebäude, bei denen einzelne Heizkörper gezielt vergrößert werden können."
  },
  150: {
    title:    "Vitocal 150-A",
    image:    "assets/vitocal-150-a-unit.png",
    imageAlt: "Vitocal 150-A Außengerät",
    lead:     "Die Vitocal 150-A ist eine attraktive Einstiegsrichtung für kleinere oder effizientere Gebäude mit moderatem Wärmebedarf.",
    use:      "Kleinere Häuser",
    strength: "Guter Einstieg",
    planning: "Wärmebedarf sauber abgleichen",
    body:     "Dieses Modell ist interessant für Reihenhäuser, Doppelhaushälften und modernisierte Gebäude mit niedrigeren Vorlauftemperaturen."
  }
};

const currency = new Intl.NumberFormat("de-DE", {
  style: "currency", currency: "EUR", maximumFractionDigits: 0
});

/* ─── Step navigation ─── */
function showStep(index) {
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  updateLocationSummary();

  steps.forEach((step, i) => step.classList.toggle("is-active", i === currentStep));
  progressSteps.forEach((step, i) => step.classList.toggle("is-active", i === currentStep));

  backBtn.hidden = currentStep === 0;
  nextBtn.hidden = currentStep === steps.length - 1;
  nextBtn.textContent = currentStep === steps.length - 2 ? "Ergebnis anzeigen" : "Weiter";

  if (currentStep === steps.length - 1) updateResult();
}

/* ─── Validation ─── */
function validateStep() {
  if (currentStep === 0) updatePostalCode();
  const invalid = Array.from(steps[currentStep].querySelectorAll("input, select"))
    .find(el => !el.checkValidity());
  if (invalid) { invalid.reportValidity(); return false; }
  return true;
}

/* ─── Form data ─── */
function getFormData() {
  return Object.fromEntries(new FormData(form).entries());
}

/* ─── PLZ lookup ─── */
function setZipHint(msg, status) {
  if (!zipHint) return;
  zipHint.textContent = msg;
  zipHint.classList.toggle("is-success", status === "success");
  zipHint.classList.toggle("is-error",   status === "error");
}

function updatePostalCode() {
  const zip = zipInput.value.replace(/\D/g, "").slice(0, 5);
  if (zipInput.value !== zip) zipInput.value = zip;
  const match = postalCodes[zip];
  cityInput.value = match?.city || "";
  zipInput.classList.toggle("is-invalid", zip.length === 5 && !match);
  if (match?.state && stateInput.value !== match.state) stateInput.value = match.state;
  if (match) {
    setZipHint(`${match.city}${match.state ? `, ${match.state}` : ""}`, "success");
    cityInput.setCustomValidity(""); zipInput.setCustomValidity("");
  } else if (zip.length === 5) {
    setZipHint("Diese PLZ wurde nicht gefunden.", "error");
    cityInput.setCustomValidity("Bitte gib eine gültige deutsche PLZ ein.");
    zipInput.setCustomValidity("Bitte gib eine gültige deutsche PLZ ein.");
  } else {
    setZipHint("Gib eine deutsche PLZ ein.", "");
    cityInput.setCustomValidity("Bitte gib eine gültige deutsche PLZ ein.");
    zipInput.setCustomValidity("");
  }
  updateLocationSummary();
}

function updateLocationSummary() {
  const el = document.querySelector("#locationSummary");
  if (!el) return;
  const d = getFormData();
  const parts = [d.zip, d.city, d.state].filter(Boolean);
  el.textContent = parts.length ? parts.join(", ") : "Deutschland";
}

/* ─── Calculation ─── */
function calculateEstimate() {
  const d = getFormData();
  const area        = Number(d.area        || 150);
  const consumption = Number(d.consumption || 22000);

  const yearFactor = { old: 1.18, mid: 1.05, new: 0.92, modern: 0.76 }[d.year] || 1;
  const insFactor  = { low: 1.18, medium: 1, high: 0.84 }[d.insulation] || 1;
  const emFactor   = { radiators: 1.1, mixed: 1, floor: 0.9 }[d.emitters] || 1;
  const propFactor = { single: 1, dual: 1.16, row: 0.9 }[d.property] || 1;

  const areaLoad        = area * 0.055 * yearFactor * insFactor * propFactor;
  const consumptionLoad = consumption / 2500;
  const estimatedKw     = Math.max(5, Math.round(((areaLoad + consumptionLoad) / 2) * emFactor));
  const minKw           = Math.max(4, estimatedKw - 1);
  const maxKw           = estimatedKw + 2;

  const baseCost = 24500 + estimatedKw * 1250 + (d.emitters === "radiators" ? 2600 : 0);
  const costLow  = Math.round((baseCost * 0.92) / 500) * 500;
  const costHigh = Math.round((baseCost * 1.16) / 500) * 500;
  const netLow   = Math.round((costLow  * 0.65) / 500) * 500;
  const netHigh  = Math.round((costHigh * 0.65) / 500) * 500;

  const model   = estimatedKw >= 10 || d.emitters === "radiators"
    ? "Vitocal 250-A" : estimatedKw <= 7 ? "Vitocal 150-A" : "Vitocal 200-A ie";
  const fit     = d.insulation === "low" && d.emitters === "radiators"
    ? "Planung nötig" : d.emitters === "floor" ? "Sehr gut" : "Gut";
  const modelKey = model.includes("250") ? "250" : model.includes("150") ? "150" : "200";

  return { area, city: d.city, state: d.state, model, modelKey, fit,
           minKw, maxKw, costLow, costHigh, netLow, netHigh };
}

/* ─── Update inline result (step 4) ─── */
function updateResult() {
  const e = calculateEstimate();
  document.querySelector("#resultTitle").textContent = `${e.model} als naheliegende Richtung`;
  document.querySelector("#powerResult").textContent  = `${e.minKw}–${e.maxKw} kW`;
  document.querySelector("#costResult").textContent   = `${currency.format(e.costLow)}–${currency.format(e.costHigh)}`;
  document.querySelector("#fitResult").textContent    = e.fit;
  document.querySelector("#resultCopy").textContent   =
    `Für ${e.area} m² in ${e.state || "Deutschland"} wirkt ein Viessmann Luft-Wasser-System ` +
    `im Bereich ${e.minKw}–${e.maxKw} kW plausibel. Vor Angebotserstellung sollten Heizlast, ` +
    `Vorlauftemperatur, Aufstellort, Schallschutz und die aktuelle BEG/KfW-Förderfähigkeit geprüft werden.`;

  if (toEstimateBtn) {
    toEstimateBtn.addEventListener("click", (ev) => {
      ev.preventDefault();
      sessionStorage.setItem("energie24nextEstimate", JSON.stringify(e));
      window.location.href = "estimate.html";
    }, { once: true });
  }
}

/* ─── Navigate to estimate page ─── */
function goToEstimate() {
  const e = calculateEstimate();
  sessionStorage.setItem("energie24nextEstimate", JSON.stringify(e));
  window.location.href = "estimate.html";
}

/* ─── Model modal ─── */
function openModelModal(modelKey, trigger) {
  const d = modelDetails[modelKey];
  if (!d || !modelModal) return;
  lastFocusedModelCard = trigger;
  document.querySelector("#modalImage").src      = d.image;
  document.querySelector("#modalImage").alt      = d.imageAlt;
  document.querySelector("#modalTitle").textContent  = d.title;
  document.querySelector("#modalLead").textContent   = d.lead;
  document.querySelector("#modalUse").textContent    = d.use;
  document.querySelector("#modalStrength").textContent = d.strength;
  document.querySelector("#modalPlanning").textContent = d.planning;
  document.querySelector("#modalBody").textContent   = d.body;
  modelModal.hidden = false;
  document.body.style.overflow = "hidden";
  modalClose.focus();
}
function closeModelModal() {
  if (!modelModal || modelModal.hidden) return;
  modelModal.hidden = true;
  document.body.style.overflow = "";
  lastFocusedModelCard?.focus();
}

/* ─── Events ─── */
nextBtn.addEventListener("click", () => {
  if (!validateStep()) return;
  if (currentStep === steps.length - 2) { goToEstimate(); return; }
  showStep(currentStep + 1);
});

backBtn.addEventListener("click", () => showStep(currentStep - 1));
zipInput.addEventListener("input", updatePostalCode);
modelCards.forEach(card => card.addEventListener("click", () => openModelModal(card.dataset.model, card)));
modalClose?.addEventListener("click", closeModelModal);
modelModal?.addEventListener("click", ev => { if (ev.target === modelModal) closeModelModal(); });
document.addEventListener("keydown", ev => { if (ev.key === "Escape") closeModelModal(); });

/* ─── Init ─── */
showStep(0);
