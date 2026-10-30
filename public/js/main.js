function onReady(fn) {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    setTimeout(fn, 10);
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}
/* 
    1 ==> Menu Icon
    2 ==> Menu
    3 ==> Client Logo Slider
    4 ==> Pricing Table
    5 ==> Accordion
    6 ==> Number Counter Up
    7 ==> Isotop
    8 ==> Home V2 Testimonial Sider
    9 ==> Footer Menu
    10 ==> Deomo Marque Slider
    11 ==> Scroll To Top Button + Scroll Progress
    12 ==> Sticky Header
    13 ==> Preloadr
    14 ==> Lenis smooth scrolling
*/

// Menu Icon
onReady(function () {
  document.querySelectorAll(".main-menu ul li").forEach(function (listItem) {
    const subMenu = listItem.querySelector(".sub-menu, .mega-menu");
    if (subMenu) {
      const anchor = listItem.querySelector("button");
      if (anchor) {
        const svgIcon = `
                    <svg class="fill-current" width="12" height="7" viewBox="0 0 12 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.264139 0.267679C0.433317 0.0962844 0.662742 0 0.901961 0C1.14118 0 1.37061 0.0962844 1.53978 0.267679L6.00545 4.7932L10.4711 0.267679C10.6413 0.101142 10.8691 0.00899045 11.1057 0.0110735C11.3422 0.0131565 11.5685 0.109307 11.7358 0.278816C11.903 0.448325 11.9979 0.677629 12 0.917342C12.002 1.15705 11.9111 1.388 11.7468 1.56042L6.64327 6.73232C6.47409 6.90372 6.24467 7 6.00545 7C5.76623 7 5.5368 6.90372 5.36762 6.73232L0.264139 1.56042C0.0950107 1.38898 0 1.15648 0 0.914052C0 0.671626 0.0950107 0.439126 0.264139 0.267679Z"/>
                    </svg>`;
        anchor.insertAdjacentHTML("beforeend", svgIcon);
      }
    }
  });
});

// Menu
function menuToggle() {
  const menuToggleBtn = document.querySelector(".menuToggle");
  const mainMenu = document.querySelector(".main-menu");
  if (!(menuToggleBtn && mainMenu)) return;

  // ---------------------------
  // Mega-menu inner dropdowns
  // ---------------------------
  function enhanceMegaMenu(mainMenuEl) {
    const megaContainers = mainMenuEl.querySelectorAll(".mega-menu");

    megaContainers.forEach((mega) => {
      // Prevent parent <li> delegation from firing for clicks inside mega
      mega.addEventListener("click", (e) => e.stopPropagation(), {
        passive: true,
      });

      const items = mega.querySelectorAll(".megamenu-item");

      items.forEach((item) => {
        const btn = item.querySelector(".megamenu-item-toogle");
        const list = item.querySelector(".mega-menu-list");
        if (!btn || !list) return;

        // Initial state for smooth accordion
        list.style.overflow = "hidden";
        if (!item.classList.contains("active")) {
          list.style.display = "none";
          list.style.height = "0";
        }

        btn.addEventListener(
          "click",
          (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isActive = item.classList.contains("active");

            // Close siblings within the same mega container (accordion behavior)
            items.forEach((sib) => {
              if (sib === item) return;
              sib.classList.remove("active");
              const sibList = sib.querySelector(".mega-menu-list");
              if (sibList) {
                sibList.style.height = sibList.scrollHeight + "px";
                void sibList.getBoundingClientRect(); // force reflow
                sibList.style.height = "0";
                setTimeout(() => {
                  sibList.style.display = "none";
                }, 300);
              }
            });

            // Toggle current
            if (!isActive) {
              item.classList.add("active");
              list.style.display = "block";
              const h = list.scrollHeight + "px";
              list.style.height = "0";
              requestAnimationFrame(() => {
                list.style.height = h;
              });
              setTimeout(() => {
                list.style.height = "";
              }, 300);
            } else {
              item.classList.remove("active");
              list.style.height = list.scrollHeight + "px";
              void list.getBoundingClientRect();
              list.style.height = "0";
              setTimeout(() => {
                list.style.display = "none";
              }, 300);
            }
          },
          { passive: false },
        );
      });
    });
  }

  // ---------------------------
  // Hamburger toggle (open/close main menu)
  // ---------------------------
  menuToggleBtn.addEventListener("click", () => {
    menuToggleBtn.classList.toggle("is-active");
    mainMenu.classList.toggle("menu-active");
    document.body.classList.toggle("menu-overlay");

    // Reset ALL submenus (top-level + mega siblings)
    mainMenu.querySelectorAll("li").forEach((li) => {
      li.classList.remove("active");
      const subMenus = li.querySelectorAll(".sub-menu, .mega-menu");
      subMenus.forEach((sub) => {
        sub.style.height = "0";
        setTimeout(() => (sub.style.display = "none"), 300);
      });
    });
  });

  // ---------------------------
  // Top-level submenu delegation (excludes clicks inside .mega-menu)
  // ---------------------------
  mainMenu.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    // Ignore if click happens inside a mega-menu; that is handled by enhanceMegaMenu()
    if (li.closest(".mega-menu")) return;

    // Does this li have a standard dropdown?
    if (li.querySelector(".sub-menu, .mega-menu")) {
      const subMenu = li.querySelector(".sub-menu, .mega-menu");
      if (!subMenu) return;

      // Toggle current li
      if (!li.classList.contains("active")) {
        li.classList.add("active");
        subMenu.style.display = "block";
        const height = subMenu.scrollHeight + "px";
        subMenu.style.height = "0";
        setTimeout(() => (subMenu.style.height = height), 10);
        setTimeout(() => (subMenu.style.height = ""), 300);
      } else {
        li.classList.remove("active");
        subMenu.style.height = subMenu.scrollHeight + "px";
        setTimeout(() => (subMenu.style.height = "0"), 10);
        setTimeout(() => (subMenu.style.display = "none"), 300);
      }

      // Close other siblings (top-level only)
      const siblings = li.parentElement?.querySelectorAll(":scope > li") || [];
      siblings.forEach((item) => {
        if (item === li) return;
        item.classList.remove("active");
        const otherSubMenus = item.querySelectorAll(
          ":scope > .sub-menu, :scope > .mega-menu",
        );
        otherSubMenus.forEach((sub) => {
          sub.style.height = "0";
          setTimeout(() => (sub.style.display = "none"), 300);
        });
      });
    }
  });

  // ---------------------------
  // Close menu on outside click
  // ---------------------------
  document.addEventListener("click", (e) => {
    const clickedInsideMenu = mainMenu.contains(e.target);
    const clickedToggle = menuToggleBtn.contains(e.target);
    if (clickedInsideMenu || clickedToggle) return;

    menuToggleBtn.classList.remove("is-active");
    mainMenu.classList.remove("menu-active");
    document.body.classList.remove("menu-overlay");

    // Reset everything
    mainMenu.querySelectorAll("li").forEach((li) => {
      li.classList.remove("active");
      const subMenus = li.querySelectorAll(".sub-menu, .mega-menu");
      subMenus.forEach((sub) => {
        sub.style.height = "0";
        setTimeout(() => (sub.style.display = "none"), 300);
      });
    });
  });

  enhanceMegaMenu(mainMenu);
}
menuToggle();

