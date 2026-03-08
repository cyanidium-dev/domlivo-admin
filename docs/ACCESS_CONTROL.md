# Access Control Model

## Current Implementation

### Studio-side only

- **ownerUserId** — String field on `property`, populated with `currentUser.id` when a property is created. Hidden in the UI.
- **My Properties** — Studio structure filter: `ownerUserId == $userId`. Shows only properties where the logged-in user's ID matches.
- **agent.userId** — Optional link from agent to Sanity user. Used for display; not enforced at API level.

### What is NOT enforced

- **Content Lake API** — No row-level security. Any client with project credentials can read/write all documents.
- **Mutations** — No server-side check that the user "owns" a property before update/delete.
- **Frontend** — Public frontend reads published content; no user-specific filtering.

## Limitation

Sanity Content Lake does not support document-level or field-level access control out of the box. Access is controlled by:

1. **API tokens** — Read-only vs read-write
2. **Sanity Studio roles** — Who can open Studio and which document types they see
3. **Custom API** — A backend (e.g. Next.js API routes) that validates ownership before mutating

## Recommendation

- **Phase 1 (current):** Rely on Studio structure filters for editor UX. Editors see "My Properties" and "All Properties". No backend enforcement.
- **Phase 2 (future):** If you need true ownership enforcement:
  1. Deploy a custom API (e.g. Next.js API routes or edge functions)
  2. Validate `ownerUserId == currentUser.id` before allowing PATCH/DELETE on properties
  3. Optionally: use Sanity webhooks + your API to sync `agent.userId` with `ownerUserId` for agent-owned listings

## Migration

If you add `ownerUserId` to existing properties:

1. Run a migration script to set `ownerUserId` from the property's `agent.userId` (if agent has `userId`), or leave empty for legacy properties
2. "My Properties" will only show properties with matching `ownerUserId`; legacy properties remain under "All Properties"
