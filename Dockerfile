FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the project
RUN npm run build

EXPOSE 3000

# Set environment variable to use SSE transport
ENV TRANSPORT=sse

# Start the server
CMD ["npm", "start"]
