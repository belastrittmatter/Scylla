(function () {
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
      setTimeout(fn, 10);
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  // Mobile header menu toggle
  function menuToggle() {
    const menuToggleBtn = document.querySelector(".menuToggle");
    const mainMenu = document.querySelector(".main-menu");
    if (!(menuToggleBtn && mainMenu)) return;

    menuToggleBtn.addEventListener("click", () => {
      menuToggleBtn.classList.toggle("is-active");
      mainMenu.classList.toggle("menu-active");
      document.body.classList.toggle("menu-overlay");
    });

    document.addEventListener("click", (e) => {
      const clickedInsideMenu = mainMenu.contains(e.target);
      const clickedToggle = menuToggleBtn.contains(e.target);
      if (clickedInsideMenu || clickedToggle) return;

      menuToggleBtn.classList.remove("is-active");
      mainMenu.classList.remove("menu-active");
      document.body.classList.remove("menu-overlay");
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
      toggleBtn.addEventListener("click", function () {
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
      });
    });

    window.addEventListener("resize", function () {
      if (!isMobile()) {
        menuToggles.forEach((btn) => btn.classList.remove("active"));
        menuLists.forEach((list) => list.classList.remove("active"));
      }
    });
  });

  registerGsapPlugins();

  if (typeof ScrollSmoother !== "undefined" && !ScrollSmoother.get()) {
    ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 2,
      effects: true,
      smoothTouch: 0.8,
    });
  }

  function initAnimations() {
    registerGsapPlugins();

    const sharedFrom = { y: 60, opacity: 0, filter: "blur(16px)" };
    const sharedTo = {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      duration: 0.8,
      ease: "power3.out",
    };

    // 1.2 => Sticky card animation
    const mm = gsap.matchMedia();
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
            scrub: true,
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

        ScrollTrigger.create({
          trigger: section,
          start: "top 80%",
          end: "top 40%",
          animation: tl,
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        });
      });
      ScrollTrigger.refresh();
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
        ScrollTrigger.create({
          trigger: wrapper,
          start: "top 80%",
          end: "top 40%",
          animation: tl,
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        });
        ScrollTrigger.refresh();
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

        ScrollTrigger.create({
          trigger: wrapper,
          start: "top 80%",
          end: "top 40%",
          animation: tl,
          toggleActions: "play none none none",
          invalidateOnRefresh: true,
        });
        ScrollTrigger.refresh();
      });
    }

    // 3.1 => Hero section animation
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
            transformOrigin: "bottom left",
            y: 100,
          },
          { ...sharedTo, scale: 1, duration: 0.8, y: 0 },
          "-=0.6",
        );
      }
      if (button) {
        tl.fromTo(button, sharedFrom, { ...sharedTo }, "-=0.6");
      }
      if (thumbnail) {
        tl.fromTo(thumbnail, sharedFrom, { ...sharedTo }, "-=0.6");
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

      ScrollTrigger.create({
        trigger: homeV1Hero,
        start: "top 80%",
        end: "top 40%",
        animation: tl,
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
      });
      tl.play();
      ScrollTrigger.refresh();
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

      const trailFrom = { y: 100, opacity: 0, filter: "blur(16px)" };
      const trailTo = {
        y: 0,
        opacity: 1,
        filter: "blur(0px)",
        duration: 0.8,
        ease: "back",
      };

      if (title) {
        tl.fromTo(title, { ...trailFrom }, { ...trailTo }, 0);
      }
      if (thumbnail) {
        tl.fromTo(
          thumbnail,
          {
            ...trailFrom,
            scale: 0.8,
            transformOrigin: "bottom left",
            y: 100,
          },
          { ...trailTo, scale: 1, duration: 0.8, y: 0 },
          "-=0.6",
        );
      }
      if (excerpt) {
        tl.fromTo(excerpt, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }
      if (topLine) {
        tl.fromTo(topLine, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }
      if (list) {
        tl.fromTo(list, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }
      if (bottomLine) {
        tl.fromTo(bottomLine, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }
      if (button) {
        tl.fromTo(button, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }

      ScrollTrigger.create({
        trigger: homeV1Trail,
        start: "top 80%",
        end: "top 40%",
        animation: tl,
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
      });
      ScrollTrigger.refresh();
    }

    // 3.3 => Process steps area animation
    const processArea = document.querySelector(
      '[data-container="process-area"]',
    );
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
        tl.fromTo(title, { ...trailFrom }, { ...trailTo }, 0);
      }
      if (excerpt) {
        tl.fromTo(excerpt, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }
      if (cards.length) {
        cards.forEach((card) => {
          tl.fromTo(card, { ...sharedFrom }, { ...sharedTo }, "-=0.6");
        });
      }

      ScrollTrigger.create({
        trigger: processArea,
        start: "top 80%",
        end: "top 40%",
        animation: tl,
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
      });
      ScrollTrigger.refresh();
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
        { y: 100, opacity: 0, filter: "blur(16px)" },
        { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.8, ease: "back" },
        0,
      );
      if (title) {
        tl.fromTo(title, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }
      if (excerpt) {
        tl.fromTo(excerpt, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }
      if (button) {
        tl.fromTo(button, { ...trailFrom }, { ...trailTo }, "-=0.6");
      }
      if (thumbnail) {
        tl.fromTo(
          thumbnail,
          {
            x: 100,
            opacity: 0,
            filter: "blur(16px)",
            scale: 0.7,
            transformOrigin: "top right",
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
          { y: 100, opacity: 0, filter: "blur(16px)" },
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
          { x: 100, opacity: 0, filter: "blur(16px)" },
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

      ScrollTrigger.create({
        trigger: appSection,
        start: "top 80%",
        end: "top 40%",
        animation: tl,
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
      });
      ScrollTrigger.refresh();
    }
  }

  onReady(() => {
    document.body.classList.remove("overflow-hidden");
    initAnimations();
  });

  // Pricing arrow SVG draw loop
  const revealStroke = document.querySelector("#revealStroke");
  if (revealStroke) {
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
          gsap.set("#revealStroke", { drawSVG: "0% 0%" });
        },
      },
    );
  }

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

    let lastScrollY = window.scrollY;
    let isHidden = false;

    ScrollTrigger.create({
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
              duration: 0.4,
              ease: "power2.inOut",
            });
            isHidden = true;
          }
        } else if (currentScroll < lastScrollY) {
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
})();
