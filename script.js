"use strict";

// ----- PAGE NAVIGATION -----
const navLinks = document.querySelectorAll(".nav-link");
const pages = {
  home: document.getElementById("home"),
  about: document.getElementById("about"),
  contact: document.getElementById("contact"),
};

function switchPage(pageId) {
  const target = pages[pageId];
  if (!target) return; // guard against missing page id

  // hide all pages
  Object.values(pages).forEach((page) => {
    if (page) {
      page.classList.remove("active");
      page.setAttribute("aria-hidden", "true");
    }
  });

  // show target
  target.classList.add("active");
  target.setAttribute("aria-hidden", "false");

  // update nav
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

  // force reflow so the fade-in animation re-triggers
  void target.offsetHeight;

  // re-check fade-in elements on the newly active page
  refreshFadeIns();
}

navLinks.forEach((link) => {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    const pageId = this.getAttribute("data-page");
    if (pageId) {
      switchPage(pageId);
      history.pushState(null, "", "#" + pageId);
    }
  });
});

// handle back/forward buttons
window.addEventListener("hashchange", function () {
  const hash = window.location.hash.replace("#", "") || "home";
  switchPage(hash);
});

// ----- INTERSECTION OBSERVER (subtle fade for cards) -----
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

// initial fade-in setup for every fade element on the page
document
  .querySelectorAll(".card, .skill-list li, .exp-item, .contact-links a")
  .forEach(setUpFadeIn);

// re-run fade-in check on elements inside the currently active page
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

// ----- INITIAL LOAD -----
const initialHash = window.location.hash.replace("#", "") || "home";
switchPage(initialHash);

// expose to global for console debugging
window.switchPage = switchPage;

// Form submission handling
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async function (e) {
    e.preventDefault();
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
    }
  });
}
