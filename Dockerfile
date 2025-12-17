FROM node:18-alpine

WORKDIR /app

# Required for node-gyp (VERY IMPORTANT)
RUN apk add --no-cache python3 make g++

# Copy only backend dependency files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy backend source
COPY server ./server

# Create uploads dir
RUN mkdir -p uploads

EXPOSE 5000

CMD ["npm", "run", "dev"]
