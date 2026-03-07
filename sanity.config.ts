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
      schemaTypes: ['city', 'district', 'blogPost'],
      languageField: 'language',
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
