#!/usr/bin/env node
/* ================================================================
   LinkVault — Sitemap Generator
   File   : generate-sitemap.js
   Author : MD KAWSAR

   PURPOSE:
     Automatically scans the project root directory for HTML files
     and generates a standards-compliant sitemap.xml file that
     search engines (Google, Bing, etc.) use to discover your pages.

   WHY NODE.JS (NOT PHP):
     Cloudflare Pages (and most static hosts like Netlify, Vercel,
     and GitHub Pages) do not support PHP. This script runs on your
     LOCAL machine during development, not on the server. You run it
     once, it creates sitemap.xml, then you upload that file as part
     of your normal deployment.

   REQUIREMENTS:
     • Node.js v14 or higher installed on your computer.
       Download from: https://nodejs.org  (choose the LTS version)
     • No extra packages needed — uses only Node's built-in modules.

   HOW TO RUN:
     1. Open a terminal / command prompt.
     2. Navigate to your LinkVault project root:
          cd /path/to/your/linkvault-project
     3. Run the script:
          node generate-sitemap.js
     4. A sitemap.xml file will be created in the same folder.
     5. Upload sitemap.xml to your live site root.
     6. Submit it in Google Search Console:
          https://search.google.com/search-console
          → Sitemaps → Enter "sitemap.xml" → Submit

   CUSTOMISATION:
     Edit the CONFIG object below to match your setup.
     Every setting is explained with a comment.
   ================================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   NODE.JS BUILT-IN MODULES
   These come with Node.js automatically — no npm install needed.
   ────────────────────────────────────────────────────────────── */
const fs   = require('fs');    // File System — read/write files
const path = require('path');  // Path utilities — join folder paths safely


/* ================================================================
   ██████╗ ██████╗ ███╗   ██╗███████╗██╗ ██████╗
  ██╔════╝██╔═══██╗████╗  ██║██╔════╝██║██╔════╝
  ██║     ██║   ██║██╔██╗ ██║█████╗  ██║██║  ███╗
  ██║     ██║   ██║██║╚██╗██║██╔══╝  ██║██║   ██║
  ╚██████╗╚██████╔╝██║ ╚████║██║     ██║╚██████╔╝
   ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝     ╚═╝ ╚═════╝

   EDIT THESE VALUES TO MATCH YOUR SITE.
   ================================================================ */
const CONFIG = {

  /* ── Your live website URL ────────────────────────────────────
     IMPORTANT: Use your real domain. No trailing slash.
     Examples:
       'https://yourdomain.com'
       'https://myname.github.io/linkvault'
       'https://myproject.pages.dev'
  ──────────────────────────────────────────────────────────────── */
  SITE_URL: 'https://yourdomain.com',

  /* ── Output file name ─────────────────────────────────────────
     Where the sitemap will be written.
     'sitemap.xml' is the standard name that search engines expect.
     Keep this as-is unless you have a specific reason to change it.
  ──────────────────────────────────────────────────────────────── */
  OUTPUT_FILE: 'sitemap.xml',

  /* ── Root directory to scan ───────────────────────────────────
     '.' means the current folder (where you run the script from).
     If your HTML files are in a subfolder, change this:
       './public'   ← if all HTML files live in a /public/ folder
       './dist'     ← if you use a build tool that outputs to /dist/
  ──────────────────────────────────────────────────────────────── */
  ROOT_DIR: '.',

  /* ── Files / folders to EXCLUDE from the sitemap ─────────────
     Add any file or folder name you do NOT want Google to index.
     Matching is case-insensitive and checks if the path contains
     any of these strings.

     Always exclude:
       'locked.html'  — dynamic redirect pages; Google can't use them
       '/admin/'      — your config tool folder; private
       '/node_modules/' — npm packages; never public
  ──────────────────────────────────────────────────────────────── */
  EXCLUDE_PATHS: [
    'locked.html',
    '/admin/',
    '/node_modules/',
    '/.git/',
    '/web-app/',
    '404.html',
    'offline.html',
  ],

  /* ── Default change frequency ────────────────────────────────
     Tells search engines how often your pages are likely to change.
     Options: 'always' | 'hourly' | 'daily' | 'weekly'
              'monthly' | 'yearly' | 'never'
     'weekly' is a safe default for a mostly-static marketing site.
  ──────────────────────────────────────────────────────────────── */
  DEFAULT_CHANGEFREQ: 'weekly',

  /* ── Default priority ────────────────────────────────────────
     A value from 0.0 to 1.0 indicating page importance.
     The homepage (index.html) gets a boosted priority automatically.
     0.8 is a good default for important sub-pages.
  ──────────────────────────────────────────────────────────────── */
  DEFAULT_PRIORITY: '0.8',

  /* ── Homepage priority ───────────────────────────────────────
     index.html always gets the highest priority.
  ──────────────────────────────────────────────────────────────── */
  HOMEPAGE_PRIORITY: '1.0',

  /* ── Per-page overrides ──────────────────────────────────────
     Optionally set custom changefreq or priority for specific pages.
     Key = path relative to root (e.g. 'about.html', 'blog/post.html')
     Value = object with optional { changefreq, priority } fields.

     Example:
       'about.html':   { priority: '0.6', changefreq: 'monthly' },
       'contact.html': { priority: '0.5' },
  ──────────────────────────────────────────────────────────────── */
  PAGE_OVERRIDES: {
    'index.html': { changefreq: 'daily' },
    // 'about.html': { priority: '0.6', changefreq: 'monthly' },
  },
};
/* ================================================================
   END OF CONFIG — do not edit below this line unless you know
   what you are doing.
   ================================================================ */


