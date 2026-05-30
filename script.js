const form = document.querySelector("#estimateForm");
const steps = Array.from(document.querySelectorAll(".form-step"));
const progressSteps = Array.from(document.querySelectorAll(".progress-step"));
const nextBtn = document.querySelector("#nextBtn");
const backBtn = document.querySelector("#backBtn");
const zipInput = form.elements.zip;
const cityInput = form.elements.city;
const stateInput = form.elements.state;
const zipHint = document.querySelector("#zipHint");
const postalCodes = window.DE_POSTAL_CODES || {};
const modelModal = document.querySelector("#modelModal");
const modalClose = document.querySelector(".modal-close");
const modelCards = Array.from(document.querySelectorAll(".model-card"));
let lastFocusedModelCard = null;

let currentStep = 0;

const modelDetails = {
  250: {
    title: "Vitocal 250-A",
    image: "assets/vitocal-250-a-unit.jpg",
    imageAlt: "Vitocal 250-A Außengerät",
    lead: "Die Vitocal 250-A ist die stärkste Richtung für viele Sanierungen, wenn vorhandene Heizkörper weiter genutzt werden sollen und höhere Vorlauftemperaturen gefordert sind.",
    use: "Altbau und Sanierung",
    strength: "Hohe Vorlauftemperaturen",
    planning: "Hydraulik und Heizkörper prüfen",
    body: "Dieses Modell passt besonders zu Häusern, bei denen der Wechsel von Gas oder Öl auf Wärmepumpe ohne vollständigen Umbau der Wärmeverteilung gelingen soll. In der Planung sind Heizlast, Heizkörperleistung, Schallschutz und Aufstellort entscheidend. Für viele Modernisierungen ist sie die erste Modellrichtung, die geprüft werden sollte."
  },
  200: {
    title: "Vitocal 200-A ie",
    image: "assets/vitocal-200-a-ie-unit.jpg",
    imageAlt: "Vitocal 200-A ie Außengerät",
    lead: "Die Vitocal 200-A ie ist eine ausgewogene Luft-Wasser-Wärmepumpe für gut vorbereitete Einfamilienhäuser und gemischte Wärmeverteilung. Das Kürzel ie steht für Intelligent Energy.",
    use: "Modernisierte Wohnhäuser",
    strength: "Intelligent Energy",
    planning: "Vorlauf niedrig halten",
    body: "Sie eignet sich, wenn Gebäudehülle und Heizflächen bereits solide Voraussetzungen bieten. Typisch sind teilmodernisierte Häuser mit Heizkörpern und Fußbodenheizung oder Gebäude, bei denen einzelne Heizkörper gezielt vergrößert werden können. Intelligent Energy beschreibt den Fokus auf ein smart abgestimmtes, effizientes Energiesystem mit sauberer Hydraulik und passenden Systemkomponenten."
  },
  150: {
    title: "Vitocal 150-A",
    image: "assets/vitocal-150-a-unit.jpg",
    imageAlt: "Vitocal 150-A Außengerät",
    lead: "Die Vitocal 150-A ist eine attraktive Einstiegsrichtung für kleinere oder effizientere Gebäude mit moderatem Wärmebedarf.",
    use: "Kleinere Häuser",
    strength: "Guter Einstieg",
    planning: "Wärmebedarf sauber abgleichen",
    body: "Dieses Modell ist interessant für Reihenhäuser, Doppelhaushälften und modernisierte Gebäude mit niedrigeren Vorlauftemperaturen. Bei kompakten Grundstücken sollte früh geprüft werden, ob Aufstellort, Schallanforderungen und Leitungsführung gut zusammenpassen."
  }
};

const currency = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

function showStep(index) {
  currentStep = Math.max(0, Math.min(index, steps.length - 1));
  updateLocationSummary();

  steps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === currentStep);
  });

  progressSteps.forEach((step, stepIndex) => {
    step.classList.toggle("is-active", stepIndex === currentStep);
  });

  backBtn.hidden = currentStep === 0;
  nextBtn.textContent = currentStep === steps.length - 2 ? "Ergebnis anzeigen" : "Weiter";
  nextBtn.hidden = currentStep === steps.length - 1;

  if (currentStep === steps.length - 1) {
    updateResult();
  }
}

function updateLocationSummary() {
  const summary = document.querySelector("#locationSummary");
  if (!summary) return;

  const data = getFormData();
  const parts = [data.zip, data.city, data.state].filter(Boolean);
  summary.textContent = parts.length ? parts.join(", ") : "Deutschland";
}

function validateStep() {
  if (currentStep === 0) {
    updatePostalCode();
  }

  const activeInputs = Array.from(steps[currentStep].querySelectorAll("input, select"));
  const invalid = activeInputs.find((input) => !input.checkValidity());

  if (invalid) {
    invalid.reportValidity();
    return false;
  }

  return true;
}

function getFormData() {
  return Object.fromEntries(new FormData(form).entries());
}

function setZipHint(message, status) {
  if (!zipHint) return;

  zipHint.textContent = message;
  zipHint.classList.toggle("is-success", status === "success");
  zipHint.classList.toggle("is-error", status === "error");
}

