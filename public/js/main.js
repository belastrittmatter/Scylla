(function () {
  if (typeof window.__scyllaLandingCleanup === "function") {
    try {
      window.__scyllaLandingCleanup();
    } catch (_e) {}
  }

  const timers = [];
  const cleanups = [];
  let gsapCtx = null;
  let mm = null;
  let refreshQueued = false;

  function registerGsapPlugins() {
    if (
      typeof gsap !== "undefined" &&
      typeof gsap.registerPlugin === "function"
    ) {
      const p = [
        typeof ScrollTrigger !== "undefined" ? ScrollTrigger : null,
        typeof ScrollSmoother !== "undefined" ? ScrollSmoother : null,
        typeof DrawSVGPlugin !== "undefined" ? DrawSVGPlugin : null,
        typeof MorphSVGPlugin !== "undefined" ? MorphSVGPlugin : null,
        typeof SplitText !== "undefined" ? SplitText : null,
      ].filter(Boolean);
      if (p.length > 0) gsap.registerPlugin(...p);
    }
  }
  registerGsapPlugins();

  function prefersReducedMotion() {
    return (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function whenHydrated(fn) {
    const done = () => {
      const h = window.__scyllaHydration;
      return Boolean(h && h.shell && h.page);
    };
    if (done()) return fn();
    const iv = setInterval(() => {
      if (done()) {
        clearInterval(iv);
        fn();
      }
    }, 40);
    timers.push(iv);
  }

  function onReady(fn) {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      timers.push(setTimeout(fn, 0));
    } else {
      document.addEventListener("DOMContentLoaded", fn);
      cleanups.push(() => document.removeEventListener("DOMContentLoaded", fn));
    }
  }

  function menuToggle() {
    const btn = document.querySelector(".menuToggle");
    const menu = document.querySelector(".main-menu");
    if (!(btn && menu)) return;
    const onToggleClick = () => {
      btn.classList.toggle("is-active");
      menu.classList.toggle("menu-active");
      document.body.classList.toggle("menu-overlay");
    };
    const onDocClick = (e) => {
      if (menu.contains(e.target) || btn.contains(e.target)) return;
      btn.classList.remove("is-active");
      menu.classList.remove("menu-active");
      document.body.classList.remove("menu-overlay");
    };
    btn.addEventListener("click", onToggleClick);
    document.addEventListener("click", onDocClick);
    cleanups.push(() => {
      btn.removeEventListener("click", onToggleClick);
      document.removeEventListener("click", onDocClick);
    });
  }
  menuToggle();

  onReady(function () {
    const toggles = document.querySelectorAll(".footer-menu-toggle");
    const lists = document.querySelectorAll(".footer-menu-list");
    const isMobile = () => window.matchMedia("(max-width: 640px)").matches;
    toggles.forEach((btn, i) => {
      const onToggle = () => {
        if (!isMobile()) return;
        btn.classList.toggle("active");
        if (lists[i]) lists[i].classList.toggle("active");
        toggles.forEach((other, j) => {
          if (j !== i) {
            other.classList.remove("active");
            if (lists[j]) lists[j].classList.remove("active");
          }
        });
      };
      btn.addEventListener("click", onToggle);
      cleanups.push(() => btn.removeEventListener("click", onToggle));
    });
    const onResize = () => {
      if (!isMobile()) {
        toggles.forEach((b) => b.classList.remove("active"));
        lists.forEach((l) => l.classList.remove("active"));
      }
    };
    window.addEventListener("resize", onResize);
    cleanups.push(() => window.removeEventListener("resize", onResize));
  });

  function pausedTimeline(vars) {
    const tl = gsap.timeline({ paused: true, ...vars });
    tl.eventCallback("onStart", () => {
      tl.getChildren(false, true, false).forEach((tw) => {
        tw.targets().forEach((t) => {
          if (t instanceof Element) t.classList.add("played");
        });
      });
    });
    return tl;
  }

  function bindRevealTrigger(triggerEl, tl) {
    ScrollTrigger.create({
      trigger: triggerEl,
      start: "top 90%",
      end: "bottom 10%",
      animation: tl,
      toggleActions: "play none none none",
      invalidateOnRefresh: true,
      onEnter: () => tl.play(),
      onEnterBack: () => tl.play(),
      onRefresh: (self) => {
        if (self.progress > 0 || self.isActive) tl.play();
      },
    });
  }

  const sharedFrom = { y: 28, opacity: 0 };
  const sharedTo = {
    y: 0,
    opacity: 1,
    duration: 0.5,
    ease: "power2.out",
    clearProps: "transform",
  };

  function addTicksToTimeline(wrapper, tl, position) {
    const ticks = wrapper.querySelectorAll("[data-tick]");
    if (ticks.length)
      tl.fromTo(
        ticks,
        { scale: 0, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.35,
          ease: "back.out(2)",
          stagger: 0.05,
          clearProps: "transform",
        },
        position,
      );
  }

  function initHeroTimeline() {
    const hero = document.querySelector("[data-hero-section]");
    if (!hero) return;

    const title = hero.querySelector("[data-title]");
    const label = hero.querySelector("[data-subtitle]");
    const excerpt = hero.querySelector("[data-excerpt]");
    const buttonRow = hero.querySelector("[data-button]");
    const thumbnail = hero.querySelector("[data-thumbnail]");
    const bloom = hero.querySelector(".hero-bloom");

    const tl = pausedTimeline({ defaults: { ease: "power3.out" } });
    tl.play();
    if (title) tl.from(title, { y: 28, opacity: 0, duration: 0.85 }, 0.15);
    if (label) tl.from(label, { y: 14, opacity: 0, duration: 0.45 }, 0.4);
    if (excerpt) tl.from(excerpt, { y: 18, opacity: 0, duration: 0.55 }, 0.52);
    if (buttonRow)
      tl.from(buttonRow, { y: 16, opacity: 0, duration: 0.45 }, 0.68);
    if (bloom)
      tl.from(bloom, { opacity: 0, duration: 1.4, ease: "power2.inOut" }, 0.2);
    if (thumbnail)
      tl.from(thumbnail, { y: 56, opacity: 0, duration: 0.85 }, 0.8);
  }

  function finalizeCounters() {
    document.documentElement.classList.remove("gsap-pending");
    document.querySelectorAll("[data-count]").forEach((el) => {
      el.textContent = String(Number(el.getAttribute("data-count")) || 0);
    });
  }

  function initAnimations() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      finalizeCounters();
      return;
    }
    registerGsapPlugins();
    gsap.defaults({ immediateRender: false });

    const isPinnedActive = () =>
      ScrollTrigger.getAll().some((st) => st.pin && st.isActive);
    const safeRefresh = () => {
      if (isPinnedActive()) {
        refreshQueued = true;
        return;
      }
      ScrollTrigger.refresh();
    };

    if (prefersReducedMotion()) {
      finalizeCounters();
      return;
    }

    gsapCtx = gsap.context(() => {
      initHeroTimeline();

      mm = gsap.matchMedia();
      mm.add("(min-width: 767px)", () => {
        const cards = gsap.utils.toArray(".sticky-card");
        const offset = 70;

        cards.forEach((card, index) => {
          const startOffset = index < 2 ? 80 : 80 + (index - 1) * offset;
          gsap.to(card, {
            scrollTrigger: {
              trigger: card,
              start: `top top+=${startOffset}`,
              endTrigger: ".process-end",
              end: "top top+=300",
              pin: true,
              pinSpacing: false,
              pinType: "transform",
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        });
      });

      const demoHeading = document.querySelectorAll("[data-section-title]");
      if (demoHeading.length) {
        demoHeading.forEach((section) => {
          const subtitle = section.querySelector("[data-subtitle]");
          const title = section.querySelector("[data-title]");
          const excerpt = section.querySelector("[data-excerpt]");
          const tl = pausedTimeline();

          if (subtitle) {
            tl.fromTo(
              subtitle,
              { ...sharedFrom, scale: 0.97 },
              { ...sharedTo, scale: 1 },
              0,
            );
          }
          if (title) {
            tl.fromTo(title, sharedFrom, { ...sharedTo }, "-=0.4");
          }
          if (excerpt) {
            tl.fromTo(excerpt, sharedFrom, { ...sharedTo }, "-=0.4");
          }

          bindRevealTrigger(section, tl);
        });
      }

      const sttrWrapper = document.querySelectorAll("[data-sttr-wrapper]");
      if (sttrWrapper.length) {
        sttrWrapper.forEach((wrapper) => {
          const sttrCards = wrapper.querySelectorAll("[data-sttr-card]");
          const tl = pausedTimeline();
          if (sttrCards.length) {
            tl.fromTo(
              sttrCards,
              { y: 30, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                ease: "power2.out",
                duration: 0.45,
                stagger: 0.05,
                clearProps: "transform",
              },
              0,
            );
          }
          addTicksToTimeline(wrapper, tl, 0.25);
          bindRevealTrigger(wrapper, tl);
        });
      }

      document
        .querySelectorAll("[data-newsletter-wrapper]")
        .forEach((wrapper) => {
          const title = wrapper.querySelector("[data-news-title]");
          const excerpt = wrapper.querySelector("[data-news-excerpt]");
          const button = wrapper.querySelector("[data-news-button]");
          const tl = pausedTimeline();
          tl.fromTo(
            wrapper,
            { y: 32, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: "power2.out",
              duration: 0.5,
              clearProps: "transform",
            },
            0,
          );
          if (title) tl.fromTo(title, sharedFrom, { ...sharedTo }, "-=0.35");
          if (excerpt) tl.fromTo(excerpt, sharedFrom, { ...sharedTo }, "-=0.4");
          if (button) tl.fromTo(button, sharedFrom, { ...sharedTo }, "-=0.4");
          bindRevealTrigger(wrapper, tl);
        });

      const homeV1Trail = document.querySelector(
        '[data-container="trail-section"]',
      );
      if (homeV1Trail) {
        const thumbnail = homeV1Trail.querySelector("[data-kanban-preview]");
        const title = homeV1Trail.querySelector("[data-title]");
        const excerpt = homeV1Trail.querySelector("[data-excerpt]");
        const list = homeV1Trail.querySelector("[data-list]");
        const button = homeV1Trail.querySelector("[data-button]");
        const tl = pausedTimeline();

        [
          [title, 0],
          [excerpt, "-=0.4"],
          [list, "-=0.4"],
          [button, "-=0.4"],
        ].forEach(([el, pos]) => {
          if (el)
            tl.fromTo(el, { x: -24, opacity: 0 }, { ...sharedTo, x: 0 }, pos);
        });
        if (thumbnail) {
          tl.fromTo(
            thumbnail,
            { ...sharedFrom, scale: 0.95, transformOrigin: "bottom left" },
            { ...sharedTo, scale: 1 },
            "-=0.5",
          );
        }

        bindRevealTrigger(homeV1Trail, tl);
      }

      const processArea = document.querySelector(
        '[data-container="process-area"]',
      );
      if (processArea) {
        const title = processArea.querySelector("[data-title]");
        const excerpt = processArea.querySelector("[data-excerpt]");
        const cardBoxes = processArea.querySelectorAll(
          "[data-card] .sticky-card > div",
        );
        const tl = pausedTimeline();

        if (title)
          tl.fromTo(title, { x: -28, opacity: 0 }, { ...sharedTo, x: 0 }, 0);
        if (excerpt)
          tl.fromTo(
            excerpt,
            { x: -28, opacity: 0 },
            { ...sharedTo, x: 0 },
            "-=0.4",
          );
        if (cardBoxes.length) {
          cardBoxes.forEach((box) => {
            tl.fromTo(box, sharedFrom, { ...sharedTo }, "-=0.4");
          });
        }

        bindRevealTrigger(processArea, tl);
      }

      const statBand = document.querySelector("[data-stat-band]");
      if (statBand) {
        const counters = statBand.querySelectorAll("[data-count]");
        const tl = pausedTimeline();
        counters.forEach((el) => {
          el.textContent = "0"; // the animation owns the zero state
          const state = { value: 0 };
          tl.to(
            state,
            {
              value: Number(el.getAttribute("data-count")) || 0,
              duration: 1.4,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = String(Math.round(state.value));
              },
            },
            0.2,
          );
        });
        bindRevealTrigger(statBand, tl);
      }

      mm.add("(min-width: 1024px)", () => {
        const tourStage = document.querySelector("[data-tour-stage]");
        const tourPanel = document.querySelector("[data-tour-panel]");
        if (tourPanel) {
          const images = tourPanel.querySelectorAll("[data-tour-image]");
          gsap.set(images, {
            position: "absolute",
            inset: 0,
            opacity: (i) => (i === 0 ? 1 : 0),
          });
          const progress = tourPanel.querySelector("[data-tour-progress]");
          const steps = tourPanel.querySelectorAll("[data-tour-step]");
          const total = 1600;
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: tourStage,
              start: "top top",
              end: `+=${total}`,
              pin: true,
              anticipatePin: 1,
              scrub: 0.6,
              invalidateOnRefresh: true,
              onUpdate: (self) => {
                const step = Math.min(3, Math.floor(self.progress * 3) + 1);
                tourStage.setAttribute("data-active-step", String(step));
              },
            },
          });
          images.forEach((img, i) => {
            tl.to(img, { opacity: 1, duration: 0.2, ease: "none" }, i / 3);
          });
          if (progress) {
            tl.to(progress, { width: "100%", ease: "none", duration: 1 }, 0);
          }
          tl.eventCallback("onUpdate", () => {
            const active = Number(
              tourStage.getAttribute("data-active-step") || "1",
            );
            steps.forEach((s, i) => {
              s.classList.toggle("opacity-100", i + 1 === active);
              s.classList.toggle("opacity-40", i + 1 !== active);
            });
          });
        }
      });

      const waveField = document.querySelector("[data-wave-field]");
      if (waveField) {
        const cols = waveField.querySelectorAll("[data-wave-col]");
        const tl = pausedTimeline();
        tl.fromTo(
          cols,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: "bottom center",
            duration: 0.7,
            ease: "power3.out",
            stagger: 0.012,
            clearProps: "transform",
          },
          0.1,
        );
        bindRevealTrigger(
          waveField.closest("[data-sttr-wrapper]") || waveField,
          tl,
        );
      }

      const appSection = document.querySelector(
        '[data-container="apps-section"]',
      );
      if (appSection) {
        const title = appSection.querySelector("[data-title]");
        const excerpt = appSection.querySelector("[data-excerpt]");
        const button = appSection.querySelector("[data-button]");
        const thumbnail = appSection.querySelector("[data-thumbnail]");
        const tl = pausedTimeline();

        tl.fromTo(
          appSection,
          { y: 32, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power2.out",
            clearProps: "transform",
          },
          0,
        );
        if (title)
          tl.fromTo(
            title,
            { x: -28, opacity: 0 },
            { ...sharedTo, x: 0 },
            "-=0.4",
          );
        if (excerpt)
          tl.fromTo(
            excerpt,
            { x: -28, opacity: 0 },
            { ...sharedTo, x: 0 },
            "-=0.4",
          );
        if (button)
          tl.fromTo(button, { ...sharedFrom }, { ...sharedTo }, "-=0.4");
        const activityLines = appSection.querySelectorAll(
          "[data-activity-line]",
        );
        if (activityLines.length) {
          tl.fromTo(
            activityLines,
            { y: 10, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.35,
              stagger: 0.12,
              ease: "power2.out",
              clearProps: "transform",
            },
            "-=0.4",
          );
        }
        if (thumbnail) {
          tl.fromTo(
            thumbnail,
            { x: 40, opacity: 0, scale: 0.92, transformOrigin: "top right" },
            {
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 0.55,
              ease: "power2.out",
              clearProps: "transform",
            },
            "-=0.4",
          );
        }
        addTicksToTimeline(appSection, tl, "-=0.4");

        bindRevealTrigger(appSection, tl);
      }

      const spotlightCells = document.querySelectorAll("[data-spotlight]");
      const onSpotlightMove = (e) => {
        const cell =
          e.target && e.target.closest
            ? e.target.closest("[data-spotlight]")
            : null;
        if (!cell) return;
        const rect = cell.getBoundingClientRect();
        cell.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        cell.style.setProperty("--my", `${e.clientY - rect.top}px`);
      };
      document.addEventListener("pointermove", onSpotlightMove);
      cleanups.push(() =>
        document.removeEventListener("pointermove", onSpotlightMove),
      );

      ScrollTrigger.refresh();
      const refreshAt = (ms) => timers.push(setTimeout(safeRefresh, ms));
      if (document.readyState !== "complete") {
        window.addEventListener("load", safeRefresh, { once: true });
      }
      refreshAt(400);
      refreshAt(1000);
      refreshAt(2200);
    });

    const smoothContent = document.querySelector("#smooth-content");
    if (smoothContent && typeof ResizeObserver !== "undefined") {
      let refreshTimeout = null;
      const ro = new ResizeObserver(() => {
        if (refreshTimeout) clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(safeRefresh, 100);
      });
      ro.observe(smoothContent);
      cleanups.push(() => {
        if (refreshTimeout) clearTimeout(refreshTimeout);
        ro.disconnect();
      });
      const onScrollEnd = () => {
        if (refreshQueued && !isPinnedActive()) {
          refreshQueued = false;
          ScrollTrigger.refresh();
        }
      };
      ScrollTrigger.addEventListener("scrollEnd", onScrollEnd);
      cleanups.push(() =>
        ScrollTrigger.removeEventListener("scrollEnd", onScrollEnd),
      );
    }
  }

  onReady(() => {
    document.body.classList.remove("overflow-hidden");
  });

  whenHydrated(() => {
    initAnimations();
  });

  whenHydrated(() => {
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
    cleanups.push(() => {
      window.removeEventListener("resize", updatePadding);
      bodyTarget.style.paddingTop = "";
      header.classList.remove("sticky-header");
      header.style.removeProperty("transform");
    });

    if (
      typeof ScrollTrigger === "undefined" ||
      typeof gsap === "undefined" ||
      prefersReducedMotion()
    ) {
      return;
    }

    let lastScrollY = window.scrollY;
    let isHidden = false;

    const headerSt = ScrollTrigger.create({
      onUpdate: (self) => {
        const currentScroll = self.scroll();

        if (currentScroll > 0) header.classList.add("sticky-header");
        else {
          header.classList.remove("sticky-header");
        }

        if (
          currentScroll > lastScrollY &&
          currentScroll > header.offsetHeight
        ) {
          if (!isHidden) {
            gsap.to(header, {
              y: -header.offsetHeight,
              duration: 0.3,
              ease: "power2.inOut",
            });
            isHidden = true;
          }
        } else if (currentScroll < lastScrollY) {
          if (isHidden) {
            gsap.to(header, {
              y: 0,
              duration: 0.3,
              ease: "power2.out",
            });
            isHidden = false;
          }
        }

        lastScrollY = currentScroll;
      },
    });
    cleanups.push(() => headerSt.kill());

    ScrollTrigger.refresh();
  });

  window.__scyllaLandingCleanup = function () {
    while (timers.length > 0) clearTimeout(timers.pop());
    while (cleanups.length > 0) {
      const fn = cleanups.pop();
      try {
        fn();
      } catch (_e) {}
    }
    if (typeof ScrollSmoother !== "undefined") {
      try {
        const sm = ScrollSmoother.get();
        if (sm) sm.kill();
      } catch (_e) {}
    }
    if (mm) {
      try {
        mm.revert();
      } catch (_e) {}
      mm = null;
    }
    if (gsapCtx) {
      try {
        gsapCtx.revert();
      } catch (_e) {}
      gsapCtx = null;
    }
    if (typeof ScrollTrigger !== "undefined") {
      try {
        ScrollTrigger.getAll().forEach((t) => t.kill(true));
      } catch (_e) {}
    }
    const wrapper = document.querySelector("#smooth-wrapper");
    const content = document.querySelector("#smooth-content");
    if (wrapper) wrapper.removeAttribute("style");
    if (content) content.removeAttribute("style");
  };
})();
