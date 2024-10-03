FROM node:17.0.1-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
EXPOSE 3001
