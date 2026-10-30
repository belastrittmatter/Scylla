"use client";

import * as React from "react";
import { HardLink } from "./hard-link";

export interface LandingPricingProps {
  defaultYearly?: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  iconHref: string;
  monthlyPrice: string;
  yearlyPrice: string;
  description: string;
  isFeatured?: boolean;
  features: string[];
}

const PRICING_PLANS: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    iconHref: "#starter",
    monthlyPrice: "$19",
    yearlyPrice: "$190",
    description:
      "Perfect for freelancers, startups, or small teams getting started with AI workflows.",
    features: [
      "Up to 3 active projects",
      "Basic automation tools",
      "Email support",
      "Standard analytics dashboard",
    ],
  },
  {
    id: "professional",
    name: "Professional",
    iconHref: "#professional",
    monthlyPrice: "$49",
    yearlyPrice: "$490",
    description:
      "Best for growing teams who need advanced tools and integrations.",
    isFeatured: true,
    features: [
      "Everything in Starter",
      "Advanced AI automation",
      "Integrations with Slack, Google Drive",
      "Priority email + chat support",
      "Advanced analytics & reporting",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    iconHref: "#enterprise",
    monthlyPrice: "$99",
    yearlyPrice: "$990",
    description:
      "Perfect for freelancers, startups, or small teams getting started with AI workflows.",
    features: [
      "Everything in Professional",
      "Custom AI model training",
      "Dedicated account manager",
      "On-premise or private cloud deployment",
      "24/7 support with SLA",
    ],
  },
];