// Client Logo Slider
function initLogoSlider(selector, options = {}) {
  const defaults = {
    spaceBetween: 50,
    centeredSlides: true,
    speed: 2000,
    slidesPerView: "auto",
    loop: true,
    allowTouchMove: false,
    observer: true,
    observeParents: true,
    autoplay: {
      delay: 1,
      disableOnInteraction: false,
      pauseOnMouseEnter: false,
    },
  };

  const cfg = Object.assign({}, defaults, options);
  const swiper = new Swiper(selector, cfg);

  // lightweight debounce
  const debounce = (fn, wait = 120) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), wait);
    };
  };

  const restart = () => {
    try {
      swiper.update?.();
      swiper.loopFix?.();
      if (swiper.autoplay) {
        swiper.autoplay.stop?.();
        swiper.autoplay.start?.();
      }
    } catch (e) {}
  };

  const safeRestart = debounce(restart, 120);

  window.addEventListener("resize", safeRestart);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") restart();
  });
  setTimeout(restart, 50);
  return swiper;
}
const logoSlider = initLogoSlider(".logo-auto-slider");

// Pricing Table (controlled by React state in pricing.tsx)

onReady(() => {
  const e = document.getElementById("priceToggle2");
  if (!e) return;
  const t = document.querySelectorAll(".price2");
  const s = document.querySelectorAll(".period2");
  const o = ["Free", "$49", "$99"];
  const l = ["Free", "$490", "$990"];

  e.addEventListener("change", () => {
    const i = e.checked;
    t.forEach((el, idx) => {
      el.textContent = i ? l[idx] : o[idx];
    });
    s.forEach((el) => {
      el.textContent = i ? "/year" : "/mo";
    });
  });
});

// Accordion
const faqHeads = document.querySelectorAll(".faq-head");
faqHeads.forEach((faqHead) => {
  faqHead.addEventListener("click", function () {
    const parent = this.parentElement;
    const faqBody = parent.querySelector(".faq-body");

    document.querySelectorAll(".faq-wrapper .single-faq").forEach((faq) => {
      if (faq !== parent) {
        faq.classList.remove("active");
        const body = faq.querySelector(".faq-body");
        if (body) {
          body.style.height = body.scrollHeight + "px";
          setTimeout(() => {
            body.style.height = "0";
          }, 10);
          setTimeout(() => (body.style.display = "none"), 300);
        }
      }
    });

    if (parent.classList.contains("active")) {
      parent.classList.remove("active");
      faqBody.style.height = faqBody.scrollHeight + "px";
      setTimeout(() => {
        faqBody.style.height = "0";
      }, 10);
      setTimeout(() => (faqBody.style.display = "none"), 300);
    } else {
      parent.classList.add("active");
      faqBody.style.display = "block";
      const height = faqBody.scrollHeight + "px";
      faqBody.style.height = "0";
      setTimeout(() => {
        faqBody.style.height = height;
      }, 10);
      setTimeout(() => (faqBody.style.height = ""), 300);
    }
  });
});

// Number Counter Up
function initCounterUp(
  selector = ".counter",
  threshold = 0.5,
  duration = 1000,
) {
  const counters = document.querySelectorAll(selector);

  const startCounting = (counter) => {
    const target = +counter.getAttribute("data-target");
    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = Math.floor(progress * target);
      counter.innerText = value.toLocaleString();

      if (progress < 1) requestAnimationFrame(update);
    };

    requestAnimationFrame(update);
  };

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          startCounting(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold },
  );

  counters.forEach((counter) => observer.observe(counter));
}
onReady(() => {
  initCounterUp(".counter", 0.5, 1500);
});

