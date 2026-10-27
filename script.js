/**
 * A Little Something for You ❤️ — Application Logic
 *
 * EXACT NAVIGATION FLOW:
 * - Page 1 (#stage-0): Music Introduction
 *   -> Clicking "Okay, I'm ready ❤️" (#start-experience-btn) starts music and goes DIRECTLY to #stage-1 (Apology).
 * - Page 2 (#stage-1): Apology & Date Invitation
 *   -> Choice A: Clicking "Yes, let's go ❤️" (#accept-apology-btn) goes IMMEDIATELY to #stage-3 (Date Selection).
 *      (#stage-2 Manali memory is NEVER shown on this path).
 *   -> Choice B: Clicking "Not yet 🙈" (#not-yet-btn) goes to #stage-2 (Manali Memory).
 * - Manali Memory (#stage-2 — shown ONLY when she clicks "Not yet 🙈"):
 *   -> Clicking "Let's make more memories together ❤️" (#to-stage-3-btn) goes to #stage-3 (Date Selection).
 * - Page 3 (#stage-3): Saturday / Sunday Selection -> #stage-4 (Lunch / Dinner) -> #stage-5 (Restaurant) -> #stage-6 (Summary) -> #stage-7 (Confirmed).
 */

const CONFIG = {
  // =========================================================================
  // TODO: KEEP YOUR DEPLOYED GOOGLE APPS SCRIPT WEB APP URL BELOW
  // Example: "https://script.google.com/macros/s/AKfycbx.../exec"
  // =========================================================================
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyYh0flRrWE2bgz4EKSi6X1oORUzdZhK6n_JgzEYSOvoEB7IcjFTLrDxXi06h0xdIaJKQ/exec",

  // Shared request token validated by Google Apps Script
  SHARED_CLIENT_TOKEN: "manali-chai-date-2026",

  // Gentle initial music volume (0.0 to 1.0)
  INITIAL_VOLUME: 0.4,
};

// Maps each stage number to the 1..5 progress indicator dots at the top of the screen
const STAGE_TO_PROGRESS_DOT = {
  1: 1, // Apology & Invitation
  2: 1, // Manali Memory (branch of the invitation step)
  3: 2, // Date Selection (Saturday / Sunday)
  4: 3, // Meal Selection (Lunch / Dinner)
  5: 4, // Restaurant Selection
  6: 5, // Final Summary
};

