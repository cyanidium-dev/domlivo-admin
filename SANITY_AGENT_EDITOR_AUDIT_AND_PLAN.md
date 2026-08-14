# Sanity Studio Audit & Implementation Plan (Agent vs Editor Separation)

## 1) Understanding

This project needs a Sanity-only audit and practical workflow plan for separating **agents** from **editors** on the **free plan**, without enterprise/Growth document-level permissions.

Key constraint: this cannot provide true row-level security inside Sanity Studio alone. The plan must therefore optimize safety and workflow clarity while explicitly documenting limitations and bypass risks.

Scope in this report is strictly Sanity repository audit + planning (no frontend implementation changes).

---

## 2) Current State Audit

### Relevant files and what each does

- `sanity.config.ts`
  - Hardcoded `projectId: g4aqp6ex`, `dataset: production`
  - Uses custom desk structure
  - Wraps `property` publish action with promotion guard
- `sanity.cli.ts`
  - Hardcoded project/dataset for CLI (`g4aqp6ex` / `production`)
- `structure/index.ts`
  - Custom desk with content sections
  - Adds `Properties > My Properties` filtered by `ownerUserId == currentUser.id`
  - Also keeps `All Properties`
- `schemaTypes/documents/agent.ts`
  - Agent model (public profile + some operational fields)
- `schemaTypes/documents/property.ts`
  - Property model, required `agent` reference, hidden/readOnly `ownerUserId`
- `schemaTypes/documents/registrationRequest.ts`
  - Inbound request model with submission fields read-only and workflow fields editable
- `schemaTypes/documents/siteSettings.ts`
  - Global contact/social/footer channels (including Telegram/WhatsApp URLs)
- `schemaTypes/documents/index.ts`
  - Registers active document schemas (includes `agent`, `property`, `registrationRequest`)
- `docs/ACCESS_CONTROL.md`
  - Explicitly states current approach is Studio UX filtering, not API-level enforcement
- `docs/registration-request-sanity-frontend-contract.md`
  - Programmatic create contract for `registrationRequest`
- `lib/sanity/fragments.ts`, `lib/sanity/queries.ts`
  - Shows what agent/property/contact fields are consumed by frontend queries
- `scripts/lib/sanityEnvClient.ts`
  - Env-driven script client for project/dataset/tokened script operations

### Current agent modeling

From `schemaTypes/documents/agent.ts`, agent fields currently include:

- Public/profile:
  - `name`, `slug`, `bio`, `photo`, `agentLogo`, `seo`
- Contact/channels:
  - `email`, `phone`, `telegramUrl`, `facebookUrl`, `instagramUrl`, `youtubeUrl`
- Operational/internal:
  - `userId` (described as Sanity user linkage)
  - `maxPremiumPromotionsOverride`, `maxTopPromotionsOverride`

Observed usage in query fragments confirms agent fields are used in public-facing data contexts (e.g., property details and landing investor/agent blocks).

### Current editor/admin modeling (if any)

- No dedicated `editor`, `staff`, or admin user schema found.
- No role-conditional desk branching found in structure.
- Current user-aware behavior is based on `context.currentUser.id` (for `My Properties`) rather than role-based gates.

### Current property-agent linkage

- `property.agent` is a required reference to `agent` in `schemaTypes/documents/property.ts`.
- Property publish/validation includes promotion cap checks tied to agent context.
- Separate ownership field exists:
  - `property.ownerUserId` hidden/readOnly, initialized from `currentUser.id` on create.

Important: property ownership (`ownerUserId`) and agent linkage (`agent` / `agent.userId`) are separate tracks and not strictly enforced to remain synchronized.

### Current lead/contact/submission-related structures

- No dedicated `lead`, `contact`, `inbox`, `message`, or `staffUser` document schema found.
- Existing operational intake is `registrationRequest`:
  - Read-only submission fields: `name`, `phone`, `email`, `realtorOrAgency`, `language`
  - Editable internal workflow fields: `status`, `internalComment`
  - Default status: `unread`

### Dataset/project configuration findings

- Studio + CLI are hardcoded to:
  - `projectId: g4aqp6ex`
  - `dataset: production`
- Script-side tooling supports env-driven project/dataset (`SANITY_PROJECT_ID`, `SANITY_DATASET`) with defaults.
- No desk behavior found that changes based on dataset.

### Current Telegram/email/contact channel support

- Agent-level channels:
  - `email`, `phone`, `telegramUrl`
