# Node Backend Build
FROM node:20-alpine
WORKDIR /usr/src/app

# Copy package descriptors
COPY package*.json ./

# Install packages
RUN npm install

# Copy source code and prisma schemas
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript to JavaScript
RUN npm run build

# Expose Express server port
EXPOSE 5001

# Command to launch Express server
CMD ["npm", "start"]
