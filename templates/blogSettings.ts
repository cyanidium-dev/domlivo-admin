import type {Template} from 'sanity'

/**
 * Initial value template for blog settings singleton.
 * Ensures the document is created with the correct _id for the structure.
 */
export const blogSettingsTemplate: Template = {
  id: 'blog-settings',
  title: 'Blog Settings',
  schemaType: 'blogSettings',
  value: {
    _id: 'blog-settings',
  },
}