- Site-level channels:
  - `contactEmail`, `contactPhone`, `footerTelegramUrl`, `footerWhatsappUrl`, `socialLinks`
- No `telegramChatId` field found.
- No outbound Telegram/email dispatch implementation found in audited Sanity repo code.

---

## 3) Gaps / Risks

### Where agent/editor separation is currently weak or nonexistent

- No true row-level document permission model in current free-plan setup.
- Separation is mainly UI workflow:
  - `My Properties` filter
  - hidden/readOnly fields
- Same Studio can still expose global lists (`All Properties`) to users with sufficient Studio access.

### What can be hidden only at UX level

- Desk filters and navigation sections (`My ...` vs `All ...`)
- Field-level `hidden` and `readOnly` callbacks
- Initial value conventions

These improve day-to-day behavior but are not hard security boundaries.

### What can still be accessed/bypassed by determined Studio users on free plan

- Any Studio user with broad permissions can navigate/query docs outside intended “my area.”
- `ownerUserId` is not API-enforced authorization by itself.
- Without custom backend checks, mutations are not guaranteed to respect ownership constraints.

### Schema/workflow inconsistencies

- `agent` currently mixes public profile and internal/operational concerns.
- Ownership model is split (`property.ownerUserId` vs `agent.userId`) with no strict binding.
- `registrationRequest` is global intake rather than per-agent ownership inbox.
- `property.ts` includes TODO note about owner migration/backfill, indicating incomplete ownership normalization.

---

## 4) Recommended Target Model

Design goal: minimal, practical, low-risk model for free-plan usage that improves separation in normal workflows without claiming hard security guarantees.

### Public agent profile data

Keep public-facing profile data on `agent`:

- `name`, `slug`, `bio`, `photo`, `agentLogo`
- public social/profile links
- public contact fields that are intentionally website-visible

### Private/operational agent data

Add a new operational doc, e.g. `agentOperationalProfile`:

- `agent` reference (required, unique 1:1 target by convention/validation)
- `ownerUserId` (required)
- private channel routing fields:
  - `telegramChatId` (private)
  - operational email / phone (if distinct from public profile)
  - optional preferred channel enum
- optional operational flags/notes

Reason: prevents sensitive routing identifiers from living in public profile documents.

### Ownership/linking strategy

- Use `ownerUserId` as canonical operational ownership key.
- Keep `property.agent` for business/public association.
- Maintain `property.ownerUserId` as operational ownership marker.
- Add validation/warnings to keep ownership mapping consistent with operational profile assignment.

### Per-agent lead/contact document design

Add new doc type, e.g. `agentLead`:

- Ownership and routing:
  - `agent` (required ref)
  - `ownerUserId` (required)
  - optional `source` and route metadata
- Submission snapshot fields:
  - `name`, `phone`, `email`, inquiry text/details
- Workflow fields:
  - `status` (enum)
  - `internalComment`
  - `readAt` / `lastActionAt` markers (simple first version)

Desk behavior:

- `My Leads` filter by `ownerUserId == currentUser.id`
- `All Leads` for editors/admins who must supervise all leads

### Communication channel fields

- Keep **public links** on `agent` (`telegramUrl` etc.) for website usage.
- Store **private routing ids** (e.g., `telegramChatId`) in operational/private doc.

### Read-only/editable rules

- Treat user-submitted fields as read-only after ingestion (same pattern as `registrationRequest`).
- Keep workflow/status/comments editable.
- Continue to present these as workflow controls, not security controls.

### Desk structure approach

- Keep current global editorial sections for admins/editors.
- Add operational sections for agent flow (`My Leads`, optionally `My Operational Profile`).
- Clearly label global vs personal lists to reduce accidental cross-editing.

### Validation and workflow suggestions

- Require `ownerUserId` and `agent` in operational docs.
- Validate status values tightly.
- Add lightweight consistency checks (warn if ownership mismatch across related docs).
- Keep status model simple initially (e.g., `unread`, `read`, `inWork`, `closedWon`, `closedLost`).

---

## 5) Recommended Plan

### Phase 1 — Guardrails and documentation alignment

- **Goal:** Make constraints explicit and reduce accidental misuse immediately.
- **Files likely affected:** `docs/ACCESS_CONTROL.md`, optional desk labels in `structure/index.ts`, schema descriptions.
- **Why needed:** Team currently has UX-based model; documenting limits avoids false security assumptions.
- **Risks/notes:** Very low risk, no data migration.

### Phase 2 — Introduce operational agent profile