export function LandingPricing({ defaultYearly = false }: LandingPricingProps) {
  const [isYearly, setIsYearly] = React.useState(defaultYearly);
  const periodLabel = isYearly ? "/year" : "/mo";

  return (
    <section className="section-bottom-border" id="pricing">
      <div className="container">
        <div className="border-container section-spacing-lg">
          {/* Section Title */}
          <div
            className="max-w-[450px] sm:max-w-[520px] lg:max-w-[600px] mx-auto text-center mb-10 sm:mb-12 md:mb-16 xl:mb-20"
            data-section-title=""
          >
            <span className="badge-button mb-5" data-subtitle="">
              Pricing Plans
            </span>
            <h2
              className="gradient-text text-3xl sm:text-4xl lg:text-5xl xl:text-[51px] !leading-[1.2] font-semibold -tracking-[0.4px] overflow-hidden"
              data-title=""
            >
              Smart Pricing That Scales With Your Growth
            </h2>
            <p
              className="mt-4 md:mt-5 text-offWhite/80 overflow-hidden"
              data-excerpt=""
            >
              Choose a plan that fits your needs—whether you&apos;re a solo
              creator or a growing team. Simple, transparent pricing with No
              hidden charges — only value.
            </p>
          </div>

          {/* Pricing Table */}
          <div className="flex flex-col items-center" data-sttr-wrapper="">
            <div data-sttr-card="">
              <div
                className="toggle-wrapper inline-flex items-center justify-center gap-4 relative"
                data-lag="0.05"
              >
                <div className="flex items-end sm:items-start gap-1.5 absolute left-[80%] sm:left-full bottom-full">
                  <svg
                    width="36"
                    height="20"
                    viewBox="0 0 36 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <mask id="drawMask">
                        <rect width="36" height="20" fill="black" />
                        <path
                          id="revealStroke"
                          fill="none"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M35.4425 1.05272C35.8034 1.27768 35.9136 1.7526 35.6886 2.11349C35.4636 2.47437 34.9887 2.58456 34.6278 2.3596L35.0352 1.70616L35.4425 1.05272ZM15.0222 10.8354L14.2599 10.9446L15.0222 10.8354ZM27.204 6.08888L27.7276 5.52431L27.204 6.08888ZM1.62019 18.9488C1.19753 18.9957 0.816829 18.6912 0.769865 18.2685L0.00454224 11.3809C-0.0424219 10.9582 0.262138 10.5775 0.684796 10.5306C1.10745 10.4836 1.48816 10.7882 1.53512 11.2108L2.21541 17.3331L8.33773 16.6528C8.76039 16.6059 9.14109 16.9104 9.18806 17.3331C9.23502 17.7558 8.93046 18.1365 8.5078 18.1834L1.62019 18.9488ZM35.0352 1.70616L34.6278 2.3596C34.4838 2.26984 34.062 2.11601 33.3247 1.96494C32.6225 1.82105 31.7193 1.69596 30.6886 1.61932C28.6244 1.46584 26.0968 1.51025 23.7029 1.96138C21.296 2.41497 19.1093 3.26371 17.6373 4.65131C16.206 6.00048 15.3826 7.92022 15.7844 10.7263L15.0222 10.8354L14.2599 10.9446C13.7916 7.67385 14.7628 5.24455 16.581 3.5307C18.3583 1.8553 20.8758 0.927057 23.4177 0.448022C25.9727 -0.0334738 28.6387 -0.0773411 30.8028 0.0835597C31.8862 0.164116 32.8559 0.296875 33.6339 0.456291C34.3768 0.608532 35.0426 0.80347 35.4425 1.05272L35.0352 1.70616ZM15.0222 10.8354L15.7844 10.7263C16.3581 14.7331 17.8982 16.7615 19.5609 17.6027C21.2364 18.4503 23.2624 18.2088 25.0513 17.1959C26.8414 16.1823 28.2719 14.4589 28.7417 12.5556C29.1995 10.7009 28.769 8.59057 26.6804 6.65344L27.204 6.08888L27.7276 5.52431C30.2071 7.82397 30.8352 10.5007 30.2369 12.9246C29.6506 15.3 27.9104 17.3467 25.8101 18.5359C23.7087 19.7258 21.1249 20.1198 18.8657 18.9769C16.594 17.8275 14.8749 15.2393 14.2599 10.9446L15.0222 10.8354ZM27.204 6.08888L26.6804 6.65344C24.1154 4.27451 21.4923 3.69823 18.948 4.14377C16.3543 4.59794 13.7748 6.12828 11.4057 8.10106C6.65559 12.0567 3.06834 17.4996 2.13643 18.6645L1.53516 18.1835L0.933884 17.7024C1.74223 16.692 5.51052 11.0062 10.4203 6.91765C12.8812 4.86835 15.7077 3.14775 18.6823 2.62685C21.7063 2.09732 24.8137 2.82183 27.7276 5.52431L27.204 6.08888Z"
                        />
                      </mask>
                    </defs>

                    <path
                      fill="#D4D4D8"
                      mask="url(#drawMask)"
                      d="M35.4425 1.05272C35.8034 1.27768 35.9136 1.7526 35.6886 2.11349C35.4636 2.47437 34.9887 2.58456 34.6278 2.3596L35.0352 1.70616L35.4425 1.05272ZM15.0222 10.8354L14.2599 10.9446L15.0222 10.8354ZM27.204 6.08888L27.7276 5.52431L27.204 6.08888ZM1.62019 18.9488C1.19753 18.9957 0.816829 18.6912 0.769865 18.2685L0.00454224 11.3809C-0.0424219 10.9582 0.262138 10.5775 0.684796 10.5306C1.10745 10.4836 1.48816 10.7882 1.53512 11.2108L2.21541 17.3331L8.33773 16.6528C8.76039 16.6059 9.14109 16.9104 9.18806 17.3331C9.23502 17.7558 8.93046 18.1365 8.5078 18.1834L1.62019 18.9488ZM35.0352 1.70616L34.6278 2.3596C34.4838 2.26984 34.062 2.11601 33.3247 1.96494C32.6225 1.82105 31.7193 1.69596 30.6886 1.61932C28.6244 1.46584 26.0968 1.51025 23.7029 1.96138C21.296 2.41497 19.1093 3.26371 17.6373 4.65131C16.206 6.00048 15.3826 7.92022 15.7844 10.7263L15.0222 10.8354L14.2599 10.9446C13.7916 7.67385 14.7628 5.24455 16.581 3.5307C18.3583 1.8553 20.8758 0.927057 23.4177 0.448022C25.9727 -0.0334738 28.6387 -0.0773411 30.8028 0.0835597C31.8862 0.164116 32.8559 0.296875 33.6339 0.456291C34.3768 0.608532 35.0426 0.80347 35.4425 1.05272L35.0352 1.70616ZM15.0222 10.8354L15.7844 10.7263C16.3581 14.7331 17.8982 16.7615 19.5609 17.6027C21.2364 18.4503 23.2624 18.2088 25.0513 17.1959C26.8414 16.1823 28.2719 14.4589 28.7417 12.5556C29.1995 10.7009 28.769 8.59057 26.6804 6.65344L27.204 6.08888L27.7276 5.52431C30.2071 7.82397 30.8352 10.5007 30.2369 12.9246C29.6506 15.3 27.9104 17.3467 25.8101 18.5359C23.7087 19.7258 21.1249 20.1198 18.8657 18.9769C16.594 17.8275 14.8749 15.2393 14.2599 10.9446L15.0222 10.8354ZM27.204 6.08888L26.6804 6.65344C24.1154 4.27451 21.4923 3.69823 18.948 4.14377C16.3543 4.59794 13.7748 6.12828 11.4057 8.10106C6.65559 12.0567 3.06834 17.4996 2.13643 18.6645L1.53516 18.1835L0.933884 17.7024C1.74223 16.692 5.51052 11.0062 10.4203 6.91765C12.8812 4.86835 15.7077 3.14775 18.6823 2.62685C21.7063 2.09732 24.8137 2.82183 27.7276 5.52431L27.204 6.08888Z"
                    />
                  </svg>

                  <span className="text-tertiary text-sm font-medium sm:whitespace-nowrap">
                    20% Saved
                  </span>
                </div>
                <span className="monthly text-base sm:text-lg sm:-tracking-[0.2px] text-offWhite/40 duration-300">
                  Monthly
                </span>
                <label className="pricing-switch relative inline-block w-14 h-7 rounded-2xl bg-tertiary cursor-pointer">
                  <input
                    type="checkbox"
                    id="priceToggle"
                    className="hidden"
                    checked={isYearly}
                    onChange={(e) => setIsYearly(e.target.checked)}
                  />
                  <span className="pricing-switch-slider absolute w-5 h-5 rounded-full bg-offWhite top-1 left-1 transition-transform duration-300"></span>
                </label>
                <span className="yearly text-base sm:text-lg sm:-tracking-[0.2px] text-offWhite/40 duration-300">
                  Yearly
                </span>
              </div>
            </div>

            <div
              className="pricing-table grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 sm:mt-12"
              data-lag="0.1"
            >
              {PRICING_PLANS.map((plan) => (
                <div key={plan.id} data-sttr-card="">
                  <div
                    className={`pricing-card ${plan.isFeatured ? "active " : ""}bg-blue px-5 pt-5 pb-5 sm:pb-8 lg:pb-10 rounded-xl sm:rounded-2xl md:rounded-[20px] border border-lineColor/50 group border-moving relative before:rounded-xl sm:before:rounded-2xl md:before:rounded-[20px] z-[1]`}
                  >
                    <div className="flex items-center gap-4">
                      <svg className="w-6 h-6 fill-current text-offWhite/80">
                        <use href={plan.iconHref} />
                      </svg>
                      <span className="flex-1 text-base sm:text-lg !leading-none text-offWhite/80 font-medium sm:-tracking-[0.3px]">
                        {plan.name}
                      </span>
                    </div>
                    <div className="mt-4 md:mt-7">
                      <h3 className="price text-[40px] font-semibold !leading-tight tracking-tight">
                        {isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      </h3>
                      <span className="mt-2.5 flex gap-1 text-offWhite/60 text-sm tracking-[0.1px]">
                        /per user <span className="period">{periodLabel}</span>
                      </span>
                    </div>
                    <p className="mt-5 md:mt-7 text-offWhite/80">
                      {plan.description}
                    </p>
                    <HardLink
                      className={
                        plan.isFeatured
                          ? "mt-5 md:mt-7.5 w-full text-sm traking-[0.1px] text-white font-medium bg-linear-to-b from-offWhite to-platinum relative text-center rounded-xl z-1 before:absolute before:w-full before:h-full before:bg-linear-to-b before:from-slateBlue before:to-royalBlue before:top-0 before:left-0 before:-z-1 before:rounded-[11px] duration-300 before:duration-300 flex flex-col h-11 cursor-pointer"
                          : "mt-5 md:mt-7.5 w-full text-sm traking-[0.1px] text-secondary font-medium bg-linear-to-b from-offWhite to-platinum relative text-center rounded-xl z-1 before:absolute before:w-full before:h-full before:bg-linear-to-b before:from-slateBlue before:to-royalBlue before:top-0 before:left-0 before:-z-1 before:rounded-[11px] duration-300 before:duration-300 before:opacity-0 before:invisible group-hover:text-offWhite group-hover:before:opacity-100 group-hover:before:visible flex flex-col h-11 group-hover:!bg-transparent cursor-pointer"
                      }
                      href="/auth/sign-in"
                    >
                      <div className="overflow-hidden flex flex-col">
                        <span className="p-3 transform duration-300 group-hover:-translate-y-full">
                          Start for free
                        </span>
                        <span className="p-3 transform duration-300 group-hover:-translate-y-full">
                          Get Started
                        </span>
                      </div>
                    </HardLink>
                    {/* Features List */}
                    <div className="mt-6 md:mt-10">
                      <p className="text-lg font-medium !leading-snug tracking-tight mb-4">
                        Features:
                      </p>
                      <ul className="flex flex-col gap-3">
                        {plan.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-center gap-3 text-offWhite/60"
                          >
                            <svg className="w-5 h-5">
                              <use href="#pricingCheck" />
                            </svg>
                            <span className="flex-1">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
