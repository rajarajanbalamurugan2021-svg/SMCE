import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const distPath = path.join(__dirname, 'dist');

// Serve static assets from production build directory if it exists
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (_req, res) => {
    res.status(200).send('SMCE Server is running. Run `npm run build` to generate static assets.');
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SMCE Application Server running on http://0.0.0.0:${PORT}`);
});
