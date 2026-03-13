/**
 * Supported languages for the Domlivo CMS.
 * Single source of truth — add new languages here only.
 * Used for field-level i18n (localizedString, localizedSlug, localizedText, localizedSeo).
 */
export interface Language {
  id: string
  title: string
}

export const languages: Language[] = [
  {id: 'en', title: 'English'},
  {id: 'uk', title: 'Ukrainian'},
  {id: 'ru', title: 'Russian'},
  {id: 'sq', title: 'Albanian'},
  {id: 'it', title: 'Italian'},
]
