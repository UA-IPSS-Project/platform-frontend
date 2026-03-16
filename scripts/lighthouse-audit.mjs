#!/usr/bin/env node
/**
 * Lighthouse audit script — Accessibility, Performance, Best Practices & SEO.
 *
 * Usage:
 *   npm run audit:a11y
 *
 * Prerequisites:
 *   1. Copy .env.lighthouse.example to .env.lighthouse and fill in credentials.
 *   2. Start the frontend server (npm run dev or docker compose up).
 *
 * Reports are written to:
 *   lighthouse-reports/<ISO-timestamp>/<page-name>.{html,json}
 */

import lighthouse from 'lighthouse';
import puppeteer from 'puppeteer';
import dotenv from 'dotenv';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

// ─── Bootstrap ───────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(ROOT, '.env.lighthouse') });

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const REPORTS_DIR = path.join(ROOT, 'lighthouse-reports', TIMESTAMP);

/** Lighthouse categories to audit. */
const AUDIT_CATEGORIES = ['accessibility', 'performance', 'best-practices', 'seo'];

/** Display labels for each category (used in terminal summary). */
const CATEGORY_LABELS = {
  accessibility: 'A11Y',
  performance:   'Perf',
  'best-practices': 'BP',
  seo:           ' SEO',
};

/**
 * Lighthouse flags shared across all audits.
 * - formFactor: 'desktop' — no mobile throttling, mirrors typical internal-tool usage.
 * - disableStorageReset: true — preserves cookies set by the Puppeteer login session.
 */
const LIGHTHOUSE_FLAGS = {
  output: ['html', 'json'],
  onlyCategories: AUDIT_CATEGORIES,
  formFactor: 'desktop',
  screenEmulation: {
    mobile: false,
    width: 1350,
    height: 940,
    deviceScaleFactor: 1,
    disabled: false,
  },
  throttling: {
    rttMs: 40,
    throughputKbps: 10_240,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 10_240,
    uploadThroughputKbps: 10_240,
  },
  disableStorageReset: true,
};

/**
 * Audit groups.
 * Each group shares a single browser session (one login → multiple page audits).
 * Set credentials to null for public pages that don't require authentication.
 * Pages can optionally define localStorage overrides to force an internal
 * dashboard view before the audit starts.
 *
 * Login types:
 *   'user'     → NIF identifier (Utilizador tab in LoginForm)
 *   'employee' → email identifier (Funcionário tab in LoginForm)
 */
const AUDIT_GROUPS = [
  {
    role: 'PUBLIC',
    credentials: null,
    pages: [
      { name: 'login',    path: '/login' },
      { name: 'register', path: '/register' },
    ],
  },
  {
    role: 'UTENTE',
    credentials: {
      type:       'user',
      identifier: process.env.UTENTE_NIF,
      password:   process.env.UTENTE_PASSWORD,
    },
    pages: [
      { name: 'utente-dashboard',      path: '/dashboard' },
      { name: 'utente-history',        path: '/dashboard/history' },
      { name: 'utente-profile',        path: '/dashboard/profile' },
      { name: 'utente-notifications',  path: '/dashboard/notifications' },
    ],
  },
  {
    role: 'SECRETARIA',
    credentials: {
      type:       'employee',
      identifier: process.env.SECRETARIA_EMAIL,
      password:   process.env.SECRETARIA_PASSWORD,
    },
    pages: [
      { name: 'secretary-dashboard', path: '/dashboard' },
      {
        name: 'secretary-requisitions',
        path: '/dashboard',
        storage: { secretaryDashboardView: 'requisitions' },
      },
      {
        name: 'secretary-management',
        path: '/dashboard',
        storage: { secretaryDashboardView: 'management' },
      },
    ],
  },
  {
    role: 'BALNEARIO',
    credentials: {
      type:       'employee',
      identifier: process.env.BALNEARIO_EMAIL,
      password:   process.env.BALNEARIO_PASSWORD,
    },
    pages: [
      { name: 'balneario-dashboard', path: '/dashboard' },
    ],
  },
  {
    role: 'ADMIN',
    credentials: {
      type:       'employee',
      identifier: process.env.ADMIN_EMAIL,
      password:   process.env.ADMIN_PASSWORD,
    },
    pages: [
      { name: 'admin-dashboard', path: '/dashboard' },
    ],
  },
];

