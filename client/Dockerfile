FROM node:19.4.0-bullseye-slim
 
# Set the working directory inside the container
WORKDIR /src
 
# Copy package.json and package-lock.json
COPY package*.json ./
 
RUN npm ci
 
# Copy the rest of your application files
COPY . .
 
# Expose the port your app runs on
EXPOSE 3000
 
# Define the command to run your app
CMD ["npm", "start"]