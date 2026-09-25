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
| **Organizer** | A user signed in with Google. Creates and owns events; manages only the events they own. |
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
| **AI provider** | A configured backend (Anthropic or OpenRouter) able to serve a "Fill with AI" request. `AI_PROVIDERS` orders the providers tried for one request. |
| **Theme** | The application's dark or light visual mode; user-selectable from the header and persisted across visits. |
| **Reduced motion** | An operating-system-level user preference (`prefers-reduced-motion`) indicating that animated transitions should be minimized. |
| **Target size** | The clickable or tappable area of an interactive control, measured in pixels. |

---

## Business rules

### Identity & roles

#### BR-01 — Organizer authentication method
**Rule:** An Organizer signs in with Google.
**Rationale:** Defines the only supported identity provider for organizers.
**Source:** design brief §2 "Actors and roles"

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
to Google sign-in, and returned to the originally requested page after signing in.
**Source:** Human decision 2026-09-24 (open question 8)

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
event) sees, instead of a blank RSVP form: "You're going · N people" (where N is their party size) when their
response is "Going", or "You're not going" when their response is "Not going" — each with "Change" and
"Cancel RSVP" actions.
**Source:** design brief §2 "RSVPs"; DESIGN.md; approved mockup
**Amended:** 2026-09-24 — human decision (DOC-Q3.1)

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
**Rule:** The signed-out home page is a single screen containing: an explanation of what the app does, a "Sign in with Google" action, and a link to a public (seeded) demo event.
**Source:** design brief §2 "Home (signed out)"

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
Anthropic, then OpenRouter), for one "Fill with AI" request.
**Source:** design brief §6 amendment A3

#### BR-120 — A provider without a configured key is skipped
**Rule:** A provider listed in `AI_PROVIDERS` with no API key configured is skipped without being attempted, and
the AI fill action proceeds to the next provider in the configured order.
**Source:** design brief §6 amendment A3

#### BR-121 — Failover to the next provider on an outage-type failure
**Rule:** When an attempted provider fails with a network error, an HTTP 5xx response, an HTTP 429 (rate limit)
response, a timeout, or an insufficient-credit error, the AI fill action tries the next configured provider,
provided the retry still fits within the same 10-second request budget (BR-64).
**Rationale:** These failure types indicate the provider itself is unavailable rather than a problem with the
request, so another provider can reasonably serve the same request.
**Source:** design brief §6 amendment A3

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

Note: the eval accuracy gate (design brief §5, "≥ 90% overall and 100% on 'must not invent' and 'prompt injection'")
is a process/test-quality gate on the AI feature, not a product business rule, and is intentionally not listed as a
BR above.

---

## Open questions

**Open** — amendment A3 (2026-09-24), to confirm at spec approval:

1. Default provider order Anthropic → OpenRouter (BR-119) is a proposed default from the human's request, not a
   confirmed decision — to confirm at spec approval.
2. Not retrying on another provider after invalid model output (BR-122) is a proposed default from the human's
   request, not a confirmed decision — to confirm at spec approval.

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