/* ──────────────────────────────────────────────────────────────
   STEP 1 — VALIDATE CONFIG
   ────────────────────────────────────────────────────────────── */
function validateConfig() {
  if (!CONFIG.SITE_URL || CONFIG.SITE_URL === 'https://yourdomain.com') {
    warn('CONFIG.SITE_URL is still set to the placeholder.');
    warn('The sitemap will be generated, but URLs will not be correct until you');
    warn('set your real domain in the CONFIG.SITE_URL field at the top of this file.');
  }
  if (!fs.existsSync(CONFIG.ROOT_DIR)) {
    fatal('Root directory "' + CONFIG.ROOT_DIR + '" does not exist. Check CONFIG.ROOT_DIR.');
  }
}


/* ──────────────────────────────────────────────────────────────
   STEP 2 — FIND ALL HTML FILES (recursive directory scan)
   ────────────────────────────────────────────────────────────── */

/**
 * Recursively walk a directory and return all .html file paths.
 *
 * @param  {string} dir       - Directory path to scan
 * @param  {string} baseDir   - The root dir (for building relative paths)
 * @returns {string[]}         - Array of relative file paths
 */
function findHtmlFiles(dir, baseDir) {
  var results = [];

  /* Read all entries in this directory */
  var entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    warn('Could not read directory: ' + dir + ' — ' + err.message);
    return results;
  }

  for (var i = 0; i < entries.length; i++) {
    var entry    = entries[i];
    var fullPath = path.join(dir, entry.name);

    /* Build the path relative to the project root (for clean URLs) */
    var relPath  = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    /* Skip hidden files/folders (start with .) */
    if (entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      /* Recurse into sub-directories */
      var subResults = findHtmlFiles(fullPath, baseDir);
      results = results.concat(subResults);

    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      /* ── Check against the exclusion list ── */
      var excluded = CONFIG.EXCLUDE_PATHS.some(function(exc) {
        return relPath.toLowerCase().includes(exc.toLowerCase());
      });

      if (!excluded) {
        results.push(relPath);
        log('  Found: ' + relPath);
      } else {
        log('  Skipped (excluded): ' + relPath);
      }
    }
  }

  return results;
}


/* ──────────────────────────────────────────────────────────────
   STEP 3 — BUILD SITEMAP XML STRING
   ────────────────────────────────────────────────────────────── */

/**
 * Convert a relative file path to a full canonical URL.
 * e.g. 'index.html' → 'https://yourdomain.com/'
 *      'about.html' → 'https://yourdomain.com/about.html'
 *
 * @param  {string} relPath - Relative HTML file path
 * @returns {string}         - Full URL
 */
function toUrl(relPath) {
  /* Clean trailing slash from base URL */
  var base = CONFIG.SITE_URL.replace(/\/$/, '');

  /* index.html at the root becomes the bare domain URL */
  if (relPath === 'index.html') return base + '/';

  /* Forward slashes only (Windows compatibility) */
  var cleanPath = '/' + relPath.replace(/\\/g, '/');
  return base + cleanPath;
}

/**
 * Get the last-modified date for a file.
 * Falls back to today's date if stat fails.
 *
 * @param  {string} filePath - Full file path
 * @returns {string}          - ISO date string (YYYY-MM-DD)
 */
function getLastMod(filePath) {
  try {
    var stat = fs.statSync(filePath);
    return stat.mtime.toISOString().slice(0, 10); // YYYY-MM-DD
  } catch (_) {
    return new Date().toISOString().slice(0, 10);
  }
}

/**
 * Build the complete sitemap XML string from the list of HTML files.
 *
 * @param  {string[]} files - Relative paths to all discovered HTML files
 * @returns {string}         - Complete sitemap.xml content
 */
