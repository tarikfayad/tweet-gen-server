# Use a specific Node.js version
FROM node:18

# Install necessary tools for directory listing
RUN apt-get update && apt-get install -y findutils

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# List all directories and store them in a file
RUN mkdir -p /root/volume_info && \
    find / -type d > /root/volume_info/all_directories.txt

# Set the port from the environment variable or default to 5001
ENV PORT=5001

# Expose the port
EXPOSE 5001

# Start the application
CMD [ "npm", "start" ]