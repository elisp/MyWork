FROM node:8.9.0-alpine

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json /usr/src/app/

RUN npm install \
    && npm ls

# Bundle app source
COPY . /usr/src/app
RUN ls \
    && pwd

ENV PORT=9100

EXPOSE $PORT
HEALTHCHECK CMD curl --fail http://localhost:$PORT/alive || exit 1