function buildSitemapXml(files) {
  /* Sort so index.html always appears first, then alphabetically */
  files.sort(function(a, b) {
    if (a === 'index.html') return -1;
    if (b === 'index.html') return  1;
    return a.localeCompare(b);
  });

  var urlEntries = files.map(function(relPath) {
    var url         = toUrl(relPath);
    var lastmod     = getLastMod(path.join(CONFIG.ROOT_DIR, relPath));
    var overrides   = CONFIG.PAGE_OVERRIDES[relPath] || {};
    var isHomepage  = (relPath === 'index.html');

    var changefreq  = overrides.changefreq || CONFIG.DEFAULT_CHANGEFREQ;
    var priority    = overrides.priority   || (isHomepage ? CONFIG.HOMEPAGE_PRIORITY : CONFIG.DEFAULT_PRIORITY);

    /* Each <url> block in the sitemap */
    return [
      '  <url>',
      '    <loc>' + escapeXml(url) + '</loc>',
      '    <lastmod>' + lastmod + '</lastmod>',
      '    <changefreq>' + changefreq + '</changefreq>',
      '    <priority>' + priority + '</priority>',
      '  </url>',
    ].join('\n');
  });

  /* Assemble the full XML document */
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!--',
    '  Sitemap generated by LinkVault Sitemap Generator',
    '  Author  : MD KAWSAR',
    '  Generated: ' + new Date().toISOString(),
    '  Pages found: ' + files.length,
    '  Submit this file at: https://search.google.com/search-console',
    '-->',
    '<urlset',
    '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9',
    '  http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
    '',
    urlEntries.join('\n\n'),
    '',
    '</urlset>',
  ].join('\n');
}

/**
 * Escape characters that are not allowed raw inside XML strings.
 * Critical for URLs that might contain &, <, >, ', " characters.
 *
 * @param  {string} str - Raw string
 * @returns {string}     - XML-safe string
 */
function escapeXml(str) {
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}


/* ──────────────────────────────────────────────────────────────
   STEP 4 — WRITE OUTPUT FILE
   ────────────────────────────────────────────────────────────── */
function writeSitemap(xmlContent) {
  var outputPath = path.join(CONFIG.ROOT_DIR, CONFIG.OUTPUT_FILE);
  try {
    fs.writeFileSync(outputPath, xmlContent, 'utf8');
    return outputPath;
  } catch (err) {
    fatal('Could not write sitemap to "' + outputPath + '": ' + err.message);
  }
}


/* ──────────────────────────────────────────────────────────────
   LOGGING HELPERS
   ────────────────────────────────────────────────────────────── */
function log(msg)   { console.log(msg); }
function warn(msg)  { console.warn('\x1b[33m⚠  ' + msg + '\x1b[0m'); }
function ok(msg)    { console.log('\x1b[32m✓  ' + msg + '\x1b[0m'); }
function fatal(msg) { console.error('\x1b[31m✗  FATAL: ' + msg + '\x1b[0m'); process.exit(1); }


/* ──────────────────────────────────────────────────────────────
   MAIN — entry point
   ────────────────────────────────────────────────────────────── */
function main() {
  log('');
  log('══════════════════════════════════════════════');
  log('  LinkVault Sitemap Generator');
  log('  Author: MD KAWSAR');
  log('══════════════════════════════════════════════');
  log('');

  /* ── Validate config before doing anything ── */
  validateConfig();

  /* ── Scan for HTML files ── */
  log('Scanning for HTML files in: ' + path.resolve(CONFIG.ROOT_DIR));
  log('');

  var htmlFiles = findHtmlFiles(
    path.resolve(CONFIG.ROOT_DIR),
    path.resolve(CONFIG.ROOT_DIR)
  );

  log('');

  if (htmlFiles.length === 0) {
    warn('No HTML files found in "' + CONFIG.ROOT_DIR + '".');
    warn('Make sure you run this script from your project root folder.');
    process.exit(0);
  }

  log('Found ' + htmlFiles.length + ' HTML file(s) to include.');
  log('');

  /* ── Build the XML ── */
  var xml = buildSitemapXml(htmlFiles);

  /* ── Write the file ── */
  var outPath = writeSitemap(xml);

  /* ── Success! ── */
  log('');
  ok('sitemap.xml written to: ' + path.resolve(outPath));
  log('');
  log('  Next steps:');
  log('  1. Open sitemap.xml and verify the URLs look correct.');
  log('  2. Upload sitemap.xml to your live site root.');
  log('  3. Submit it in Google Search Console:');
  log('     → https://search.google.com/search-console');
  log('     → Sitemaps → Enter "sitemap.xml" → Submit');
  log('');
}

/* ── Run! ── */
main();
