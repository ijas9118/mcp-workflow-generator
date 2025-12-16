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

# Expose port (default 3000)
EXPOSE 3000

# Set environment variable to use SSE transport
ENV TRANSPORT=sse
ENV PORT=3000

# Start the server
CMD ["npm", "start"]
