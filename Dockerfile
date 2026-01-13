FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm install
COPY server ./server
RUN mkdir -p uploads
EXPOSE 5001
CMD ["npm", "run", "dev"]