const RESTAURANTS = [
  {
    id: "fifty-five-east",
    name: "Fifty Five East",
    hotelOrArea: "Grand Hyatt Mumbai Hotel & Residences, Santacruz East",
    address:
      "Off Western Express Highway, Santacruz East, Mumbai, Maharashtra 400055",
    cuisine: "Multi-Cuisine Interactive Dining (Indian, Asian, Mezze, Sushi & Western)",
    atmosphere:
      "Warm luxury with interactive open kitchens, high ceilings, and relaxed conversational seating.",
    tripAdvisorNote:
      "Consistently top-rated on TripAdvisor among Santacruz 5-star dining venues.",
    reviewHighlights: [
      "Praised for interactive live kitchens where chefs customize dishes fresh to taste",
      "Loved for its generous Sunday brunch & multi-cuisine dinner spreads",
      "Warm, attentive Grand Hyatt hospitality without feeling overly formal",
    ],
    priceEstimate: "Approx. ₹4,500 – ₹5,500 for two (excluding taxes)",
    officialUrl:
      "https://www.hyatt.com/grand-hyatt/en-US/mumgh-grand-hyatt-mumbai-hotel-and-residences/dining/fifty-five-east",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Fifty+Five+East+Grand+Hyatt+Mumbai+Santacruz+East",
    localImage: "./assets/fifty-five-east.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "celini",
    name: "Celini",
    hotelOrArea: "Grand Hyatt Mumbai Hotel & Residences, Santacruz East",
    address:
      "Off Western Express Highway, Santacruz East, Mumbai, Maharashtra 400055",
    cuisine: "Authentic Home-Style Italian & Wood-Fired Pizzas",
    atmosphere:
      "Intimate, contemporary Italian dining with a central wood-fired oven, warm lighting, and a classic date-night ambiance.",
    tripAdvisorNote:
      "Celebrated on TripAdvisor for romantic dinners and authentic artisanal Italian fare in Mumbai.",
    reviewHighlights: [
      "Famous for thin-crust wood-fired pizzas, handmade ravioli, and classic tiramisu",
      "Cozy, dimly lit evening setting that feels quiet and personal for couples",
      "Open kitchen designed with signature contemporary sculptures and warm acoustics",
    ],
    priceEstimate: "Approx. ₹4,800 – ₹6,000 for two (excluding taxes)",
    officialUrl:
      "https://www.hyatt.com/grand-hyatt/en-US/mumgh-grand-hyatt-mumbai-hotel-and-residences/dining/celini",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Celini+Grand+Hyatt+Mumbai+Santacruz+East",
    localImage: "./assets/celini.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "copper-chimney-bkc",
    name: "Copper Chimney – BKC",
    hotelOrArea: "Bandra Kurla Complex (BKC), Kalina / Bandra East",
    address:
      "Kalina, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400098",
    cuisine: "North Indian, Mughlai & Northwest Frontier",
    atmosphere:
      "Contemporary copper-accented interiors, warm lighting, and nostalgic comfort food perfected since 1972.",
    tripAdvisorNote:
      "Verified TripAdvisor BKC listing (ID: d14142541) — beloved for signature tandoori grills and rich curries.",
    reviewHighlights: [
      "Iconic slow-cooked Dal Maharani, Chelo Kebabs, and Roomali Roti",
      "Warm, lively atmosphere ideal for a comforting, soulful Indian meal together",
      "Reliable service and convenient central BKC location",
    ],
    priceEstimate: "Approx. ₹2,200 – ₹3,000 for two (excluding taxes)",
    officialUrl:
      "https://www.tripadvisor.in/Restaurant_Review-g304554-d14142541-Reviews-Copper_Chimney_Bkc-Mumbai_Maharashtra.html",
    mapsUrl:
      "https://www.google.com/maps/search/?api=1&query=Copper+Chimney+BKC+Mumbai",
    localImage: "./assets/copper-chimney.jpg",
    fallbackImage:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=800&q=80",
  },
];

const state = {
  currentStage: 0,
  selectedDayName: null,         // "Saturday" | "Sunday"
  selectedDateShort: null,       // e.g., "Saturday, 31 October"
  selectedDateFormatted: null,   // e.g., "Saturday, 31 October 2026"
  selectedMeal: null,            // "Lunch" | "Dinner"
  selectedRestaurant: null,      // Restaurant object
  customNote: "",
  notYetMoveCount: 0,
  isSubmitting: false,
  lastSubmittedSignature: null,
};

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/* ==========================================================================
   Initialization
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
  initAmbientParticles();
  initCurrentDateStamp();
  initWeekendDates();
  renderRestaurants();
  initAudioSystem();
  initStageNavigation();
  initPlayfulNotYetButton();
  initSelectionHandlers();
});

/* ==========================================================================
   1. Ambient Particles
   ========================================================================== */
function initAmbientParticles() {
  if (prefersReducedMotion) return;
  const container = document.getElementById("ambient-particles");
  if (!container) return;

  const symbols = ["♥", "✦", "❦", "♡"];
  for (let i = 0; i < 14; i++) {
    const span = document.createElement("span");
    span.className = "floating-particle";
    span.textContent = symbols[i % symbols.length];
    span.style.left = `${Math.random() * 96}%`;
    span.style.fontSize = `${0.75 + Math.random() * 0.85}rem`;
    span.style.animationDuration = `${14 + Math.random() * 14}s`;
    span.style.animationDelay = `${Math.random() * 10}s`;
    container.appendChild(span);
  }
}

