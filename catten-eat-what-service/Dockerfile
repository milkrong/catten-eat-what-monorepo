FROM oven/bun:1.0.20

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install

# Copy source code and config files
COPY src/ ./src/
COPY tsconfig.json vitest.config.ts ./

# Build the project
RUN bun run build

# Expose the port your app runs on
EXPOSE 3002

# Start the application
CMD ["bun", "run", "start:prod"] 