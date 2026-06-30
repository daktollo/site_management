# Backend API — Node.js (works on arm64 / Raspberry Pi)
FROM node:20-alpine
WORKDIR /app

# Install production dependencies (deterministic via lockfile)
COPY package*.json ./
RUN npm ci --omit=dev

# App source
COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
