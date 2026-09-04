const API_URL = (() => {
  const fallback = "http://127.0.0.1:8000/predict";
  const origin = window.location.origin;

  if (!origin || origin === "null") return fallback;
  if (window.location.protocol === "file:") return fallback;
  if (window.location.port && window.location.port !== "8000") return fallback;

  return `${origin}/predict`;
})();

const ROOM_CLASSES = ["Entire home/apt", "Private room", "Shared room"];

const ROOM_ICONS = {
  "Entire home/apt": "⌂",
  "Private room": "◻",
  "Shared room": "☰",
};

const NEIGHBOURHOODS_BY_BOROUGH = {
  Bronx: [
    "Allerton", "Baychester", "Belmont", "Bronxdale", "Castle Hill", "City Island",
    "Claremont Village", "Clason Point", "Co-op City", "Concourse", "Concourse Village",
    "East Morrisania", "Eastchester", "Edenwald", "Fieldston", "Fordham", "Highbridge",
    "Hunts Point", "Kingsbridge", "Longwood", "Melrose", "Morris Heights", "Morris Park",
    "Morrisania", "Mott Haven", "Mount Eden", "Mount Hope", "North Riverdale", "Norwood",
    "Olinville", "Parkchester", "Pelham Bay", "Pelham Gardens", "Port Morris", "Riverdale",
    "Schuylerville", "Soundview", "Spuyten Duyvil", "Throgs Neck", "Tremont", "Unionport",
    "University Heights", "Van Nest", "Wakefield", "West Farms", "Westchester Square",
    "Williamsbridge", "Woodlawn",
  ],
  Brooklyn: [
    "Bath Beach", "Bay Ridge", "Bedford-Stuyvesant", "Bensonhurst", "Bergen Beach",
    "Boerum Hill", "Borough Park", "Brighton Beach", "Brooklyn Heights", "Brownsville",
    "Bushwick", "Canarsie", "Carroll Gardens", "Clinton Hill", "Cobble Hill", "Columbia St",
    "Coney Island", "Crown Heights", "Cypress Hills", "DUMBO", "Downtown Brooklyn",
    "Dyker Heights", "East Flatbush", "East New York", "Flatbush", "Flatlands",
    "Fort Greene", "Fort Hamilton", "Gowanus", "Gravesend", "Greenpoint", "Kensington",
    "Manhattan Beach", "Midwood", "Mill Basin", "Navy Yard", "Park Slope",
    "Prospect Heights", "Prospect-Lefferts Gardens", "Red Hook", "Sea Gate",
    "Sheepshead Bay", "South Slope", "Sunset Park", "Vinegar Hill", "Williamsburg",
    "Windsor Terrace",
  ],
  Manhattan: [
    "Battery Park City", "Chelsea", "Chinatown", "Civic Center", "East Harlem",
    "East Village", "Financial District", "Flatiron District", "Gramercy",
    "Greenwich Village", "Harlem", "Hell's Kitchen", "Inwood", "Kips Bay",
    "Little Italy", "Lower East Side", "Marble Hill", "Midtown", "Morningside Heights",
    "Murray Hill", "NoHo", "Nolita", "Roosevelt Island", "SoHo", "Stuyvesant Town",
    "Theater District", "Tribeca", "Two Bridges", "Upper East Side", "Upper West Side",
    "Washington Heights", "West Village",
  ],
  Queens: [
    "Arverne", "Astoria", "Bay Terrace", "Bayside", "Bayswater", "Belle Harbor",
    "Bellerose", "Breezy Point", "Briarwood", "Cambria Heights", "College Point",
    "Corona", "Ditmars Steinway", "Douglaston", "East Elmhurst", "Edgemere", "Elmhurst",
    "Far Rockaway", "Flushing", "Forest Hills", "Fresh Meadows", "Glendale",
    "Hollis", "Holliswood", "Howard Beach", "Jackson Heights", "Jamaica",
    "Jamaica Estates", "Jamaica Hills", "Kew Gardens", "Kew Gardens Hills", "Laurelton",
    "Little Neck", "Long Island City", "Maspeth", "Middle Village", "Neponsit",
    "Ozone Park", "Queens Village", "Rego Park", "Richmond Hill", "Ridgewood",
    "Rockaway Beach", "Rosedale", "South Ozone Park", "Springfield Gardens",
    "St. Albans", "Sunnyside", "Whitestone", "Woodhaven", "Woodside",
  ],
  "Staten Island": [
    "Arden Heights", "Arrochar", "Bay Terrace, Staten Island", "Bull's Head",
    "Castleton Corners", "Clifton", "Concord", "Dongan Hills", "Eltingville",
    "Emerson Hill", "Graniteville", "Grant City", "Great Kills", "Grymes Hill",
    "Howland Hook", "Huguenot", "Lighthouse Hill", "Mariners Harbor", "Midland Beach",
    "New Brighton", "New Dorp", "New Dorp Beach", "New Springville", "Oakwood",
    "Port Richmond", "Prince's Bay", "Randall Manor", "Rosebank", "Rossville",
    "Shore Acres", "Silver Lake", "South Beach", "St. George", "Stapleton",
    "Todt Hill", "Tompkinsville", "Tottenville", "West Brighton", "Westerleigh",
    "Willowbrook",
  ],
};

