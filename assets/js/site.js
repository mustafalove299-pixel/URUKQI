/* ================================================================
   URUKQI site behaviour shared by every page: scroll reveals, subtle
   hero parallax, the six-stage journey, challenge tabs and textarea
   counters. Progressive enhancement: without it, content stays visible.
   ================================================================ */
(function () {
  const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- scroll reveals ---------------- */

  const revealed = document.querySelectorAll("[data-reveal], .sector-tile, .svc-card, .sol-card");
  if (!reduced && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
    revealed.forEach(el => {
      el.classList.add("will-reveal");
      observer.observe(el);
    });
  }

  /* ---------------- hero parallax ---------------- */

  const layers = Array.from(document.querySelectorAll("[data-parallax]"));
  if (!reduced && layers.length && window.innerWidth > 760) {
    let ticking = false;
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      layers.forEach(layer => {
        if (y < layer.offsetHeight * 1.2) layer.style.transform = `translate3d(0, ${(y * 0.14).toFixed(1)}px, 0)`;
      });
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
  }

  /* ---------------- roving-tabindex tabs ---------------- */

  function rovingKeys(list, select) {
    list.forEach((tab, i) => tab.addEventListener("keydown", e => {
      // RTL: the visual "next" tab is on the left.
      const step = { ArrowLeft: 1, ArrowRight: -1, ArrowDown: 1, ArrowUp: -1 }[e.key];
      let next = -1;
      if (step) next = (i + step + list.length) % list.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = list.length - 1;
      if (next < 0) return;
      e.preventDefault();
      select(next);
      list[next].focus();
    }));
  }

  /* ---------------- six-stage journey ---------------- */

  document.querySelectorAll("[data-journey]").forEach(root => {
    const steps = JSON.parse(root.getAttribute("data-journey"));
    const tabs = Array.from(root.querySelectorAll(".journey-step"));
    const panel = root.querySelector(".journey-panel");
    const set = (name, value) => { root.querySelector(`[data-journey-${name}]`).textContent = value; };
    const select = i => {
      tabs.forEach((t, n) => {
        const on = n === i;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle("is-done", n < i);
      });
      panel.setAttribute("aria-labelledby", tabs[i].id);
      set("count", `المرحلة ${i + 1} من ${steps.length}`);
      set("title", steps[i].title);
      set("text", steps[i].text);
      set("gets", steps[i].gets);
    };
    tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));
    rovingKeys(tabs, select);
  });

  /* ---------------- challenge → solution tabs ---------------- */

  document.querySelectorAll("[data-tabs]").forEach(root => {
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    const panels = Array.from(root.querySelectorAll('[role="tabpanel"]'));
    const select = i => {
      tabs.forEach((t, n) => {
        t.setAttribute("aria-selected", String(n === i));
        t.tabIndex = n === i ? 0 : -1;
      });
      panels.forEach((p, n) => { p.hidden = n !== i; });
    };
    tabs.forEach((t, i) => t.addEventListener("click", () => select(i)));
    rovingKeys(tabs, select);
  });

  /* ---------------- textarea counters ---------------- */

  document.querySelectorAll("textarea[data-count]").forEach(area => {
    const out = document.getElementById(area.getAttribute("data-count"));
    if (!out) return;
    const update = () => { out.textContent = `${area.value.length}/${area.maxLength}`; };
    area.addEventListener("input", update);
    update();
    // request.js can fill the field from a chosen problem after this runs.
    setTimeout(update, 0);
  });
})();
