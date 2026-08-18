import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
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
  const { search_id, marca, clase_niza } = req.body;
  if (!search_id || !marca) return res.status(400).json({ error: 'search_id and marca required' });

  console.log(`Searching SIPI for: "${marca}"`);
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'es-CO', timezoneId: 'America/Bogota'
  });
  const page = await context.newPage();
  await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });

  try {
    await page.goto('https://sipi.sic.gov.co/sipi/extra/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('#MainContent_lnkTMSearch');
    await page.waitForTimeout(2000);
    await page.click('#MainContent_ctrlTMSearch_lnkAdvanceSearch');
    await page.waitForTimeout(2000);
    await page.fill('#MainContent_ctrlTMSearch_txtDeno', marca);
    await page.selectOption('#MainContent_ctrlTMSearch_ddlCaseType', '1');
    await page.selectOption('#MainContent_ctrlTMSearch_ddlNature', '1');
    await page.selectOption('#MainContent_ctrlTMSearch_ddlType', '1');
    await page.selectOption('#MainContent_ctrlTMSearch_ddlCountry', 'CO');
    if (clase_niza) await page.fill('#MainContent_ctrlTMSearch_txtNiceClassification', clase_niza);
    await page.click('#MainContent_ctrlTMSearch_lnkbtnSearch');
    await page.waitForTimeout(8000);

    const results = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      let rt = null;
      for (const t of tables) { for (const h of t.querySelectorAll('th')) { if (h.textContent?.includes('Expediente No')) { rt = t; break; } } if (rt) break; }
      if (!rt) return [];
      const data = [];
      for (let i = 1; i < rt.querySelectorAll('tr').length; i++) {
        const c = rt.querySelectorAll('tr')[i].querySelectorAll('td');
        if (c.length >= 8) {
          const exp = c[1]?.textContent?.trim() || '';
          const den = c[3]?.textContent?.trim() || '';
          const est = c[6]?.textContent?.trim() || '';
          const cls = c[8]?.textContent?.trim() || '';
          if (exp && /^\d+$/.test(exp) && den && !den.includes('Seleccionar')) data.push({ expediente: exp, denominacion: den, estado: est, clases: cls });
        }
      }
      return data;
    });

    console.log(`Found ${results.length} results`);
    const SVC_KEY = process.env.SUPA_SERVICE_ROLE;
    let stored = 0;
    if (SVC_KEY) {
      for (const r of results) {
        const ok = await fetch(`${SUPA_URL}/rest/v1/matches`, {
          method: 'POST', headers: { 'Authorization': `Bearer ${SVC_KEY}`, 'apikey': PUB_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
          body: JSON.stringify({ search_id, source: 'sipi', matched_name: r.denominacion, class_no: parseInt(r.clases) || null, legal_status: r.estado, external_id: r.expediente, risk: 'insufficient' })
        });
        if (ok.ok) stored++;
      }
      await fetch(`${SUPA_URL}/rest/v1/search_source_checks`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${SVC_KEY}`, 'apikey': PUB_KEY, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify({ search_id, source: 'sipi', status: 'completed', message: `${stored} resultado(s) encontrados`, checked_at: new Date().toISOString() })
      });
    }
    res.json({ results, stored });
  } catch (e) { res.status(500).json({ error: e.message }); }
  finally { await browser.close(); }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\nMarcaCheck 360 Server: http://localhost:${PORT}`);
  console.log(`Endpoints: POST /api/login, POST /api/search-sipi\n`);
});