// ─── Login helper ────────────────────────────────────────────────────────────

/**
 * Logs in to the application using a Puppeteer page.
 *
 * @param {import('puppeteer').Page} page
 * @param {{ type: 'user'|'employee', identifier: string, password: string }} cred
 */
async function loginAs(page, cred) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30_000 });

  // Switch to "Funcionário" tab for employee (email-based) logins.
  if (cred.type === 'employee') {
    await page.waitForSelector('button', { timeout: 10_000 });
    const allButtons = await page.$$('button');
    for (const btn of allButtons) {
      const text = await btn.evaluate((el) => el.textContent?.trim() ?? '');
      if (text.includes('Funcionário')) {
        await btn.click();
        await wait(400);
        break;
      }
    }
  }

  // Fill credentials.
  await page.waitForSelector('#identifier', { timeout: 10_000 });
  await page.click('#identifier', { clickCount: 3 });
  await page.type('#identifier', cred.identifier, { delay: 20 });

  await page.click('#password', { clickCount: 3 });
  await page.type('#password', cred.password, { delay: 20 });

  // Submit and wait for navigation to /dashboard.
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30_000 }),
    page.click('button[type="submit"]'),
  ]);

  const currentUrl = page.url();
  if (!currentUrl.includes('/dashboard')) {
    throw new Error(
      `Login failed for "${cred.identifier}" — ended up at: ${currentUrl}`,
    );
  }
}

// ─── Audit helper ────────────────────────────────────────────────────────────

/**
 * Runs a Lighthouse audit against a URL using an already-running Chrome instance.
 * Writes both .html and .json report files.
 *
 * @param {string}  url          Full URL to audit.
 * @param {number}  chromePort   Chrome DevTools remote debugging port.
 * @param {string}  reportName   Base filename for the reports (no extension).
 * @param {string}  outputDir    Directory to write reports into.
 * @returns {Promise<Record<string, number|null>>} Category scores (0-100).
 */
async function runAudit(url, chromePort, reportName, outputDir) {
  const result = await lighthouse(url, { ...LIGHTHOUSE_FLAGS, port: chromePort });

  if (!result) throw new Error('Lighthouse returned no result');

  const { lhr, report } = result;
  const [htmlReport, jsonReport] = Array.isArray(report) ? report : [report, null];

  fs.writeFileSync(path.join(outputDir, `${reportName}.html`), htmlReport, 'utf8');
  fs.writeFileSync(
    path.join(outputDir, `${reportName}.json`),
    jsonReport ?? JSON.stringify(lhr, null, 2),
    'utf8',
  );

  const scores = {};
  for (const [id, cat] of Object.entries(lhr.categories)) {
    scores[id] = cat.score !== null ? Math.round(cat.score * 100) : null;
  }
  return scores;
}

// ─── Terminal summary ────────────────────────────────────────────────────────

function colorScore(value) {
  if (value === null || value === undefined) return '   -';
  const s = String(value).padStart(3);
  if (value >= 90) return `\x1b[32m ${s}\x1b[0m`; // green
  if (value >= 50) return `\x1b[33m ${s}\x1b[0m`; // yellow
  return `\x1b[31m ${s}\x1b[0m`;                   // red
}

function printSummary(results) {
  if (results.length === 0) {
    console.log('\nNo pages were audited.\n');
    return;
  }

  const PAGE_W = Math.max(12, ...results.map((r) => r.name.length));
  const catKeys = Object.keys(CATEGORY_LABELS);
  const divider = '─'.repeat(PAGE_W + catKeys.length * 7 + 2);

  console.log(`\n\x1b[1mSummary\x1b[0m`);
  console.log(divider);

  // Header row
  const headerCols = catKeys.map((k) => CATEGORY_LABELS[k].padStart(4));
  console.log(`  ${'Page'.padEnd(PAGE_W)}  ${headerCols.join('   ')}`);
  console.log(divider);

  // Data rows
  for (const { name, scores } of results) {
    const scoreCols = catKeys.map((k) => colorScore(scores[k])).join('  ');
    console.log(`  ${name.padEnd(PAGE_W)}  ${scoreCols}`);
  }

  console.log(divider + '\n');
}

