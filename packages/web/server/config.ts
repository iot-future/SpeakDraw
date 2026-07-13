export const config = {
  port: parseInt(process.env['SERVER_PORT'] ?? '3001', 10),
  corsOrigins: process.env['CORS_ORIGINS']?.split(',') ?? ['http://localhost:3000'],
  maxSessionAge: 60 * 60 * 1000, // 1 hour
};