const BOROUGH_COORDS = {
  Bronx: { lat: 40.8448, lng: -73.8648 },
  Brooklyn: { lat: 40.6782, lng: -73.9442 },
  Manhattan: { lat: 40.7831, lng: -73.9712 },
  Queens: { lat: 40.7282, lng: -73.7949 },
  "Staten Island": { lat: 40.5795, lng: -74.1502 },
};

const DEMO = {
  neighbourhood_group: "Manhattan",
  neighbourhood: "Midtown",
  latitude: 40.75362,
  longitude: -73.98377,
  price: 225,
  minimum_nights: 1,
  number_of_reviews: 45,
  reviews_per_month: 0.38,
  calculated_host_listings_count: 2,
  availability_365: 355,
};

const form = document.getElementById("predict-form");
const boroughSelect = document.getElementById("neighbourhood_group");
const neighbourhoodSelect = document.getElementById("neighbourhood");
const priceInput = document.getElementById("price");
const priceRange = document.getElementById("price-range");
const availabilityInput = document.getElementById("availability_365");
const availabilityRange = document.getElementById("availability-range");
const stepIndicator = document.getElementById("step-indicator");
const formError = document.getElementById("form-error");
const btnPredict = document.getElementById("btn-predict");
const btnDemo = document.getElementById("btn-demo");
const btnReset = document.getElementById("btn-reset");
const resultEmpty = document.getElementById("result-empty");
const resultBody = document.getElementById("result-body");
const liveDot = document.getElementById("live-dot");
const predictionType = document.getElementById("prediction-type");
const predictionIcon = document.getElementById("prediction-icon");
const confidenceValue = document.getElementById("confidence-value");
const confidenceFill = document.getElementById("confidence-fill");
const probList = document.getElementById("prob-list");

function populateNeighbourhoods(borough, selected = "") {
  neighbourhoodSelect.innerHTML = '<option value="">Select neighbourhood</option>';
  if (!borough || !NEIGHBOURHOODS_BY_BOROUGH[borough]) {
    neighbourhoodSelect.disabled = true;
    return;
  }

  NEIGHBOURHOODS_BY_BOROUGH[borough].forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    neighbourhoodSelect.appendChild(option);
  });

  neighbourhoodSelect.disabled = false;
  if (selected) neighbourhoodSelect.value = selected;
}

function syncRanges() {
  if (priceInput.value) priceRange.value = Math.min(500, Math.max(20, Number(priceInput.value)));
  if (availabilityInput.value) {
    availabilityRange.value = Math.min(365, Math.max(0, Number(availabilityInput.value)));
  }
}

