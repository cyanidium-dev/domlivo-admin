import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {districtInCityTemplate} from './templates/districtInCity'
import {blogSettingsTemplate} from './templates/blogSettings'
import {registrationRequestDefaultTemplate} from './templates/registrationRequestDefault'
import {withPropertyPromotionPublishGuard} from './components/sanity/PropertyPromotionPublishAction'

export default defineConfig({
  name: 'default',
  title: 'domlivo-admin',

  projectId: 'g4aqp6ex',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  document: {
    actions: (prev, context) => {
      if (context.schemaType !== 'property') return prev
      return prev.map((action) => {
        if (action.action === 'publish') {
          return withPropertyPromotionPublishGuard(action)
        }
        return action
      })
    },
  },

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      districtInCityTemplate,
      blogSettingsTemplate,
      registrationRequestDefaultTemplate,
    ],
  },
})
