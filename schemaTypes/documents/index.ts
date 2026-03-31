import {catalogSeoPage} from './catalogSeoPage'
import {city} from './city'
import {district} from './district'
import {amenity} from './amenity'
import {blogCategory} from './blogCategory'
import {blogAuthor} from './blogAuthor'
import {blogPost} from './blogPost'
import {blogSettings} from './blogSettings'
import {agent} from './agent'
import {property} from './property'
import {propertyType} from './propertyType'
import {locationTag} from './locationTag'
import {siteSettings} from './siteSettings'
import {landingPage} from './landingPage'
import {registrationRequest} from './registrationRequest'

/**
 * Document types (standalone content)
 * Add new document schemas here.
 */
export const documents = [
  catalogSeoPage,
  landingPage,
  city,
  district,
  amenity,
  blogAuthor,
  blogCategory,
  blogPost,
  blogSettings,
  agent,
  property,
  propertyType,
  locationTag,
  siteSettings,
  registrationRequest,
]
