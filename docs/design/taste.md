# Taste and direction

<!-- Written for the Scylla ui-refine-loop batch (11 targets, one branch each, from origin/main 32f78b9).
Checkers and fixers read it before any playbook and cite rules by id (T3, S5). -->

## Direction

**Project-wide (every target):**

- **Goal:** Every page should look super clean and distinctive, like one product with the landing page (`src/app/(marketing)`, `src/components/landing/*`), not stock shadcn.
- **Direction:** Roughly the landing's language. That means the blueprint frame (dashed `border-line` rails, hairline dividers), mono uppercase eyebrows with the small ember dot (`Eyebrow` in `landing/primitives.tsx`), the warm paper/ink/line palette, ember used sparingly as the single accent, and Inter + the mono code font for labels, IDs, counts and keyboard hints. Use Cloudflare's dashboard as a *very rough* reference for the app pages: dense but calm, a clear page header (title, one-line description, one primary action on the right), thin-bordered panels instead of shadowed cards, crisp tables and lists with mono metadata, grouped left navigation, orange accent only for the primary action or the active state, and almost no decoration.
- **Work pages vs public pages:** Work pages (calendar, tasks, projects, teams, settings, support, the shell) are used daily, so keep them dense and quiet, with no hero-sized type or marketing sections. Public pages (sign-in, consent, booking, legal) can lean closer to the landing's look.
- **Keep:** All behavior, routes, data and copy meaning. Accessibility (labels, focus, contrast). Both themes and both widths.
- **Avoid:** New marketing-style sections on app pages, gradients or glows, a card inside a card, emoji, and one-off hex colors next to tokens.
- **Shared code:** Shared components (`src/components/ui`, `layout`) may be changed. Other loops run in parallel on other branches, though, so keep shared edits small and purposeful. **Only the `app-shell` loop changes the app-wide `:root` / `.dark` tokens in `src/app/globals.css`.** For example, it may lift the landing's paper/ink/line/ember palette from `.landing` scope into the app. Other loops use the existing tokens, and if they need landing tokens they scope them locally (for example by adding the `landing`-style class on their own page wrapper).
- **Users:** Small teams scheduling meetings and tracking tasks. Some are daily power users, some are first-time invitees (booking, consent, sign-in).
- **Reference:** The Scylla landing page (`/`). Cloudflare dashboard (rough).

### sign-in (`/auth/sign-in`)
- **Direction:** Lean toward the landing. A confident, branded first impression; the Google button is the obvious single action, and the showcase supports it rather than competing with it.

### consent (`/consent`)
- **Direction:** Calm and trustworthy, close to the landing look. The scopes read as a clear list with mono scope ids, and Allow / Deny are unambiguous.

### booking (`/book/[slug]`)
- **Direction:** Public, invitee-facing. Landing look: the meeting title, duration and organizer lead, picking a slot is effortless, and mobile 390 is a priority.

### calendar (`/calendar`)
- **Direction:** A dense work view. Quiet grid, clear today/now marker in ember, a mono time gutter, a toolbar like Cloudflare's (compact, grouped).

### tasks (`/tasks`)
- **Direction:** A dense work view. Clean list/board/timeline rows, mono metadata (ids, dates, estimates), status and priority readable without loud color.

### projects (`/projects`, also `/teams/engineering-core/projects/task-workspace-dashboard`)
- **Direction:** A dense work view. A Cloudflare-style resource list or table, and a project detail with a clear header and sections.

### teams (`/teams`, also `/teams/engineering-core`)
- **Direction:** A dense work view. Member lists like a Cloudflare members table: roles as quiet mono badges, actions in a row menu.

### settings (`/settings`, also `/account/settings`)
- **Direction:** Cloudflare-style settings. Each setting is a row (label and help on the left, control on the right) in thin-bordered groups, with section eyebrows.

### support (`/support`)
- **Direction:** Quiet and helpful. Clear options, no tile grid (S1).

### legal (`/privacy`, also `/terms`, `/ai-policy`)
- **Direction:** Landing look, built for reading: a comfortable measure, a clear heading hierarchy, a sticky table of contents on desktop if it fits.

### app-shell (dashboard sidebar and header, `src/components/layout/*`, screenshotted on `/teams`)
- **Direction:** Cloudflare-style grouped left navigation with the landing's language: a crisp active state with an ember marker, mono section eyebrows, and a compact header with breadcrumbs. This loop owns the app-wide tokens in `globals.css` and may bring the landing palette into the app.

## Taste rules

| id | Rule |
|---|---|
| T1 | **One product.** Pages share the landing's visual language (palette, eyebrows, rails, type). Refine toward it; don't invent a third style. |
| T2 | **The primary task leads.** The first thing the eye lands on is what the visitor came for: the key figure, the main action, the content. |
| T3 | **One color per meaning, from tokens.** Ember marks the primary action, the active state or "now", and nothing else. No raw hex next to a token. |
| T4 | **One spacing scale, one type scale.** Every gap and size comes from the repo's scale. Related things sit closer than unrelated things. |
| T5 | **Aligned edges.** Content reads along a left edge. Labels, figures and actions line up across rows and sections. |
| T6 | **Both themes are real.** Dark mode gets the same hierarchy and contrast as light. Nothing disappears, glows or turns muddy. |
| T7 | **Both widths are real.** At 390 nothing clips, scrolls sideways or shrinks below a 24px tap target. Tables scroll or collapse inside themselves. |
| T8 | **Cut before you add.** Remove duplicate actions, redundant copy and decorative chrome before adding a section, a color or an animation. |
| T9 | **Honest copy.** Labels say what things do. Errors say what failed and how to fix it. Claims match the product. |
| T10 | **Reuse, then extend.** Use the repo's shared components and landing primitives and extend them by prop. A one-off copy is a problem even when it looks good. |
| T11 | **Mono for machine values.** IDs, slugs, times, counts, durations and keyboard hints use the mono code font at a small size. Prose never does. |
| T12 | **Hairlines over shadows.** Panels separate with 1px `line`/`border` and spacing, not drop shadows or nested cards. |

## Slop tells

Check every screenshot for these. Each hit is a problem citing the tell and the rule it breaks.

- **S1** A grid of equal tiles, each with an icon on top, a bold title and two lines of filler. (T2, T8)
- **S2** Gradient text, glow, shimmer or pulse rings used as decoration. (T3)
- **S3** Icon-in-a-tile section headers, or emoji as icons. (T8)
- **S4** Pastel washes, tinted banners and badges on everything. (T3, T8)
- **S5** Everything centered, with no edge to read along. (T5)
- **S6** Decorative backgrounds (blobs, mesh gradients) competing with the task. (T2)
- **S7** Fake-precise stats or unverifiable claims. (T9)
- **S8** Oversized padding and type on a working app page. (T4)
- **S9** Repeated chrome: two headers, a card inside a card, two CTAs saying the same thing. (T8)
- **S10** Dark mode as inverted light mode: pure-black surfaces, unreadable gray text, colors that lose meaning. (T6)
- **S11** Stock shadcn: the default gray card with a shadow, the default badge colors, nothing of the landing's language. (T1)

## When the brief is open-ended

1. **Name the page type** (marketing, app or dashboard, settings, content) and write the visitor's job in one sentence.
2. **Check the slop tells** against every shot, in both themes and at both widths.
3. **Rank by what blocks the job.** Anything that pushes the task below the fold, or breaks a theme or a width, is P1. Off-taste chrome (S11 included) is P2. Polish is P3.
4. **Prefer cutting over adding** (T8). A problem that adds something must say which job it serves.