function triggerHeartBurst(originElement) {
  if (prefersReducedMotion || !originElement) return;
  const rect = originElement.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  for (let i = 0; i < 8; i++) {
    const heart = document.createElement("span");
    heart.className = "burst-heart";
    heart.textContent = i % 2 === 0 ? "❤️" : "✨";
    heart.style.left = `${centerX}px`;
    heart.style.top = `${centerY}px`;

    const angle = (Math.PI * 2 * i) / 8;
    const distance = 45 + Math.random() * 45;
    heart.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
    heart.style.setProperty("--ty", `${Math.sin(angle) * distance - 25}px`);

    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 1150);
  }
}

/* ==========================================================================
   2. Dynamic Indian Calendar Calculation for Next Saturday & Sunday
   ========================================================================== */
function initCurrentDateStamp() {
  const stamp = document.getElementById("current-date-stamp");
  if (!stamp) return;
  const now = new Date();
  stamp.textContent = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

function getUpcomingWeekendDates() {
  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const currentDayOfWeek = todayMidnight.getDay(); // 0 = Sun ... 6 = Sat

  let daysUntilSaturday = (6 - currentDayOfWeek + 7) % 7;
  if (daysUntilSaturday === 0 && now.getHours() >= 15) {
    daysUntilSaturday = 7;
  }

  let daysUntilSunday = (7 - currentDayOfWeek) % 7;
  if (daysUntilSunday === 0 && now.getHours() >= 15) {
    daysUntilSunday = 7;
  }

  const saturdayDate = new Date(todayMidnight);
  saturdayDate.setDate(todayMidnight.getDate() + daysUntilSaturday);

  const sundayDate = new Date(todayMidnight);
  sundayDate.setDate(todayMidnight.getDate() + daysUntilSunday);

  const formatIndianDate = (dateObj) => {
    const weekday = new Intl.DateTimeFormat("en-IN", { weekday: "long" }).format(dateObj);
    const day = new Intl.DateTimeFormat("en-IN", { day: "numeric" }).format(dateObj);
    const month = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(dateObj);
    return {
      shortLabel: `${weekday}, ${day} ${month}`,
      fullLabel: `${weekday}, ${day} ${month} ${dateObj.getFullYear()}`,
    };
  };

  return {
    saturday: formatIndianDate(saturdayDate),
    sunday: formatIndianDate(sundayDate),
  };
}

function initWeekendDates() {
  const weekend = getUpcomingWeekendDates();
  const satLabel = document.getElementById("saturday-date-label");
  const sunLabel = document.getElementById("sunday-date-label");
  const satBtn = document.getElementById("select-saturday-btn");
  const sunBtn = document.getElementById("select-sunday-btn");

  if (satLabel && satBtn) {
    satLabel.textContent = weekend.saturday.shortLabel;
    satBtn.dataset.shortDate = weekend.saturday.shortLabel;
    satBtn.dataset.formattedDate = weekend.saturday.fullLabel;
  }
  if (sunLabel && sunBtn) {
    sunLabel.textContent = weekend.sunday.shortLabel;
    sunBtn.dataset.shortDate = weekend.sunday.shortLabel;
    sunBtn.dataset.formattedDate = weekend.sunday.fullLabel;
  }
}

/* ==========================================================================
   3. Persistent Audio System (Starts on Page 1 -> Navigates to Page 2 Apology)
   ========================================================================== */
function initAudioSystem() {
  const audio = document.getElementById("bg-music");
  const startBtn = document.getElementById("start-experience-btn");
  const controller = document.getElementById("music-controller");
  const toggleBtn = document.getElementById("music-toggle-btn");
  const musicIcon = document.getElementById("music-icon");
  const statusText = document.getElementById("music-status-text");
  const volumeSlider = document.getElementById("volume-slider");
  const fallbackBadge = document.getElementById("audio-fallback-badge");

  if (!audio) return;
  audio.volume = CONFIG.INITIAL_VOLUME;

  const updateAudioUI = (isPlaying) => {
    if (isPlaying) {
      musicIcon.textContent = "♫";
      musicIcon.classList.add("playing");
      toggleBtn.setAttribute("aria-label", "Pause music");
      statusText.textContent = "Pause Music";
      fallbackBadge.classList.add("hidden");
    } else {
      musicIcon.textContent = "▶";
      musicIcon.classList.remove("playing");
      toggleBtn.setAttribute("aria-label", "Play music");
      statusText.textContent = "Play Music";
    }
  };

  // Page 1 (#stage-0) "Okay, I'm ready ❤️" -> Starts music and goes DIRECTLY to Page 2 (#stage-1 Apology)
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      controller.classList.remove("hidden");

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => updateAudioUI(true))
          .catch((err) => {
            console.warn("Audio autoplay blocked or file missing:", err);
            updateAudioUI(false);
            fallbackBadge.classList.remove("hidden");
          });
      }

      triggerHeartBurst(startBtn);
      goToStage(1); // Directly to Apology & Date Invitation (never Manali memory here)
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      if (audio.paused) {
        audio
          .play()
          .then(() => updateAudioUI(true))
          .catch(() => {
            fallbackBadge.textContent = "Add our-song.mp3 in assets/";
            fallbackBadge.classList.remove("hidden");
          });
      } else {
        audio.pause();
        updateAudioUI(false);
      }
    });
  }

  if (volumeSlider) {
    volumeSlider.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      audio.volume = val;
      if (val === 0 && !audio.paused) {
        musicIcon.classList.remove("playing");
      } else if (val > 0 && !audio.paused) {
        musicIcon.classList.add("playing");
      }
    });
  }
}