- **Goal:** Separate private operational identity/routing from public `agent`.
- **Files likely affected:** new schema file under `schemaTypes/documents/`, `schemaTypes/documents/index.ts`, `structure/index.ts`.
- **Why needed:** Supports private fields like `telegramChatId` and cleaner ownership model.
- **Risks/notes:** Requires one-time mapping/backfill process.

### Phase 3 — Introduce per-agent lead model

- **Goal:** Create explicit per-agent operational inbox model.
- **Files likely affected:** new lead schema file, schema registry, desk structure additions, optional initial templates.
- **Why needed:** Current `registrationRequest` is global and not ownership-partitioned.
- **Risks/notes:** Keep first version simple; avoid CRM-style overbuild.

### Phase 4 — Routing/workflow normalization

- **Goal:** Stabilize status/routing fields for future integration.
- **Files likely affected:** lead schema, docs contract(s), optional helper validation utilities.
- **Why needed:** Future Telegram/email/form routing needs stable schema contracts.
- **Risks/notes:** Keep optional fields optional until integration exists.

### Phase 5 — Ownership cleanup/migration

- **Goal:** Backfill and normalize `ownerUserId` consistency in existing data where needed.
- **Files likely affected:** migration scripts + docs; possibly validation hints.
- **Why needed:** Existing TODO indicates incomplete owner migration.
- **Risks/notes:** Use idempotent scripts; review before executing in production dataset.

---

## 6) Frontend / backend dependencies

These are not part of this Sanity-only step, but will be required later:

- API route/service for creating `agentLead` documents from website forms.
- Routing logic to determine target agent (property-based, manual, or rule-based assignment).
- Telegram chat-id collection/verification flow if real chat-id delivery is needed.
- Outbound Telegram/email delivery services and retry/error handling.
- Signed/internal API for safe writes (no public write token exposure).
- Optional webhook sync logic for ownership consistency.

---

## 7) Open Questions

- Should `registrationRequest` remain as a separate global intake type, or be replaced by/translated into `agentLead`?
- How should new lead assignment be decided (property agent, explicit selector, round-robin, manual triage)?
- Which contact fields must stay publicly visible on `agent` vs move to private operational profile?
- Do operational users need access to `All Leads`, or should only admins/editors have that?
- How complete is current production population of `agent.userId` and `property.ownerUserId`?
- Is there a required status vocabulary from sales/ops that must be reflected from day one?

---

## 8) Recommendation Summary

Safest practical free-plan approach:

- Keep public profile content on `agent`
- Add a private operational profile doc for ownership + private routing fields
- Add per-agent lead documents keyed by `ownerUserId`
- Use desk structure (`My ...` + `All ...`) and read-only submission fields for workflow discipline
- Explicitly document this as UX/workflow containment, not true security

If true enforcement is later required, add backend authorization checks for ownership before mutations.

---

## Minimal recommended implementation scope

- Add `agentOperationalProfile` schema (private owner + routing fields including `telegramChatId`).
- Add `agentLead` schema (required `agent`, required `ownerUserId`, simple status workflow).
- Update desk structure with `My Leads` and `All Leads`.
- Add validation rules and schema descriptions clarifying ownership semantics.
- Update docs to reflect free-plan limitations and intended operational workflow.

---

## Not recommended right now

- Large refactor of unrelated content schemas (properties/pages/blog/city models not directly relevant).
- Building a complex CRM/event timeline system in first pass.
- Treating `hidden/readOnly` and desk filters as hard security controls.
- Enterprise-only permission strategy as primary path for this project phase.
- Frontend/backend implementation in this prompt.

---

## Implementation handoff notes for next prompt

- [ ] Create `agentOperationalProfile` document schema with:
  - [ ] required `agent` ref
  - [ ] required `ownerUserId`
  - [ ] private communication routing fields (incl. `telegramChatId`)
- [ ] Create `agentLead` document schema with:
  - [ ] required `agent` ref
  - [ ] required `ownerUserId`
  - [ ] submission snapshot fields
  - [ ] status + internal workflow fields
- [ ] Register new schemas in `schemaTypes/documents/index.ts`
- [ ] Extend `structure/index.ts` with `Leads > My Leads` and `Leads > All Leads`
- [ ] Add validation for ownership/status consistency
- [ ] Keep existing `agent` public profile model intact during initial rollout
- [ ] Add/update docs for free-plan limitations and operational process
- [ ] Prepare optional migration script for missing `ownerUserId` values (review before run)
