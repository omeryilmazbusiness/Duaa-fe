FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG DUA_API_ORIGIN=http://localhost:8080
ENV DUA_API_ORIGIN=$DUA_API_ORIGIN
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Railway overwrites HOSTNAME with the container id; force bind in CMD.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["sh", "-c", "HOSTNAME=0.0.0.0 exec node server.js"]
