# Custom Dockerfile to install Playwright browsers in production
# This will be appended to the generated Wasp Dockerfile

# Install specific version of Playwright globally
RUN npm install -g playwright@1.48.2

# Install required system dependencies for Playwright on Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Install Playwright browsers without system dependencies
RUN cd /app && npx playwright install chromium

# Set proper permissions for all browsers
RUN find /root/.cache/ms-playwright/ -name "chrome" -type f -exec chmod +x {} \; && \
    find /root/.cache/ms-playwright/ -name "headless_shell" -type f -exec chmod +x {} \; && \
    ls -la /root/.cache/ms-playwright/
