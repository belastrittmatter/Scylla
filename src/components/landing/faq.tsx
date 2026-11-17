import { Plus } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/github-repo";
import { Section, SectionHeading } from "@/components/landing/primitives";

const FAQS = [
  {
    q: "How do AI agents connect to Scylla?",
    a: "Through the Model Context Protocol. Point any MCP client, such as Claude, Cursor, Windsurf or Codex, at your Scylla MCP endpoint and sign in once over OAuth. The agent can then check availability, book rooms and manage tasks within the scopes you granted.",
  },
  {
    q: "Is Scylla only a calendar?",
    a: "No. Teams get projects with task boards, comments and time tracking. Meetings can be linked to a project, so the booking, the tasks it's about and the follow-ups live in the same place.",
  },
  {
    q: "Which calendars does Scylla work with?",
    a: "Google Calendar. Scylla reads free/busy live and writes bookings, including Google Meet links, straight into it.",
  },
  {
    q: "How are meeting rooms handled?",
    a: "Rooms are synced from your Google Workspace with their capacity and office. Scylla only proposes rooms that fit the group and are free at that time, and reserves the room together with the meeting.",
  },
  {
    q: "Can agents see everyone's calendar?",
    a: "No. An agent only gets the scopes its user consented to, every action runs as that user, and revoking a client cuts off its access.",
  },
  {
    q: "Does it work across timezones?",
    a: "Yes. Working hours are evaluated per attendee in their own timezone before any slot is suggested.",
  },
];

export function LandingFaq() {
  return (
    <Section className="border-t">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-16">
        <SectionHeading
          index="04"
          eyebrow="FAQ"
          title="Questions, answered."
          lede={
            <>
              The short version. The{" "}
              <a
                href={`${GITHUB_REPO_URL}#readme`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink underline underline-offset-4 hover:text-ember"
              >
                README
              </a>{" "}
              covers the rest.
            </>
          }
        />
        <div className="reveal divide-y divide-line border-y border-line">
          {FAQS.map((item, i) => (
            <details key={item.q} open={i === 0} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-ink [&::-webkit-details-marker]:hidden">
                <span className="font-medium">{item.q}</span>
                <Plus
                  className="size-4 shrink-0 text-ember transition-transform duration-300 group-open:rotate-45"
                  aria-hidden="true"
                />
              </summary>
              <p className="max-w-[600px] pb-6 text-sm leading-relaxed text-ink-2">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  );
}
