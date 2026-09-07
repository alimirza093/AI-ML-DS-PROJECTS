(() => {
  const API_BASE = window.location.origin.includes("5500")
    || window.location.protocol === "file:"
    ? "http://127.0.0.1:8000"
    : "";

  const form = document.getElementById("predict-form");
  const statusEl = document.getElementById("form-status");
  const submitBtn = document.getElementById("submit-btn");
  const btnLabel = submitBtn.querySelector(".btn-label");
  const btnSpinner = submitBtn.querySelector(".btn-spinner");
  const scoreValue = document.getElementById("score-value");
  const scoreLabel = document.getElementById("score-label");
  const gaugeFill = document.getElementById("gauge-fill");
  const insightList = document.getElementById("insight-list");

  const CIRCUMFERENCE = 2 * Math.PI * 88;
  gaugeFill.style.strokeDasharray = String(CIRCUMFERENCE);
  gaugeFill.style.strokeDashoffset = String(CIRCUMFERENCE);

  const rangeBindings = [
    ["Avg_Daily_Usage_Hours", "usage-val", (v) => Number(v).toFixed(1)],
    ["Daily_Unlocks", "unlocks-val", (v) => String(Math.round(v))],
    ["Study_Hours", "study-val", (v) => Number(v).toFixed(1)],
    ["Physical_Activity_Hours", "activity-val", (v) => Number(v).toFixed(1)],
    ["Sleep_Hours_Per_Night", "sleep-val", (v) => Number(v).toFixed(1)],
  ];

  rangeBindings.forEach(([name, id, fmt]) => {
    const input = form.elements.namedItem(name);
    const label = document.getElementById(id);
    const sync = () => {
      label.textContent = fmt(input.value);
    };
    input.addEventListener("input", sync);
    sync();
  });

  function setStatus(message, type = "") {
    statusEl.textContent = message;
    statusEl.className = `form-status${type ? ` ${type}` : ""}`;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    btnSpinner.hidden = !isLoading;
    btnLabel.textContent = isLoading ? "Predicting…" : "Predict score";
  }

  function interpretScore(score) {
    if (score >= 7.5) {
      return {
        label: "Strong balance",
        color: "#34d399",
        tips: [
          "You're in a healthier range — keep protecting sleep and activity.",
          "Stay mindful of unlock spikes during exam weeks.",
        ],
      };
    }
    if (score >= 6) {
      return {
        label: "Moderate pulse",
        color: "#2dd4bf",
        tips: [
          "A bit more sleep or lower stress often lifts this band.",
          "Try trimming daily usage by 30–60 minutes and re-check.",
        ],
      };
    }
    if (score >= 5) {
      return {
        label: "Needs attention",
        color: "#fbbf24",
        tips: [
          "Stress and short sleep are common drag factors here.",
          "Prioritize rest and light movement before late-night scrolling.",
        ],
      };
    }
    return {
      label: "High strain",
      color: "#fb7185",
      tips: [
        "This estimate suggests heavy lifestyle strain — consider support resources.",
        "Reducing unlocks and raising sleep often moves the score upward.",
      ],
    };
  }

  function animateGauge(score) {
    const clamped = Math.max(0, Math.min(10, score));
    const offset = CIRCUMFERENCE * (1 - clamped / 10);
    gaugeFill.style.strokeDashoffset = String(offset);

    const start = Number(scoreValue.dataset.current || 0);
    const end = score;
    const duration = 900;
    const t0 = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = start + (end - start) * eased;
      scoreValue.textContent = val.toFixed(2);
      if (t < 1) requestAnimationFrame(tick);
      else scoreValue.dataset.current = String(end);
    }
    requestAnimationFrame(tick);
  }

  function renderResult(score) {
    const info = interpretScore(score);
    scoreLabel.textContent = info.label;
    scoreLabel.style.color = info.color;
    animateGauge(score);
    insightList.innerHTML = info.tips.map((tip) => `<li>${tip}</li>`).join("");
  }

  function collectPayload() {
    const data = new FormData(form);
    return {
      Age: Number(data.get("Age")),
      Gender: data.get("Gender"),
      Country_Grouped: data.get("Country_Grouped"),
      Academic_Level: data.get("Academic_Level"),
      Most_Used_Platform: data.get("Most_Used_Platform"),
      Purpose_Of_Use: data.get("Purpose_Of_Use"),
      Avg_Daily_Usage_Hours: Number(data.get("Avg_Daily_Usage_Hours")),
      Daily_Unlocks: Number(data.get("Daily_Unlocks")),
      Study_Hours: Number(data.get("Study_Hours")),
      Physical_Activity_Hours: Number(data.get("Physical_Activity_Hours")),
      Sleep_Hours_Per_Night: Number(data.get("Sleep_Hours_Per_Night")),
      Stress_Level: data.get("Stress_Level"),
    };
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      setStatus("Please complete all required fields.", "error");
      return;
    }

    const payload = collectPayload();
    setLoading(true);
    setStatus("Sending lifestyle data to the model…");

    try {
      const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = body.detail;
        const message = Array.isArray(detail)
          ? detail.map((d) => d.msg || JSON.stringify(d)).join("; ")
          : detail || `Request failed (${response.status})`;
        throw new Error(message);
      }

      const score = Number(body.Mental_Health_Score);
      renderResult(score);
      setStatus("Prediction ready.", "success");
    } catch (err) {
      setStatus(err.message || "Could not reach the API. Is the server running?", "error");
    } finally {
      setLoading(false);
    }
  });

  form.addEventListener("reset", () => {
    setTimeout(() => {
      rangeBindings.forEach(([name, id, fmt]) => {
        const input = form.elements.namedItem(name);
        document.getElementById(id).textContent = fmt(input.value);
      });
      scoreValue.textContent = "—";
      scoreValue.dataset.current = "0";
      scoreLabel.textContent = "Awaiting input";
      scoreLabel.style.color = "";
      gaugeFill.style.strokeDashoffset = String(CIRCUMFERENCE);
      insightList.innerHTML = `
        <li>Adjust sleep, stress, and screen time to see how the score responds.</li>
        <li>This is a statistical estimate — not a clinical diagnosis.</li>
      `;
      setStatus("");
    }, 0);
  });

  /* Animated particle network background */
  const canvas = document.getElementById("bg-canvas");
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let particles = [];
  let rafId = 0;
  let width = 0;
  let height = 0;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    const count = Math.min(70, Math.floor((width * height) / 18000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.6 + 0.4,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(45, 212, 191, 0.55)";
      ctx.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 120) {
          ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 * (1 - dist / 120)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }
    }
    rafId = requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  if (!reduceMotion) draw();
  else {
    ctx.clearRect(0, 0, width, height);
    particles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(45, 212, 191, 0.4)";
      ctx.fill();
    });
  }

  window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
})();
