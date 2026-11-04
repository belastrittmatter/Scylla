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

  function registerGsapPlugins() {
    if (
      typeof gsap !== "undefined" &&
      typeof gsap.registerPlugin === "function"
    ) {
      const gsapPlugins = [
        typeof ScrollTrigger !== "undefined" ? ScrollTrigger : null,
        typeof ScrollSmoother !== "undefined" ? ScrollSmoother : null,
        typeof DrawSVGPlugin !== "undefined" ? DrawSVGPlugin : null,
        typeof MorphSVGPlugin !== "undefined" ? MorphSVGPlugin : null,
        typeof SplitText !== "undefined" ? SplitText : null,
      ].filter(Boolean);
      if (gsapPlugins.length > 0) {
        gsap.registerPlugin(...gsapPlugins);
      }
      if (gsap.core && typeof gsap.core.globals === "function") {
        if (typeof ScrollTrigger !== "undefined") {
          gsap.core.globals("ScrollTrigger", ScrollTrigger);
        }
        if (typeof ScrollSmoother !== "undefined") {
          gsap.core.globals("ScrollSmoother", ScrollSmoother);
        }
      }
    }
  }
  registerGsapPlugins();

  function onReady(fn) {
    if (
      document.readyState === "complete" ||
      document.readyState === "interactive"
    ) {
      const id = setTimeout(fn, 0);
      timers.push(id);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
      cleanups.push(() => document.removeEventListener("DOMContentLoaded", fn));
    }
  }

  // Mobile header menu toggle
  function menuToggle() {
    const menuToggleBtn = document.querySelector(".menuToggle");
    const mainMenu = document.querySelector(".main-menu");
    if (!(menuToggleBtn && mainMenu)) return;

    const onToggleClick = () => {
      menuToggleBtn.classList.toggle("is-active");
      mainMenu.classList.toggle("menu-active");
      document.body.classList.toggle("menu-overlay");
    };

    const onDocClick = (e) => {
      const clickedInsideMenu = mainMenu.contains(e.target);
      const clickedToggle = menuToggleBtn.contains(e.target);
      if (clickedInsideMenu || clickedToggle) return;

      menuToggleBtn.classList.remove("is-active");
      mainMenu.classList.remove("menu-active");
      document.body.classList.remove("menu-overlay");
    };

    menuToggleBtn.addEventListener("click", onToggleClick);
    document.addEventListener("click", onDocClick);
    cleanups.push(() => {
      menuToggleBtn.removeEventListener("click", onToggleClick);
      document.removeEventListener("click", onDocClick);
    });
  }
  menuToggle();

  // Footer Menu (mobile accordion)
  onReady(function () {
    const menuToggles = document.querySelectorAll(".footer-menu-toggle");
    const menuLists = document.querySelectorAll(".footer-menu-list");

    function isMobile() {
      return window.matchMedia("(max-width: 640px)").matches;
    }

    menuToggles.forEach((toggleBtn, index) => {
      const onFooterToggle = function () {
        if (!isMobile()) return;

        const correspondingMenuList = menuLists[index];
        toggleBtn.classList.toggle("active");
        if (correspondingMenuList) {
          correspondingMenuList.classList.toggle("active");
        }

        menuToggles.forEach((otherMenuToggle, otherIndex) => {
          if (otherIndex !== index) {
            otherMenuToggle.classList.remove("active");
            if (menuLists[otherIndex]) {
              menuLists[otherIndex].classList.remove("active");
            }
          }
        });
      };
      toggleBtn.addEventListener("click", onFooterToggle);
      cleanups.push(() =>
        toggleBtn.removeEventListener("click", onFooterToggle),
      );
    });

    const onFooterResize = function () {
      if (!isMobile()) {
        menuToggles.forEach((btn) => btn.classList.remove("active"));
        menuLists.forEach((list) => list.classList.remove("active"));
      }
    };
    window.addEventListener("resize", onFooterResize);
    cleanups.push(() => window.removeEventListener("resize", onFooterResize));
  });

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
        if (self.progress > 0 || self.isActive) {
          tl.play();
        }
      },
    });
  }

  function initAnimations() {
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
      return;
    }
    registerGsapPlugins();

    gsapCtx = gsap.context(() => {
      const sharedFrom = { y: 32, opacity: 0 };
      const sharedTo = {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: "power2.out",
        clearProps: "transform",
      };

      // 1.2 => Sticky card animation
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

      // 1.3 => Reusable section heading animation
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
              { ...sharedFrom, scale: 0.95 },
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

      // 1.4 => Multiple glass card section
      const sttrWrapper = document.querySelectorAll("[data-sttr-wrapper]");
      if (sttrWrapper.length) {
        sttrWrapper.forEach((wrapper) => {
          const sttrCards = wrapper.querySelectorAll("[data-sttr-card]");
          const tl = gsap.timeline({ paused: true });
          if (sttrCards) {
            sttrCards.forEach((sttrCard) => {
              tl.fromTo(
                sttrCard,
                { y: 36, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  ease: "power2.out",
                  duration: 0.45,
                  stagger: 0.03,
                  clearProps: "transform",
                },
                "-=0.35",
              );
            });
          }
          bindRevealTrigger(wrapper, tl);
        });
      }

      // 1.5 => Newsletter / CTA glass card section
      const newsletterWrapper = document.querySelectorAll(
        "[data-newsletter-wrapper]",
      );
      if (newsletterWrapper.length) {
        newsletterWrapper.forEach((wrapper) => {
          const title = wrapper.querySelector("[data-news-title]");
          const excerpt = wrapper.querySelector("[data-news-excerpt]");
          const button = wrapper.querySelector("[data-news-button]");
          const video = wrapper.querySelector("[data-news-video]");
          const tl = gsap.timeline({ paused: true });

          tl.fromTo(
            wrapper,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: "power2.out",
              duration: 0.5,
              clearProps: "transform",
            },
            0,
          );
          if (video) {
            tl.fromTo(
              video,
              { x: 40, opacity: 0 },
              {
                x: 0,
                opacity: 1,
                ease: "power2.out",
                duration: 0.55,
                clearProps: "transform",
              },
              "-=0.4",
            );
          }
          if (title) {
            tl.fromTo(title, sharedFrom, { ...sharedTo }, "-=0.4");
          }
          if (excerpt) {
            tl.fromTo(excerpt, sharedFrom, { ...sharedTo }, "-=0.4");
          }
          if (button) {
            tl.fromTo(button, { ...sharedFrom }, { ...sharedTo }, "-=0.4");
          }

          bindRevealTrigger(wrapper, tl);
        });
      }

      // 3.2 => Task board preview ("trail-section") animation
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

        const trailFrom = { y: 36, opacity: 0 };
        const trailTo = {
          y: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power2.out",
          clearProps: "transform",
        };

        if (title) {
          tl.fromTo(title, { ...trailFrom }, { ...trailTo }, 0);
        }
        if (thumbnail) {
          tl.fromTo(
            thumbnail,
            {
              ...trailFrom,
              scale: 0.95,
              transformOrigin: "bottom left",
            },
            { ...trailTo, scale: 1 },
            "-=0.4",
          );
        }
        if (excerpt) {
          tl.fromTo(excerpt, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }
        if (topLine) {
          tl.fromTo(topLine, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }
        if (list) {
          tl.fromTo(list, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }
        if (bottomLine) {
          tl.fromTo(bottomLine, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }
        if (button) {
          tl.fromTo(button, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }

        bindRevealTrigger(homeV1Trail, tl);
      }

      // 3.3 => Process steps area animation
      const processArea = document.querySelector(
        '[data-container="process-area"]',
      );
      if (processArea) {
        const title = processArea.querySelector("[data-title]");
        const excerpt = processArea.querySelector("[data-excerpt]");
        const cardBoxes = processArea.querySelectorAll(
          "[data-card] .sticky-card > div",
        );
        const tl = gsap.timeline({ paused: true });

        const trailFrom = { x: -36, opacity: 0 };
        const trailTo = {
          x: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power2.out",
          clearProps: "transform",
        };

        if (title) {
          tl.fromTo(title, { ...trailFrom }, { ...trailTo }, 0);
        }
        if (excerpt) {
          tl.fromTo(excerpt, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }
        if (cardBoxes.length) {
          cardBoxes.forEach((box) => {
            tl.fromTo(box, { ...sharedFrom }, { ...sharedTo }, "-=0.4");
          });
        }

        bindRevealTrigger(processArea, tl);
      }

      // 3.4 => Integrations ("apps-section") animation
      const appSection = document.querySelector(
        '[data-container="apps-section"]',
      );
      if (appSection) {
        const title = appSection.querySelector("[data-title]");
        const excerpt = appSection.querySelector("[data-excerpt]");
        const button = appSection.querySelector("[data-button]");
        const thumbnail = appSection.querySelector("[data-thumbnail]");
        const bgShape = appSection.querySelector("[data-bg-shape]");
        const glowShape = appSection.querySelector("[data-glow-shape]");
        const tl = gsap.timeline({ paused: true });

        const trailFrom = { x: -36, opacity: 0 };
        const trailTo = {
          x: 0,
          opacity: 1,
          duration: 0.55,
          ease: "power2.out",
          clearProps: "transform",
        };

        tl.fromTo(
          appSection,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: "power2.out",
            clearProps: "transform",
          },
          0,
        );
        if (title) {
          tl.fromTo(title, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }
        if (excerpt) {
          tl.fromTo(excerpt, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }
        if (button) {
          tl.fromTo(button, { ...trailFrom }, { ...trailTo }, "-=0.4");
        }
        if (thumbnail) {
          tl.fromTo(
            thumbnail,
            {
              x: 40,
              opacity: 0,
              scale: 0.92,
              transformOrigin: "top right",
            },
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
        if (bgShape) {
          tl.fromTo(
            bgShape,
            { y: 36, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.55,
              ease: "power2.out",
              clearProps: "transform",
            },
            "-=0.4",
          );
        }
        if (glowShape) {
          tl.fromTo(
            glowShape,
            { x: 36, opacity: 0 },
            {
              x: 0,
              opacity: 1,
              duration: 0.55,
              ease: "power2.out",
              clearProps: "transform",
            },
            "-=0.4",
          );
        }

        bindRevealTrigger(appSection, tl);
      }

      ScrollTrigger.refresh();
    });

    const smoothContent = document.querySelector("#smooth-content");
    if (smoothContent && typeof ResizeObserver !== "undefined") {
      let refreshTimeout = null;
      const ro = new ResizeObserver(() => {
        if (refreshTimeout) clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(() => {
          if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
          }
        }, 100);
      });
      ro.observe(smoothContent);
      cleanups.push(() => {
        if (refreshTimeout) clearTimeout(refreshTimeout);
        ro.disconnect();
      });
    }
  }

  onReady(() => {
    document.body.classList.remove("overflow-hidden");
    initAnimations();
  });

  // Sticky Header hide/show on scroll
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
    cleanups.push(() => {
      window.removeEventListener("resize", updatePadding);
      bodyTarget.style.paddingTop = "";
      header.classList.remove("sticky-header");
      header.style.removeProperty("transform");
    });

    if (typeof ScrollTrigger === "undefined" || typeof gsap === "undefined") {
      return;
    }

    let lastScrollY = window.scrollY;
    let isHidden = false;

    const headerSt = ScrollTrigger.create({
      onUpdate: (self) => {
        const currentScroll = self.scroll();

        if (currentScroll > 0) {
          header.classList.add("sticky-header");
        } else {
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
