"use client";

interface CalendarFeature {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  wrapperWidthClass: string;
  imageHeightClass: string;
}

const ROW_ONE_FEATURES: CalendarFeature[] = [
  {
    title: "Unified Visual Time-Blocking",
    description:
      "Drag pending backlog tasks directly onto your hourly calendar timeline. Lock in focused deep work blocks with automatic duration snapping and live status updates.",
    imageSrc: "/images/calendar/why-chose-01.jpg",
    imageAlt: "Visual drag and drop time blocking on Scylla Calendar",
    wrapperWidthClass: "sm:max-w-[699px] w-full",
    imageHeightClass: "h-[300px] sm:h-[370px] lg:h-[420px]",
  },
  {
    title: "Instant Two-Way Calendar Sync",
    description:
      "Real-time bidirectional sync with Google Calendar and Microsoft Outlook. Any change made in Scylla or external apps reflects instantly with zero lag.",
    imageSrc: "/images/calendar/why-chose-02.png",
    imageAlt: "Real-time two-way sync with Google Calendar and Outlook",
    wrapperWidthClass: "sm:max-w-[481px] w-full",
    imageHeightClass: "h-[300px] sm:h-[370px] lg:h-[420px]",
  },
];

const ROW_TWO_FEATURES: CalendarFeature[] = [
  {
    title: "Team Availability Overlay",
    description:
      "Layer teammates' schedules to spot mutual free slots instantly without asking around or comparing multiple calendars.",
    imageSrc: "/images/calendar/why-chose-03.jpg",
    imageAlt: "Team availability overlay showing mutual free slots",
    wrapperWidthClass: "sm:max-w-[339px] w-full",
    imageHeightClass: "h-[220px] sm:h-[260px] md:h-[280px]",
  },
  {
    title: "Project-Linked Meetings",
    description:
      "Link calendar events directly to active workspace projects. Access meeting agendas, client deliverables, and auto-assigned tasks in one place.",
    imageSrc: "/images/calendar/why-chose-04.png",
    imageAlt: "Project-linked meetings connecting calendar events to deliverables",
    wrapperWidthClass: "sm:max-w-[339px] w-full",
    imageHeightClass: "h-[220px] sm:h-[260px] md:h-[280px]",
  },
  {
    title: "1-Click Booking Links",
    description:
      "Share your custom availability link with clients. Guests select an open slot, and Scylla handles meeting room creation and calendar invites automatically.",
    imageSrc: "/images/calendar/why-chose-05.jpg",
    imageAlt: "Personalized 1-click booking link widget with Google Meet generation",
    wrapperWidthClass: "sm:max-w-[481px] w-full",
    imageHeightClass: "h-[220px] sm:h-[260px] md:h-[280px]",
  },
];

function FeatureCard({ feature }: { feature: CalendarFeature }) {
  return (
    <div
      className={`${feature.wrapperWidthClass} flex flex-col`}
      data-sttr-card=""
    >
      <div className="p-4 sm:p-5 rounded-20 border border-lineColor/70 bg-gradient-to-b from-white/[0.04] to-transparent relative z-1 overflow-hidden h-full flex flex-col justify-between hover:border-white/20 transition-all duration-300">
        {/* Feature Image Preview */}
        <div
          className={`overflow-hidden rounded-xl md:rounded-2xl border border-white/10 bg-black/40 ${feature.imageHeightClass} w-full shrink-0`}
        >
          <img
            className="w-full h-full object-cover object-center hover:scale-[1.02] transition-transform duration-500 select-none"
            src={feature.imageSrc}
            alt={feature.imageAlt}
            loading="lazy"
          />
        </div>

        {/* Feature Content */}
        <div className="pt-5 md:py-5 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl !leading-tight font-medium sm:tracking-[0.2px] text-offWhite min-h-[2.75rem] flex items-center">
              {feature.title}
            </h3>
            <div className="my-4 gradient-border w-full h-[1px]" />
          </div>
          <p className="text-offWhite/60 text-sm sm:text-base leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Calendar() {
  return (
    <section
      className="section-bottom-border bg-[#09090b]"
      id="calendar-features"
      data-container="calendar-features"
    >
      <div className="container">
        <div className="border-container section-spacing-lg">
          {/* Section Header */}
          <div
            className="max-w-[500px] sm:max-w-[580px] lg:max-w-[700px] mx-auto text-center mb-10 sm:mb-12 md:mb-16 xl:mb-20"
            data-section-title=""
          >
            <span className="badge-button mb-5" data-subtitle="">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5 animate-pulse" />
              Scylla Smart Calendar
            </span>
            <h2
              className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.2] font-semibold -tracking-[0.4px]"
              data-title=""
            >
              Visual Scheduling Designed for Deep Work
            </h2>
            <p
              className="mt-4 md:mt-5 text-offWhite/80 text-sm sm:text-base lg:text-lg"
              data-excerpt=""
            >
              Connect your tasks directly to your timeline. Say goodbye to
              fragmented apps, double bookings, and endless schedule coordination.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="flex flex-col gap-5">
            {/* Row 1: 2 Cards (Large + Medium) */}
            <div
              className="grid sm:grid-cols-2 lg:flex gap-5 items-stretch"
              data-sttr-wrapper=""
            >
              {ROW_ONE_FEATURES.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </div>

            {/* Row 2: 3 Cards (Small + Small + Medium) */}
            <div
              className="grid sm:grid-cols-2 md:flex gap-5 items-stretch"
              data-sttr-wrapper=""
            >
              {ROW_TWO_FEATURES.map((feature) => (
                <FeatureCard key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Calendar;