// script.js
// Core interactivity for the Islamic wedding invitation SPA

// Util: Smooth scroll to target
function smoothScrollTo(targetSelector) {
  const el = document.querySelector(targetSelector);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Navigation: smooth scroll handling
function setupSmoothScroll() {
  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const scrollTarget = target.getAttribute("data-scroll-target");
    if (!scrollTarget) return;

    event.preventDefault();
    smoothScrollTo(scrollTarget);
  });
}

// Mobile nav toggle
function setupMobileNav() {
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("nav-menu");

  if (!toggle || !menu) return;

  toggle.addEventListener("click", () => {
    const isExpanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isExpanded));
    menu.classList.toggle("open", !isExpanded);
  });

  // Close menu on link click (mobile)
  menu.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof HTMLAnchorElement) {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("open");
    }
  });

  // Close menu when clicking outside
  document.addEventListener("click", (event) => {
    if (!toggle.contains(event.target) && !menu.contains(event.target)) {
      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("open");
    }
  });
}

// Intersection Observer for reveal animations
function setupRevealOnScroll() {
  const elements = document.querySelectorAll(".reveal");
  if (!("IntersectionObserver" in window) || elements.length === 0) {
    elements.forEach((el) => el.classList.add("reveal-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      root: null,
      threshold: 0.2,
    }
  );

  elements.forEach((el) => observer.observe(el));
}

// Helper: Create date in Pakistan Standard Time (PKT = UTC+5)
function createDateInPKT(year, month, day, hour, minute = 0, second = 0) {
  // Create date string in ISO format with PKT offset (UTC+5)
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}+05:00`;
  return new Date(dateStr);
}

// Countdown timer to first event
function setupCountdown() {
  const container = document.getElementById("countdown-timer");
  if (!container) return;

  // February 1st, 2026, 19:00 PKT (Pakistan Standard Time, UTC+5)
  const eventDate = createDateInPKT(2026, 2, 1, 19, 0, 0);

  function updateCountdown() {
    const now = new Date();
    let diff = eventDate.getTime() - now.getTime();

    if (diff <= 0) {
      container.innerHTML =
        "<span><strong>00</strong><small>Days</small></span>" +
        "<span><strong>00</strong><small>Hours</small></span>" +
        "<span><strong>00</strong><small>Minutes</small></span>" +
        "<span><strong>00</strong><small>Seconds</small></span>";
      return;
    }

    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / (60 * 60 * 24));
    const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    const pad = (n) => String(n).padStart(2, "0");

    container.innerHTML = `
      <span><strong>${pad(days)}</strong><small>Days</small></span>
      <span><strong>${pad(hours)}</strong><small>Hours</small></span>
      <span><strong>${pad(minutes)}</strong><small>Minutes</small></span>
      <span><strong>${pad(secs)}</strong><small>Seconds</small></span>
    `;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Add-to-calendar (.ics) generation
function createICSContent({ title, description, location, start, end }) {
  const pad = (n) => String(n).padStart(2, "0");

  function toICSDateString(date) {
    // Convert to UTC for ICS format
    return (
      date.getUTCFullYear().toString() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      "T" +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      "Z"
    );
  }

  const dtStart = toICSDateString(start);
  const dtEnd = toICSDateString(end);
  const dtStamp = toICSDateString(new Date());
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@wedding-invitation`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wedding Invitation//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(filename, content) {
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function setupCalendarButtons() {
  const buttons = document.querySelectorAll("[data-calendar]");
  if (!buttons.length) return;

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.getAttribute("data-calendar");
      if (!type) return;

      let title = "";
      let description = "";
      let location = "";
      let start;
      let end;

      switch (type) {
        case "walima": {
          title = "Walima Ceremony - Muhammad Arshad Irshad";
          description =
            "Walima Ceremony of Muhammad Arshad Irshad with Daughter of Rao Muhammad Sarwar. IN SHA ALLAH.";
          location = "Nawab Marquee, Burewala Road, Vehari";
          // February 01, 2026, 19:00 PKT - Reception at 7pm, Dinner at 8pm
          start = createDateInPKT(2026, 2, 1, 19, 0, 0);
          end = createDateInPKT(2026, 2, 1, 21, 0, 0);
          break;
        }
        default:
          return;
      }

      const icsContent = createICSContent({
        title,
        description,
        location,
        start,
        end,
      });

      downloadICS(`${type}-event.ics`, icsContent);
    });
  });
}

