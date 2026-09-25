# Business Rules — Event RSVP App

- **Derived from:** `docs/design/2026-09-24-design-brief.md` (Status: Approved, design sections 1–5)
- **Owner:** `analyst` agent
- **Traceability:** `BR-xx` → `REQ-xx` (spec) → `TASK-xx` (plan) → test named `REQ-xx: …`
- IDs are stable and never renumbered. A superseded rule is struck through and points to its replacement,
  e.g. `~~BR-07~~ Deprecated by BR-19`.

---

## Glossary

| Term | Definition |
|---|---|
| **Organizer** | A user signed in with Google or with a registered email and password (amendment A6). Creates and owns events; manages only the events they own. |
| **Guest** | An anonymous person, without an account, who submits an RSVP for an event through its invite link. |
| **Role** | Not a stored attribute. Contextual per event: the event's owner is its Organizer; everyone else is a Guest for that event. |
| **Event** | The entity an Organizer creates: name, description, date/time, timezone, optional location, unique slug. |
| **Slug** | A random 10-character nanoid identifying an event in its URL, chosen to prevent enumeration. |
| **Invite link** | The event's guest-facing URL (`/e/[slug]`), shared by the organizer for guests to RSVP. |
| **RSVP** | A guest's response to an event: name, response (Going / Not going), and party size. |
| **Party size** | Total number of people the RSVP covers, including the guest submitting it. 1–10 when Going; 0 when Not going. |
| **NameKey** | The normalized form (case-insensitive, trimmed) of an RSVP's guest name, used to detect duplicate names within an event. |
| **Edit token** | A 32-random-byte secret issued to a guest on RSVP submission, used later to identify their own RSVP in their browser. Only its SHA-256 hash is stored server-side. |
| **Sample event** | A demo event an Organizer can generate from an empty dashboard: dated 7 days ahead, pre-populated with 5 fictional RSVPs. |
| **Public demo event** | A seeded event linked from the signed-out home page so evaluators can see the app without signing in. |
| **Missing field (AI)** | A form field the AI event-parsing feature could not determine from the organizer's free text; returned as missing rather than guessed. |
| **Fill with AI** | The action that sends organizer free text to the AI parser and populates the event form; it never saves the event itself. |
| **AI provider** | A configured backend (OpenRouter, or optionally also Anthropic) able to serve a "Fill with AI" request. `AI_PROVIDERS` orders the providers tried for one request; by default it lists OpenRouter only. |
| **Theme** | The application's dark or light visual mode; user-selectable from the header and persisted across visits. |
| **Reduced motion** | An operating-system-level user preference (`prefers-reduced-motion`) indicating that animated transitions should be minimized. |
| **Target size** | The clickable or tappable area of an interactive control, measured in pixels. |
| **Password account** | A user account that has a password set (via registration or via the Account page), allowing sign-in with email and password in addition to any linked Google identity. |
| **Google-only account** | A user account with a linked Google identity but no password set. |
| **Account linking** | The process by which a single user account becomes reachable by both Google sign-in and email/password sign-in: either by a user setting a password on their Google-only account (Account page), or by a user signing in with Google using the email of an existing password account. |

---

## Business rules

### Identity & roles

#### BR-01 — Organizer authentication method
**Rule:** An Organizer signs in with Google, or with an email and password registered through the app's Register
page.
**Rationale:** Defines the supported identity methods for organizers.
**Source:** design brief §2 "Actors and roles"
**Amended:** 2026-09-25 — design brief §6 amendment A6 (email and password sign-in alongside Google).

#### BR-02 — Guest requires no account
**Rule:** A Guest RSVPs without creating an account or signing in.
**Rationale:** Keeps the RSVP flow frictionless for invitees.
**Source:** design brief §2 "Actors and roles"

#### BR-03 — Role is derived per event, not stored
**Rule:** For any given event, the user who owns it is treated as its Organizer, and every other user (or anonymous visitor) is treated as a Guest for that event; role is not a stored column.
**Rationale:** One user can be an Organizer on one event and a Guest on another; a single source of truth per event avoids inconsistent role state.
**Source:** design brief §2 "Actors and roles"

#### BR-95 — Signed-out access to organizer-only routes
**Rule:** A signed-out visitor requesting an organizer-only route (e.g. `/dashboard`, `/events/new`) is redirected
to the sign-in page (offering Google and email/password sign-in, per BR-154), and returned to the originally
requested page after signing in.
**Source:** Human decision 2026-09-24 (open question 8)
**Amended:** 2026-09-25 — design brief §6 amendment A6: the redirect target is no longer Google-only.

---

### Events

#### BR-04 — Event name required and bounded
**Rule:** Event name is required and must be at most 120 characters.
**Source:** design brief §2 "Events"

#### BR-05 — Event description required and bounded
**Rule:** Event description is required and must be at most 2000 characters (a short description is acceptable).
**Source:** design brief §2 "Events"

#### BR-06 — Event location optional
**Rule:** Event location is optional.
**Source:** design brief §2 "Events"

#### BR-07 — Only the owner may edit an event
**Rule:** Only the event's owner (Organizer) can edit the event.
**Rationale:** Preserves event data integrity and prevents guests or other organizers from altering it.
**Source:** design brief §2 "Events"

#### BR-08 — Only the owner may delete an event
**Rule:** Only the event's owner (Organizer) can delete the event.
**Source:** design brief §2 "Events"

#### BR-09 — Delete requires confirmation
**Rule:** Deleting an event requires the organizer to confirm the action before it is carried out.
**Rationale:** Deletion is destructive (removes RSVPs); confirmation prevents accidental loss.
**Source:** design brief §2 "Events"

#### BR-10 — Delete cascades to RSVPs
**Rule:** Deleting an event removes all of that event's RSVPs.
**Source:** design brief §2 "Events"

#### BR-11 — Field changes after RSVPs exist are allowed
**Rule:** The organizer may edit any event field — name, description, date/time, timezone, or location — even
after guests have RSVP'd, as long as the event has not yet ended (see BR-94).
**Source:** design brief §2 "Events"
**Amended:** 2026-09-24 — human decision (open question 5)

#### BR-12 — No guest notification on change
**Rule:** Guests are not notified when the organizer changes any event field, including date/time (email
notifications are out of scope).
**Source:** design brief §2 "Events"
**Amended:** 2026-09-24 — human decision (open question 5)

#### BR-13 — Events have no end time
**Rule:** An event has a start date/time only; there is no end-time field.
**Source:** design brief §2 "Events"

#### BR-14 — Event URL uses a random slug
**Rule:** Each event's URL uses a randomly generated 10-character nanoid slug rather than a sequential or guessable identifier.
**Rationale:** Prevents enumeration of events by guessing URLs.
**Source:** design brief §2 "Events"

---

### Event time & timezone

#### BR-15 — Date and time required
**Rule:** Event date and time are required fields.
**Source:** design brief §2 "Events"

#### BR-16 — Timezone required and in IANA format
**Rule:** Event timezone is required and must be a valid IANA timezone identifier.
**Source:** design brief §2 "Events"

#### BR-17 — Date/time entered in the event's timezone
**Rule:** The organizer enters the event date/time in the event's own timezone (not necessarily the organizer's current timezone).
**Source:** design brief §2 "Events"