// ─── Utilities ───────────────────────────────────────────────────────────────

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extracts the Chrome DevTools port from Puppeteer's wsEndpoint.
 * Format: ws://127.0.0.1:<PORT>/devtools/browser/<UUID>
 */
function getChromePort(browser) {
  const ws = browser.wsEndpoint();
  const match = ws.match(/:(\d+)\//);
  if (!match) throw new Error(`Cannot parse port from wsEndpoint: ${ws}`);
  return parseInt(match[1], 10);
}

function credsMissing(cred) {
  return !cred.identifier || !cred.password;
}

/**
 * Applies per-page localStorage state before navigating to the audit URL.
 * This is used for dashboards that persist the current internal view.
 *
 * @param {import('puppeteer').Page} page
 * @param {{ storage?: Record<string, string> }} pageConfig
 */
async function applyPageState(page, pageConfig) {
  const storage = pageConfig.storage ?? {};

  await page.evaluate((entries) => {
    for (const [key, value] of Object.entries(entries)) {
      window.localStorage.setItem(key, String(value));
    }
  }, storage);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  console.log(`\n\x1b[1mLighthouse Audit — ${new Date().toLocaleString()}\x1b[0m`);
  console.log(`Base URL : ${BASE_URL}`);
  console.log(`Reports  : ${REPORTS_DIR}\n`);

  const allResults = [];
  let anySkipped = false;

  for (const group of AUDIT_GROUPS) {
    const { role, credentials, pages } = group;

    console.log(`\x1b[1m── ${role}\x1b[0m`);

    // Skip groups with missing credentials (warn but don't crash).
    if (credentials && credsMissing(credentials)) {
      console.warn(
        `  \x1b[33m⚠  Skipping — credentials for ${role} not set in .env.lighthouse\x1b[0m`,
      );
      anySkipped = true;
      continue;
    }

    // Launch a fresh browser for each role (clean session isolation).
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1350, height: 940 });

      // Authenticate if credentials are provided.
      if (credentials) {
        process.stdout.write(`  Logging in as ${credentials.identifier}... `);
        await loginAs(page, credentials);
        console.log('\x1b[32m✓ logged in\x1b[0m');
      }

      const chromePort = getChromePort(browser);

      for (const pg of pages) {
        const url = `${BASE_URL}${pg.path}`;
        process.stdout.write(`  Auditing \x1b[1m${pg.name}\x1b[0m... `);

        await applyPageState(page, pg);

        // Navigate first so the SPA mounts the correct view before Lighthouse audits.
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });
        await wait(1_500); // Extra settle time for heavy SPA transitions.

        try {
          const scores = await runAudit(url, chromePort, pg.name, REPORTS_DIR);
          allResults.push({ name: pg.name, scores });

          const scoreStr = Object.keys(CATEGORY_LABELS)
            .map((k) => `${CATEGORY_LABELS[k].trim()}:${scores[k] ?? '-'}`)
            .join('  ');
          console.log(`\x1b[32m✓\x1b[0m  ${scoreStr}`);
        } catch (err) {
          console.error(`\x1b[31m✗ ${err.message}\x1b[0m`);
        }
      }
    } finally {
      await browser.close();
    }

    console.log('');
  }

  printSummary(allResults);

  if (anySkipped) {
    console.warn(
      '\x1b[33m⚠  Some groups were skipped — fill in .env.lighthouse and re-run.\x1b[0m\n',
    );
  }

  console.log(`Reports saved to:\n  ${REPORTS_DIR}\n`);
}

main().catch((err) => {
  console.error('\n\x1b[31mFatal error:\x1b[0m', err.message);
  process.exit(1);
});
