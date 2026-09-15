"use strict";

const navLinks = document.querySelectorAll(".nav-link");
const pages = {
  home: document.getElementById("home"),
  about: document.getElementById("about"),
  contact: document.getElementById("contact"),
};

// These are NOT an SEO signal — all three hash routes share one canonical URL,
// so search engines only ever index the title in the HTML. This is for humans:
// browser history, bookmarks and the tab strip all read document.title, and
// three identical entries there are useless when you're trying to find your way
// back to something.
const pageTitles = {
  home: "Jae.dev | Full-Stack Developer Portfolio",
  about: "About Etinosa Akenbor Jesse (Jae) | Jae.dev",
  contact: "Contact Jae — Full-Stack Developer, Benin City | Jae.dev",
};

// resetScroll defaults to false so the very first call on load leaves the
// scroll position alone — the browser is still restoring it, and a deep link
// like /#about should land where the browser put it.
function switchPage(pageId, { resetScroll = false } = {}) {
  const target = pages[pageId];
  if (!target) return; // guard against missing page id

  Object.values(pages).forEach((page) => {
    if (page) {
      page.classList.remove("active");
      page.setAttribute("aria-hidden", "true");
    }
  });

  target.classList.add("active");
  target.setAttribute("aria-hidden", "false");

  document.title = pageTitles[pageId] || pageTitles.home;

  navLinks.forEach((link) => {
    const linkPage = link.getAttribute("data-page");
    const isActive = linkPage === pageId;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  // Sections are swapped with display, not scrolled to, so the old page's
  // scroll offset would otherwise survive the switch — clicking Contact from
  // the bottom of Home dropped you 630px into Contact, past its heading.
  // "instant" rather than the default: html has scroll-behavior: smooth, and a
  // page switch should feel like a new page, not a glide. This must run before
  // refreshFadeIns(), which measures getBoundingClientRect().
  if (resetScroll) {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }

  void target.offsetHeight;

  refreshFadeIns();
}

navLinks.forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const pageId = this.getAttribute("data-page");
    if (pageId) {
      switchPage(pageId, { resetScroll: true });
      history.pushState(null, "", "#" + pageId);
    }
  });
});

window.addEventListener("hashchange", function () {
  const hash = window.location.hash.replace("#", "") || "home";
  switchPage(hash, { resetScroll: true });
});

const siteHeader = document.querySelector("header");
const scrollSentinel = document.getElementById("scroll-sentinel");

if (siteHeader && scrollSentinel) {
  const headerObserver = new IntersectionObserver(
    ([entry]) => {
      siteHeader.classList.toggle("scrolled", !entry.isIntersecting);
    },
    { threshold: 0 },
  );
  headerObserver.observe(scrollSentinel);
}

const navToggle = document.querySelector(".nav-toggle");
const navPanel = document.getElementById("nav-links");

function closeNav() {
  if (!siteHeader || !navToggle) return;
  const hadFocusInside = navPanel && navPanel.contains(document.activeElement);

  siteHeader.classList.remove("nav-open");
  navToggle.setAttribute("aria-expanded", "false");

  // The panel becomes visibility:hidden, which drops whatever was focused
  // inside it onto <body> — a keyboard user pressing Escape lost their place
  // and had to tab from the top of the document again. Hand focus back to the
  // control that opened it, which is where it came from.
  // Guarded: only when focus was actually inside, so closing the menu by
  // clicking elsewhere on the page doesn't yank focus to the hamburger.
  if (hadFocusInside) navToggle.focus();
}

if (siteHeader && navToggle) {
  navToggle.addEventListener("click", () => {
    const open = siteHeader.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach((link) => link.addEventListener("click", closeNav));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
  });

  document.addEventListener("click", (e) => {
    if (!siteHeader.contains(e.target)) closeNav();
  });

  // crossing back to the inline layout must never leave it stuck open
  window.matchMedia("(min-width: 721px)").addEventListener("change", (e) => {
    if (e.matches) closeNav();
  });
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  },
  { threshold: 0.1 },
);

function setUpFadeIn(el) {
  el.style.opacity = "0";
  el.style.transform = "translateY(12px)";
  el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
  observer.observe(el);
}

document
  .querySelectorAll(".card, .skill-list li, .exp-item, .contact-links a")
  .forEach(setUpFadeIn);

function refreshFadeIns() {
  const visibleEls = document.querySelectorAll(
    ".page.active .card, .page.active .skill-list li, .page.active .exp-item, .page.active .contact-links a",
  );
  visibleEls.forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    } else if (el.style.opacity !== "0") {
      setUpFadeIn(el);
    }
  });
}

const initialHash = window.location.hash.replace("#", "") || "home";
switchPage(initialHash);

window.switchPage = switchPage;

const contactForm = document.getElementById("contact-form");
if (contactForm) {
  const submitBtn = contactForm.querySelector(".form-submit");
  // Disabling the button alone is not enough: a submit also fires from Enter
  // inside a text field, which never touches the button. This flag is what
  // actually guarantees one request per intent.
  let sending = false;

  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    if (sending) return;
    sending = true;
    if (submitBtn) submitBtn.disabled = true;

    const form = e.target;
    const status = document.getElementById("form-status");
    const data = new FormData(form);

    status.textContent = "Sending...";

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data,
      });
      const result = await response.json();

      if (result.success) {
        status.textContent = "Thanks — I'll get back to you soon.";
        form.reset();
      } else {
        status.textContent =
          "Something went wrong. Try again or email me directly.";
      }
    } catch (error) {
      status.textContent =
        "Something went wrong. Try again or email me directly.";
    } finally {
      // finally, not the end of try: a thrown request must still release the
      // form, or one network blip locks the visitor out for good.
      sending = false;
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
