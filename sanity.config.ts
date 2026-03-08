import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {districtInCityTemplate} from './templates/districtInCity'

export default defineConfig({
  name: 'default',
  title: 'domlivo-admin',

  projectId: 'g4aqp6ex',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
    templates: (prev) => [...prev, districtInCityTemplate],
  },
})
