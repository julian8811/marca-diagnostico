import express from 'express';
import cors from 'cors';
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const SUPA_URL = 'https://fyjvswgqgyvrakluyteq.supabase.co';
const PUB_KEY = 'sb_publishable_R6Wseju-vULpJt9lIrWl5Q_Zj4sC6yH';

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const r = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'apikey': PUB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await r.json();
    if (r.ok) {
      res.json({ token: data.access_token, user: data.user });
    } else {
      res.status(401).json({ error: data.error_description || data.msg });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// SIPI Search endpoint
app.post('/api/search-sipi', async (req, res) => {
  const { search_id, marca, clase_niza, supa_token } = req.body;
  
  if (!search_id || !marca) {
    return res.status(400).json({ error: 'search_id and marca required' });
  }

  console.log(`🔍 Searching SIPI for: "${marca}"`);

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    locale: 'es-CO',
    timezoneId: 'America/Bogota'
  });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

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
    if (clase_niza) {
      await page.fill('#MainContent_ctrlTMSearch_txtNiceClassification', clase_niza);
    }

    await page.click('#MainContent_ctrlTMSearch_lnkbtnSearch');
    await page.waitForTimeout(8000);

    const results = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      let resultsTable = null;
      for (const table of tables) {
        const headers = table.querySelectorAll('th');
        for (const h of headers) {
          if (h.textContent?.includes('Expediente No')) {
            resultsTable = table;
            break;
          }
        }
        if (resultsTable) break;
      }
      if (!resultsTable) return [];
      const rows = resultsTable.querySelectorAll('tr');
      const data = [];
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length >= 8) {
          const expediente = cells[1]?.textContent?.trim() || '';
          const denominacion = cells[3]?.textContent?.trim() || '';
          const estado = cells[6]?.textContent?.trim() || '';
          const clases = cells[8]?.textContent?.trim() || '';
          if (expediente && /^\d+$/.test(expediente) && denominacion && !denominacion.includes('Seleccionar')) {
            data.push({ expediente, denominacion, estado, clases });
          }
        }
      }
      return data;
    });

    console.log(`📊 Found ${results.length} results`);

    // Store in Supabase
    const SVC_KEY = process.env.SUPA_SERVICE_ROLE;
    if (SVC_KEY && results.length > 0) {
      for (const r of results) {
        await fetch(`${SUPA_URL}/rest/v1/matches`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${SVC_KEY}`,
            'apikey': PUB_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            search_id,
            source: 'sipi',
            matched_name: r.denominacion,
            class_no: parseInt(r.clases) || null,
            legal_status: r.estado,
            external_id: r.expediente,
            risk: 'insufficient'
          })
        });
      }

      await fetch(`${SUPA_URL}/rest/v1/search_source_checks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SVC_KEY}`,
          'apikey': PUB_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify({
          search_id,
          source: 'sipi',
          status: 'completed',
          message: `${results.length} resultado(s) encontrados`,
          checked_at: new Date().toISOString()
        })
      });
    }

    res.json({ results, stored: results.length });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 MarcaCheck 360 Server running at http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /api/login        - Supabase auth`);
  console.log(`  POST /api/search-sipi  - Search SIPI for trademarks`);
  console.log(`\nUsage:`);
  console.log(`  SUPA_SERVICE_ROLE=xxx node server.mjs`);
});
