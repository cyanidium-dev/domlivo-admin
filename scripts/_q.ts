import path from 'node:path'
import {config} from 'dotenv'
import {createClient} from '@sanity/client'
config({path: path.resolve(process.cwd(), '.env')})
const c = createClient({projectId: process.env.SANITY_PROJECT_ID!, dataset: process.env.SANITY_DATASET || 'production', apiVersion: process.env.QV || '2025-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false})
const q = process.argv[2]
c.fetch(q).then((r) => console.log(JSON.stringify(r, null, 1)))
