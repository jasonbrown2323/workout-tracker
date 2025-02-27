FROM node:18-alpine as build

WORKDIR /app

# Add build arguments for environment variables
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Build for production
RUN npm run build

# This container doesn't need to run - we'll use the build output in nginx
CMD ["echo", "Build complete - use the build volume"]