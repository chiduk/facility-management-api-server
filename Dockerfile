# development stage
FROM --platform=linux/amd64 node:18-alpine as base
WORKDIR /usr/src/app
ENV REDIS_URL redis://0.0.0.0:6379
ENV MONGODB_URL mongodb://0.0.0.0:27017/fm
COPY .env package.json yarn.lock tsconfig.json ecosystem.config.json ./
COPY ./src ./src
RUN ls -a
RUN yarn install --pure-lockfile && yarn compile
RUN yarn global add pm2
CMD [ "yarn", "dev" ]
EXPOSE 3000

# production stage

FROM --platform=linux/amd64 base as production

WORKDIR /usr/prod/app

ENV NODE_ENV=production

COPY package.json yarn.lock ecosystem.config.json ./

RUN yarn install --production --pure-lockfile

COPY --from=base /usr/src/app/dist ./dist
