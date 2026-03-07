/**
 * Supported languages for the Domlivo CMS.
 * Single source of truth — add new languages here only.
 * Used by @sanity/document-internationalization plugin.
 */
export interface Language {
  id: string
  title: string
}

export const languages: Language[] = [
  {id: 'en', title: 'English'},
  {id: 'ru', title: 'Russian'},
  {id: 'uk', title: 'Ukrainian'},
  {id: 'sq', title: 'Albanian'},
]
