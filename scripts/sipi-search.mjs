#!/usr/bin/env node
/**
 * SIPI Trademark Search - Playwright Automation
 * Usage: SUPA_SERVICE_ROLE=xxx node scripts/sipi-search.mjs <search_id> <marca> [clase_niza]
 * 
 * Searches SIPI (sipi.sic.gov.co) for trademark coincidences
 * and stores results in Supabase matches table.
 */

import { chromium } from 'playwright';

const SUPA_URL = 'https://fyjvswgqgyvrakluyteq.supabase.co';
const SVC_KEY = process.env.SUPA_SERVICE_ROLE;
const PUB_KEY = 'sb_publishable_R6Wseju-vULpJt9lIrWl5Q_Zj4sC6yH';

const [, , searchId, marca, claseNiza = ''] = process.argv;

if (!searchId || !marca) {
  console.error('Usage: SUPA_SERVICE_ROLE=xxx node sipi-search.mjs <search_id> <marca> [clase_niza]');
  process.exit(1);
}

if (!SVC_KEY) {
  console.error('Set SUPA_SERVICE_ROLE environment variable');
  process.exit(1);
}

console.log(`Searching SIPI for: "${marca}" (class: ${claseNiza || 'all'})`);

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
  console.log('Connecting to SIPI...');
  await page.goto('https://sipi.sic.gov.co/sipi/extra/', { waitUntil: 'networkidle', timeout: 30000 });
  
  console.log('Opening Trademark search...');
  await page.click('#MainContent_lnkTMSearch');
  await page.waitForTimeout(2000);
  
  console.log('Opening Advanced Search...');
  await page.click('#MainContent_ctrlTMSearch_lnkAdvanceSearch');
  await page.waitForTimeout(2000);
  
  console.log('Filling search criteria...');
  await page.fill('#MainContent_ctrlTMSearch_txtDeno', marca);
  await page.selectOption('#MainContent_ctrlTMSearch_ddlCaseType', '1');
  await page.selectOption('#MainContent_ctrlTMSearch_ddlNature', '1');
  await page.selectOption('#MainContent_ctrlTMSearch_ddlType', '1');
  await page.selectOption('#MainContent_ctrlTMSearch_ddlCountry', 'CO');
  
  if (claseNiza) {
    await page.fill('#MainContent_ctrlTMSearch_txtNiceClassification', claseNiza);
  }
  
  console.log('Executing search...');
  await page.click('#MainContent_ctrlTMSearch_lnkbtnSearch');
  await page.waitForTimeout(8000);
  
  console.log('Extracting results...');
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
  
  console.log(`Found ${results.length} results`);
  results.forEach((r, i) => {
    console.log(`  ${i+1}. ${r.denominacion} | Clase ${r.clases} | ${r.estado}`);
  });
  
  // Store in Supabase matches table (using service_role to bypass RLS)
  console.log('Storing results in Supabase...');
  let stored = 0;
  for (const r of results) {
    const matchData = {
      search_id: searchId,
      source: 'sipi',
      matched_name: r.denominacion,
      class_no: parseInt(r.clases) || null,
      legal_status: r.estado,
      external_id: r.expediente,
      risk: 'insufficient'
    };
    
    const res = await fetch(`${SUPA_URL}/rest/v1/matches`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SVC_KEY}`,
        'apikey': PUB_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(matchData)
    });
    
    if (res.ok) {
      stored++;
    } else {
      const err = await res.json();
      console.error(`Failed to store ${r.denominacion}:`, err.message);
    }
  }
  
  // Update source check
  await fetch(`${SUPA_URL}/rest/v1/search_source_checks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SVC_KEY}`,
      'apikey': PUB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify({
      search_id: searchId,
      source: 'sipi',
      status: 'completed',
      message: `${stored} resultado(s) encontrados`,
      checked_at: new Date().toISOString()
    })
  });
  
  console.log(`Done! ${stored}/${results.length} results stored.`);
  
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await browser.close();
}
