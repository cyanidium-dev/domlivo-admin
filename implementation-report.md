# Phase 1 Implementation Report (Agent/Editor Workflow Containment)

## 1. Changed Files

- `schemaTypes/documents/studioUserAccess.ts`
- `schemaTypes/documents/propertyLead.ts`
- `schemaTypes/documents/index.ts`
- `schemaTypes/documents/registrationRequest.ts`
- `templates/registrationRequestDefault.ts`
- `schemaTypes/documents/agent.ts`
- `schemaTypes/documents/property.ts`
- `structure/index.ts`
- `docs/ACCESS_CONTROL.md`
- `docs/registration-request-sanity-frontend-contract.md`

## 2. Diffs

### `schemaTypes/documents/studioUserAccess.ts`
- Added new `studioUserAccess` schema for pseudo-role mapping on Studio UX layer.
- Fields:
  - `userId` (required)
  - `userEmail` (optional)
  - `role` (`admin | editor | agent`)
  - `linkedAgent` (required when role is `agent`)
  - `active` (optional soft toggle, defaults to `true`)
- Added clear schema description that this is free-plan workflow containment, not hard security.

### `schemaTypes/documents/propertyLead.ts`
- Added new lead schema for property contact submissions (`propertyLead`).
- Includes required submission and operational fields:
  - `name`, `email`, `phone`, `message`
  - `status` (`new | contacted | closed`, default `new`)
  - `createdAt`
  - `property` reference
  - `linkedAgent` reference
  - `propertyTitleSnapshot`, `propertyPriceSnapshot`
  - `locale`, `sourcePageUrl`, `source` (`property_contact_form`)
- Submission-origin fields are read-only after create (`document._createdAt` check).

### `schemaTypes/documents/index.ts`
- Registered new document schemas:
  - `studioUserAccess`
  - `propertyLead`

### `schemaTypes/documents/registrationRequest.ts`
- Updated registration workflow statuses to:
  - `pending`
  - `approved`
  - `rejected`
- Updated defaults from `unread` to `pending` (document-level initial value + field initial value).
- Kept submission fields read-only pattern intact.

### `templates/registrationRequestDefault.ts`
- Updated template default status from `unread` to `pending`.

### `schemaTypes/documents/agent.ts`
- Added agent business profile fields:
  - `company` (optional)
  - `companyLogo` (optional image)
- Added per-channel contact + visibility pattern:
  - `whatsapp` + `showWhatsapp`
  - `telegram` + `showTelegram`
  - `messenger` + `showMessenger`
  - `viber` + `showViber`
- Visibility toggles are hidden/read-only unless the corresponding value exists, preventing public enablement of empty channels.
- Added hidden service data fields with admin-only visibility in Studio UI:
  - `agentId` (auto-generated stable token on create)
  - `agentKey` (auto-generated stable token on create)
  - `telegramChatId`
  - `telegramChatLinked`
  - `sendLeadsToTelegram`
- Kept existing schema behavior and promotion fields unchanged.

### `schemaTypes/documents/property.ts`
- Added minimal create-time auto-link helper that resolves:
  - `currentUser.id` -> `studioUserAccess` -> `linkedAgent`
- Updated `agent` field `initialValue`:
  - auto-reference linked agent only when user has `role == "agent"` and `linkedAgent`.
  - admin/editor unchanged (manual selection).
- Updated hidden `ownerUserId` field `initialValue`:
  - sets current user id only for mapped agent users with linked agent.
  - returns empty string for admin/editor.
- Behavior applies only on document initialization; no publish/edit overwrite.

### `structure/index.ts`
- Added role-aware desk workspace entry:
  - resolves current user mapping from `studioUserAccess`.
  - treats Sanity administrator role as admin fallback.
- Implemented pseudo-role desk UX:
  - **Admin:** broad existing access + `Property Leads` + `Studio User Access`
  - **Editor:** editorial sections only (`Home Landing`, `Landing Pages`, `Catalog SEO Pages`, `Blog`)
  - **Agent:** `My Profile`, `My Properties`, `My Leads`
- Agent list filters use linked agent reference:
  - properties: `property.agent._ref == linkedAgentId`
  - leads: `propertyLead.linkedAgent._ref == linkedAgentId`
- Preserved existing major admin sections and property workflow structure.

### `docs/ACCESS_CONTROL.md`
- Updated to describe pseudo-role workflow containment model.
- Added explicit notes about free-plan limitations and non-enforced security.
- Documented `studioUserAccess`, `property.agent` linkage, and `propertyLead`.
- Clarified that hidden/readOnly fields are UX controls, not true security.

### `docs/registration-request-sanity-frontend-contract.md`
- Updated registration status contract:
  - default from `unread` -> `pending`
  - allowed explicit statuses to `pending | approved | rejected`
- Updated integration notes accordingly.

## 3. Summary

Implemented Phase 1 CMS-side workflow containment for Sanity Studio without frontend changes:

- Added pseudo-role mapping with `studioUserAccess`.
- Added dedicated property contact leads schema (`propertyLead`).
- Updated registration request workflow to `pending/approved/rejected`.
- Extended agent schema with company data, safe per-channel contact visibility controls, and hidden service fields.
- Added create-time property auto-linking for agent users via `currentUser -> studioUserAccess -> linkedAgent`.
- Updated desk structure to provide role-scoped experiences for admin/editor/agent using filtered lists and linked agent resolution.

Pseudo-role flow now works as:
- current Studio user is matched in `studioUserAccess`.
- role determines desk experience.
- for agent role, linked agent reference drives My Profile/My Properties/My Leads.

Property auto-link now works as:
- on create, mapped agent users get `property.agent` prefilled from `linkedAgent`.
- on create, mapped agent users also get `ownerUserId` set from `currentUser.id`.
- admin/editor create flow remains manual for `agent`.
- later edits/publish do not overwrite ownership/linking fields automatically.

Leads/registration/agent updates:
- leads are separate from registration requests.
- registration keeps inbound-readonly style, with new review statuses.
- agent model now includes requested operational and channel visibility fields in a minimal way.

## 4. Notes

- Assumptions made:
  - New lead schema name is `propertyLead` for clarity and separation from registration flow.
  - Sanity administrator role should retain full access regardless of pseudo-role document presence.
  - `active` in `studioUserAccess` is useful as a minimal operational switch.

- Free-plan limitation reminders:
  - This is Studio UX/workflow containment only.
  - It is not row-level/document-level enforcement at API level.
  - Hidden/readOnly fields are not hard security.

- Follow-up needed later in frontend/backend repo:
  - Property page submission pipeline should create `propertyLead` docs with required snapshots and metadata.
  - Frontend should render channel links only when both channel value and `show*` toggle are true.
  - Frontend/backend should derive lead routing from property’s linked agent as needed.

- Migration/backfill considerations:
  - Existing agents will not have `agentId`/`agentKey` until edited or backfilled.
  - Existing properties with missing `ownerUserId` remain unchanged.
  - Existing users need `studioUserAccess` docs to participate in new pseudo-role workflow.