// Isotop + GSAP Animation
(function () {
  const grid = document.getElementById("integration-grid");
  if (!grid) return;

  const items = Array.from(grid.querySelectorAll(".integration-card"));
  const filters = document.getElementById("filters");

  function matches(el, cat) {
    if (cat === "*") return true;
    const cats = (el.getAttribute("data-cat") || "").trim().split(/\s+/);
    return cats.includes(cat);
  }

  function applyFilter(cat) {
    let i = 0;

    items.forEach((el) => {
      if (matches(el, cat)) {
        el.style.display = "block";

        gsap.fromTo(
          el,
          { y: 40, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: "power2.out",
            delay: i * 0.05,
          },
        );

        i++;
      } else {
        el.style.display = "none";
        gsap.killTweensOf(el);
      }
    });
  }

  if (filters) {
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-filter]");
      if (!btn) return;

      filters
        .querySelectorAll(".integration-button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      applyFilter(btn.dataset.filter);
    });
  }

  applyFilter("*");
})();

// Home V2 Testimonial Sider
new Swiper(".testimonial-slider", {
  loop: true,
  speed: 1000,
  autoplay: {
    delay: 2000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },
  slidesPerView: 3,
  paginationClickable: true,
  spaceBetween: 20,
  autoHeight: true,
  breakpoints: {
    1920: {
      slidesPerView: 3,
    },
    1028: {
      slidesPerView: 2,
    },
    640: {
      slidesPerView: 1,
    },
  },
  navigation: {
    nextEl: ".tmnl-slider-next",
    prevEl: ".tmnl-slider-prev",
  },
});

// Footer Menu
onReady(function () {
  const menuToggles = document.querySelectorAll(".footer-menu-toggle");
  const menuLists = document.querySelectorAll(".footer-menu-list");

  function isMobile() {
    return window.matchMedia("(max-width: 640px)").matches;
  }

  menuToggles.forEach((menuToggle, index) => {
    menuToggle.addEventListener("click", function () {
      if (!isMobile()) return;

      const correspondingMenuList = menuLists[index];

      menuToggle.classList.toggle("active");
      correspondingMenuList.classList.toggle("active");

      menuToggles.forEach((otherMenuToggle, otherIndex) => {
        if (otherIndex !== index) {
          otherMenuToggle.classList.remove("active");
          menuLists[otherIndex].classList.remove("active");
        }
      });
    });
  });

  window.addEventListener("resize", function () {
    if (!isMobile()) {
      menuToggles.forEach((btn) => btn.classList.remove("active"));
      menuLists.forEach((list) => list.classList.remove("active"));
    }
  });
});

// Deomo Marque Slider
const marqueeSliderEl = document.querySelector(".marquee-slider");
if (marqueeSliderEl) {
  const marqueeSwiper = new Swiper(".marquee-slider", {
    slidesPerView: "auto",
    spaceBetween: 0,
    loop: true,
    freeMode: true,
    freeModeMomentum: false,
    animationSpeed: 1000,
    speed: 4000,
    allowTouchMove: true,
    grabCursor: true,
    autoplay: {
      delay: 0,
      disableOnInteraction: false,
      pauseOnMouseEnter: true,
    },
  });

  // marqueeSwiper.el.addEventListener("mouseenter", () => {
  //   marqueeSwiper.autoplay.stop();
  //   marqueeSwiper.setTranslate(marqueeSwiper.getTranslate());
  // });

  // marqueeSwiper.el.addEventListener("mouseleave", () => {
  //   marqueeSwiper.autoplay.start();
  // });
}

