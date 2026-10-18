import 'dotenv/config';
import { createClient } from '@sanity/client';
const c = createClient({ projectId: process.env.SANITY_PROJECT_ID, dataset: process.env.SANITY_DATASET, apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN });
console.log(JSON.stringify(await c.fetch(process.argv[2]), null, 1));
