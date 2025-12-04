FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install

# Copy application code
COPY src ./src

# Build the app
RUN npm run build

# Expose port (render.com will set PORT env var)
EXPOSE 3000

# Health check for render.com
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/health || exit 1

# Run the application
CMD ["node", "dist/index.js"]