/* ==========================================================================
   4. Stage Navigation
   ========================================================================== */
function initStageNavigation() {
  // Generic back buttons using [data-go-stage]
  document.querySelectorAll("[data-go-stage]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetStage = parseInt(btn.getAttribute("data-go-stage"), 10);
      goToStage(targetStage);
    });
  });

  // Choice A on Apology Page (#stage-1): "Yes, let's go ❤️"
  // -> Navigates IMMEDIATELY to Date Selection (#stage-3) without showing Manali memory
  const acceptBtn = document.getElementById("accept-apology-btn");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      triggerHeartBurst(acceptBtn);
      goToStage(3);
    });
  }

  // Button at the end of Manali Memory (#stage-2): "Let's make more memories together ❤️"
  // -> Navigates to Date Selection (#stage-3)
  const toStage3Btn = document.getElementById("to-stage-3-btn");
  if (toStage3Btn) {
    toStage3Btn.addEventListener("click", () => {
      triggerHeartBurst(toStage3Btn);
      goToStage(3);
    });
  }

  // Stage 6 "Change something" -> returns to Stage 3 (Date selection) keeping existing selections
  const changeChoicesBtn = document.getElementById("change-choices-btn");
  if (changeChoicesBtn) {
    changeChoicesBtn.addEventListener("click", () => {
      hideSubmissionStatus();
      goToStage(3);
    });
  }

  // Stage 7 "Review our plan" -> returns to Stage 6 summary
  const reviewPlanBtn = document.getElementById("review-plan-btn");
  if (reviewPlanBtn) {
    reviewPlanBtn.addEventListener("click", () => {
      goToStage(6);
    });
  }
}