#### BR-18 — Date/time stored as UTC instant plus timezone
**Rule:** The event's date/time is stored as a UTC instant together with its IANA timezone identifier.
**Source:** design brief §2 "Events"

#### BR-19 — Date/time always displayed in the event's timezone with label
**Rule:** The event's date/time is always displayed in the event's own timezone, with a timezone label (e.g. "7:00 PM EDT"), regardless of the viewer's local timezone.
**Source:** design brief §2 "Events"

#### BR-20 — Timezone field prefilled and editable
**Rule:** The event's timezone field is prefilled from the browser's detected timezone (`Intl`) but the organizer can edit it.
**Rationale:** The organizer may be creating an event for a location in a different timezone than their own.
**Source:** design brief §2 "Events"

#### BR-21 — Event date/time cannot be in the past
**Rule:** An event cannot be created with a date/time earlier than the current moment.
**Source:** design brief §2 "Events"

#### BR-90 — Edited date/time cannot be in the past
**Rule:** When the organizer edits an existing event's date/time (see BR-11), the new value cannot be earlier than
the current moment.
**Source:** Human decision 2026-09-24 (open question 5)

---

### RSVPs

#### BR-22 — Guest name length
**Rule:** An RSVP's guest name must be between 1 and 80 characters.
**Source:** design brief §2 "RSVPs"

#### BR-23 — Response has exactly two options
**Rule:** An RSVP's response is either "Going" or "Not going"; there is no "Maybe" option.
**Source:** design brief §2 "RSVPs"

#### BR-24 — Party size counts the guest
**Rule:** Party size represents the total number of people the RSVP covers, including the guest submitting it.
**Source:** design brief §2 "RSVPs"

#### BR-25 — Party size field label
**Rule:** The party size input is labeled "How many people, including you?".
**Source:** design brief §2 "RSVPs"

#### BR-26 — Party size range when Going
**Rule:** When the response is "Going", party size must be between 1 and 10.
**Source:** design brief §2 "RSVPs"

#### BR-27 — Party size is 0 when Not going
**Rule:** When the response is "Not going", party size is set to 0.
**Source:** design brief §2 "RSVPs"

#### BR-28 — Edit token issued on submit
**Rule:** When an RSVP is submitted, the server issues an edit token consisting of 32 random bytes.
**Source:** design brief §2 "RSVPs"

#### BR-29 — Only the token's hash is stored
**Rule:** The server stores only the SHA-256 hash of the edit token, never the raw token.
**Rationale:** Limits impact if the database is compromised; the raw token exists only in the guest's cookie.
**Source:** design brief §2 "RSVPs"

#### BR-30 — Edit token delivered via secure cookie
**Rule:** The raw edit token is set in an httpOnly, Secure, SameSite=Lax cookie scoped to the event's path.
**Source:** design brief §2 "RSVPs"

#### BR-31 — Edit token cookie validity
**Rule:** The edit token cookie remains valid until 30 days after the event's date/time.
**Source:** design brief §2 "RSVPs"

#### BR-32 — RSVPs close at event start
**Rule:** RSVP submission and editing close once the event's start time has passed.
**Source:** design brief §2 "RSVPs"

#### BR-33 — Ended-event page is read-only
**Rule:** Once RSVPs are closed, the event's guest-facing page displays "This event has ended" and accepts no further submissions or edits. This restriction applies only to the guest-facing page; for the organizer's own
capabilities after an event has ended, see BR-91–BR-94.
**Source:** design brief §2 "RSVPs"
**Amended:** 2026-09-24 — human decision (open question 6)

#### BR-91 — Organizer can view the guest list after an event has ended
**Rule:** After an event has ended, its organizer can still view the event's full guest list.
**Source:** Human decision 2026-09-24 (open question 6)

#### BR-92 — Organizer can remove RSVPs after an event has ended
**Rule:** After an event has ended, its organizer can still remove RSVPs from the event.
**Source:** Human decision 2026-09-24 (open question 6)

