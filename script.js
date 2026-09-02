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

  const businessType = document.getElementById("businessType");
  const businessProblem = document.getElementById("businessProblem");
  const findSolution = document.getElementById("findSolution");
  const solutionResult = document.getElementById("solutionResult");

  const solutions = {
    sales: ["نظام CRM ومتابعة المبيعات", "ترتيب رحلة العميل من أول تواصل إلى المتابعة والبيع."],
    customers: ["نظام متابعة العملاء", "تنظيم المتابعة واستعادة العملاء غير النشطين وفق قواعد مناسبة."],
    orders: ["نظام إدارة الطلبات", "جمع الطلبات وتنظيم مراحلها وتقليل المتابعة اليدوية."],
    inventory: ["أتمتة المخزون والتنبيهات", "تنبيهات للحالات المهمة مثل النقص أو تغير الحالة."],
    support: ["خدمة عملاء ذكية", "التعامل مع الأسئلة المتكررة وتحويل الحالات المهمة للموظف المناسب."],
    finance: ["الفواتير والتحصيل", "تنظيم الإرسال والتذكير والمتابعة وفق قواعد العمل."],
    reports: ["التقارير والبيانات", "جمع البيانات وإنشاء تقارير وتنبيهات تساعد الإدارة."],
    employees: ["أتمتة العمليات الداخلية", "تحديد المهام المتكررة وبناء مسار واضح بين الموظفين."],
    documents: ["معالجة المستندات والبيانات", "استخراج وتنظيم المعلومات المتكررة من الملفات والمرفقات."],
    marketing: ["أتمتة التسويق والمتابعة", "ربط الحملات والعملاء والمتابعة ضمن مسار منظم."],
    appointments: ["المواعيد والتذكيرات", "تنظيم المواعيد وإرسال التذكيرات والمتابعة عند الحاجة."],
    other: ["دراسة مخصصة", "أخبرنا بالمشكلة كما تحدث في الواقع وسنحدد إن كانت قابلة للتحويل إلى نظام."]
  };

  const businessLabels = {
    store: "المتاجر والتجارة", pharmacy: "الصيدليات", restaurant: "المطاعم والمقاهي",
    "small-company": "الشركات الصغيرة", "medium-company": "الشركات المتوسطة",
    enterprise: "الشركات الكبيرة والمؤسسات", factory: "المصانع والإنتاج", services: "الخدمات والمكاتب"
  };

  if (findSolution && businessType && businessProblem && solutionResult) {
    findSolution.addEventListener("click", () => {
      const type = businessType.value;
      const problem = businessProblem.value;
      if (!type || !problem) {
        solutionResult.innerHTML = "<strong>اختر نشاطك والمشكلة أولًا.</strong>";
        return;
      }
      const [name, desc] = solutions[problem] || solutions.other;
      const activity = businessLabels[type] || "نشاطك";
      solutionResult.innerHTML = `<strong>وجدنا نقطة بداية محتملة لك.</strong><br><b>${name}</b><br>${desc}<br><small>لـ${activity} · هذه نتيجة أولية وليست تشخيصًا نهائيًا.</small><br><a class="finder-contact" href="https://wa.me/9647711910777" target="_blank" rel="noopener">أريد من URUKQI دراسة هذه العملية ←</a>`;
    });
  }

  const revealElements = document.querySelectorAll(".problem-card, .solution-card, .industry, .process-card, .plan-card, .comparison-side, .provide-grid article, .why-grid article, .workflow-track > div");
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
