import { createApp } from './app.js';

const PORT = Number(process.env.PORT) || 3001;
const { app } = createApp();

app
  .listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    console.log(`Server running on http://localhost:${PORT}`);
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
