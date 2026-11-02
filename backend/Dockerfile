# build stage
FROM node:22-alpine AS build
WORKDIR /app
# dependencies
COPY package*.json ./
RUN npm ci
# build
COPY . .
RUN npm run build

# run stage
FROM node:20-alpine
WORKDIR /app
# production
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
# copy build
COPY --from=build /app/dist ./dist
# start
CMD node dist/server.js