import dotenv from 'dotenv';
import path from 'path';
import express from 'express';
import { ToolsService, tool, ParameterType } from '@optimizely-opal/opal-tools-sdk';
import { Pool } from 'pg';
import OpenAI from 'openai';

// Load environment variables from .env.local for local development
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Create Express app
const app = express();
app.use(express.json());

// Validate required environment variables
const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const openaiApiKey = process.env.OPENAI_API_KEY;

if (!dbPassword) {
  console.error('Missing required environment variable: SUPABASE_DB_PASSWORD');
  process.exit(1);
}

if (!openaiApiKey) {
  console.error('Missing required environment variable: OPENAI_API_KEY');
  process.exit(1);
}

// PostgreSQL connection configuration
const pool = new Pool({
  host: 'aws-0-us-east-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.ldfcmkqfcicjqmwiclur',
  password: dbPassword,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// OpenAI client for generating embeddings
const openai = new OpenAI({ apiKey: openaiApiKey });

// Create Tools Service
const toolsService = new ToolsService(app);

// Interface for search parameters
interface SearchParameters {
  query: string;
  limit?: number;
}

// Interface for search result
interface SearchResult {
  id: string;
  content: string;
  drupal_entity_id?: string;
  drupal_long_id?: string;
  similarity: number;
}

/**
 * Generate embedding for a query using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text
  });
  return response.data[0].embedding;
}

/**
 * Phase2 Search Tool: Searches the Phase2 Technology website content
 * using vector similarity search
 */
async function phase2Search(parameters: SearchParameters): Promise<{
  results: SearchResult[];
  query: string;
  count: number;
}> {
  const { query, limit = 5 } = parameters;
  const matchThreshold = parseFloat(process.env.MATCH_THRESHOLD || '0.5');

  try {
    // Generate embedding for the search query
    const queryEmbedding = await generateEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(',')}]`;

    // Query the Phase2Website collection using cosine similarity
    const result = await pool.query(
      `SELECT
        id,
        content,
        drupal_entity_id,
        drupal_long_id,
        1 - (embedding <=> $1::vector) as similarity
      FROM "Phase2Website"
      WHERE 1 - (embedding <=> $1::vector) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3`,
      [embeddingStr, matchThreshold, limit]
    );

    const results: SearchResult[] = result.rows.map((row) => ({
      id: String(row.id),
      content: String(row.content),
      drupal_entity_id: row.drupal_entity_id ? String(row.drupal_entity_id) : undefined,
      drupal_long_id: row.drupal_long_id ? String(row.drupal_long_id) : undefined,
      similarity: parseFloat(row.similarity)
    }));

    return {
      results,
      query,
      count: results.length
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('Search error:', errorMessage);
    throw new Error(`Failed to search Phase2 content: ${errorMessage}`);
  }
}

// Register the search tool
tool({
  name: 'phase2-search',
  description: 'Searches the Phase2 Technology website content using semantic vector search. Returns relevant pages and content based on the query.',
  parameters: [
    {
      name: 'query',
      type: ParameterType.String,
      description: 'The search query to find relevant Phase2 Technology content',
      required: true
    },
    {
      name: 'limit',
      type: ParameterType.Number,
      description: 'Maximum number of results to return (default: 5, max: 20)',
      required: false
    }
  ]
})(phase2Search);

// Health check endpoint for render.com
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Phase2 Search service running on port ${PORT}`);
  console.log(`Discovery endpoint: http://localhost:${PORT}/discovery`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database pool...');
  await pool.end();
  process.exit(0);
});