function countReadyFields() {
  const ids = [
    "neighbourhood_group", "neighbourhood", "latitude", "longitude", "price",
    "minimum_nights", "number_of_reviews", "reviews_per_month",
    "calculated_host_listings_count", "availability_365",
  ];
  return ids.filter((id) => {
    const el = document.getElementById(id);
    return el && String(el.value).trim() !== "";
  }).length;
}

function updateStepIndicator() {
  const ready = countReadyFields();
  stepIndicator.textContent = `${ready} / 10 ready`;
  stepIndicator.style.color = ready === 10 ? "var(--success)" : "var(--muted)";
  stepIndicator.style.borderColor = ready === 10 ? "rgba(52, 211, 153, 0.35)" : "";
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function fillDemo() {
  populateNeighbourhoods(DEMO.neighbourhood_group, DEMO.neighbourhood);
  Object.entries(DEMO).forEach(([key, value]) => setField(key, value));
  syncRanges();
  updateStepIndicator();
  clearError();
  form.classList.add("shake");
  setTimeout(() => form.classList.remove("shake"), 400);
}

function resetForm() {
  form.reset();
  populateNeighbourhoods("");
  priceRange.value = 150;
  availabilityRange.value = 200;
  clearError();
  updateStepIndicator();
  resultEmpty.hidden = false;
  resultBody.hidden = true;
  liveDot.textContent = "Waiting";
  liveDot.classList.remove("active");
}

function clearError() {
  formError.hidden = true;
  formError.textContent = "";
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
}

function showError(message, invalidIds = []) {
  formError.hidden = false;
  formError.textContent = message;
  invalidIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("invalid");
  });
}

function collectPayload() {
  return {
    latitude: Number(document.getElementById("latitude").value),
    longitude: Number(document.getElementById("longitude").value),
    price: Number(document.getElementById("price").value),
    minimum_nights: Number(document.getElementById("minimum_nights").value),
    number_of_reviews: Number(document.getElementById("number_of_reviews").value),
    reviews_per_month: Number(document.getElementById("reviews_per_month").value),
    calculated_host_listings_count: Number(document.getElementById("calculated_host_listings_count").value),
    availability_365: Number(document.getElementById("availability_365").value),
    neighbourhood_group: boroughSelect.value,
    neighbourhood: neighbourhoodSelect.value,
  };
}

function validatePayload(data) {
  const invalid = [];
  if (!data.neighbourhood_group) invalid.push("neighbourhood_group");
  if (!data.neighbourhood) invalid.push("neighbourhood");
  if (!Number.isFinite(data.latitude) || data.latitude < -90 || data.latitude > 90) invalid.push("latitude");
  if (!Number.isFinite(data.longitude) || data.longitude < -180 || data.longitude > 180) invalid.push("longitude");
  if (!(data.price > 0)) invalid.push("price");
  if (!Number.isInteger(data.minimum_nights) || data.minimum_nights < 1 || data.minimum_nights > 365) {
    invalid.push("minimum_nights");
  }
  if (!Number.isInteger(data.number_of_reviews) || data.number_of_reviews < 0) {
    invalid.push("number_of_reviews");
  }
  if (!(data.reviews_per_month >= 0)) invalid.push("reviews_per_month");
  if (!Number.isInteger(data.calculated_host_listings_count) || data.calculated_host_listings_count < 0) {
    invalid.push("calculated_host_listings_count");
  }
  if (!Number.isInteger(data.availability_365) || data.availability_365 < 0 || data.availability_365 > 365) {
    invalid.push("availability_365");
  }
  return invalid;
}

