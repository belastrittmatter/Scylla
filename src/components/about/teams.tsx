"use client";

import * as React from "react";

interface TeamMember {
  name: string;
  role: string;
  image: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Alex Chen",
    role: "Chief Executive Officer & Co-founder",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80",
    twitter: "https://x.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  },
  {
    name: "Michael Lee",
    role: "Head of Product",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
    twitter: "https://x.com",
    linkedin: "https://linkedin.com",
  },
  {
    name: "Sophia Rodriguez",
    role: "Chief Technology Officer",
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80",
    twitter: "https://x.com",
    linkedin: "https://linkedin.com",
    github: "https://github.com",
  }
];

export function Teams() {
  return (
    <section className="section-bottom-border bg-[#09090b] relative z-1 overflow-hidden" id="our-team">
      <div className="container">
        <div className="border-container section-spacing-lg">
          {/* Section Title */}
          <div
            className="max-w-[450px] sm:max-w-[540px] lg:max-w-[680px] mx-auto text-center mb-10 sm:mb-12 md:mb-16 xl:mb-20"
            data-section-title=""
          >
            <span className="badge-button mb-5" data-subtitle="">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block mr-1.5" />
              Meet the Builders
            </span>
            <h2
              className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.2] font-semibold -tracking-[0.4px]"
              data-title=""
            >
              The Team Behind Scylla
            </h2>
            <p
              className="mt-4 md:mt-5 text-offWhite/80 text-sm sm:text-base lg:text-lg leading-relaxed"
              data-excerpt=""
            >
              A focused crew of engineers, designers, and AI protocol architects
              dedicated to building the most fluid productivity tools in the
              world.
            </p>
          </div>

          {/* Team Cards Grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            data-sttr-wrapper=""
          >
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="p-2 sm:p-2.5 bg-[#121215] rounded-[20px] border border-lineColor/70 relative group overflow-hidden transition-all duration-300 hover:border-white/30"
                data-sttr-card=""
              >
                {/* Member Portrait */}
                <div className="overflow-hidden rounded-[16px] aspect-[4/5] bg-black/40 relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover object-center duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Subtle gradient vignette at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                </div>

                {/* Floating Member Info Bar */}
                <div className="p-4 sm:p-5 mt-2 bg-[#18181b]/80 backdrop-blur-md rounded-[16px] border border-white/5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg text-offWhite font-medium truncate">
                      {member.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-offWhite/60 truncate mt-0.5">
                      {member.role}
                    </p>
                  </div>

                  {/* Social Links */}
                  <div className="flex items-center gap-2 shrink-0">
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${member.name} on X`}
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-orange-500/20 text-offWhite/70 hover:text-orange-400 border border-white/10 transition-colors"
                      >
                        <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                        </svg>
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${member.name} on LinkedIn`}
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-orange-500/20 text-offWhite/70 hover:text-orange-400 border border-white/10 transition-colors"
                      >
                        <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74V9.93H5.06v8.57h2.8z" />
                        </svg>
                      </a>
                    )}
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${member.name} on GitHub`}
                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-orange-500/20 text-offWhite/70 hover:text-orange-400 border border-white/10 transition-colors"
                      >
                        <svg className="size-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                        </svg>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Teams;