/**
 * Slug minting for the Parse action, so a parsed draft is publishable without
 * the editor pressing Generate — `slug` is `Rule.required()` on `property`.
 *
 * `slugify` is a deliberate copy of `slugify` in the bot repo
 * (`domlivo-bot/src/buildDraft.ts`): the two repos share no package, and the
 * Telegram and Studio intake routes must mint the same slug for the same
 * title. The test pins both to the same outputs, so drift shows up as a
 * failure rather than as two listings that disagree about their own URL.
 */

export function slugify(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
    .replace(/-+$/, '')
}

/**
 * `taken` comes from a query the Studio runs under the editor's own session —
 * the AI endpoints never touch the dataset. Suffixes start at 2 because the
 * unsuffixed slug is the first one.
 */
export function pickFreeSlug(base: string, taken: readonly string[]): string {
  const used = new Set(taken)
  if (!used.has(base)) return base
  for (let n = 2; n < 1000; n++) {
    const candidate = `${base}-${n}`
    if (!used.has(candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}