function goToStage(stageNumber) {
  const stages = document.querySelectorAll(".stage");
  const journeyHeader = document.getElementById("journey-header");

  stages.forEach((sec) => {
    sec.classList.remove("active");
    sec.hidden = true;
  });

  const targetSection = document.getElementById(`stage-${stageNumber}`);
  if (!targetSection) return;

  targetSection.hidden = false;
  void targetSection.offsetWidth; // Force reflow for smooth CSS transition
  targetSection.classList.add("active");

  state.currentStage = stageNumber;
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });

  // Update progress header dots
  const dotStep = STAGE_TO_PROGRESS_DOT[stageNumber];
  if (dotStep) {
    journeyHeader.classList.remove("hidden");
    updateProgressDots(dotStep);
  } else {
    journeyHeader.classList.add("hidden");
  }

  if (stageNumber === 1) {
    revealLinesSequentially("#stage-1 .stagger-line", 240);
  } else if (stageNumber === 2) {
    revealLinesSequentially("#stage-2 .journal-line", 220);
  } else if (stageNumber === 6) {
    populateSummaryScreen();
  }
}

function updateProgressDots(activeStepIndex) {
  document.querySelectorAll(".step-dot").forEach((dot) => {
    const step = parseInt(dot.getAttribute("data-step-indicator"), 10);
    dot.classList.remove("active", "completed");
    if (step === activeStepIndex) {
      dot.classList.add("active");
    } else if (step < activeStepIndex) {
      dot.classList.add("completed");
    }
  });
}

function revealLinesSequentially(selector, delayMs) {
  const lines = document.querySelectorAll(selector);
  if (prefersReducedMotion) {
    lines.forEach((el) => el.classList.add("revealed"));
    return;
  }
  lines.forEach((el, index) => {
    setTimeout(() => {
      el.classList.add("revealed");
    }, index * delayMs);
  });
}

/* ==========================================================================
   5. Choice B on Apology Page: "Not yet 🙈" -> Navigates to Manali Memory (#stage-2)
   ========================================================================== */
function initPlayfulNotYetButton() {
  const notYetBtn = document.getElementById("not-yet-btn");
  if (!notYetBtn) return;

  // Keeps the gentle playful hover nudge on desktop (up to 2 times), while remaining easy to click
  const nudgePlayfully = () => {
    if (prefersReducedMotion || state.notYetMoveCount >= 2) return;
    state.notYetMoveCount += 1;
    const offsets = [
      { x: 18, y: -8 },
      { x: -16, y: 6 },
    ];
    const move = offsets[state.notYetMoveCount - 1];
    notYetBtn.style.transform = `translate(${move.x}px, ${move.y}px)`;
  };

  notYetBtn.addEventListener("mouseenter", nudgePlayfully);

  // When she clicks "Not yet 🙈", navigate to the Manali Memory page (#stage-2)
  notYetBtn.addEventListener("click", () => {
    notYetBtn.style.transform = "translate(0, 0)";
    goToStage(2);
  });
}

/* ==========================================================================
   6. Date, Meal & Restaurant Selection Handlers
   ========================================================================== */
function renderRestaurants() {
  const grid = document.getElementById("restaurant-grid");
  if (!grid) return;

  grid.innerHTML = RESTAURANTS.map(
    (r) => `
    <article class="restaurant-card" id="card-${r.id}" data-restaurant-id="${r.id}">
      <div class="restaurant-img-box">
        <img
          src="${r.localImage}"
          alt="${r.name} - ${r.hotelOrArea}"
          loading="lazy"
          onerror="this.onerror=null; this.src='${r.fallbackImage}';"
        />
        <span class="cuisine-pill">${r.cuisine.split("(")[0].trim()}</span>
      </div>
      <div class="restaurant-details">
        <div>
          <h3 class="restaurant-title">${r.name}</h3>
          <p class="restaurant-hotel">📍 ${r.hotelOrArea}</p>
          <p class="restaurant-desc">${r.atmosphere}</p>
          <ul class="restaurant-meta-list">
            <li><strong>Cuisine:</strong> ${r.cuisine}</li>
            <li><strong>Why people love it:</strong> ${r.reviewHighlights.join(" • ")}</li>
            <li><strong>Public Rating Note:</strong> ${r.tripAdvisorNote}</li>
            <li><strong>Estimated for two:</strong> ${r.priceEstimate}</li>
          </ul>
        </div>
        <div class="restaurant-card-footer">
          <div class="restaurant-links">
            <a href="${r.mapsUrl}" target="_blank" rel="noopener noreferrer" class="text-link">
              View location ↗
            </a>
            <a href="${r.officialUrl}" target="_blank" rel="noopener noreferrer" class="text-link">
              Official Info / Reviews ↗
            </a>
          </div>
          <button
            type="button"
            class="btn btn-primary choose-restaurant-btn"
            data-restaurant-id="${r.id}"
          >
            Choose this restaurant ❤️
          </button>
        </div>
      </div>
    </article>
  `
  ).join("");
}

