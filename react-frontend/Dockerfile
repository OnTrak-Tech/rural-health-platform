# ----------------------------
# Stage 1: Base Image
# ----------------------------
FROM node:18-alpine         

# ----------------------------
# Stage 2: Working Directory
# ----------------------------
WORKDIR /app                   

# ----------------------------
# Stage 3: Install Dependencies
# ----------------------------
# Copy only package files first to leverage Docker layer caching
COPY package*.json ./

# Install production dependencies
# --only=production : install only prod dependencies
# --no-audit, --no-fund : skip audit/funding checks for speed
# --cache /tmp/.npm : use a temp cache for faster installs
RUN npm ci --only=production --no-audit --no-fund --cache /tmp/.npm

# ----------------------------
# Stage 4: Application Source
# ----------------------------
COPY . .                        

# Optional: Clear npm cache to reduce final image size
RUN npm cache clean --force

# ----------------------------
# Stage 5: Runtime
# ----------------------------
EXPOSE 3000                    
CMD ["npm", "start"]   