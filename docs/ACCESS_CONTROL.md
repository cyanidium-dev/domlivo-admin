# Access Control Model

## Current Implementation

### Studio-side only (workflow containment, not hard security)

- **studioUserAccess** — Pseudo-role mapping (`admin` | `editor` | `agent`) for desk UX filtering.
- **linkedAgent** — On `studioUserAccess`, resolves agent workspace (`My Profile`, `My Properties`, `My Leads`).
- **ownerUserId** — String field on `property`, auto-populated from `currentUser.id` only for mapped agent users.
- **property.agent** — Auto-linked on property create for mapped agent users. Admin/editor keep manual agent selection.
- **propertyLead** — Separate inbound lead document for property contact submissions.

### What is NOT enforced

- **Content Lake API** — No row-level security. Any client with project credentials can read/write all documents.
- **Mutations** — No server-side check that the user "owns" a property before update/delete.
- **Frontend** — Public frontend reads published content; no user-specific filtering.
- **Field secrecy** — Hidden/readOnly fields are Studio UX restrictions, not cryptographic protection.

## Limitation

Sanity Content Lake does not support document-level or field-level access control out of the box. Access is controlled by:

1. **API tokens** — Read-only vs read-write
2. **Sanity Studio roles** — Who can open Studio and which document types they see
3. **Custom API** — A backend (e.g. Next.js API routes) that validates ownership before mutating

## Recommendation

- **Phase 1 (current):** Rely on Studio structure filters and pseudo-role mapping for workflow UX. No backend enforcement.
- **Phase 2 (future):** If you need true ownership enforcement:
  1. Deploy a custom API (e.g. Next.js API routes or edge functions)
  2. Validate `ownerUserId == currentUser.id` before allowing PATCH/DELETE on properties
  3. Validate lead visibility and access in API layer (never trust desk filtering alone)

## Migration

If you add or normalize `ownerUserId` on existing properties:

1. Run a migration script to set `ownerUserId` from agent mappings where appropriate, or leave empty for legacy properties
2. Agent desk "My Properties" is filtered by `property.agent` reference; ownership (`ownerUserId`) is still useful operational metadata
