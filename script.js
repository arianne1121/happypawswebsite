// =========================================================
// Happy Paws Veterinary Clinic — Interactivity
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Mobile menu toggle ----------
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");

  const closeMenu = () => {
    navLinks.classList.remove("open");
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.classList.toggle("open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
  });
  navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  // ---------- Navbar shadow + back-to-top button ----------
  const navbar = document.getElementById("navbar");
  const toTop = document.getElementById("toTop");
  const onScroll = () => {
    navbar.classList.toggle("scrolled", window.scrollY > 150);
    toTop.classList.toggle("show", window.scrollY > 600);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  // ---------- Highlight the nav link for the section in view ----------
  const sectionLinks = [...navLinks.querySelectorAll('a[href^="#"]')];
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        sectionLinks.forEach((a) =>
          a.classList.toggle("active", a.getAttribute("href") === `#${entry.target.id}`)
        );
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  sectionLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean)
    .forEach((s) => sectionObserver.observe(s));

  // ---------- Fade-in on scroll ----------
  const revealTargets = document.querySelectorAll(
    ".intro-inner, .promo, .service, .vet-card, .section-head, .contact-intro, .appt-form, .newsletter, .partners"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));
  const revealObserver = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealTargets.forEach((el) => revealObserver.observe(el));

  // ---------- Reusable slider helper ----------
  // Builds dots, wires prev/next buttons, and auto-advances (pauses on hover).
  function makeSlider({ count, show, dotsWrap, dotClass, prevBtn, nextBtn, hoverEl, interval, label }) {
    let current = 0;
    let timer;

    const dots = [...Array(count)].map((_, i) => {
      const dot = document.createElement("button");
      if (dotClass) dot.className = dotClass;
      dot.setAttribute("aria-label", `Show ${label} ${i + 1}`);
      dot.addEventListener("click", () => { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
      return dot;
    });

    function goTo(index) {
      current = (index + count) % count;
      show(current);
      dots.forEach((d, i) => d.classList.toggle("active", i === current));
    }
    function restart() {
      clearInterval(timer);
      if (!reduceMotion) timer = setInterval(() => goTo(current + 1), interval);
    }

    prevBtn.addEventListener("click", () => { goTo(current - 1); restart(); });
    nextBtn.addEventListener("click", () => { goTo(current + 1); restart(); });
    hoverEl.addEventListener("mouseenter", () => clearInterval(timer));
    hoverEl.addEventListener("mouseleave", restart);

    goTo(0);
    restart();
  }

  // Hero slider (cross-fade)
  const heroSlides = document.querySelectorAll(".hero-slide");
  makeSlider({
    count: heroSlides.length,
    show: (i) => heroSlides.forEach((s, j) => s.classList.toggle("active", i === j)),
    dotsWrap: document.getElementById("heroDots"),
    prevBtn: document.getElementById("heroPrev"),
    nextBtn: document.getElementById("heroNext"),
    hoverEl: document.querySelector(".hero"),
    interval: 6000,
    label: "slide",
  });

  // Testimonials slider (slide)
  const slides = document.getElementById("slides");
  makeSlider({
    count: slides.children.length,
    show: (i) => { slides.style.transform = `translateX(-${i * 100}%)`; },
    dotsWrap: document.getElementById("dots"),
    dotClass: "dot",
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    hoverEl: document.getElementById("slider"),
    interval: 7000,
    label: "testimonial",
  });

  // ---------- Highlight today's hours ----------
  const today = new Date().getDay(); // 0 = Sunday
  document.querySelector(`#hoursList li[data-day="${today}"]`)?.classList.add("today");

  // ---------- Newsletter forms (mockup only: nothing is sent) ----------
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  document.querySelectorAll(".js-subscribe").forEach((form) => {
    const msg = form.parentElement.querySelector(".subscribe-msg");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input");
      if (!emailPattern.test(input.value)) {
        msg.textContent = "Please enter a valid email address.";
        input.focus();
        return;
      }
      msg.textContent = "🎉 Thanks for subscribing!";
      form.reset();
    });
  });

  // ---------- Appointment form ----------
  const form = document.getElementById("apptForm");
  const success = document.getElementById("formSuccess");
  const dateInput = document.getElementById("date");

  // Don't allow picking a date in the past
  const todayISO = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];
  dateInput.min = todayISO;

  const validators = {
    ownerName: (v) => (v.trim() ? "" : "Please enter your name."),
    petName: (v) => (v.trim() ? "" : "Please enter your pet's name."),
    email: (v) => (emailPattern.test(v) ? "" : "Please enter a valid email."),
    phone: (v) => (v.replace(/\D/g, "").length >= 10 ? "" : "Please enter a valid phone number."),
    service: (v) => (v ? "" : "Please choose a service."),
    date: (v) => (!v ? "Please pick a date." : v < todayISO ? "Please choose a future date." : ""),
  };

  function validateField(name) {
    const input = form.elements[name];
    const message = validators[name](input.value);
    const field = input.closest(".field");
    field.classList.toggle("invalid", Boolean(message));
    field.querySelector(".error").textContent = message;
    return !message;
  }

  // Re-check a field as soon as the user fixes it
  Object.keys(validators).forEach((name) => {
    form.elements[name].addEventListener("input", () => {
      if (form.elements[name].closest(".field").classList.contains("invalid")) validateField(name);
    });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const allValid = Object.keys(validators).map(validateField).every(Boolean);
    if (!allValid) {
      success.hidden = true;
      form.querySelector(".field.invalid input, .field.invalid select")?.focus();
      return;
    }
    // Mockup only: no data is sent anywhere.
    const owner = form.elements.ownerName.value.trim().split(" ")[0];
    const pet = form.elements.petName.value.trim();
    success.textContent = `🎉 Thanks, ${owner}! We've received your request for ${pet}. Our team will contact you within one business day to confirm.`;
    success.hidden = false;
    form.reset();
  });

  // ---------- Footer year ----------
  document.getElementById("year").textContent = new Date().getFullYear();
});
