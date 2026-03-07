import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {documentInternationalization} from '@sanity/document-internationalization'
import {schemaTypes} from './schemaTypes'
import {languages} from './lib/languages'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'domlivo-admin',

  projectId: 'g4aqp6ex',
  dataset: 'production',

  plugins: [
    structureTool({structure}),
    visionTool(),
    documentInternationalization({
      supportedLanguages: languages,
      schemaTypes: ['city', 'district', 'blogPost', 'homePage', 'siteSettings'],
      languageField: 'language',
    }),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      ...languages.map((lang) => ({
        id: `homePage-${lang.id}`,
        title: `Home Page (${lang.title})`,
        schemaType: 'homePage',
        value: {language: lang.id},
      })),
      ...languages.map((lang) => ({
        id: `siteSettings-${lang.id}`,
        title: `Site Settings (${lang.title})`,
        schemaType: 'siteSettings',
        value: {language: lang.id},
      })),
    ],
  },
})
