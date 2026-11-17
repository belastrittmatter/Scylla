import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  MeetingInviteService,
  toPublicInviteDetails,
} from "@/services/meeting-invite";
import { MeetingBookingClient } from "@/components/booking/meeting-booking-client";
import { Eyebrow } from "@/components/landing/primitives";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import Link from "next/link";

interface BookingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: BookingPageProps,
): Promise<Metadata> {
  const { slug } = await props.params;
  const details = await MeetingInviteService.getInviteBySlug(slug);

  if (!details || !details.invite.isActive) {
    return {
      title: "Meeting Not Found | Scylla",
      description:
        "The requested meeting invite is unavailable or has expired.",
    };
  }

  return {
    title: `${details.invite.title} | Schedule with ${details.organizer?.name || "Team"}`,
    description:
      details.invite.description ||
      `Pick a time to meet with ${details.organizer?.name || "our team"} based on mutual calendar availability.`,
  };
}

async function BookingContent(props: BookingPageProps) {
  const { slug } = await props.params;
  if (!slug) {
    notFound();
  }

  const details = await MeetingInviteService.getInviteBySlug(slug);

  if (!details || !details.invite.isActive) {
    return (
      <div className="max-w-xl py-6 sm:py-16">
        <Eyebrow className="text-ink-2">Booking link</Eyebrow>
        <h1 className="text-ink mt-4 text-balance text-3xl font-medium leading-tight tracking-[-0.02em]">
          This meeting link is unavailable
        </h1>
        <p className="text-ink-2 mt-3 text-pretty text-base leading-relaxed">
          This invitation link does not exist, has expired, or is no longer
          accepting new bookings.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "mt-6 h-9 px-4")}
        >
          Return to home
        </Link>
      </div>
    );
  }

  return <MeetingBookingClient details={toPublicInviteDetails(details)} />;
}

export default function BookingPage(props: BookingPageProps) {
  return (
    <Suspense
      fallback={
        <p role="status" className="text-ink-2 py-16 text-sm">
          Loading booking details…
        </p>
      }
    >
      <BookingContent {...props} />
    </Suspense>
  );
}
