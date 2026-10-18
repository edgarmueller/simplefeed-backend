FROM node:22-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NODE_ENV=production npx nx build simplefeed --skip-nx-cache

# The build emits a pruned package.json and lockfile next to the bundle,
# so the runtime image only installs what the server actually needs.
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist/apps/simplefeed ./
RUN npm ci --omit=dev && npm cache clean --force
USER node
CMD ["node", "main.js"]
