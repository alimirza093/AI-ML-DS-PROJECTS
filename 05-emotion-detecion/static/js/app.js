/**
 * EmotiSense — Frontend interaction layer
 * Talks to FastAPI /predict and /health endpoints.
 */

(() => {
  "use strict";

  const EMOTION_META = {
    sadness: { emoji: "😢", color: "#60a5fa" },
    joy: { emoji: "😄", color: "#fbbf24" },
    love: { emoji: "❤️", color: "#fb7185" },
    anger: { emoji: "😠", color: "#f87171" },
    fear: { emoji: "😨", color: "#a78bfa" },
    surprise: { emoji: "😲", color: "#38bdf8" },
  };

  const EMOTION_ORDER = ["sadness", "joy", "love", "anger", "fear", "surprise"];
  const HISTORY_KEY = "emotisense_history_v1";
  const MAX_HISTORY = 6;

  const els = {
    textInput: document.getElementById("text-input"),
    charCount: document.getElementById("char-count"),
    analyzeBtn: document.getElementById("analyze-btn"),
    clearBtn: document.getElementById("clear-btn"),
    errorMsg: document.getElementById("error-msg"),
    emptyState: document.getElementById("empty-state"),
    resultContent: document.getElementById("result-content"),
    emotionEmoji: document.getElementById("emotion-emoji"),
    emotionName: document.getElementById("emotion-name"),
    confidenceFill: document.getElementById("confidence-fill"),
    confidenceValue: document.getElementById("confidence-value"),
    probList: document.getElementById("prob-list"),
    analyzedText: document.getElementById("analyzed-text"),
    samples: document.getElementById("samples"),
    healthStatus: document.getElementById("health-status"),
    healthLabel: document.getElementById("health-label"),
    historySection: document.getElementById("history-section"),
    historyList: document.getElementById("history-list"),
    clearHistory: document.getElementById("clear-history"),
    canvas: document.getElementById("bg-canvas"),
  };

  let particleHue = 170;
  let analyzing = false;

  /* ---------- Utilities ---------- */

  function clampText(value) {
    return String(value || "").slice(0, 2000);
  }

  function formatPct(value) {
    return `${Math.round((Number(value) || 0) * 100)}%`;
  }

  function showError(message) {
    els.errorMsg.hidden = false;
    els.errorMsg.textContent = message;
  }

  function clearError() {
    els.errorMsg.hidden = true;
    els.errorMsg.textContent = "";
  }

  function setLoading(isLoading) {
    analyzing = isLoading;
    els.analyzeBtn.disabled = isLoading;
    els.analyzeBtn.classList.toggle("loading", isLoading);
  }

  function updateCharCount() {
    const len = els.textInput.value.length;
    els.charCount.textContent = `${len} / 2000`;
  }

  /* ---------- Health check ---------- */

  async function checkHealth() {
    try {
      const res = await fetch("/health", { cache: "no-store" });
      if (!res.ok) throw new Error("Health check failed");
      const data = await res.json();
      const loaded = Boolean(data.model_loaded);
      els.healthStatus.classList.toggle("online", loaded);
      els.healthStatus.classList.toggle("offline", !loaded);
      els.healthLabel.textContent = loaded ? "Model online" : "Model unavailable";
    } catch {
      els.healthStatus.classList.remove("online");
      els.healthStatus.classList.add("offline");
      els.healthLabel.textContent = "API offline";
    }
  }

  /* ---------- Render results ---------- */

  function applyEmotionTheme(emotion) {
    const key = EMOTION_META[emotion] ? emotion : "neutral";
    document.body.dataset.emotion = key;
    particleHue = {
      joy: 45,
      love: 350,
      anger: 0,
      fear: 265,
      surprise: 195,
      sadness: 210,
      neutral: 170,
    }[key];
  }

  function renderProbabilities(allProbabilities, topEmotion) {
    const entries = EMOTION_ORDER.map((label) => ({
      label,
      value: Number(allProbabilities?.[label] ?? 0),
    })).sort((a, b) => b.value - a.value);

    els.probList.innerHTML = entries
      .map((item, index) => {
        const isTop = item.label === topEmotion || index === 0;
        return `
          <li class="prob-item ${isTop ? "is-top" : ""}" data-emotion="${item.label}">
            <span class="name">${item.label}</span>
            <div class="bar-track">
              <div class="bar-fill" style="width:0%" data-target="${Math.max(item.value * 100, 0)}"></div>
            </div>
            <span class="pct">${formatPct(item.value)}</span>
          </li>
        `;
      })
      .join("");

    requestAnimationFrame(() => {
      els.probList.querySelectorAll(".bar-fill").forEach((bar) => {
        bar.style.width = `${bar.dataset.target}%`;
      });
    });
  }

  function renderResult(payload) {
    const emotion = payload.predicted_emotion;
    const meta = EMOTION_META[emotion] || { emoji: "✨" };

    applyEmotionTheme(emotion);

    els.emptyState.hidden = true;
    els.resultContent.hidden = false;

    // Retrigger emoji animation
    els.emotionEmoji.style.animation = "none";
    void els.emotionEmoji.offsetHeight;
    els.emotionEmoji.style.animation = "";

    els.emotionEmoji.textContent = meta.emoji;
    els.emotionName.textContent = emotion;
    els.analyzedText.textContent = `“${payload.text}”`;

    const confidence = Number(payload.confidence) || 0;
    els.confidenceValue.textContent = formatPct(confidence);
    els.confidenceFill.style.width = "0%";
    requestAnimationFrame(() => {
      els.confidenceFill.style.width = `${confidence * 100}%`;
    });

    renderProbabilities(payload.all_probabilities || {}, emotion);
    burstParticles(18);
  }

  /* ---------- History ---------- */

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveHistory(items) {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  }

  function pushHistory(payload) {
    const items = loadHistory().filter((item) => item.text !== payload.text);
    items.unshift({
      text: payload.text,
      emotion: payload.predicted_emotion,
      confidence: payload.confidence,
      ts: Date.now(),
    });
    saveHistory(items);
    renderHistory();
  }

  function renderHistory() {
    const items = loadHistory();
    if (!items.length) {
      els.historySection.hidden = true;
      els.historyList.innerHTML = "";
      return;
    }

    els.historySection.hidden = false;
    els.historyList.innerHTML = items
      .map((item) => {
        const emoji = EMOTION_META[item.emotion]?.emoji || "✨";
        const safeText = escapeHtml(item.text);
        return `
          <li class="history-item" data-text="${escapeAttr(item.text)}" tabindex="0" role="button">
            <span class="history-emoji">${emoji}</span>
            <span class="history-text">${safeText}</span>
            <span class="history-badge">${item.emotion} · ${formatPct(item.confidence)}</span>
          </li>
        `;
      })
      .join("");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }

  /* ---------- Predict ---------- */

  async function analyzeText(rawText) {
    const text = clampText(rawText).trim();
    if (!text) {
      showError("Please enter some text to analyze.");
      els.textInput.focus();
      return;
    }

    clearError();
    setLoading(true);

    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        let detail = "Prediction failed. Please try again.";
        try {
          const err = await res.json();
          detail = err.detail || detail;
        } catch {
          /* ignore parse errors */
        }
        throw new Error(typeof detail === "string" ? detail : "Prediction failed.");
      }

      const data = await res.json();
      renderResult(data);
      pushHistory(data);
    } catch (err) {
      showError(err.message || "Unable to reach the prediction API.");
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Canvas particle field ---------- */

  function initCanvas() {
    const canvas = els.canvas;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let particles = [];
    let raf = null;
    let mouse = { x: null, y: null };

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      const count = Math.min(90, Math.floor((width * height) / 18000));
      particles = Array.from({ length: count }, () => spawnParticle(true));
    }

    function spawnParticle(randomY = false) {
      return {
        x: Math.random() * width,
        y: randomY ? Math.random() * height : height + Math.random() * 40,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.35,
        vy: -Math.random() * 0.35 - 0.08,
        alpha: Math.random() * 0.45 + 0.15,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      // soft vignette grid
      ctx.save();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.045)";
      ctx.lineWidth = 1;
      const step = 64;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      for (const p of particles) {
        if (!reducedMotion) {
          p.x += p.vx;
          p.y += p.vy;

          if (mouse.x != null) {
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 120) {
              p.x += dx * 0.01;
              p.y += dy * 0.01;
            }
          }

          if (p.y < -10 || p.x < -20 || p.x > width + 20) {
            Object.assign(p, spawnParticle(false));
            p.y = height + 10;
          }
        }

        ctx.beginPath();
        ctx.fillStyle = `hsla(${particleHue}, 80%, 65%, ${p.alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // connect nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 110) {
            ctx.strokeStyle = `hsla(${particleHue}, 70%, 60%, ${0.12 * (1 - dist / 110)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(draw);
    }

    window.burstParticles = function burstParticles(n = 12) {
      for (let i = 0; i < n; i++) {
        particles.push({
          x: width * 0.5 + (Math.random() - 0.5) * 180,
          y: height * 0.35 + (Math.random() - 0.5) * 120,
          r: Math.random() * 2.4 + 0.8,
          vx: (Math.random() - 0.5) * 2.4,
          vy: (Math.random() - 0.5) * 2.4,
          alpha: 0.8,
        });
      }
      if (particles.length > 140) particles.splice(0, particles.length - 140);
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener(
      "pointermove",
      (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
      },
      { passive: true }
    );
    window.addEventListener(
      "pointerleave",
      () => {
        mouse.x = null;
        mouse.y = null;
      },
      { passive: true }
    );

    resize();
    if (raf) cancelAnimationFrame(raf);
    draw();
  }

  /* ---------- Events ---------- */

  function bindEvents() {
    els.textInput.addEventListener("input", updateCharCount);

    els.analyzeBtn.addEventListener("click", () => {
      if (!analyzing) analyzeText(els.textInput.value);
    });

    els.clearBtn.addEventListener("click", () => {
      els.textInput.value = "";
      updateCharCount();
      clearError();
      els.textInput.focus();
    });

    els.textInput.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !analyzing) {
        analyzeText(els.textInput.value);
      }
    });

    els.samples.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      els.textInput.value = chip.dataset.sample || "";
      updateCharCount();
      clearError();
      analyzeText(els.textInput.value);
    });

    els.historyList.addEventListener("click", (e) => {
      const item = e.target.closest(".history-item");
      if (!item) return;
      els.textInput.value = item.dataset.text || "";
      updateCharCount();
      analyzeText(els.textInput.value);
    });

    els.historyList.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const item = e.target.closest(".history-item");
      if (!item) return;
      e.preventDefault();
      els.textInput.value = item.dataset.text || "";
      updateCharCount();
      analyzeText(els.textInput.value);
    });

    els.clearHistory.addEventListener("click", () => {
      localStorage.removeItem(HISTORY_KEY);
      renderHistory();
    });
  }

  /* ---------- Boot ---------- */

  function init() {
    updateCharCount();
    bindEvents();
    initCanvas();
    renderHistory();
    checkHealth();
    setInterval(checkHealth, 30000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
