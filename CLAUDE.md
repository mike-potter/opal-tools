# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains sample tools services for Optimizely Opal, demonstrating how to build AI-accessible tools using the Opal Tools SDK. Currently, only the TypeScript implementation exists (Python and .NET samples were removed).

## Repository Structure

```
typescript/greeting/     # TypeScript sample tool service
├── src/index.ts        # Main application with tool definitions
├── package.json        # Node.js dependencies
├── tsconfig.json       # TypeScript configuration
└── Dockerfile          # Container build instructions
```

## Build and Run Commands

### TypeScript Sample (in `typescript/greeting/`)

```bash
# Install dependencies
npm install

# Development mode (with ts-node)
npm run dev

# Production build
npm run build

# Run production build
npm start
```

### Docker

```bash
docker build -t opal-sample-tools-typescript .
docker run -p 3000:3000 opal-sample-tools-typescript
```

## Architecture

### Opal Tools SDK Pattern

Tools are created using the `@optimizely-opal/opal-tools-sdk` package:

1. Create an Express app and wrap it with `ToolsService`
2. Define async handler functions with typed parameters
3. Register tools using the `tool()` decorator with name, description, and parameter definitions
4. The SDK automatically creates a `/discovery` endpoint for tool metadata
5. Tool endpoints are exposed at `/tools/{tool-name}`

### Key SDK Components

- `ToolsService`: Express middleware that manages tool registration and routing
- `tool()`: Decorator function to register tools with metadata
- `ParameterType`: Enum for parameter type definitions (String, Number, etc.)

### TypeScript Configuration

The project uses `experimentalDecorators` and `emitDecoratorMetadata` for the SDK's decorator-based tool registration.

## Testing Endpoints

- Discovery: `http://localhost:3000/discovery`
- Greeting tool: `POST http://localhost:3000/tools/greeting` with `{"name":"John"}`
- Date tool: `POST http://localhost:3000/tools/todays-date` with `{"format":"%Y-%m-%d"}`
