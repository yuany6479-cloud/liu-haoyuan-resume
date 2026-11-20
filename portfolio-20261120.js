const pageRoot = document.documentElement;
const pageBody = document.body;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

window.addEventListener("load", () => pageBody.classList.add("is-loaded"));

const storedTheme = localStorage.getItem("resume-theme");
if (storedTheme === "dark") pageRoot.dataset.theme = "dark";

function updateThemeControl() {
  const button = document.querySelector(".theme-toggle");
  const dark = pageRoot.dataset.theme === "dark";
  button.setAttribute("aria-pressed", String(dark));
  button.querySelector(".theme-toggle__label").textContent = dark ? "DARK" : "LIGHT";
}

document.querySelector(".theme-toggle")?.addEventListener("click", () => {
  pageRoot.dataset.theme = pageRoot.dataset.theme === "dark" ? "light" : "dark";
  localStorage.setItem("resume-theme", pageRoot.dataset.theme);
  updateThemeControl();
});
updateThemeControl();

const progressBar = document.querySelector(".scroll-progress span");
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.transform = `scaleX(${max > 0 ? Math.min(1, window.scrollY / max) : 0})`;
}
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

document.querySelector(".back-to-top")?.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      revealObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
);
document.querySelectorAll("[data-reveal]").forEach((element) => revealObserver.observe(element));

function makeCard(galleryName, item, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "gallery-card";
  button.dataset.category = item.category;
  button.dataset.index = String(index);
  button.setAttribute("aria-label", `打开第 ${item.page} 页：${item.title}`);
  button.innerHTML = `
    <span class="gallery-card-image">
      <img src="${item.src}" alt="${item.title}" loading="lazy">
      <i>VIEW ↗</i>
    </span>
    <span class="gallery-card-meta">
      <strong>${item.title}</strong>
      <span>${String(item.page).padStart(2, "0")} / ${String(window.RESUME_PORTFOLIO[galleryName].pages.length).padStart(2, "0")}</span>
    </span>
  `;
  button.addEventListener("click", () => openLightbox(galleryName, index));
  return button;
}

function renderGallery(galleryName) {
  const grid = document.getElementById(`${galleryName}-grid`);
  const data = window.RESUME_PORTFOLIO[galleryName];
  grid.replaceChildren(...data.pages.map((item, index) => makeCard(galleryName, item, index)));
}

renderGallery("visual");
renderGallery("environment");
renderGallery("deepening");

document.querySelectorAll("[data-gallery-group]").forEach((section) => {
  const galleryName = section.dataset.galleryGroup;
  const cards = [...section.querySelectorAll(".gallery-card")];
  section.querySelectorAll(".gallery-filters button").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      section.querySelectorAll(".gallery-filters button").forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });
      cards.forEach((card) => {
        card.hidden = filter !== "all" && card.dataset.category !== filter;
      });
    });
  });
});

const lightbox = document.querySelector(".lightbox");
const lightboxImage = lightbox.querySelector(".lightbox-image");
const lightboxTitle = lightbox.querySelector(".lightbox-title");
const lightboxCount = lightbox.querySelector(".lightbox-count");
const lightboxDownload = lightbox.querySelector(".lightbox-download");
let activeGallery = "visual";
let activeIndex = 0;
let pointerStartX = null;

function paintLightbox() {
  const data = window.RESUME_PORTFOLIO[activeGallery];
  const item = data.pages[activeIndex];
  lightboxImage.src = item.src;
  lightboxImage.alt = item.title;
  lightboxTitle.textContent = item.title;
  lightboxCount.textContent = `${String(item.page).padStart(2, "0")} / ${String(data.pages.length).padStart(2, "0")}`;
  lightboxDownload.href = data.pdf;
}

function openLightbox(galleryName, index) {
  activeGallery = galleryName;
  activeIndex = index;
  paintLightbox();
  lightbox.classList.add("is-open");
  pageBody.classList.add("lightbox-open");
  lightbox.querySelector(".lightbox-close").focus();
}

function closeLightbox() {
  lightbox.classList.remove("is-open");
  pageBody.classList.remove("lightbox-open");
}

function stepLightbox(direction) {
  const pages = window.RESUME_PORTFOLIO[activeGallery].pages;
  activeIndex = (activeIndex + direction + pages.length) % pages.length;
  paintLightbox();
}

document.querySelectorAll(".gallery-trigger").forEach((button) => {
  button.addEventListener("click", () => {
    openLightbox(button.dataset.gallery, Number(button.dataset.index));
  });
});

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.querySelector(".lightbox-prev").addEventListener("click", () => stepLightbox(-1));
lightbox.querySelector(".lightbox-next").addEventListener("click", () => stepLightbox(1));
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});
lightboxImage.addEventListener("pointerdown", (event) => {
  pointerStartX = event.clientX;
});
lightboxImage.addEventListener("pointerup", (event) => {
  if (pointerStartX == null) return;
  const distance = event.clientX - pointerStartX;
  pointerStartX = null;
  if (Math.abs(distance) > 50) stepLightbox(distance > 0 ? -1 : 1);
});

document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("is-open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") stepLightbox(-1);
  if (event.key === "ArrowRight") stepLightbox(1);
});