function initSelectionHandlers() {
  // Day selection (Stage 3 -> Stage 4)
  const dayCards = document.querySelectorAll(".day-card");
  dayCards.forEach((card) => {
    card.addEventListener("click", () => {
      dayCards.forEach((c) => {
        c.classList.remove("selected");
        c.setAttribute("aria-pressed", "false");
      });
      card.classList.add("selected");
      card.setAttribute("aria-pressed", "true");

      state.selectedDayName = card.dataset.dayType;
      state.selectedDateShort = card.dataset.shortDate;
      state.selectedDateFormatted = card.dataset.formattedDate;

      const reminder = document.getElementById("selected-day-reminder");
      if (reminder) {
        reminder.textContent = `You picked ${state.selectedDateShort}. Now pick the vibe that sounds best to you!`;
      }

      triggerHeartBurst(card);
      setTimeout(() => goToStage(4), 260);
    });
  });

  // Meal selection (Stage 4 -> Stage 5)
  const mealCards = document.querySelectorAll(".meal-card");
  mealCards.forEach((card) => {
    card.addEventListener("click", () => {
      mealCards.forEach((c) => {
        c.classList.remove("selected");
        c.setAttribute("aria-pressed", "false");
      });
      card.classList.add("selected");
      card.setAttribute("aria-pressed", "true");

      state.selectedMeal = card.dataset.meal;
      triggerHeartBurst(card);
      setTimeout(() => goToStage(5), 260);
    });
  });

  // Restaurant selection (Stage 5 -> Stage 6)
  document.querySelectorAll(".choose-restaurant-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const restId = btn.getAttribute("data-restaurant-id");
      const found = RESTAURANTS.find((item) => item.id === restId);
      if (!found) return;

      state.selectedRestaurant = found;

      document.querySelectorAll(".restaurant-card").forEach((card) => {
        card.classList.toggle("selected", card.dataset.restaurantId === restId);
      });

      triggerHeartBurst(btn);
      setTimeout(() => goToStage(6), 280);
    });
  });

  // Final Confirmation & Telegram Notification (Stage 6)
  const confirmBtn = document.getElementById("confirm-choices-btn");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", handleFinalConfirmation);
  }
}

/* ==========================================================================
   7. Summary Rendering & Telegram Notification Submission
   ========================================================================== */
function populateSummaryScreen() {
  document.getElementById("summary-day").textContent =
    state.selectedDateShort || "Not selected";
  document.getElementById("summary-meal").textContent = state.selectedMeal
    ? `${state.selectedMeal} date`
    : "Not selected";

  if (state.selectedRestaurant) {
    document.getElementById("summary-restaurant").textContent =
      state.selectedRestaurant.name;
    document.getElementById("summary-address").textContent =
      state.selectedRestaurant.address;
    const mapLink = document.getElementById("summary-map-link");
    mapLink.href = state.selectedRestaurant.mapsUrl;
  }
}

function showSubmissionStatus(message, type) {
  const statusBox = document.getElementById("submission-status");
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = `submission-status ${type}`;
  statusBox.classList.remove("hidden");
}

function hideSubmissionStatus() {
  const statusBox = document.getElementById("submission-status");
  if (statusBox) statusBox.classList.add("hidden");
}

