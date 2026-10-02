document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("header");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileNav = document.getElementById("mobileNav");

  window.addEventListener("scroll", () => {
    if (header) header.classList.toggle("scrolled", window.scrollY > 40);
  }, { passive: true });

  if (mobileMenu && mobileNav) {
    mobileMenu.addEventListener("click", () => {
      const isOpen = mobileNav.classList.toggle("open");
      mobileMenu.setAttribute("aria-expanded", String(isOpen));
    });
    mobileNav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => {
      mobileNav.classList.remove("open");
      mobileMenu.setAttribute("aria-expanded", "false");
    }));
  }

  // Desktop dropdowns (الحلول / القطاعات): open on hover via CSS, and on click/keyboard here.
  const navGroups = Array.from(document.querySelectorAll(".nav-group"));
  const closeGroup = group => {
    group.classList.remove("open");
    const trigger = group.querySelector(".nav-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  };
  navGroups.forEach(group => {
    const trigger = group.querySelector(".nav-trigger");
    if (!trigger) return;
    trigger.addEventListener("click", () => {
      const open = !group.classList.contains("open");
      navGroups.forEach(closeGroup);
      group.classList.toggle("open", open);
      trigger.setAttribute("aria-expanded", String(open));
    });
    group.addEventListener("keydown", event => {
      if (event.key === "Escape") { closeGroup(group); trigger.focus(); }
    });
    group.addEventListener("focusout", event => {
      if (!group.contains(event.relatedTarget)) closeGroup(group);
    });
    group.querySelectorAll("a").forEach(link => link.addEventListener("click", () => closeGroup(group)));
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".nav-group")) navGroups.forEach(closeGroup);
  });

  const revealElements = document.querySelectorAll(".problem-card, .solution-card, .industry, .process-card, .plan-card, .comparison-side, .provide-grid article, .why-grid article, .workflow-track > div, .category-card");
  revealElements.forEach(el => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add("visible"); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add("visible"));
  }

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", event => {
      const id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
});
