import Link from "next/link";

export function LandingHero() {
  return (
    <>
      <div className="header-innerHeight">
        <div className="container">
          <div className="border-container pt-[60px] lg:pt-[71px]"></div>
        </div>
      </div>
      {/* Banner Area Start */}
      <section
        className="relative z-1 pt-3 sm:pt-4 pb-3 sm:pb-4"
        data-hero-section=""
      >
        {/* Panel sized like the Cloudflare reference: ~1480px wide, ~720px tall */}
        <div className="px-2 sm:px-3">
          <div className="hero-panel w-full px-5 sm:px-10 lg:px-16 pt-16 sm:pt-20 lg:pt-24 pb-0">
            <div className="hero-bloom" aria-hidden="true" />
            <div className="relative z-1 max-w-[820px] mx-auto text-center w-full pb-[190px] sm:pb-[230px] lg:pb-[260px]">
              <span data-subtitle="" className="hero-label text-sm font-medium">
                AI-Powered Task &amp; Calendar Engine
              </span>
              <h1
                data-title=""
                className="hero-title !leading-[1.16] text-3xl sm:text-5xl lg:text-6xl xl:text-[64px] mt-5"
              >
                <span className="hero-title-inner">
                  Master Your Tasks. Harmonize Every Schedule with{" "}
                  <em>Scylla</em>
                </span>
              </h1>
              <p
                data-excerpt=""
                className="hero-sub mt-5 md:mt-6 font-normal text-sm sm:text-base lg:text-lg !leading-[1.7] tracking-[0.1px] max-w-[820px] mx-auto"
              >
                The unified workspace bridging visual Kanban boards, sub-second
                deep-work timers, and intelligent multi-person calendar
                scheduling. Eliminate context switching and keep your team in
                sync.
              </p>
              <div
                data-button=""
                className="hero-ctas mt-7 sm:mt-8 lg:mt-9 flex flex-wrap items-center justify-center gap-4"
              >
                <Link
                  prefetch={false}
                  className="button-white inline-flex items-center justify-center px-7 py-3.5 font-medium text-sm leading-normal text-center cursor-pointer"
                  href="/auth/sign-in"
                >
                  Get Started Free
                </Link>
                <Link
                  prefetch={false}
                  className="button-secondary cursor-pointer !py-3.5 px-6 text-sm"
                  href="/calendar"
                >
                  Explore Live Calendar
                </Link>
              </div>
            </div>
            {/* Dashboard preview rises from the panel's bottom edge */}
            <div
              data-thumbnail=""
              className="absolute inset-x-0 bottom-0 z-1 mx-auto max-w-[1000px] px-4"
            >
              <div className="hero-shot p-1 sm:p-2 !pb-0">
                <div className="max-h-[180px] overflow-hidden rounded-t-[10px] sm:max-h-[240px]">
                  <img
                    className="w-full"
                    src="/images/calendar-dashboard-preview.png"
                    alt="Scylla Task & Calendar dashboard preview"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Banner Area End */}
    </>
  );
}
