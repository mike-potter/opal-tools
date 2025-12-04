# Phase2 Search Tool

An Opal AI tool that searches Phase2 Technology website content using Supabase vector similarity search.

## Prerequisites

- Node.js 18+
- Access to the Phase2 Supabase vector database

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SUPABASE_DB_PASSWORD` | Yes | - | Database password |
| `OPENAI_API_KEY` | Yes | - | OpenAI API key for generating embeddings |
| `MATCH_THRESHOLD` | No | `0.5` | Minimum similarity score (0-1) |
| `PORT` | No | `3000` | Server port |

## Database Connection

The tool connects directly to PostgreSQL using the Supabase pooler:
- Host: `aws-0-us-east-2.pooler.supabase.com`
- Port: `6543`
- Database: `postgres`

## Local Development

```bash
# Install dependencies
npm install

# Set environment variables
export SUPABASE_DB_PASSWORD="your-password"
export OPENAI_API_KEY="your-openai-key"

# Run in development mode
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Docker

```bash
docker build -t phase2-search .
docker run -p 3000:3000 \
  -e SUPABASE_DB_PASSWORD="your-password" \
  -e OPENAI_API_KEY="your-openai-key" \
  phase2-search
```

## Render.com Deployment

1. Connect your repository to Render.com
2. Create a new Web Service
3. Set the root directory to `typescript/phase2-search`
4. Add environment variables in the Render dashboard:
   - `SUPABASE_DB_PASSWORD`
   - `OPENAI_API_KEY`
5. Deploy

## API Endpoints

- `GET /discovery` - Tool metadata for Opal registration
- `POST /tools/phase2-search` - Execute search
- `GET /health` - Health check endpoint

## Example Request

```bash
curl -X POST http://localhost:3000/tools/phase2-search \
  -H "Content-Type: application/json" \
  -d '{"query": "digital transformation services", "limit": 5}'
```

## Example Response

```json
{
  "results": [
    {
      "id": "abc123",
      "content": "Phase2 provides digital transformation services...",
      "drupal_entity_id": "node:123",
      "drupal_long_id": "entity:node/123:en",
      "similarity": 0.89
    }
  ],
  "query": "digital transformation services",
  "count": 1
}
```
