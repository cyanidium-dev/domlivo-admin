import {defineField} from 'sanity'

/**
 * Reusable language field for multilingual documents.
 * Used by @sanity/document-internationalization plugin.
 */
export const languageField = defineField({
  name: 'language',
  type: 'string',
  readOnly: true,
  hidden: true,
})
