/**
 * Shared Sanity client for scripts (token from .env).
 */
import path from 'path'
import {config as loadDotenv} from 'dotenv'
import {createClient, type SanityClient} from '@sanity/client'

loadDotenv({path: path.resolve(process.cwd(), '.env')})

export function getSanityClientForScripts(): SanityClient {
  const projectId = (process.env.SANITY_PROJECT_ID || 'g4aqp6ex').trim()
  const dataset = (process.env.SANITY_DATASET || 'production').trim()
  const apiVersion = (process.env.SANITY_API_VERSION || '2024-01-01').trim()
  const token = process.env.SANITY_API_TOKEN?.trim()
  if (!token) {
    throw new Error('SANITY_API_TOKEN required. Add to .env')
  }
  return createClient({projectId, dataset, apiVersion, useCdn: false, token})
}
