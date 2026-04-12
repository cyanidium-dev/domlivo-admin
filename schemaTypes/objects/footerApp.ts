import {defineType, defineField} from 'sanity'

const optionalHttpUrl = (Rule: any) =>
  Rule.custom((value: string | undefined) => {
    if (value == null || !String(value).trim()) return true
    const v = String(value).trim()
    if (!/^https?:\/\//i.test(v)) return 'Use a full URL starting with http:// or https://.'
    try {
      void new URL(v)
      return true
    } catch {
      return 'Enter a valid URL.'
    }
  })

export const footerApp = defineType({
  name: 'footerApp',
  title: 'Footer App Links',
  type: 'object',
  fields: [
    defineField({
      name: 'enabled',
      title: 'Enabled',
      type: 'boolean',
      initialValue: false,
      description:
        'When true, the frontend may show the app column (labels and layout are defined in code).',
    }),
    defineField({
      name: 'appStoreUrl',
      title: 'App Store URL',
      type: 'string',
      validation: optionalHttpUrl,
    }),
    defineField({
      name: 'googlePlayUrl',
      title: 'Google Play URL',
      type: 'string',
      validation: optionalHttpUrl,
    }),
    defineField({
      name: 'primaryUrl',
      title: 'Primary / fallback URL',
      type: 'string',
      validation: optionalHttpUrl,
    }),
  ],
})
