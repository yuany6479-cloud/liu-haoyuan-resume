const root = document.documentElement;
const body = document.body;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

window.addEventListener("load", () => {
  document.body.classList.add("is-loaded");
});

const savedTheme = localStorage.getItem("resume-theme");
if (savedTheme === "dark") {
  root.dataset.theme = "dark";
}

function syncThemeButton() {
  const button = document.querySelector(".theme-toggle");
  if (!button) return;
  const isDark = root.dataset.theme === "dark";
  button.setAttribute("aria-pressed", String(isDark));
  button.querySelector(".theme-toggle__label").textContent = isDark ? "DARK" : "LIGHT";
  document.querySelector('meta[name="theme-color"]').content = isDark ? "#171715" : "#f4f1ec";
}

document.querySelector(".theme-toggle")?.addEventListener("click", () => {
  root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("resume-theme", root.dataset.theme);
  syncThemeButton();
});
syncThemeButton();

const progress = document.querySelector(".scroll-progress span");
const backToTop = document.querySelector(".back-to-top");

function updateScrollProgress() {
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = height > 0 ? window.scrollY / height : 0;
  progress.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio))})`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

backToTop?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.14, rootMargin: "0px 0px -7% 0px" }
);

document.querySelectorAll("[data-reveal], .skill-row").forEach((element) => {
  revealObserver.observe(element);
});

const counterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.7 }
);

document.querySelectorAll(".counter").forEach((counter) => counterObserver.observe(counter));

function animateCounter(element) {
  const target = Number(element.dataset.target);
  const suffix = element.dataset.suffix || "";
  if (reducedMotion) {
    element.textContent = `${target.toLocaleString("zh-CN")}${suffix}`;
    return;
  }

  const duration = target >= 1000 ? 1500 : 1100;
  const start = performance.now();

  function frame(now) {
    const progress = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(target * eased);
    element.textContent = `${current.toLocaleString("zh-CN")}${suffix}`;
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

const filterButtons = [...document.querySelectorAll(".experience-filter button")];
const timelineItems = [...document.querySelectorAll(".timeline-item")];

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });

    timelineItems.forEach((item) => {
      const visible = filter === "all" || item.dataset.category === filter;
      item.classList.toggle("is-filtered", !visible);
      if (visible) {
        item.classList.add("is-visible");
      }
    });
  });
});

const navLinks = [...document.querySelectorAll(".site-nav a")];
const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const navObserver = new IntersectionObserver(
  (entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    navLinks.forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${visible.target.id}`);
    });
  },
  { threshold: [0.25, 0.5, 0.75] }
);

navSections.forEach((section) => navObserver.observe(section));

const portraitStage = document.querySelector(".portrait-stage");
if (portraitStage && !reducedMotion && window.matchMedia("(pointer:fine)").matches) {
  window.addEventListener(
    "pointermove",
    (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 16;
      const y = (event.clientY / window.innerHeight - 0.5) * 13;
      portraitStage.style.setProperty("--mx", `${x}px`);
      portraitStage.style.setProperty("--my", `${y}px`);
    },
    { passive: true }
  );
}

const toast = document.querySelector(".toast");
let toastTimer;

document.querySelector(".copy-phone")?.addEventListener("click", async (event) => {
  const text = event.currentTarget.dataset.copy;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
});

document.querySelector(".share-site")?.addEventListener("click", async () => {
  const payload = {
    title: "刘浩源｜平面设计师简历",
    text: "平面设计师 / 视觉传播 / 电商与新媒体视觉",
    url: window.location.href,
  };
  try {
    if (navigator.share) {
      await navigator.share(payload);
      return;
    }
    await navigator.clipboard.writeText(payload.url);
    toast.textContent = "网址已复制";
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 1800);
  } catch (error) {
    if (error?.name !== "AbortError") {
      window.prompt("复制下面的网址：", payload.url);
    }
  }
});
