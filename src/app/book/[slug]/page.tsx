import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MeetingInviteService } from "@/services/meeting-invite";
import { MeetingBookingClient } from "@/components/booking/meeting-booking-client";
import { CalendarX } from "lucide-react";
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <CalendarX className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Meeting Link Unavailable
          </h1>
          <p className="text-muted-foreground text-sm">
            This invitation link does not exist, has expired, or is no longer
            accepting new bookings.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "text-xs",
              )}
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <MeetingBookingClient details={details} />;
}

export default function BookingPage(props: BookingPageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-neutral-400 dark:bg-slate-950">
          Loading booking details...
        </div>
      }
    >
      <BookingContent {...props} />
    </Suspense>
  );
}
