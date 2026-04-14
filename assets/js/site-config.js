/* ================================================================
   LinkVault — Site Configuration
   File    : assets/js/site-config.js
   Author  : Lisa
   Generated: 2026-04-14 by LinkVault Config Tool

   HOW TO USE:
   Load this file in <head> BEFORE script.js:
     <script src="assets/js/site-config.js"><\/script>
     <script src="assets/js/script.js"><\/script>

   To change a setting, edit the value on the right side of
   each line, save the file, and re-upload it to your server.
================================================================ */

'use strict';

/* ── Branding ───────────────────────────────────────────── */
window.LV_SITE = {
  BRAND_NAME: "LinkVault",
  SITE_URL: "https://linkvault.eu.cc",
  TAGLINE: "",
  AUTHOR: "Lisa",
  
  /* ── Timer ──────────────────────────────────────────── */
  // How many seconds the countdown lasts.
  // Recommended: 10–30 seconds for best ad revenue.
  COUNTDOWN_SECONDS: 10,
  
  // The filename of your locked redirect page.
  // Change this if you rename locked.html.
  LOCKED_PAGE: "locked.html",
  
  /* ── Features ───────────────────────────────────────── */
  // true  = show overlay when an ad blocker is detected
  // false = ignore ad blockers (not recommended)
  ENABLE_ANTI_ADBLOCK: true,
  
  // true  = pause countdown when user switches to another tab
  // false = timer continues even if tab is hidden
  ENABLE_VISIBILITY_PAUSE: true,
  
  // true  = destination opens in a new tab (_blank)
  // false = destination opens in the same tab
  OPEN_IN_NEW_TAB: true,
  
  /* ── Theme Colors ───────────────────────────────────── */
  // These are injected as CSS custom properties at runtime.
  // Format: valid CSS hex color string.
  THEME: {
    BG: "#080c14", // page background
    ACCENT: "#00e0ff", // highlight / link color
    CARD: "#0e1420", // card surface color
  },
  
  /* ── SEO / Open Graph ───────────────────────────────── */
  OG_TITLE: "LinkVault — Monetize Every Click",
  OG_DESC: "",
  OG_IMAGE: "https://linkvault.eu.cc/assets/img/og-cover.webp",
  TWITTER: "",
  GA_ID: "", // Google Analytics — leave empty to disable
};

/* ── Apply theme colors to CSS variables immediately ─────── */
/* This runs before the stylesheet so there is no color flash. */
(function applyTheme() {
  var t = window.LV_SITE && window.LV_SITE.THEME;
  if (!t) return;
  var r = document.documentElement.style;
  if (t.BG) r.setProperty("--clr-bg", t.BG);
  if (t.ACCENT) r.setProperty("--clr-accent", t.ACCENT);
  if (t.CARD) r.setProperty("--clr-surface", t.CARD);
})();

/* Google Analytics not configured. */