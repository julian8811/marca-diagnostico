import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const SUPA_URL = 'https://fyjvswgqgyvrakluyteq.supabase.co';
const PUB_KEY = 'sb_publishable_R6Wseju-vULpJt9lIrWl5Q_Zj4sC6yH';

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': PUB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (r.ok) res.json({ token: data.access_token, user: data.user });
    else res.status(401).json({ error: data.error_description || data.msg });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/search-sipi', async (req, res) => {
  res.json({ 
    message: 'SIPI search requires Playwright. Deploy with Playwright support or run locally.',
    results: [],
    stored: 0
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MarcaCheck 360 API running' });
});

app.listen(PORT, () => {
  console.log(`MarcaCheck 360 Server: http://localhost:${PORT}`);
});
