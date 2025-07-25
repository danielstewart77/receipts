FROM node:18-alpine

WORKDIR /app

# Install Angular CLI globally first
RUN npm install -g @angular/cli

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies with verbose logging
RUN npm install --verbose

# Copy the rest of the application
COPY . .

# Verify Angular workspace and required packages
RUN ls -la && test -f angular.json || (echo "ERROR: angular.json not found!" && exit 1)
RUN npm list @angular-devkit/build-angular || (echo "WARNING: @angular-devkit/build-angular not found, but continuing...")

# Expose port 4400 for Angular development server
EXPOSE 4400

# Start the Angular development server
CMD ["ng", "serve", "--host", "0.0.0.0", "--port", "4400", "--proxy-config", "proxy.conf.json", "--poll", "2000"]