// Contact card click to call functionality
function setupContactCalls() {
  document.addEventListener('click', function (e) {
    const card = e.target.closest('.js-contact--call-toggle');
    if (!card) return;

    const href = card.getAttribute('data-href');
    if (!href) return;

    // Create and click a temporary link
    const a = document.createElement('a');
    a.href = href;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}

// Footer year
function setCurrentYear() {
  const yearEl = document.getElementById("current-year");
  if (!yearEl) return;
  yearEl.textContent = String(new Date().getFullYear());
}

// Keyboard navigation: close mobile menu with Escape
function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const toggle = document.querySelector(".nav-toggle");
      const menu = document.getElementById("nav-menu");
      if (!toggle || !menu) return;

      toggle.setAttribute("aria-expanded", "false");
      menu.classList.remove("open");
    }
  });
}

// Lazy loading for images (for browsers that don't support native lazy loading)
function setupLazyLoading() {
  if ('loading' in HTMLImageElement.prototype) {
    // Browser supports native lazy loading
    return;
  }

  // Fallback for older browsers
  const images = document.querySelectorAll('img[loading="lazy"]');
  
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src || img.src;
          img.classList.add('loaded');
          observer.unobserve(img);
        }
      });
    });

    images.forEach(img => imageObserver.observe(img));
  } else {
    // Fallback: just load all images
    images.forEach(img => {
      img.src = img.dataset.src || img.src;
    });
  }
}

// Performance optimization: Debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Handle window resize for responsive adjustments
function setupResponsiveHandlers() {
  const handleResize = debounce(() => {
    // Add any responsive adjustments needed on resize
    const nav = document.querySelector('.nav-links');
    const toggle = document.querySelector('.nav-toggle');
    
    // Close mobile menu on resize to desktop
    if (window.innerWidth >= 768) {
      if (toggle) toggle.setAttribute("aria-expanded", "false");
      if (nav) nav.classList.remove("open");
    }
  }, 250);

  window.addEventListener('resize', handleResize);
}

// Initialize all features once DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  setupSmoothScroll();
  setupMobileNav();
  setupRevealOnScroll();
  setupCountdown();
  setupCalendarButtons();
  setupContactCalls();
  setupLazyLoading();
  setCurrentYear();
  setupKeyboardShortcuts();
  setupResponsiveHandlers();
});

// Helper: Create date in Pakistan Standard Time (UTC+5)
function createDateInPKT(year, month, day, hour, minute = 0, second = 0) {
  const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}:${String(second).padStart(2, "0")}+05:00`;
  return new Date(dateStr);
}

// Countdown to 1st Feb 2026 00:00:00
function setupCountdown() {
  const container = document.getElementById("countdown-timer");
  if (!container) return;

  const eventDate = createDateInPKT(2026, 2, 1, 0, 0, 0);

  function updateCountdown() {
    const now = new Date();
    let diff = eventDate - now;

    if (diff <= 0) diff = 0;

    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / (60 * 60 * 24));
    const hours = Math.floor((seconds % (60 * 60 * 24)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    const pad = (n) => String(n).padStart(2, "0");

    container.innerHTML = `
      <span><strong>${pad(days)}</strong><small>Days</small></span>
      <span><strong>${pad(hours)}</strong><small>Hours</small></span>
      <span><strong>${pad(minutes)}</strong><small>Minutes</small></span>
      <span><strong>${pad(secs)}</strong><small>Seconds</small></span>
    `;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

// Footer year
function setCurrentYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", () => {
  setupCountdown();
  setCurrentYear();
});

// Handle page visibility change to update countdown
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page is visible again, ensure countdown is accurate
    setupCountdown();
  }
});
