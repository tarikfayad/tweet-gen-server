FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Set the port from the environment variable or default to 5001
ENV PORT=5001

# Expose the port
EXPOSE 5001

# Start the application
CMD [ "npm", "start" ]