function updatePostalCode() {
  const zip = zipInput.value.replace(/\D/g, "").slice(0, 5);
  if (zipInput.value !== zip) {
    zipInput.value = zip;
  }

  const match = postalCodes[zip];

  cityInput.value = match?.city || "";
  zipInput.classList.toggle("is-invalid", zip.length === 5 && !match);

  if (match?.state && stateInput.value !== match.state) {
    stateInput.value = match.state;
  }

  if (match) {
    setZipHint(`${match.city}${match.state ? `, ${match.state}` : ""}`, "success");
    cityInput.setCustomValidity("");
    zipInput.setCustomValidity("");
  } else if (zip.length === 5) {
    setZipHint("Diese PLZ wurde in der lokalen Deutschland-Datenbank nicht gefunden.", "error");
    cityInput.setCustomValidity("Bitte gib eine gültige deutsche PLZ ein.");
    zipInput.setCustomValidity("Bitte gib eine gültige deutsche PLZ ein.");
  } else {
    setZipHint("Gib eine deutsche PLZ ein.", "");
    cityInput.setCustomValidity("Bitte gib eine gültige deutsche PLZ ein.");
    zipInput.setCustomValidity("");
  }

  updateLocationSummary();
}

function updateResult() {
  const data = getFormData();
  const area = Number(data.area || 150);
  const consumption = Number(data.consumption || 22000);

  const yearFactor = {
    old: 1.18,
    mid: 1.05,
    new: 0.92,
    modern: 0.76
  }[data.year] || 1;

  const insulationFactor = {
    low: 1.18,
    medium: 1,
    high: 0.84
  }[data.insulation] || 1;

  const emitterFactor = {
    radiators: 1.1,
    mixed: 1,
    floor: 0.9
  }[data.emitters] || 1;

  const propertyFactor = {
    single: 1,
    dual: 1.16,
    row: 0.9
  }[data.property] || 1;

  const areaLoad = area * 0.055 * yearFactor * insulationFactor * propertyFactor;
  const consumptionLoad = consumption / 2500;
  const estimatedKw = Math.max(5, Math.round(((areaLoad + consumptionLoad) / 2) * emitterFactor));
  const minKw = Math.max(4, estimatedKw - 1);
  const maxKw = estimatedKw + 2;

  const baseCost = 24500 + estimatedKw * 1250 + (data.emitters === "radiators" ? 2600 : 0);
  const costLow = Math.round((baseCost * 0.92) / 500) * 500;
  const costHigh = Math.round((baseCost * 1.16) / 500) * 500;

  const model = estimatedKw >= 10 || data.emitters === "radiators" ? "Vitocal 250-A" : estimatedKw <= 7 ? "Vitocal 150-A" : "Vitocal 200-A ie";
  const fit = data.insulation === "low" && data.emitters === "radiators" ? "Planung nötig" : data.emitters === "floor" ? "Sehr gut" : "Gut";

  document.querySelector("#resultTitle").textContent = `${model} als naheliegende Richtung`;
  document.querySelector("#powerResult").textContent = `${minKw}-${maxKw} kW`;
  document.querySelector("#costResult").textContent = `${currency.format(costLow)}-${currency.format(costHigh)}`;
  document.querySelector("#fitResult").textContent = fit;
  document.querySelector("#resultCopy").textContent =
    `Für ${area} m² in ${data.state || "Deutschland"} wirkt ein Viessmann Luft-Wasser-System im Bereich ${minKw}-${maxKw} kW plausibel. ` +
    "Vor Angebotserstellung sollten Heizlast, Vorlauftemperatur, Aufstellort, Schallschutz und die aktuelle BEG/KfW-Förderfähigkeit geprüft werden.";
}

function openModelModal(modelKey, trigger) {
  const detail = modelDetails[modelKey];
  if (!detail || !modelModal) return;

  lastFocusedModelCard = trigger;
  document.querySelector("#modalImage").src = detail.image;
  document.querySelector("#modalImage").alt = detail.imageAlt;
  document.querySelector("#modalTitle").textContent = detail.title;
  document.querySelector("#modalLead").textContent = detail.lead;
  document.querySelector("#modalUse").textContent = detail.use;
  document.querySelector("#modalStrength").textContent = detail.strength;
  document.querySelector("#modalPlanning").textContent = detail.planning;
  document.querySelector("#modalBody").textContent = detail.body;

  modelModal.hidden = false;
  document.body.classList.add("modal-open");
  modalClose.focus();
}

function closeModelModal() {
  if (!modelModal || modelModal.hidden) return;

  modelModal.hidden = true;
  document.body.classList.remove("modal-open");
  lastFocusedModelCard?.focus();
}

nextBtn.addEventListener("click", () => {
  if (!validateStep()) return;
  showStep(currentStep + 1);
});

backBtn.addEventListener("click", () => {
  showStep(currentStep - 1);
});

zipInput.addEventListener("input", updatePostalCode);

modelCards.forEach((card) => {
  card.addEventListener("click", () => {
    openModelModal(card.dataset.model, card);
  });
});

modalClose?.addEventListener("click", closeModelModal);

modelModal?.addEventListener("click", (event) => {
  if (event.target === modelModal) {
    closeModelModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModelModal();
  }
});

showStep(0);
