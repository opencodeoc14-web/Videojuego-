FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node chaos-twins/ ./
RUN node build.cjs && node --check public/game.js && node --check server.cjs
USER node
EXPOSE 8080
CMD ["node", "server.cjs"]
