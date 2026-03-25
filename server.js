import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the compiled Vue Vite files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Serve the index.html on all unmatched routes to support Vue Router (SPA)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Production server listening on http://0.0.0.0:${PORT}`);
});
