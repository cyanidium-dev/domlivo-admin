import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'
import {districtInCityTemplate} from './templates/districtInCity'
import {blogSettingsTemplate} from './templates/blogSettings'
import {registrationRequestDefaultTemplate} from './templates/registrationRequestDefault'
import {withPropertyPromotionPublishGuard} from './components/sanity/PropertyPromotionPublishAction'
import {OpenInLandingEditorAction} from './components/sanity/OpenInLandingEditorAction'

export default defineConfig({
  name: 'default',
  title: 'domlivo-admin',

  projectId: 'g4aqp6ex',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  document: {
    actions: (prev, context) => {
      // Property promotion publish guard (existing behavior).
      let actions = prev
      if (context.schemaType === 'property') {
        actions = actions.map((action) => {
          if (action.action === 'publish') {
            return withPropertyPromotionPublishGuard(action)
          }
          return action
        })
      }
      // Expose "Open in landing editor" on landing documents.
      if (context.schemaType === 'landingPage') {
        actions = [...actions, OpenInLandingEditorAction]
      }
      return actions
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
