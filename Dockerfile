FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create required directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "src/index.js"] 