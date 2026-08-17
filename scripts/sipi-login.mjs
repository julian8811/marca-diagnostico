#!/usr/bin/env node
/**
 * Supabase Auth Login - Get JWT token for Edge Functions
 * Usage: node scripts/sipi-login.mjs <email> <password>
 */

const SUPA_URL = 'https://fyjvswgqgyvrakluyteq.supabase.co';
const SUPA_KEY = 'sb_publishable_R6Wseju-vULpJt9lIrWl5Q_Zj4sC6yH';

const [, , email, password] = process.argv;

if (!email || !password) {
  console.error('Usage: node sipi-login.mjs <email> <password>');
  process.exit(1);
}

async function login() {
  const res = await fetch(`${SUPA_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'apikey': SUPA_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (res.ok) {
    console.log(data.access_token);
  } else {
    console.error('Login failed:', data.error_description || data.msg || JSON.stringify(data));
    process.exit(1);
  }
}

login();
