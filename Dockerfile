FROM node:22-slim AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN NODE_ENV=production npx nx run-many -t build --projects=simplefeed,channels --skip-nx-cache

# Each build emits a pruned package.json and lockfile next to its bundle,
# so the runtime image only installs what the two apps actually need.
FROM node:22-slim
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY --from=builder /usr/src/app/dist/apps/simplefeed ./simplefeed
COPY --from=builder /usr/src/app/dist/apps/channels ./channels
RUN cd simplefeed && npm ci --omit=dev \
  && cd ../channels && npm ci --omit=dev \
  && npm cache clean --force
USER node
# the API by default; fly.toml runs the channels worker from the same image
CMD ["node", "simplefeed/main.js"]
