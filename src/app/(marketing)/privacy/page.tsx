import type { Metadata } from "next";
import {
  DemoNotice,
  LegalContact,
  LegalLinks,
  LegalList,
  LegalPage,
  LegalSection,
  legalLinkClass,
} from "@/components/landing/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | Scylla",
  description:
    "What data the hosted Scylla demo stores, why, who it is shared with, and how Google user data is handled under the Limited Use requirements.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage badge="Legal" title="Privacy Policy">
      <DemoNotice>
        <p>
          Because the Demo can be reset or lost at any time, we recommend trying
          it with a test Google account rather than your main work account.
        </p>
        <LegalLinks
          links={[
            { href: "/terms", label: "Terms of Service" },
            { href: "/ai-policy", label: "AI & MCP Policy" },
          ]}
        />
      </DemoNotice>

      <LegalSection title="1. Who is responsible">
        <p>
          The hosted demo on this website (the &ldquo;Demo&rdquo;) is run by the
          maintainers of the open-source Scylla project (&ldquo;we&rdquo;). This
          policy only covers the Demo. If someone runs their own copy of Scylla,
          that operator is responsible for the data in it.
        </p>
      </LegalSection>

      <LegalSection title="2. What we store">
        <LegalList>
          <li>
            <strong>Your Google account:</strong> name, email address, profile
            picture and Google account ID, plus the OAuth access and refresh
            tokens Google issues, so Scylla can work with your calendar.
          </li>
          <li>
            <strong>Sign-in sessions:</strong> session tokens, IP address and
            browser user agent.
          </li>
          <li>
            <strong>Bookings made through Scylla:</strong> title, time, room,
            Google Meet link, project link, and the names and email addresses of
            attendees.
          </li>
          <li>
            <strong>Meeting rooms:</strong> name, capacity and location of rooms
            in your Google Workspace.
          </li>
          <li>
            <strong>Workspace content:</strong> teams and members (including the
            email addresses of people you invite, even before they sign in),
            projects, tasks, task comments, time tracking sessions, working
            hours, event types and booking links.
          </li>
          <li>
            <strong>Booking-link guests:</strong> the name and email address a
            guest enters, and the slot they pick.
          </li>
          <li>
            <strong>Connected AI assistants:</strong> the client&apos;s
            registration details, its tokens, the permissions you granted and
            your consent records.
          </li>
        </LegalList>
        <p>
          Other events in your Google Calendar are read live from Google when
          you view your calendar or when availability is checked. They are not
          copied into our database.
        </p>
        <p>
          We use only the cookies needed to keep you signed in. Your theme
          choice is saved in your browser. There are no analytics, advertising
          or tracking tools.
        </p>
      </LegalSection>

      <LegalSection title="3. How we use it">
        <p>
          Only to run the Demo&apos;s features for you and your teammates:
          showing calendars and availability, finding slots, booking and
          changing meetings and rooms, running projects and tasks, and letting
          assistants you connect do the same on your behalf. We also use it to
          keep the Demo secure and to fix problems. We don&apos;t sell your
          data, show ads or build profiles.
        </p>
      </LegalSection>

      <LegalSection title="4. Google user data">
        <p>Scylla asks Google for these permissions:</p>
        <LegalList>
          <li>
            <strong>Basic profile and email</strong>, to sign you in.
          </li>
          <li>
            <strong>Calendar read access</strong>, to show your calendar and
            check free/busy times.
          </li>
          <li>
            <strong>Calendar event access</strong>, to create, change and cancel
            the meetings you book through Scylla, including Google Meet links
            and invitations.
          </li>
          <li>
            <strong>Workspace calendar resources (read-only)</strong>, to list
            your organization&apos;s meeting rooms.
          </li>
        </LegalList>
        <p>
          Scylla&apos;s use and transfer of information received from Google
          APIs to any other app will adhere to the{" "}
          <a
            href="https://developers.google.com/terms/api-services-user-data-policy"
            target="_blank"
            rel="noopener noreferrer"
            className={legalLinkClass}
          >
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements. In particular:
        </p>
        <LegalList>
          <li>We do not sell Google user data.</li>
          <li>We do not use Google user data for advertising.</li>
          <li>We do not use Google user data to train AI or ML models.</li>
          <li>
            Google user data goes to an AI assistant only when you connect that
            assistant and it requests the data on your behalf.
          </li>
          <li>
            People only look at your data when needed to fix a problem with the
            Demo, keep it secure, comply with the law, or when you ask us to.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="5. Who else sees your data">
        <LegalList>
          <li>
            <strong>Your teammates</strong> see what the features show them,
            such as your availability, shared bookings, projects and tasks.
          </li>
          <li>
            <strong>Google</strong> receives the bookings, invitations and room
            reservations Scylla creates for you.
          </li>
          <li>
            <strong>AI assistants you connect</strong> receive what they request
            within the permissions you granted. What they do with it is governed
            by their provider&apos;s policies.
          </li>
          <li>
            <strong>Infrastructure providers</strong> that host the Demo and its
            database process data on our behalf.
          </li>
          <li>
            <strong>Authorities</strong>, if the law requires it.
          </li>
        </LegalList>
      </LegalSection>

      <LegalSection title="6. Security">
        <p>
          The Demo is served over HTTPS, and access to its data is limited to
          the maintainers. It is still a demo run by volunteers, not a hardened,
          audited service. We cannot guarantee the security of your data, which
          is another reason not to store anything sensitive in it.
        </p>
      </LegalSection>

      <LegalSection title="7. How long we keep it">
        <p>
          We keep your data until you delete your account, or until the Demo is
          reset or shut down, whichever comes first. Deleting your account in
          your account settings removes your profile and the data tied to it.
          Copies in our providers&apos; backups or logs may remain for a short
          time. You can also remove Scylla&apos;s access to your Google account
          at any time at{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className={legalLinkClass}
          >
            myaccount.google.com/permissions
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="8. Your rights">
        <p>
          You can see and change most of your data in the app, and delete your
          account in your account settings. Depending on where you live (for
          example, under the GDPR in the EU and UK), you may also have the right
          to request access to, correction, deletion or a copy of your data, to
          object to or restrict its processing, and to complain to your data
          protection authority. To make a request, see Contact below.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>The Demo is not meant for anyone under 16.</p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update this policy. The date at the top shows the latest
          version.
        </p>
      </LegalSection>

      <LegalContact>
        Questions about this policy or your data? Open an issue on GitHub:
      </LegalContact>
    </LegalPage>
  );
}