#### BR-93 — Organizer can delete the event after it has ended
**Rule:** After an event has ended, its organizer can still delete the event (subject to BR-09's confirmation and
BR-10's cascade).
**Source:** Human decision 2026-09-24 (open question 6)

#### BR-94 — Organizer cannot edit the event after it has ended
**Rule:** After an event has ended, its organizer can no longer edit the event's fields.
**Source:** Human decision 2026-09-24 (open question 6)

#### BR-34 — No RSVP capacity limit
**Rule:** There is no maximum number of RSVPs or total attendees an event can accept.
**Source:** design brief §2 "RSVPs"

---

### Guest RSVP editing

#### BR-35 — Returning guest sees their RSVP status
**Rule:** A guest returning to the event page in the same browser (holding a valid edit-token cookie for that
event) sees, instead of a blank RSVP form: "You're going · N people" (where N is their party size) with "Change"
and "Cancel RSVP" actions when their response is "Going", or "You're not going" with only a "Change" action when
their response is "Not going" (a "Cancel RSVP" action on an already "Not going" RSVP would change nothing).
**Source:** design brief §2 "RSVPs"; DESIGN.md; approved mockup
**Amended:** 2026-09-24 — human decision (DOC-Q3.1)
**Amended:** 2026-09-25 — human decision (DOC-Q4)

#### BR-36 — Cancel sets response to Not going, does not delete
**Rule:** Using "Cancel" on an existing RSVP sets its response to "Not going" rather than deleting the RSVP record.
**Rationale:** The organizer wants to know who declined, not just who is missing from the list.
**Source:** design brief §2 "RSVPs"

#### BR-37 — Same-browser duplicate name is treated as an edit
**Rule:** If a guest submits a name that matches (case-insensitive, trimmed) an existing RSVP on the same event, and
the request carries an edit-token cookie whose SHA-256 hash equals that specific RSVP's stored edit-token hash, the
submission is treated as an edit of that existing RSVP rather than a new one. An edit-token cookie only authorizes
editing the RSVP it was issued for; it never authorizes editing a different guest's RSVP, even one on the same
event.
**Source:** design brief §2 "RSVPs"
**Amended:** 2026-09-24 — human decision (open question 4)
**Amended:** 2026-09-24 — human decision (DOC-Q1): clarified that "valid cookie for that event" means the cookie's
hash matches the specific RSVP being duplicated, not merely any RSVP on the same event.

#### BR-38 — Different-browser duplicate name is blocked
**Rule:** If a guest submits a name that matches (case-insensitive, trimmed) an existing RSVP on the same event, and
the request does not carry an edit-token cookie whose SHA-256 hash equals that specific RSVP's stored edit-token
hash (never issued, cleared, expired, or valid only for a different RSVP of the same event), the submission is
blocked with `DUPLICATE_NAME` and the message "This name is already on the list. Use a different name or ask the
organizer."
**Rationale:** A cookie proving control of one RSVP must not let its holder silently take over another guest's RSVP
by submitting that guest's name; see BR-37.
**Source:** design brief §2 "RSVPs"
**Amended:** 2026-09-24 — human decision (open question 4)
**Amended:** 2026-09-24 — human decision (DOC-Q1): added the case where the cookie is valid for a different RSVP of
the same event, which is now also blocked as a duplicate rather than treated as an edit.

#### BR-39 — Name uniqueness enforced at the database level
**Rule:** Name uniqueness per event is enforced by a database unique constraint on `(eventId, nameKey)`, not only by application-level checks.
**Rationale:** Guarantees correctness under concurrent submissions of the same name.
**Source:** design brief §2 "RSVPs"; §3 "Data model"

#### BR-40 — No cross-device RSVP editing
**Rule:** A guest cannot edit an existing RSVP from a device/browser other than the one it was created on.
**Source:** design brief §2 "RSVPs"

#### BR-41 — Organizer can remove any RSVP
**Rule:** The event's organizer can remove any RSVP on their event, regardless of which guest or browser created it.
**Source:** design brief §2 "RSVPs"

---

### Guest list visibility

#### BR-42 — Organizer sees the full guest list
**Rule:** The organizer's view of an event shows, for every RSVP: guest name, response, party size, a date labeled
"Last updated" (the time of the RSVP's most recent change — submission, edit, or cancel), and a control to remove
it.
**Source:** design brief §2 "Guest list visibility"
**Amended:** 2026-09-24 — human decision (open question 9)

#### BR-43 — Organizer sees totals
**Rule:** The organizer's view of an event shows totals (e.g. going / declined / total people).
**Source:** design brief §2 "Guest list visibility"

#### BR-44 — Guest sees only the aggregate total and their own RSVP
**Rule:** A guest viewing the event page sees only the aggregate total (e.g. "14 people going") and the details of their own RSVP — not other guests' names or responses.
**Source:** design brief §2 "Guest list visibility"

#### BR-45 — Guest names never sent to non-owners
**Rule:** Guest names are never transmitted to the browser of anyone other than the event's owner.
**Rationale:** Enforces guest-list privacy at the data-transfer level, not only in the UI.
**Source:** design brief §2 "Guest list visibility"

---

### Dashboard & sample data

#### BR-46 — Dashboard lists upcoming and past events
**Rule:** The organizer dashboard ("My events") lists the organizer's events split into upcoming and past.
**Source:** design brief §2 "Organizer dashboard"

#### BR-47 — Dashboard shows per-event counts
**Rule:** Each event listed on the dashboard shows its going / declined / total people counts.
**Source:** design brief §2 "Organizer dashboard"

#### BR-48 — Empty dashboard offers event creation
**Rule:** When the organizer has no events, the dashboard's empty state offers a "Create event" action.
**Source:** design brief §2 "Organizer dashboard"

#### BR-49 — Empty dashboard offers a sample event
**Rule:** When the organizer has no events, the dashboard's empty state offers a "Create sample event" action.
**Source:** design brief §2 "Organizer dashboard"

#### BR-50 — Sample event content
**Rule:** The generated sample event is dated 7 days ahead of creation at 19:00 local time in the organizer's
browser timezone, and is pre-populated with 5 fictional RSVPs.
**Source:** design brief §2 "Organizer dashboard"
**Amended:** 2026-09-24 — human decision (open question 10)

#### BR-51 — Owner event page offers invite-link copy
**Rule:** The event page, viewed by its owner, includes a "Copy invite link" action.
**Source:** design brief §2 "Organizer dashboard"

#### BR-52 — Signed-out home page content
**Rule:** The signed-out home page is a single screen containing: an explanation of what the app does, a sign-in
action leading to the sign-in page (which offers Google and email/password sign-in, per BR-154), and a link to a
public (seeded) demo event.
**Source:** design brief §2 "Home (signed out)"
**Amended:** 2026-09-25 — design brief §6 amendment A6: the home page's sign-in action is no longer Google-only.

---

### AI event creation

#### BR-53 — Organizer can request AI fill from free text
**Rule:** On the event-creation form, the organizer can enter free text describing the event and trigger the "Fill with AI" action.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-54 — AI fills the structured event fields
**Rule:** The AI fill action populates the form's name, description, date, time, timezone, and location fields from the organizer's free text.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-55 — AI drafts a description when absent
**Rule:** If the organizer's input text describes an event but does not include a description, the AI drafts one,
written in the same language as the organizer's input text. This rule does not apply when the input text does not
describe an event at all (see BR-96).
**Source:** design brief §2 "AI feature — natural-language event creation"
**Amended:** 2026-09-24 — human decision (open question 7)
**Amended:** 2026-09-24 — human decision (DOC-Q2): scoped this rule to text that describes an event; non-event text
is governed by BR-96 instead, which takes precedence.

#### BR-96 — Non-event text yields an explicit "not found" message
**Rule:** When "Fill with AI" receives input text that does not describe an event, the AI returns every event field
empty and marked as missing, drafts no description (per the exception in BR-55), and the UI shows the translated
message "Couldn't find event details in that text."
**Rationale:** Distinguishes "text describes an event but omits some details" (ordinary missing-fields UX, BR-56/
BR-57) from "text is not about an event at all," so the organizer gets an actionable, specific message instead of a
form with every field flagged as missing and no explanation.
**Source:** Human decision 2026-09-24 (DOC-Q2)

#### BR-56 — AI reports fields it could not determine
**Rule:** For any field the AI cannot determine from the input text, the AI fill action returns that field's name in a list of missing fields instead of filling it.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-57 — Missing fields are highlighted in the UI
**Rule:** The event-creation UI visually highlights the fields the AI reported as missing.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-58 — AI never saves the event
**Rule:** The AI fill action only populates the form; it never persists (saves) the event. Saving requires the organizer to review and submit the form themselves.
**Rationale:** Keeps a human in the loop before any AI-derived data is committed, and ensures the AI has no path to writing data even under prompt injection.
**Source:** design brief §2 "AI feature — natural-language event creation"; §4 "Errors and security"

#### BR-59 — AI never invents absent data
**Rule:** For data absent from the organizer's input text, the AI returns the corresponding field as missing rather than inferring or guessing a value.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-60 — Timezone resolution priority
**Rule:** The AI fill action resolves the event's timezone in this priority order: (1) a timezone explicit in the input text (e.g. "7pm EST"); (2) otherwise, the form's current timezone field value; (3) otherwise, the timezone is reported as missing.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-61 — Explicit timezone in text updates the form field
**Rule:** When the input text contains an explicit timezone, the AI fill action also updates the form's timezone field to that value.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-62 — Reference date/time is the organizer's local time
**Rule:** The AI fill action resolves relative dates (e.g. "next Friday") using a reference "now" built from the organizer's own timezone, not the server's UTC day.
**Rationale:** Prevents a relative date like "tonight" from resolving to the wrong calendar day when the server's UTC date differs from the organizer's local date.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-63 — Supported input languages
**Rule:** The AI fill action understands organizer input written in English, French, or Brazilian Portuguese.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-64 — AI request timeout
**Rule:** The AI fill request times out after 10 seconds.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-65 — Fallback message on AI timeout or error
**Rule:** If the AI fill request times out or errors, the UI displays "Couldn't fill automatically — please fill the form."
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-66 — Manual form always available
**Rule:** The event-creation form can always be filled and submitted manually, independent of AI availability.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-67 — AI fill requires sign-in
**Rule:** The "Fill with AI" action is available only to signed-in users.
**Source:** design brief §2 "AI feature — natural-language event creation"

#### BR-68 — AI daily call limit
**Rule:** Each signed-in user is limited to 20 "Fill with AI" calls per day. The daily window is fixed and resets
at 00:00 UTC, regardless of the user's local timezone.
**Source:** design brief §2 "AI feature — natural-language event creation"; §4 "Errors and security"
**Amended:** 2026-09-24 — human decision (open question 1)

#### BR-89 — AI daily-limit UX
**Rule:** When an organizer has exceeded the AI daily call limit (BR-68), "Fill with AI" remains visible; using it
shows the message "Daily AI limit reached — fill the form manually." instead of calling the AI, and the manual
form continues to work as normal.
**Source:** Human decision 2026-09-24 (open question 3)

#### BR-69 — AI input is delimited against prompt injection
**Rule:** Organizer-supplied text is delimited within the AI prompt, separating it from instructions, as a prompt-injection mitigation.
**Source:** design brief §4 "Errors and security"

#### BR-70 — AI output is schema-constrained and validated
**Rule:** The AI's output is constrained to a structured schema and validated (with zod) before it is used to populate the form.
**Source:** design brief §4 "Errors and security"

### AI providers (amendment A3 — OpenRouter as a second provider)

#### BR-119 — AI providers are tried in a configured order
**Rule:** The AI fill action attempts providers in the order given by the `AI_PROVIDERS` configuration (default:
`openrouter` only) for one "Fill with AI" request. Anthropic is optional: an operator enables it by listing it
explicitly in `AI_PROVIDERS`, in either order (e.g. `openrouter,anthropic` or `anthropic,openrouter`), with its
API key configured.
**Source:** design brief §6 amendment A3
**Amended:** 2026-09-25 — human decision (OpenRouter default, Anthropic optional)

#### BR-120 — A provider without a configured key is skipped
**Rule:** A provider listed in `AI_PROVIDERS` with no API key configured is skipped without being attempted, and
the AI fill action proceeds to the next provider in the configured order.
**Source:** design brief §6 amendment A3

#### BR-121 — Failover to the next provider on an outage-type failure
**Rule:** When an attempted provider fails with a network error, an HTTP 5xx response, an HTTP 429 (rate limit)
response, an HTTP 401 (invalid or revoked key) response, an HTTP 403 (unauthorized key) response, a timeout, or an
insufficient-credit error, the AI fill action tries the next configured provider, provided the retry still fits
within the same 10-second request budget (BR-64). Other 4xx responses — HTTP 400 (except the insufficient-credit
case), 404, and 422 — do not trigger failover.
**Rationale:** These failure types indicate the provider itself is unavailable rather than a problem with the
request, so another provider can reasonably serve the same request. A misconfigured or revoked key makes that
provider unusable for every request, which is exactly the situation failover exists for. This rule has an effect
only when `AI_PROVIDERS` (BR-119) lists more than one provider; with the default single-provider configuration
there is no second provider to fail over to.
**Source:** design brief §6 amendment A3
**Amended:** 2026-09-24 — human decision (Phase 7 approval)
**Amended:** 2026-09-25 — human decision (OpenRouter default, Anthropic optional): noted that failover requires
more than one configured provider, since the default configuration now has only one.

#### BR-122 — Invalid model output is not retried on another provider
**Rule:** When a provider's output fails schema validation (BR-70), the AI fill action does not retry the request
on another configured provider.
**Rationale:** Schema-invalid output signals a model or prompt problem, not a provider outage; retrying on a
different provider would not fix the underlying issue and could mask a prompt regression.
**Source:** design brief §6 amendment A3

#### BR-123 — User-facing AI behavior is identical regardless of which provider answered
**Rule:** The messages shown to the organizer, the rule that AI never saves the event (BR-58), the handling of
missing fields (BR-56, BR-57), and the non-event message (BR-96) are the same whichever configured provider
produced the result.
**Rationale:** The AI provider is an internal, cost-driven implementation detail; the organizer's experience must
not depend on which backend answered.
**Source:** design brief §6 amendment A3

#### BR-124 — The daily AI limit is counted once per fill request
**Rule:** One "Fill with AI" request counts once against the organizer's daily AI call limit (BR-68), regardless of
how many configured providers were attempted while producing that request's outcome.
**Rationale:** Prevents internal failover attempts (BR-121) from consuming more than one unit of the organizer's
daily quota for a single organizer action.
**Source:** design brief §6 amendment A3

#### BR-125 — AI provider keys are never exposed to the browser or to CI
**Rule:** The Anthropic and OpenRouter API keys are never sent to the browser and are never present in CI
(continuous integration) environments or configuration; CI's end-to-end tests use a local OpenAI-compatible mock
server instead.
**Source:** design brief §4 "Errors and security" ("AI key in a server-only module"); §6 amendment A3

#### BR-126 — AI provider keys are provisioned with a spend limit
**Rule:** Each AI provider API key used by the application is provisioned with a spend limit at creation time.
**Source:** design brief §6 amendment A3

---

### Calendar export

#### BR-71 — Anyone can export an .ics file
**Rule:** Both guests and organizers can download an `.ics` calendar file for an event.
**Source:** design brief §2 "Calendar export"

#### BR-72 — Exported event uses a 2-hour default duration
**Rule:** Since events have no stored end time, the exported `.ics` file gives the event a default duration of 2 hours.
**Source:** design brief §2 "Events"; §2 "Calendar export"

---

### Internationalization

#### BR-73 — Supported UI languages
**Rule:** The UI is available in English, French, and Brazilian Portuguese.
**Source:** design brief §2 "Internationalization"

#### BR-74 — Locale detected from browser
**Rule:** The initial UI locale is detected from the visitor's browser.
**Source:** design brief §2 "Internationalization"

#### BR-75 — Manual locale switch
**Rule:** The user can manually switch the UI locale.
**Source:** design brief §2 "Internationalization"

#### BR-76 — Locale-aware date/time formatting
**Rule:** Dates and times are formatted according to the active UI locale.
**Source:** design brief §2 "Internationalization"

#### BR-77 — Event content is not translated
**Rule:** Organizer-entered event content (name, description) is displayed as entered and is not machine- or auto-translated for viewers in other locales.
**Source:** design brief §2 "Internationalization"

#### BR-78 — Every message key must exist in all supported locales
**Rule:** Every UI message key must have a translation present in each of the three supported locale files (English, French, Brazilian Portuguese).
**Source:** design brief §2 "Internationalization"

---

### Abuse protection & privacy

#### BR-79 — RSVP submission rate limit
**Rule:** RSVP submissions are rate-limited to 10 per 10 minutes per IP address.
**Source:** design brief §4 "Errors and security"

#### BR-88 — RSVP rate-limit UX
**Rule:** When a guest exceeds the RSVP rate limit (BR-79), the form displays the translated message "Too many
submissions — please try again in a few minutes." and preserves the values the guest had entered.
**Source:** Human decision 2026-09-24 (open question 2)

#### BR-80 — IP addresses stored hashed
**Rule:** Client IP addresses used for rate limiting are stored hashed, not in plaintext.
**Source:** design brief §4 "Errors and security"

#### BR-81 — Honeypot field on the RSVP form
**Rule:** The RSVP form includes a honeypot field to help detect and block automated submissions.
**Source:** design brief §4 "Errors and security"

#### BR-82 — No raw HTML rendering of user content
**Rule:** User-supplied content (e.g. event description, guest name) is rendered as plain text via React's default escaping; `dangerouslySetInnerHTML` is not used.
**Source:** design brief §4 "Errors and security"

#### BR-83 — No internal error details shown to users
**Rule:** Users are shown mapped, translated error messages, never raw stack traces or internal error details.
**Source:** design brief §4 "Errors and security"

#### BR-84 — Unexpected errors are logged
**Rule:** Unexpected (unmapped) errors are logged server-side even though they are not shown to the user.
**Source:** design brief §4 "Errors and security"

#### BR-85 — Authoritative server-side validation
**Rule:** Every input validated on the client (for immediate feedback) is re-validated on the server using the same schema, and the server's validation is authoritative.
**Source:** design brief §4 "Errors and security"

#### BR-86 — Authorization enforced server-side
**Rule:** Authorization checks (e.g. who may edit/delete an event, who may see the full guest list) are enforced in the server-side service layer, not only hidden or disabled in the UI.
**Source:** design brief §4 "Errors and security"

#### BR-87 — Security response headers
**Rule:** Server responses include the headers `X-Frame-Options: DENY`, `Referrer-Policy`, and `X-Content-Type-Options`.
**Source:** design brief §4 "Errors and security"

---

### Interface & accessibility

#### BR-97 — Dark theme is the default
**Rule:** On first visit, with no stored theme preference, the application renders in the dark theme.
**Rationale:** Establishes a single, predictable default appearance for new visitors, consistent with the approved
visual direction.
**Source:** design brief §6 amendment A2; DESIGN.md §"Scene"; PRODUCT.md §"Accessibility & Inclusion"

#### BR-98 — Theme switch available in the header on every page
**Rule:** Every page displays a control in the header that lets the user switch between the dark and light themes.
**Source:** design brief §6 amendment A2; DESIGN.md §"Layout"

#### BR-99 — Theme choice is remembered across visits
**Rule:** Once a user selects a theme, that choice is applied on subsequent page loads and future visits in the same
browser, until the user changes it again.
**Rationale:** Avoids forcing the user to re-select their preferred theme on every visit.
**Source:** design brief §6 amendment A2; DESIGN.md §"Theme implementation notes"

#### BR-100 — Theme is applied without a flash of the other theme
**Rule:** When a page loads, the user's previously chosen theme is the first theme rendered; the page never
visibly renders in the other theme before switching to the chosen one.
**Rationale:** A visible flash of the wrong theme reads as a bug and undermines the calm, trustworthy brand
personality.
**Source:** design brief §6 amendment A2; DESIGN.md §"Theme implementation notes"

#### BR-101 — Both themes meet AA contrast for text
**Rule:** In both the dark theme and the light theme, independently, body and label text has a contrast ratio of
at least 4.5:1 against its background.
**Source:** PRODUCT.md §"Accessibility & Inclusion"; DESIGN.md §"Tokens (OKLCH)"

#### BR-102 — Both themes meet AA contrast for large text and UI boundaries
**Rule:** In both the dark theme and the light theme, independently, large text and the visual boundaries of UI
components (e.g. input borders, focus indicators) have a contrast ratio of at least 3:1 against their adjacent
background.
**Source:** PRODUCT.md §"Accessibility & Inclusion"; DESIGN.md §"Tokens (OKLCH)"

#### BR-103 — Visible focus indicator on every interactive control
**Rule:** Every interactive control (link, button, input, toggle) shows a visible focus indicator when it
receives keyboard focus.
**Source:** PRODUCT.md §"Accessibility & Inclusion"; DESIGN.md §"Components"

#### BR-104 — Full keyboard operability
**Rule:** Every user action available with a pointer is also available using only the keyboard.
**Source:** PRODUCT.md §"Accessibility & Inclusion"

#### BR-105 — Every input has a visible label
**Rule:** Every form input displays a visible text label; a placeholder is never the only label for an input.
Exception: the header's language select is not required to show a visible text label — its visible content (a
globe icon plus the current language name, or the globe icon alone below a 480 px viewport width) together with
an accessible name supplied via `aria-label` satisfies this rule for that control. Every input inside the main
content area of any page keeps a visible label with no exception.
**Source:** PRODUCT.md §"Accessibility & Inclusion"; DESIGN.md §"Components"
**Amended:** 2026-09-24 — human decision (DOC-Q3.3)

#### BR-106 — Form errors are announced to assistive technology
**Rule:** When a form submission produces a validation or server error, the error message is exposed to
assistive technology (e.g. via `role="alert"` or an `aria-live` region), not only shown visually.
**Source:** PRODUCT.md §"Accessibility & Inclusion"

#### BR-107 — Status and state are never conveyed by color alone
**Rule:** Wherever the interface conveys a status or state with color (e.g. going / not going / ended, an error,
a success confirmation), it also conveys the same information with an icon, a text label, or both.
**Rationale:** Keeps the interface usable for users who cannot distinguish the colors involved (e.g. color-blind
users) or who rely on assistive technology that does not render color.
**Source:** PRODUCT.md §"Design Principles" (#4 "State is always visible"); DESIGN.md §"Components"

#### BR-108 — Minimum interactive target size
**Rule:** Every interactive control has a target size of at least 24x24 px.
**Source:** PRODUCT.md §"Accessibility & Inclusion"

#### BR-109 — Larger touch targets for guest RSVP controls
**Rule:** On the guest-facing RSVP page, the response choice, the party-size stepper controls, and the submit
action each have a target size of at least 44x44 px.
**Rationale:** These are the controls a guest completing an RSVP on a phone touches directly; a larger target
reduces mis-taps on small screens.
**Source:** DESIGN.md §"Components"; PRODUCT.md §"Design Principles" (#2 "Guest first, phone first")

#### BR-110 — Confirmation required before removing an RSVP
**Rule:** Organizer removal of an RSVP requires an explicit confirmation step before the RSVP is removed.
**Rationale:** Removal is destructive and not reversible by the guest; explicit confirmation prevents accidental
removal, mirroring the existing requirement for deleting an event (BR-09).
**Source:** DESIGN.md §"Components" ("Inline confirm")

#### BR-111 — Destructive-action confirmations are inline, not modal
**Rule:** Confirmation for deleting an event (BR-09) and for removing an RSVP (BR-110) is presented inline,
expanding in place next to the control that triggered it, rather than in a modal dialog.
**Source:** design brief §6 amendment A2; DESIGN.md §"Components" ("Inline confirm")

#### BR-112 — Guest RSVP page usable at 375 px width without horizontal scrolling
**Rule:** The guest-facing RSVP page (`/e/[slug]`) is fully usable at a 375 px viewport width without any
horizontal scrolling.
**Source:** PRODUCT.md §"Design Principles" (#2 "Guest first, phone first")

#### BR-113 — Reduced motion is respected
**Rule:** When the user's system is set to prefer reduced motion, all interface transitions are limited to
opacity changes only (no movement, scaling, or other motion).
**Source:** PRODUCT.md §"Accessibility & Inclusion"; DESIGN.md §"Motion"

#### BR-114 — Header displays the app logo on every page
**Rule:** Every page's header displays the application's logo mark.
**Source:** design brief §6 amendment A2; DESIGN.md §"Layout"

#### BR-115 — Favicon is the app logo
**Rule:** The browser favicon is the application's logo.
**Source:** design brief §6 amendment A2; DESIGN.md §"Theme implementation notes"

#### BR-116 — Layouts tolerate longer French strings
**Rule:** Every layout displaying UI text remains usable and free of clipped, overlapping, or truncated text when
the French translation of that text is up to 30% longer than the English source.
**Source:** PRODUCT.md §"Accessibility & Inclusion"

#### BR-117 — Decorative icons are hidden from assistive technology
**Rule:** Icons used purely for decoration, that do not convey information on their own, are hidden from
assistive technology and are not announced by screen readers.
**Source:** DESIGN.md §"Iconography"

#### BR-118 — Copy-link confirmation is announced to assistive technology
**Rule:** After the invite link is copied successfully, the confirmation is announced to assistive technology
(e.g. via an `aria-live` region), in addition to any visual change.
**Source:** DESIGN.md §"Components" ("Copy invite link")

---

### Local containerized run (amendment A5 — Phase 9)

#### BR-127 — One command starts a complete local run
**Rule:** Running `docker compose up --build` starts both the PostgreSQL database and the application containers,
producing a working local instance of the app with no other setup step required.
**Rationale:** Lets an evaluator run the whole app without installing Node or a database.
**Source:** design brief §6 amendment A5

#### BR-128 — Migrations applied automatically on app start
**Rule:** The app container applies pending database migrations (`prisma migrate deploy`) every time it starts,
before it begins serving requests.
**Source:** design brief §6 amendment A5

#### BR-129 — Seed runs automatically on app start
**Rule:** The app container runs the demo-data seed every time it starts, after migrations and before it begins
serving requests.
**Source:** design brief §6 amendment A5

#### BR-130 — Seed is idempotent
**Rule:** Running the seed more than once (e.g. across repeated container starts) does not create duplicate
records or fail; the database converges to the same seeded state.
**Source:** design brief §6 amendment A5

#### BR-131 — Default app port
**Rule:** When the `APP_PORT` environment variable is not set, the app is reachable at `http://localhost:3000`.
**Source:** design brief §6 amendment A5

#### BR-132 — App port is configurable
**Rule:** Setting `APP_PORT` before `docker compose up` changes the host port the app is published on, with no
other configuration change required.
**Source:** design brief §6 amendment A5

#### BR-133 — The app starts without a `.env.local` file
**Rule:** `docker compose up --build` succeeds and produces a running app when no `.env.local` file is present.
**Source:** design brief §6 amendment A5

#### BR-134 — AUTH_SECRET is generated when absent
**Rule:** When no `AUTH_SECRET` value is supplied (no `.env.local`, or one that omits it), the app container
generates one at container start so authentication machinery has a secret to use.
**Rationale:** A secret generated at each container start is not persisted, so sessions issued under it do not
survive a container restart; this is accepted because, without `.env.local`, sessions are local to that run only.
**Source:** design brief §6 amendment A5

#### BR-135 — Public side fully works without `.env.local`
**Rule:** Without a `.env.local` file, every guest-facing capability of the app — viewing an event, submitting an
RSVP, and downloading its `.ics` file — works fully.
**Source:** design brief §6 amendment A5

#### BR-136 — Google sign-in requires the reader's own Google credentials
**Rule:** Without a `.env.local` file supplying Google OAuth credentials, "Sign in with Google" specifically cannot
complete; using that method requires the reader to supply their own Google OAuth client credentials. This does not
apply to email/password registration and sign-in (see BR-170).
**Source:** design brief §6 amendment A5
**Amended:** 2026-09-25 — design brief §6 amendment A6: scoped this rule to the Google sign-in method, since
email/password is now an alternative that does not depend on Google credentials.

#### BR-137 — AI fill falls back when no AI provider key is configured
**Rule:** Without a `.env.local` file supplying any AI provider key, every configured provider is skipped for lack
of a key (BR-120) and "Fill with AI" ends in the same fallback as an AI error (BR-65): the UI shows "Couldn't fill
automatically — please fill the form."
**Source:** design brief §6 amendment A5

#### BR-138 — `.env.local` values are used when present
**Rule:** When a `.env.local` file is present, the app uses the environment variables it defines (e.g.
`AUTH_SECRET`, Google OAuth credentials, AI provider keys) instead of the generated or fallback behavior described
in BR-134, BR-136, and BR-137.
**Source:** design brief §6 amendment A5

#### BR-139 — App image uses Node 22 and npm 10
**Rule:** The application's Docker image is built on Node 22 with npm 10, matching the versions used in CI.
**Source:** design brief §6 amendment A5

#### BR-140 — App image build does not change the Vercel build
**Rule:** The application's Docker image is built with a full Next.js build, not the `standalone` output mode, so
the Vercel production build configuration is unaffected by the container image.
**Source:** design brief §6 amendment A5

#### BR-141 — Database-only compose target for development and tests
**Rule:** Running `docker compose up -d db` starts only the PostgreSQL database container, without the app, for
use during local development and test runs.
**Source:** design brief §6 amendment A5

#### BR-142 — CI smoke-test job for the containerized stack
**Rule:** A CI job builds the Docker Compose stack, starts it, and verifies that the home page, the public demo
event page, and the `.ics` download each respond successfully.
**Source:** design brief §6 amendment A5

#### BR-143 — Containerized-stack CI job is not required to merge
**Rule:** The CI job described in BR-142 is not a required status check; its failure alone does not block a pull
request from merging.
**Source:** design brief §6 amendment A5

#### BR-144 — No secrets baked into the app image
**Rule:** Building the application's Docker image never embeds secret values (e.g. API keys, `AUTH_SECRET`) into
the image itself; secrets are supplied only at container run time.
**Rationale:** Keeps the built image safe to share or publish without leaking credentials.
**Source:** design brief §6 amendment A5

---

### Email and password sign-in (amendment A6 — Phase 10)

#### BR-145 — Registration required fields
**Rule:** The Register page requires name, email, password, and confirm password.
**Source:** design brief §6 amendment A6 (a)

#### BR-146 — Registration signs the user in immediately
**Rule:** On successful registration, the account is created and the user is signed in immediately, without an
email-verification step.
**Source:** design brief §6 amendment A6 (a)

#### BR-147 — Email is normalized before use
**Rule:** On both registration and sign-in, the email address is trimmed of surrounding whitespace and lower-cased
before it is stored, compared, or used to look up an account.
**Rationale:** Ensures `Alice@Example.com` and `alice@example.com` are treated as the same account.
**Source:** design brief §6 amendment A6 (a)

#### BR-148 — Password length bounds
**Rule:** A password must be between 8 and 128 characters.
**Source:** design brief §6 amendment A6 (b)

#### BR-149 — No password composition rules
**Rule:** No character-composition requirement (e.g. mandatory uppercase, digit, or symbol) is enforced on a
password beyond its length (BR-148).
**Rationale:** Follows NIST SP 800-63B guidance that composition rules push users toward predictable patterns
without materially improving security.
**Source:** design brief §6 amendment A6 (b)

#### BR-150 — Password confirmation must match
**Rule:** Registration is rejected if the confirm-password field does not match the password field exactly.
**Source:** design brief §6 amendment A6 (b)

#### BR-151 — Password hashing algorithm and salt
**Rule:** A password is hashed with `scrypt` from Node's `node:crypto`, using a random salt generated per user (not
a shared or fixed salt), before it is stored.
**Rationale:** Avoids adding a new dependency while using a memory-hard KDF; a per-user salt defeats precomputed
(rainbow-table) attacks and ensures two users with the same password get different stored hashes.
**Source:** design brief §6 amendment A6 (b)

#### BR-152 — Constant-time password comparison
**Rule:** Verifying a submitted password against its stored hash uses a constant-time comparison.
**Rationale:** Prevents a timing side-channel from revealing how much of a guessed password was correct.
**Source:** design brief §6 amendment A6 (b)

#### BR-153 — Password hash is never logged or returned
**Rule:** A password's hash is never written to logs and never included in any API or page response.
**Source:** design brief §6 amendment A6 (b)

#### BR-154 — Sign-in page offers both methods
**Rule:** The sign-in page lets a user sign in with email and password, and also offers Google sign-in.
**Source:** design brief §6 amendment A6 (c)

#### BR-155 — Generic sign-in error message
**Rule:** A failed sign-in attempt — whether caused by an unknown email, a wrong password, or an email that
belongs to a Google-only account — shows the same generic message: "email or password is incorrect". The response
does not otherwise reveal which of these three causes applied.
**Rationale:** Prevents a sign-in attempt from being used to discover whether a given email has an account, or
which sign-in method it uses.
**Source:** design brief §6 amendment A6 (c)

#### BR-156 — Failed sign-in attempts are rate-limited per IP and email
**Rule:** Failed email/password sign-in attempts are rate-limited both by the client's IP address and by the
submitted email address: at most 5 failed attempts per email per 15 minutes, and at most 20 failed attempts per IP
per 15 minutes.
**Source:** design brief §6 amendment A6 (c)
**Amended:** 2026-09-25 — human pre-authorized the analyst's recommendation (DOC-Q5), resolving the brief's silence
on the specific thresholds.

#### BR-157 — Registration is refused for an email already on a Google-only account
**Rule:** If the submitted registration email belongs to an existing Google-only account, registration is refused;
no account is created and the existing account is not changed.
**Source:** design brief §6 amendment A6 (d)

#### BR-158 — Refusal guidance names Google sign-in and the Account page
**Rule:** The message shown for the refusal in BR-157 tells the person to sign in with Google and, once signed in,
to set a password from the Account page.
**Rationale:** Gives the person a path to using both methods without creating a duplicate account.
**Source:** design brief §6 amendment A6 (d)
**Note:** telling the person their email is already a Google account reveals that the email has an account
(account enumeration); this trade-off is recorded, not silently accepted, in the Open questions section below.

#### BR-159 — Account page: set a password when none exists
**Rule:** A signed-in user with no password set (a Google-only account) can set one from the Account page.
**Source:** design brief §6 amendment A6 (d)

#### BR-160 — Account page: changing a password requires the current one
**Rule:** A signed-in user who already has a password must provide their current password to change it from the
Account page.
**Source:** design brief §6 amendment A6 (d)

#### BR-161 — Setting a password opens both sign-in methods on the same account
**Rule:** Once a Google-only account has a password set (BR-159), the same account can be signed in to with either
Google or that email and password.
**Source:** design brief §6 amendment A6 (d)

#### BR-162 — Google sign-in with a password account's email links the accounts
**Rule:** If a user signs in with Google using the email address of an existing password account, that Google
identity is linked to the existing account rather than a new account being created.
**Source:** design brief §6 amendment A6 (e)

#### BR-163 — Linking clears the existing password
**Rule:** When the linking in BR-162 happens, the account's existing password is cleared; it can no longer be used
to sign in.
**Rationale:** The password had been set without proof that its owner controlled the email address; clearing it on
proof of Google ownership (`email_verified`) protects against account pre-hijacking, where an attacker registers a
password account with a victim's email before the victim ever signs in.
**Source:** design brief §6 amendment A6 (e)

#### BR-164 — User is notified when their password is cleared
**Rule:** When the account's password is cleared (BR-163), the user is shown an in-app banner right after the
linking sign-in completes, and a persistent notice on the Account page that remains until the user sets a new
password (BR-159) or dismisses it. No email notification is sent (email sending is out of scope for this phase).
**Source:** design brief §6 amendment A6 (e)
**Amended:** 2026-09-25 — human pre-authorized the analyst's recommendation (DOC-Q6), resolving the brief's silence
on the notification's form.

#### BR-165 — Sessions are JWT-based
**Rule:** Signed-in sessions are represented as JWTs, not as rows in the database.
**Rationale:** Auth.js requires JWT sessions when a credentials (email/password) provider is enabled alongside
OAuth.
**Source:** design brief §6 amendment A6 (f)

#### BR-166 — User and account records remain in PostgreSQL
**Rule:** Despite sessions being JWT-based (BR-165), user and account records (including password hashes and
linked Google identities) continue to be stored in PostgreSQL.
**Source:** design brief §6 amendment A6 (f)

#### BR-167 — Existing sessions end once, at deploy
**Rule:** Deploying this change ends every session that existed under the previous (database) session mechanism,
one time; it does not otherwise shorten session lifetimes.
**Source:** design brief §6 amendment A6 (f)

#### BR-168 — Sign-out clears the session cookie
**Rule:** Signing out clears the session cookie.
**Source:** design brief §6 amendment A6 (f)

#### BR-169 — New screens follow existing i18n and accessibility rules
**Rule:** The Register page, the sign-in page, and the Account page each comply with the existing internationalization
rules (BR-73 through BR-78) and the existing accessibility rules (BR-97 through BR-118), in both themes.
**Source:** design brief §6 amendment A6 (g)

#### BR-170 — Email/password auth works without `.env.local` in the containerized run
**Rule:** Without a `.env.local` file, registration and email/password sign-in still work fully, since they depend
only on the generated `AUTH_SECRET` (BR-134) and not on external OAuth credentials.
**Rationale:** Extends the containerized local run (amendment A5) to the new sign-in method: unlike Google sign-in
(BR-136), email/password does not require the reader to supply their own credentials.
**Source:** design brief §6 amendment A5; §6 amendment A6

---

## Out of scope

Per the brief's principle "Maximum with minimum": everything left out is recorded here with the reason the brief
gives, or noted as not yet given (to be written up in the README, per the brief's own instruction that the README
carries the one-line reason for each excluded item).

| Item | Reason |
|---|---|
| Capacity limits on RSVPs | Explicitly decided: "No capacity limit" (design brief §2 "RSVPs"). |
| Email notifications | Explicitly decided: guests are not notified of date changes because "email out of scope" (design brief §2 "Events"). |
| "Maybe" RSVP response | Response is limited to Going / Not going by design (design brief §2 "RSVPs"); no reason given beyond the decision itself. |
| CSV export | Listed in the brief's out-of-scope list (design brief §2); no reason given in the brief. |
| Admin role | Listed in the brief's out-of-scope list (design brief §2); consistent with roles being only Organizer/Guest, contextual per event (§2 "Actors and roles"), but no explicit reason given. |
| Multiple organizers per event | Listed in the brief's out-of-scope list (design brief §2); consistent with the data model's single `ownerId` per event (§3 "Data model"), but no explicit reason given. |
| Cross-device RSVP editing for guests | Listed in the brief's out-of-scope list (design brief §2), and stated directly as unsupported (§2 "RSVPs"); no explicit reason given beyond the decision. |
| Strict CSP | Listed in the brief's out-of-scope list (design brief §2); the brief notes other XSS mitigations instead (React escaping only, no `dangerouslySetInnerHTML` — §4), but does not give an explicit reason for omitting CSP itself. |
| Observability beyond logs | Listed in the brief's out-of-scope list (design brief §2); no reason given in the brief. |
| Per-PR preview deployments | Explicitly decided: "no per-PR previews (would migrate the production database)" (design brief §7 "Repository and delivery"). |
| Password reset | Explicitly decided: out of scope for Phase 10 because it needs email sending (design brief §6 amendment A6). |
| Email verification | Explicitly decided: out of scope for Phase 10 because it needs email sending (design brief §6 amendment A6); registration is not gated on it (BR-146). |

Note: the eval accuracy gate (design brief §5, "≥ 90% overall and 100% on 'must not invent' and 'prompt injection'")
is a process/test-quality gate on the AI feature, not a product business rule, and is intentionally not listed as a
BR above.

---

## Open questions

**Open** — none.

**Resolved — DOC-Q5 and DOC-Q6** — human pre-authorized the analyst's recommendation (2026-09-25):

- **DOC-Q5** — What are the failed-sign-in rate-limit thresholds per IP and per email (BR-156)? The brief said
  rate limiting applies "per client IP and email" but gave no numbers. Resolved: 5 failed attempts per email per
  15 minutes, and 20 failed attempts per IP per 15 minutes — tighter than the RSVP limit (BR-79: 10/10 min per IP)
  because credential-stuffing risk is higher than RSVP spam, while still allowing a genuine user a few honest
  mistakes before being blocked. See BR-156 (amended).
- **DOC-Q6** — What form does the "notify" in BR-164 take, when a Google sign-in clears an existing password?
  Resolved: an in-app banner shown immediately after the linking sign-in completes, plus a persistent notice on the
  Account page until the user sets a new password or dismisses it; no email (email sending is out of scope for
  this phase, alongside password reset and email verification, design brief §6 amendment A6). See BR-164 (amended).

**Resolved — A6 (documented trade-off, not silently decided)**: the design brief's amendment A6 (d) explicitly
requires the registration-refusal message (BR-157, BR-158) to tell the person their email belongs to a Google
account. This necessarily reveals, to whoever submits that email on the Register page, that an account with that
email exists (account enumeration) — the same information a generic "check your email" message would hide.
**Recommendation:** accept this trade-off as specified in A6 (already approved by the human on 2026-09-25): the
alternative (a generic refusal that does not say why) would strand a returning Google user with no path back to
their account, which the brief's own goal for this phase ("the evaluator can sign in without being added as a
Google test user, and one person can use both methods") argues against. Mitigate the residual risk with the
sign-in rate limit (BR-156), which also slows automated enumeration via the registration endpoint, and record the
trade-off explicitly in the README's "What I left out and why" / security notes so it is a visible, intentional
choice rather than an oversight.

**Resolved — A3** — decided by the human (Ramon) on 2026-09-24, at Phase 7 spec kickoff:

1. Default provider order `anthropic,openrouter` → BR-119 confirmed as written (no change).
2. No cross-provider retry after invalid model output → BR-122 confirmed as written (no change).

   **Revised 2026-09-25** — human decision (Ramon): the default provider order above is superseded. `AI_PROVIDERS`
   defaults to `openrouter` only; Anthropic is optional and used only when an operator lists it explicitly. See
   BR-119 (amended) and BR-121 (amended).

**Resolved — Phase 7 approval** — decided by the human (Ramon) on 2026-09-24, while approving the Phase 7 spec:

1. Failover on authentication errors → BR-121 (amended): HTTP 401 and 403 are added to the outage-type failures
   that trigger failover to the next provider, since a misconfigured or revoked key makes that provider unusable
   for the request.
2. Evaluation scope (process decision, not a product rule — no BR): the Phase 7 evaluation also covers Claude
   Sonnet via OpenRouter, in addition to `anthropic/claude-haiku-4.5` and `openai/gpt-4o-mini`, restoring the
   original Haiku-vs-Sonnet comparison from the design brief.

**Revised 2026-09-25** — human decision (Ramon): OpenRouter is now the default provider and Anthropic is optional.
The default `AI_PROVIDERS` is `openrouter` only; Anthropic is used only when an operator lists it explicitly (with
its key configured). This supersedes the `anthropic,openrouter` default order confirmed above. See BR-119
(amended) and BR-121 (amended).

**Resolved** — decided by the human (Ramon) on 2026-09-24:

1. AI daily limit reset window → BR-68 (amended)
2. RSVP rate-limit UX → BR-88 (new)
3. AI daily-limit UX → BR-89 (new)
4. "Same browser" detection mechanism for duplicate names → BR-37, BR-38 (amended)
5. Scope of "date changes after RSVPs are allowed" → BR-11, BR-12 (amended), BR-90 (new)
6. Organizer actions after an event has ended → BR-33 (amended), BR-91, BR-92, BR-93, BR-94 (new)
7. Language of the AI-drafted description → BR-55 (amended)
8. Unauthenticated access to organizer-only routes → BR-95 (new)
9. Meaning of "RSVP date" in the organizer's guest list → BR-42 (amended)
10. Sample event's timezone → BR-50 (amended)

**Resolved** — decided by the human (Ramon) on 2026-09-24, from `spec-writer`'s DOC failure report:

- DOC-Q1 (edit-token cookie belonging to a different RSVP of the same event) → BR-37, BR-38 (amended)
- DOC-Q2 (AI response to text that does not describe an event) → BR-55 (amended), BR-96 (new)

**Resolved** — decided by the human (Ramon) on 2026-09-24, from `spec-writer`'s DOC failure report (Phase 6):

- DOC-Q3.1 (returning-guest line wording) → BR-35 (amended): follow DESIGN.md / the approved mockup —
  "You're going · N people" / "You're not going", with "Change" and "Cancel RSVP" actions.
- DOC-Q3.2 ("Copy invite link" vs DESIGN.md's "Copy link") → BR-51 kept as is, no change; the BR wording is
  authoritative over DESIGN.md's "Copy link" for this action's label.
- DOC-Q3.3 (visible label on every input vs the header language select) → BR-105 (amended): documented
  exception for the header language select (globe icon + current language name, globe only below 480 px, plus
  `aria-label`); every input in the main content keeps a visible label.

**Resolved** — decided by the human (Ramon) on 2026-09-25, from `spec-writer`'s DOC failure report (Phase 6):

- DOC-Q4 (amended BR-35 said both "Going" and "Not going" panels get "Change" and "Cancel RSVP", but DESIGN.md
  gives the Not going panel only "Change", and "Cancel RSVP" on an already "Not going" RSVP would change nothing)
  → BR-35 (amended again): the Not going panel shows only "Change"; the "Going" panel keeps "Change" and
  "Cancel RSVP". Confirms the default already applied in `docs/spec.md` REQ-31, REQ-84.