async function handleFinalConfirmation() {
  if (state.isSubmitting) return;

  const confirmBtn = document.getElementById("confirm-choices-btn");
  const changeBtn = document.getElementById("change-choices-btn");
  const noteInput = document.getElementById("her-custom-note");

  state.customNote = noteInput ? noteInput.value.trim() : "";

  if (
    !state.selectedDayName ||
    !state.selectedDateShort ||
    !state.selectedMeal ||
    !state.selectedRestaurant
  ) {
    showSubmissionStatus(
      "Please select a day, meal, and restaurant first so our plan is complete! ❤️",
      "error"
    );
    return;
  }

  const currentSignature = [
    state.selectedDayName,
    state.selectedDateShort,
    state.selectedMeal,
    state.selectedRestaurant.name,
    state.customNote,
  ].join("|");

  if (state.lastSubmittedSignature === currentSignature) {
    goToStage(7);
    return;
  }

  const scriptUrl = (CONFIG.GOOGLE_APPS_SCRIPT_URL || "").trim();
  const isConfigured =
    scriptUrl.startsWith("https://script.google.com/macros/s/") &&
    !scriptUrl.includes("PASTE_YOUR");

  if (!isConfigured) {
    showSubmissionStatus(
      "Notification service is not configured yet (Google Apps Script URL missing in script.js). Your choices are still saved right here—please check the backend setup and try again.",
      "error"
    );
    return;
  }

  state.isSubmitting = true;
  confirmBtn.disabled = true;
  if (changeBtn) changeBtn.disabled = true;
  confirmBtn.textContent = "Sending confirmation... ❤️";
  showSubmissionStatus(
    "Sending your date preferences to my planner... please wait a moment ✨",
    "info"
  );

  const confirmedAtIST = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  const payload = {
    token: CONFIG.SHARED_CLIENT_TOKEN,
    idempotencyKey: currentSignature,
    selectedDay: state.selectedDayName,
    calendarDate: state.selectedDateShort,
    fullCalendarDate: state.selectedDateFormatted,
    mealPreference: state.selectedMeal,
    restaurantName: state.selectedRestaurant.name,
    restaurantArea: state.selectedRestaurant.hotelOrArea,
    customNote: state.customNote,
    confirmedAtIST: confirmedAtIST,
  };

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    let result = null;
    try {
      result = await response.json();
    } catch (_) {
      result = null;
    }

    if (response.ok && result && result.status === "success") {
      state.lastSubmittedSignature = currentSignature;
      hideSubmissionStatus();

      const recapText = document.getElementById("final-recap-text");
      const receiptNote = document.getElementById("final-notification-receipt");
      const finalMapBtn = document.getElementById("final-map-btn");

      if (recapText) {
        recapText.textContent = `${state.selectedMeal} on ${state.selectedDateShort} at ${state.selectedRestaurant.name}`;
      }
      if (receiptNote) {
        receiptNote.textContent =
          "✨ Preferences confirmed! Your date planner has received your confirmation on Telegram.";
      }
      if (finalMapBtn) {
        finalMapBtn.href = state.selectedRestaurant.mapsUrl;
      }

      triggerHeartBurst(confirmBtn);
      goToStage(7);
    } else {
      const serverMsg =
        (result && result.message) ||
        "Could not deliver the confirmation notification right now.";
      showSubmissionStatus(
        `⚠️ ${serverMsg} Your choices are safely preserved above—please tap "Confirm my choices ❤️" to try again.`,
        "error"
      );
    }
  } catch (err) {
    console.error("Telegram notification error:", err);
    showSubmissionStatus(
      "⚠️ Network error while sending your confirmation. Your choices are still saved on this screen—please check your connection and tap 'Confirm my choices ❤️' to retry.",
      "error"
    );
  } finally {
    state.isSubmitting = false;
    confirmBtn.disabled = false;
    if (changeBtn) changeBtn.disabled = false;
    confirmBtn.textContent = "Confirm my choices ❤️";
  }
}