// Scroll To Top Button + Scroll Progress
function scrollToTop() {
  const progress = document.getElementById("progress");
  const scrollProgress = document.querySelector(".progress");
  if (!progress || !scrollProgress) return;
  const targetElement = document.documentElement;

  progress.addEventListener("click", () => {
    if (typeof ScrollSmoother !== "undefined" && ScrollSmoother.get()) {
      ScrollSmoother.get().scrollTo(0, true);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });
  window.addEventListener("scroll", () => {
    const scrollTop = window.scrollY;
    const scrollHeight = targetElement.scrollHeight - window.innerHeight;
    const scrollValue = Math.round((scrollTop * 100) / scrollHeight);

    if (scrollTop > 100) {
      scrollProgress.classList.add("setvissible");
      scrollProgress.style.background = `conic-gradient(#ea580c ${scrollValue}% , #27272a ${scrollValue}%)`;
    } else {
      scrollProgress.classList.remove("setvissible");
      scrollProgress.style.background = `conic-gradient(#ea580c 0%, #27272a 0%)`;
    }
  });
}
scrollToTop();
function raf(time) {
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

let smoother = null;
if (typeof ScrollSmoother !== "undefined" && !ScrollSmoother.get()) {
  smoother = ScrollSmoother.create({
    wrapper: "#smooth-wrapper",
    content: "#smooth-content",
    smooth: 2,
    effects: true,
    smoothTouch: 0.8,
  });
}

function initAnimations() {
  /**
   * ALL EXISTING ANIMATION CODES GO HERE
   * 1.1-> animation Global variable
   * 1.2-> sticky card
   * 1.3-> Reuseable Heading animation script  
   * 1.4-> Multiple glass card section  
   * 1.5-> Newsletter glass card section  
   * 2.1-> Demo Animation Script  
   * 2.2-> Choose US animation script  
   * 3.1-> home version one Hero animation
   * 3.2-> home version one Team animation
   * 3.3-> home version one Team animation
   * 3.4-> home version one App animation
   * 4.1-> home version Two Hero animation
   * 4.1-> home version Two review animation
   * 4.2-> home version one Hero animation
   * 4.3-> home version Two Testimonial animation
   * etc...
   */
  //----------------------------------------------
  //1.1=>animation Global variable
  //----------------------------------------------
  const sharedFrom = { y: 60, opacity: 0, filter: "blur(16px)" };
  const sharedTo = {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    duration: 0.8,
    ease: "power3.out",
  };
  //----------------------------------------------
  //1.2=>sticky card animation start here
  //----------------------------------------------
  let mm = gsap.matchMedia();

  mm.add("(min-width: 767px)", () => {
    const cards = gsap.utils.toArray(".sticky-card");
    const offset = 70;

    cards.forEach((card, index) => {
      // ✅ If index is 0 or 1 → no offset
      const startOffset = index < 2 ? 80 : 80 + (index - 1) * offset;
      gsap.to(card, {
        scrollTrigger: {
          trigger: card,
          start: `top top+=${startOffset}`,
          endTrigger: ".process-end",
          end: "top top+=300",
          pin: true,
          pinSpacing: false,
          scrub: true,
        },
      });
    });
  });

  //----------------------------------------------
  //1.3=>Reuseable Heading animation script
  //----------------------------------------------
  const demoHeading = document.querySelectorAll("[data-section-title]");

  if (demoHeading.length) {
    demoHeading.forEach((section) => {
      const subtitle = section.querySelector("[data-subtitle]");
      const title = section.querySelector("[data-title]");
      const excerpt = section.querySelector("[data-excerpt]");

      const tl = gsap.timeline({ paused: true });

      if (subtitle) {
        tl.fromTo(
          subtitle,
          { ...sharedFrom, scale: 0.8 },
          { ...sharedTo, scale: 1 },
          0,
        );
      }

      if (title) {
        tl.fromTo(title, sharedFrom, { ...sharedTo }, "-=0.6");
      }

      if (excerpt) {
        tl.fromTo(excerpt, sharedFrom, { ...sharedTo }, "-=0.6");
      }

      // ScrollTrigger attached separately to timeline
      ScrollTrigger.create({
        trigger: section,
        start: "top 80%",
        end: "top 40%",
        animation: tl,
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
        // markers: true,
      });
    });

    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  //1.4=> Multiple glass card section
  //----------------------------------------------
  const sttrWrapper = document.querySelectorAll("[data-sttr-wrapper]");
  if (sttrWrapper.length) {
    sttrWrapper.forEach((sttrWrapper) => {
      const sttrCards = sttrWrapper.querySelectorAll("[data-sttr-card]");
      const tl = gsap.timeline({ paused: true });
      if (sttrCards) {
        sttrCards.forEach((sttrCard) => {
          tl.fromTo(
            sttrCard,
            { y: 100, opacity: 0, filter: "blur(16px)" },
            {
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
              ease: "power3.out",
              duration: 0.6,
              stagger: 0.04,
            },
            "-=0.4",
          );
        });
      }
      // ScrollTrigger attached separately to timeline
      ScrollTrigger.create({
        trigger: sttrWrapper,
        start: "top 80%",
        end: "top 40%",
        animation: tl,
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
        //markers: true,
      });
      // In case layout shifts (fonts/images load), refresh triggers
      ScrollTrigger.refresh();
    });
  }
  //----------------------------------------------
  //1.5=> Newsletter glass card section
  //----------------------------------------------
  const newsletterWrapper = document.querySelectorAll(
    "[data-newsletter-wrapper]",
  );
  if (newsletterWrapper.length) {
    newsletterWrapper.forEach((sttrWrapper) => {
      const title = sttrWrapper.querySelector("[data-news-title]");
      const excerpt = sttrWrapper.querySelector("[data-news-excerpt]");
      const button = sttrWrapper.querySelector("[data-news-button]");
      const video = sttrWrapper.querySelector("[data-news-video]");
      const tl = gsap.timeline({ paused: true });
      if (sttrWrapper) {
        tl.fromTo(
          sttrWrapper,
          { y: 100, opacity: 0, filter: "blur(16px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            ease: "power3.out",
            duration: 0.6,
          },
          0,
        );
      }
      if (video) {
        tl.fromTo(
          video,
          { x: 100, opacity: 0, filter: "blur(16px)" },
          {
            x: 0,
            opacity: 1,
            filter: "blur(0px)",
            ease: "power3.out",
            duration: 0.8,
          },
          "-=0.6",
        );
      }
      if (title) {
        tl.fromTo(title, sharedFrom, { ...sharedTo }, "-=0.6");
      }

      if (excerpt) {
        tl.fromTo(excerpt, sharedFrom, { ...sharedTo }, "-=0.6");
      }
      if (button) {
        tl.fromTo(button, { ...sharedFrom }, { ...sharedTo }, "-=0.6");
      }
      // ScrollTrigger attached separately to timeline
      ScrollTrigger.create({
        trigger: sttrWrapper,
        start: "top 80%",
        end: "top 40%",
        animation: tl,
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
        //markers: true,
      });
      // In case layout shifts (fonts/images load), refresh triggers
      ScrollTrigger.refresh();
    });
  }
  //----------------------------------------------
  //2.1=> Demo Animation Script
  //----------------------------------------------
  const demoHero = document.querySelector(".demo-banner");

  if (demoHero) {
    const header = document.querySelector(".header-wrapper");
    const title = demoHero.querySelector("h1");
    const excerpt = demoHero.querySelector("p");
    const sttrCard = demoHero.querySelectorAll(".sttr-card");
    const marquee = demoHero.querySelectorAll("[data-slider-animi]");

    const tl = gsap.timeline({ paused: true });

    if (title) {
      tl.fromTo(title, sharedFrom, { ...sharedTo }, 0);
    }

    if (excerpt) {
      tl.fromTo(excerpt, sharedFrom, { ...sharedTo }, "-=0.6");
    }
    if (sttrCard) {
      sttrCard.forEach((sttrCard) => {
        tl.fromTo(
          sttrCard,
          sharedFrom,
          {
            ...sharedTo,
            stagger: 0.05,
          },
          "-=0.6",
        );
      });
    }
    if (header) {
      tl.fromTo(
        header,
        { y: -100, opacity: 0, filter: "blur(16px)" },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          filter: "blur(0px)",
          ease: "power3.out",
        },
        "-=0.8",
      );
    }
    if (marquee) {
      tl.fromTo(
        marquee,
        {
          y: 100,
          scale: 0.85,
          origin: "top",
          opacity: 0,
          filter: "blur(16px)",
        },
        {
          y: 0,
          scale: 1,
          opacity: 1,
          duration: 1.2,
          filter: "blur(0px)",
          ease: "power3.out",
        },
        "-=0.8",
      );
    }
    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: demoHero,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      // markers: true,
    });
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  //2.2=> Choose US animation script
  //----------------------------------------------
  const chooseUs = document.querySelector(".choose-us");

  if (chooseUs) {
    const ChooseSttrCards = chooseUs.querySelectorAll(".c-sttr-card");

    const tl = gsap.timeline({ paused: true });
    if (ChooseSttrCards) {
      ChooseSttrCards.forEach((sttrCard) => {
        tl.fromTo(
          sttrCard,
          { y: 100, opacity: 0, filter: "blur(16px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            ease: "power3.out",
            duration: 0.6,
            stagger: 0.03,
          },
          "-=0.3",
        );
      });
    }
    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: chooseUs,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      //markers: true,
    });
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  //3.1=>home version one Hero animation
  //----------------------------------------------
  const homeV1Hero = document.querySelector("[data-hero-section]");

  if (homeV1Hero) {
    const header = document.querySelector(".header-wrapper");
    const bgShape = homeV1Hero.querySelector("[data-bg-shape]");
    const subtitle = homeV1Hero.querySelector("[data-subtitle]");
    const title = homeV1Hero.querySelector("[data-title]");
    const excerpt = homeV1Hero.querySelector("[data-excerpt]");
    const button = homeV1Hero.querySelector("[data-button]");
    const thumbnail = homeV1Hero.querySelector("[data-thumbnail]");

    const tl = gsap.timeline({ paused: true });

    if (subtitle) {
      tl.fromTo(subtitle, sharedFrom, { ...sharedTo, delay: 0.4 }, 0);
    }
    if (title) {
      tl.fromTo(title, sharedFrom, { ...sharedTo }, "-=0.6");
    }
    if (excerpt) {
      tl.fromTo(excerpt, sharedFrom, { ...sharedTo }, "-=0.6");
    }
    if (bgShape) {
      tl.fromTo(
        bgShape,
        {
          ...sharedFrom,
          scale: 0.8,
          origin: "bottom left",
          y: 100,
        },
        {
          ...sharedTo,
          scale: 1,
          duration: 0.8,
          y: 0,
        },
        "-=0.6",
      );
    }
    if (button) {
      tl.fromTo(
        button,
        sharedFrom,
        {
          ...sharedTo,
        },
        "-=0.6",
      );
    }

    if (thumbnail) {
      tl.fromTo(
        thumbnail,
        sharedFrom,
        {
          ...sharedTo,
        },
        "-=0.6",
      );
    }
    if (header) {
      tl.fromTo(
        header,
        { y: -100, opacity: 0, filter: "blur(16px)" },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          filter: "blur(0px)",
          ease: "power3.out",
        },
        "-=0.8",
      );
    }
    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: homeV1Hero,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      //markers: true,
    });
    tl.play();
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  //3.2=> home version one Team animation
  //----------------------------------------------

  const homeV1Trail = document.querySelector(
    '[data-container="trail-section"]',
  );
  if (homeV1Trail) {
    const thumbnail = homeV1Trail.querySelector("[data-video]");
    const title = homeV1Trail.querySelector("[data-title]");
    const excerpt = homeV1Trail.querySelector("[data-excerpt]");
    const topLine = homeV1Trail.querySelector("[data-line-top]");
    const list = homeV1Trail.querySelector("[data-list]");
    const bottomLine = homeV1Trail.querySelector("[data-line-bottom]");
    const button = homeV1Trail.querySelector("[data-button]");

    const tl = gsap.timeline({ paused: true });

    const trailFrom = { y: 100, opacity: 0, filter: "blur(16px)" };
    const trailTo = {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "back",
    };
    if (title) {
      tl.fromTo(
        title,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        0,
      );
    }
    if (thumbnail) {
      tl.fromTo(
        thumbnail,
        {
          ...trailFrom,
          scale: 0.8,
          origin: "bottom left",
          y: 100,
        },
        {
          ...trailTo,
          scale: 1,
          duration: 0.8,
          y: 0,
        },
        "-=0.6",
      );
    }
    if (excerpt) {
      tl.fromTo(
        excerpt,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (topLine) {
      tl.fromTo(
        topLine,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (list) {
      tl.fromTo(
        list,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (bottomLine) {
      tl.fromTo(
        bottomLine,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (button) {
      tl.fromTo(
        button,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }

    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: homeV1Trail,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      //markers: true,
    });
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  //3.3=> home version one Team animation
  //----------------------------------------------

  const processArea = document.querySelector('[data-container="process-area"]');
  if (processArea) {
    const title = processArea.querySelector("[data-title]");
    const excerpt = processArea.querySelector("[data-excerpt]");
    const cards = processArea.querySelectorAll("[data-card]");
    const tl = gsap.timeline({ paused: true });

    const trailFrom = { x: -100, opacity: 0, filter: "blur(16px)" };
    const trailTo = {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "back",
    };
    if (title) {
      tl.fromTo(
        title,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        0,
      );
    }
    if (excerpt) {
      tl.fromTo(
        excerpt,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (cards.length) {
      cards.forEach((card) => {
        tl.fromTo(
          card,
          {
            ...sharedFrom,
          },
          {
            ...sharedTo,
          },
          "-=0.6",
        );
      });
    }

    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: processArea,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      //markers: true,
    });
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  // 3.4=> home version one App animation
  //----------------------------------------------

  const appSection = document.querySelector('[data-container="apps-section"]');
  if (appSection) {
    const title = appSection.querySelector("[data-title]");
    const excerpt = appSection.querySelector("[data-excerpt]");
    const button = appSection.querySelector("[data-button]");
    const thumbnail = appSection.querySelector("[data-thumbnail]");
    const bgShape = appSection.querySelector("[data-bg-shape]");
    const glowShape = appSection.querySelector("[data-glow-shape]");
    const tl = gsap.timeline({ paused: true });

    const trailFrom = { x: -100, opacity: 0, filter: "blur(16px)" };
    const trailTo = {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "back",
    };

    tl.fromTo(
      appSection,
      {
        y: 100,
        opacity: 0,
        filter: "blur(16px)",
      },
      {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "back",
      },
      0,
    );

    if (title) {
      tl.fromTo(
        title,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (excerpt) {
      tl.fromTo(
        excerpt,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (button) {
      tl.fromTo(
        button,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (thumbnail) {
      tl.fromTo(
        thumbnail,
        {
          x: 100,
          opacity: 0,
          filter: "blur(16px)",
          scale: 0.7,
          origin: "top right",
        },
        {
          x: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 0.8,
          ease: "back",
        },
        "-=0.6",
      );
    }
    if (bgShape) {
      tl.fromTo(
        bgShape,
        {
          y: 100,
          opacity: 0,
          filter: "blur(16px)",
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6",
      );
    }
    if (glowShape) {
      tl.fromTo(
        glowShape,
        {
          x: 100,
          opacity: 0,
          filter: "blur(16px)",
        },
        {
          x: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.6",
      );
    }

    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: appSection,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      //markers: true,
    });
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  // 4.1=> home version Two Hero animation
  //----------------------------------------------
  const h4HeroSection = document.querySelector(
    '[data-container="homeV2-hero"]',
  );
  if (h4HeroSection) {
    const header = document.querySelector(".header-wrapper");
    const subTitle = h4HeroSection.querySelector("[data-subtitle]");
    const title = h4HeroSection.querySelector("[data-title]");
    const excerpt = h4HeroSection.querySelector("[data-excerpt]");
    const button = h4HeroSection.querySelector("[data-button]");
    const listItems = h4HeroSection.querySelectorAll("[data-list] li");
    const thumbnail = h4HeroSection.querySelector("[data-thumbnail]");
    const video = h4HeroSection.querySelector("[data-video]");

    const tl = gsap.timeline({ paused: true });

    const trailFrom = { x: -100, opacity: 0, filter: "blur(16px)" };
    const trailTo = {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "back",
    };

    if (subTitle) {
      tl.fromTo(subTitle, trailFrom, { ...trailTo, delay: 0.4 }, 0);
    }
    if (title) {
      tl.fromTo(title, trailFrom, { ...trailTo }, "-=0.6");
    }
    if (excerpt) {
      tl.fromTo(excerpt, trailFrom, { ...trailTo }, "-=0.6");
    }
    if (button) {
      tl.fromTo(button, trailFrom, { ...trailTo }, "-=0.6");
    }
    if (listItems.length) {
      listItems.forEach((listItem) => {
        tl.fromTo(listItem, trailFrom, { ...trailTo, stagger: 0.05 }, "-=0.6");
      });
    }
    if (video) {
      tl.fromTo(
        video,
        {
          y: 100,
          opacity: 0,
          filter: "blur(100px)",
          scale: 0.8,
          origin: "bottom left",
        },
        {
          y: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=1",
      );
    }
    if (thumbnail) {
      tl.fromTo(
        thumbnail,
        {
          x: 100,
          opacity: 0,
          filter: "blur(16px)",
        },
        {
          x: 0,
          opacity: 1,
          filter: "blur(0px)",
          scale: 1,
          duration: 0.8,
          ease: "power3.out",
        },
        "-=0.4",
      );
    }
    if (header) {
      tl.fromTo(
        header,
        { y: -100, opacity: 0, filter: "blur(16px)" },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          filter: "blur(0px)",
          ease: "power3.out",
        },
        "-=0.8",
      );
    }
    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: h4HeroSection,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      //markers: true,
    });
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  // 4.2=> home version Two review animation
  //----------------------------------------------
  const H2review = document.querySelector('[data-container="review-section"]');
  if (H2review) {
    const thumbnail = H2review.querySelector("[data-video]");
    const title = H2review.querySelector("[data-title]");
    const excerpt = H2review.querySelector("[data-excerpt]");
    const topLine = H2review.querySelector("[data-line-top]");
    const lists = H2review.querySelectorAll("[data-lists]");
    const bottomLine = H2review.querySelector("[data-line-bottom]");
    const button = H2review.querySelector("[data-button]");

    const tl = gsap.timeline({ paused: true });

    const trailFrom = { y: 100, opacity: 0, filter: "blur(16px)" };
    const trailTo = {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "back",
    };
    if (title) {
      tl.fromTo(
        title,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        0,
      );
    }
    if (thumbnail) {
      tl.fromTo(
        thumbnail,
        {
          ...trailFrom,
          scale: 0.8,
          origin: "bottom left",
          y: 100,
        },
        {
          ...trailTo,
          scale: 1,
          duration: 0.8,
          y: 0,
        },
        "-=0.6",
      );
    }
    if (excerpt) {
      tl.fromTo(
        excerpt,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (topLine) {
      tl.fromTo(
        topLine,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (lists.length) {
      lists.forEach((list) => {
        tl.fromTo(
          list,
          {
            ...trailFrom,
          },
          {
            ...trailTo,
            stagger: 0.05,
          },
          "-=0.6",
        );
      });
    }
    if (bottomLine) {
      tl.fromTo(
        bottomLine,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (button) {
      tl.fromTo(
        button,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }

    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: H2review,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      //markers: true,
    });
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
  //----------------------------------------------
  //4.3=> home version Two Testimonial animation
  //----------------------------------------------

  const H2Testimonial = document.querySelector(
    '[data-container="testimonial-section"]',
  );
  if (H2Testimonial) {
    const subtitle = H2Testimonial.querySelector("[data-subtitle]");
    const title = H2Testimonial.querySelector("[data-title]");
    const excerpt = H2Testimonial.querySelector("[data-excerpt]");
    const review = H2Testimonial.querySelector("[data-review]");
    const Testimonial = H2Testimonial.querySelector("[data-testimonial]");
    const button = H2Testimonial.querySelector("[data-button]");

    const tl = gsap.timeline({ paused: true });

    const trailFrom = { y: 100, opacity: 0, filter: "blur(16px)" };
    const trailTo = {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "back",
    };
    if (subtitle) {
      tl.fromTo(
        subtitle,
        {
          ...trailFrom,
          scale: 0.8,
          origin: "bottom left",
        },
        {
          ...trailTo,
          scale: 1,
          duration: 0.8,
        },
        0,
      );
    }
    if (title) {
      tl.fromTo(
        title,
        {
          ...trailFrom,
          scale: 0.8,
          origin: "bottom left",
          y: 100,
        },
        {
          ...trailTo,
          scale: 1,
          duration: 0.8,
          y: 0,
        },
        "-=0.6",
      );
    }
    if (excerpt) {
      tl.fromTo(
        excerpt,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (review) {
      tl.fromTo(
        review,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (Testimonial) {
      tl.fromTo(
        Testimonial,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }
    if (button) {
      tl.fromTo(
        button,
        {
          ...trailFrom,
        },
        {
          ...trailTo,
        },
        "-=0.6",
      );
    }

    // ScrollTrigger attached separately to timeline
    ScrollTrigger.create({
      trigger: H2Testimonial,
      start: "top 80%",
      end: "top 40%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      //markers: true,
    });
    // In case layout shifts (fonts/images load), refresh triggers
    ScrollTrigger.refresh();
  }
}

onReady(() => {
  document.body.classList.remove("overflow-hidden");
  initAnimations();
});

const p = document.querySelector("#revealStroke");
if (p) {
  gsap.fromTo(
    "#revealStroke",
    { drawSVG: "0% 0%" },
    {
      drawSVG: "0% 100%",
      duration: 2,
      ease: "power2.inOut",
      repeat: -1,
      repeatDelay: 0.4,
      onRepeat: () => {
        // erase line before next loop
        gsap.set("#revealStroke", { drawSVG: "0% 0%" });
      },
    },
  );
}

onReady(() => {
  const header = document.querySelector(".header-area");
  const bodyTarget = document.querySelector(
    ".header-innerHeight .border-container",
  );

  if (!header || !bodyTarget) return;

  const updatePadding = () => {
    bodyTarget.style.paddingTop = `${header.offsetHeight}px`;
  };

  updatePadding();
  window.addEventListener("resize", updatePadding);

  let lastScrollY = window.scrollY;
  let isHidden = false;

  ScrollTrigger.create({
    onUpdate: (self) => {
      const currentScroll = self.scroll();

      // ✅ Add .scrolled class when scrollY > 0
      if (currentScroll > 0) {
        header.classList.add("sticky-header");
      } else {
        header.classList.remove("sticky-header");
      }

      // ✅ Hide on scroll down
      if (currentScroll > lastScrollY && currentScroll > header.offsetHeight) {
        if (!isHidden) {
          gsap.to(header, {
            y: -header.offsetHeight,
            duration: 0.4,
            ease: "power2.inOut",
          });
          isHidden = true;
        }
      }
      // ✅ Show on scroll up
      else if (currentScroll < lastScrollY) {
        if (isHidden) {
          gsap.to(header, {
            y: 0,
            duration: 0.4,
            ease: "power2.out",
          });
          isHidden = false;
        }
      }

      lastScrollY = currentScroll;
    },
  });

  ScrollTrigger.refresh();
});

// light box popup script
onReady(() => {
  const preview = document.getElementById("aboutVideoPreview");
  const modal = document.getElementById("videoModal");
  const closeBtn = document.getElementById("closeVideoModal");
  const modalVideo = document.getElementById("modalVideo");

  if (preview) {
    preview.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
      modalVideo.play(); // play on open
      document.body.style.overflow = "hidden"; // prevent scroll
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      modalVideo.pause();
      modalVideo.currentTime = 0;
      document.body.style.overflow = ""; // restore scroll
    });
  }

  // close on overlay click
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeBtn.click();
      }
    });
  }
});

/* ===============================
  FORM VALIDATION
  =============================== */
onReady(() => {
  /* ===============================
     CONTACT / DEMO FORM VALIDATION
  =============================== */
  const forms = document.querySelectorAll("form[action='#']");

  forms.forEach((currentForm) => {
    const btn = currentForm.querySelector("button[type='submit']");
    const btnText = btn?.querySelector(".btn-text");
    const loader = btn?.querySelector(".loader");
    const message = currentForm.querySelector("#formMessage");

    if (!btn || !message) return; // skip if missing

    // Helper functions
    function showError(el, errorText, customMessage) {
      el.classList.add("border-red-500");
      el.classList.remove("border-green-500");
      if (errorText) {
        errorText.textContent = customMessage || "This field is required.";
        errorText.classList.remove("hidden");
        errorText.style.display = "block";
        errorText.style.opacity = "1";
      }
    }

    function hideError(el, errorText) {
      el.classList.remove("border-red-500");
      el.classList.add("border-green-500");
      if (errorText) {
        errorText.classList.add("hidden");
        errorText.style.display = "none";
        errorText.style.opacity = "0";
      }
    }

    // Real-time validation
    currentForm
      .querySelectorAll("input[required], textarea[required]")
      .forEach((el) => {
        el.addEventListener("input", () => {
          const errorText = document.getElementById(`${el.id}-error`);
          if (el.type === "email") {
            const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (validEmail.test(el.value.trim())) hideError(el, errorText);
          } else if (el.value.trim()) hideError(el, errorText);
        });
      });

    // Submit handler
    currentForm.addEventListener("submit", (e) => {
      e.preventDefault();
      let valid = true;
      message.classList.add("hidden");

      currentForm
        .querySelectorAll("input[required], textarea[required]")
        .forEach((el) => {
          const errorText = document.getElementById(`${el.id}-error`);
          const value = el.value.trim();

          if (!value) {
            showError(el, errorText);
            valid = false;
          } else if (
            el.type === "email" &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ) {
            showError(el, errorText, "Please enter a valid email address.");
            valid = false;
          } else {
            hideError(el, errorText);
          }
        });

      if (!valid) return;

      // Loading state
      btn.disabled = true;
      if (loader) loader.classList.remove("hidden");
      if (btnText) btnText.textContent = "Sending...";

      setTimeout(() => {
        if (loader) loader.classList.add("hidden");
        btn.disabled = false;
        if (btnText) btnText.textContent = "Send";

        // success message by page id
        if (currentForm.id === "demoForm") {
          message.textContent = "✅ Demo request sent successfully!";
        } else {
          message.textContent = "✅ Message sent successfully!";
        }

        message.className =
          "sm:col-span-2 mt-3 text-center text-sm text-green-400 transition-opacity duration-300";

        currentForm.reset();
        currentForm.querySelectorAll("input, textarea").forEach((el) => {
          el.classList.remove("border-green-500", "border-red-500");
        });

        setTimeout(() => message.classList.add("hidden"), 4000);
      }, 1500);
    });
  });

  /* ===============================
     PROTECTED PAGE VALIDATION
  =============================== */
  const accessForm = document.getElementById("accessForm");
  const accessInput = document.getElementById("protected-email");
  const accessMsg = document.getElementById("accessMessage");
  const accessBtn = document.getElementById("accessBtn");

  if (accessForm && accessInput && accessBtn && accessMsg) {
    const errorText = document.getElementById(`${accessInput.id}-error`);
    accessForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const emailValue = accessInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      accessInput.classList.remove("border-green-500", "border-red-500");
      accessMsg.classList.add("hidden");

      if (!emailValue) {
        accessInput.classList.add("border-red-500");
        errorText.textContent = "Email is required.";
        errorText.classList.remove("hidden");
        return;
      } else if (!emailRegex.test(emailValue)) {
        accessInput.classList.add("border-red-500");
        errorText.textContent = "Please enter a valid email address.";
        errorText.classList.remove("hidden");
        return;
      }

      accessInput.classList.add("border-green-500");
      errorText.classList.add("hidden");

      accessBtn.disabled = true;
      accessBtn.textContent = "Verifying...";
      setTimeout(() => {
        accessBtn.disabled = false;
        accessBtn.textContent = "Submit";
        accessMsg.textContent = "✅ Verification email sent!";
        accessMsg.className =
          "mt-3 text-center text-sm text-green-400 transition-opacity duration-300";
        accessForm.reset();
        accessInput.classList.remove("border-green-500");
        setTimeout(() => accessMsg.classList.add("hidden"), 4000);
      }, 1200);
    });

    accessInput.addEventListener("input", () => {
      const value = accessInput.value.trim();
      if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        accessInput.classList.remove("border-red-500");
        accessInput.classList.add("border-green-500");
        errorText.classList.add("hidden");
      }
    });
  }
});
