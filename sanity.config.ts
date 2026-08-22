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
import {TranslateDocumentAction, TRANSLATE_ACTION_TYPES} from './components/sanity/ai/TranslateDocumentAction'
import {ParseFromTextAction} from './components/sanity/ai/ParseFromTextAction'
import {AMENITY_SUGGESTION_ACTIONS} from './components/sanity/ai/AmenitySuggestionActions'

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
      // AI actions: parse a pasted listing (property), translate localized fields.
      if (context.schemaType === 'property') {
        actions = [...actions, ParseFromTextAction]
      }
      if (TRANSLATE_ACTION_TYPES.has(context.schemaType)) {
        actions = [...actions, TranslateDocumentAction]
      }
      // Amenity review queue: map a wording onto an existing amenity, create a
      // new amenity as a draft, or reject it.
      if (context.schemaType === 'amenitySuggestion') {
        actions = [...actions, ...AMENITY_SUGGESTION_ACTIONS]
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
