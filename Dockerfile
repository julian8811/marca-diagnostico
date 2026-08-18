FROM mcr.microsoft.com/playwright:v1.61.0-noble

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

COPY . .

ENV SUPA_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5anZzd2dxZ3l2cmFrbHV5dGVxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njg3NTgwNCwiZXhwIjoyMTAyNDUxODA0fQ.xhjFRB1g8mGEe0QvaBhQvO5SkwIQZ0GKUeWg7KG32BU

EXPOSE 3000

CMD ["node", "server.mjs"]