function renderPrediction(predicted, probabilities) {
  const probs = ROOM_CLASSES.map((label, index) => ({
    label,
    value: Number(probabilities[index] ?? 0),
  })).sort((a, b) => b.value - a.value);

  const top = probs[0];
  const confidence = Math.round(top.value * 1000) / 10;

  resultEmpty.hidden = true;
  resultBody.hidden = false;
  resultBody.classList.remove("result-body");
  void resultBody.offsetWidth;
  resultBody.classList.add("result-body");

  predictionType.textContent = predicted;
  predictionIcon.textContent = ROOM_ICONS[predicted] || "◆";
  confidenceValue.textContent = `${confidence}%`;
  confidenceFill.style.width = "0%";
  requestAnimationFrame(() => {
    confidenceFill.style.width = `${Math.min(100, confidence)}%`;
  });

  liveDot.textContent = "Live";
  liveDot.classList.add("active");

  probList.innerHTML = probs
    .map((item, index) => {
      const pct = Math.round(item.value * 1000) / 10;
      const winner = item.label === predicted ? " winner" : "";
      return `
        <div class="prob-item${winner}" style="animation-delay:${0.08 + index * 0.08}s">
          <div class="prob-meta">
            <strong>${item.label}</strong>
            <span>${pct}%</span>
          </div>
          <div class="prob-bar">
            <div class="prob-fill" data-width="${pct}"></div>
          </div>
        </div>
      `;
    })
    .join("");

  requestAnimationFrame(() => {
    probList.querySelectorAll(".prob-fill").forEach((bar) => {
      bar.style.width = `${bar.dataset.width}%`;
    });
  });
}

async function predict(event) {
  event.preventDefault();
  clearError();

  const payload = collectPayload();
  const invalid = validatePayload(payload);
  if (invalid.length) {
    showError("Please fill all fields with valid values.", invalid);
    form.classList.add("shake");
    setTimeout(() => form.classList.remove("shake"), 400);
    return;
  }

  btnPredict.classList.add("loading");
  liveDot.textContent = "Thinking";
  liveDot.classList.add("active");

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detail = "Prediction failed. Check your inputs and try again.";
      try {
        const err = await response.json();
        if (err.detail) detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      } catch (_) { /* ignore */ }
      throw new Error(detail);
    }

    const data = await response.json();
    const predicted = data["Predicted room type"];
    const probabilities = data.Probability || [];
    renderPrediction(predicted, probabilities);
  } catch (error) {
    showError(error.message || "Could not reach the API. Is the server running?");
    liveDot.textContent = "Error";
    liveDot.classList.remove("active");
  } finally {
    btnPredict.classList.remove("loading");
  }
}

function initParticles() {
  const canvas = document.getElementById("particle-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let particles = [];
  let raf = 0;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    const count = Math.min(70, Math.floor((canvas.width * canvas.height) / 22000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      a: Math.random() * 0.45 + 0.15,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(45, 212, 191, ${p.a})`;
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 110) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 * (1 - dist / 110)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    raf = requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  if (!reduceMotion) draw();

  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });

  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
}

boroughSelect.addEventListener("change", () => {
  const borough = boroughSelect.value;
  populateNeighbourhoods(borough);
  const coords = BOROUGH_COORDS[borough];
  if (coords) {
    if (!document.getElementById("latitude").value) setField("latitude", coords.lat);
    if (!document.getElementById("longitude").value) setField("longitude", coords.lng);
  }
  updateStepIndicator();
});

priceRange.addEventListener("input", () => {
  priceInput.value = priceRange.value;
  updateStepIndicator();
});

priceInput.addEventListener("input", () => {
  syncRanges();
  updateStepIndicator();
});

availabilityRange.addEventListener("input", () => {
  availabilityInput.value = availabilityRange.value;
  updateStepIndicator();
});

availabilityInput.addEventListener("input", () => {
  syncRanges();
  updateStepIndicator();
});

form.addEventListener("input", updateStepIndicator);
form.addEventListener("change", updateStepIndicator);
form.addEventListener("submit", predict);
btnDemo.addEventListener("click", fillDemo);
btnReset.addEventListener("click", resetForm);

updateStepIndicator();
initParticles();
