FROM node:18-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Expose port 4400 for Angular development server
EXPOSE 4400

# Start the Angular development server
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4400", "--poll", "2000"]
