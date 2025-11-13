# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install pnpm
RUN npm install -g pnpm

# Override the local SDK dependency with the npm version and add missing dependencies
RUN pnpm add @hiero-ledger/sdk@^2.70.0 long@^5.2.3 @hiero-ledger/proto@^2.21.0

# Install dependencies
RUN pnpm install

# Copy TCK source code
COPY . .

# Stage 2: Runtime
FROM node:20-alpine

WORKDIR /app

# Install pnpm in the runtime stage
RUN npm install -g pnpm

# Copy only the necessary files from the build stage
COPY --from=build /app .

# Expose the port used by the server
EXPOSE 8544

# Start the server
CMD ["pnpm", "start"]