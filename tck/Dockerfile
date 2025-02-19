# Stage 1: Build
FROM node:20-slim AS build

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Override the local SDK dependency with the npm version and add missing dependencies
RUN pnpm add @hashgraph/sdk@^2.58.0 long@^5.2.3 @hashgraph/proto@^2.16.0-beta.8

# Install dependencies
RUN pnpm install

# Copy TCK source code
COPY . .

# Stage 2: Runtime
FROM node:20-slim

WORKDIR /app

# Install pnpm in the runtime stage
RUN npm install -g pnpm

# Copy only the necessary files from the build stage
COPY --from=build /app .

ENV RUNNING_IN_DOCKER=true 

# Expose the port used by the server
EXPOSE 8544

# Start the server
CMD ["pnpm", "start"]