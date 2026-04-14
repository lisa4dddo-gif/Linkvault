/* ================================================================
   LinkVault — Ad Network Configuration
   File: assets/js/ads.js

   ╔══════════════════════════════════════════════════════════════╗
   ║  BUYER INSTRUCTIONS — READ THIS FIRST                       ║
   ╠══════════════════════════════════════════════════════════════╣
   ║  This file is the central hub for all your ad network        ║
   ║  JavaScript integrations. Paste your ad scripts here and    ║
   ║  configure the options below.                               ║
   ║                                                              ║
   ║  This file is loaded on BOTH index.html and locked.html     ║
   ║  so you can place ads on either or both pages.              ║
   ║                                                              ║
   ║  For banner / display ads, also paste the <script> tags     ║
   ║  directly into the ad zone divs inside locked.html.         ║
   ╚══════════════════════════════════════════════════════════════╝

   SUPPORTED AD TYPES:
   ─────────────────────────────────────────────────────────────────
   ① Pop-Under / Pop-Up        → Section A
   ② Push Notification Ads     → Section B
   ③ Native / In-Page Ads      → Section C
   ④ Custom JS on Page Load    → Section D (advanced)
   ─────────────────────────────────────────────────────────────────

   QUICK START GUIDE:
   1. Sign up with an ad network (Adsterra, PropellerAds, HilltopAds).
   2. Create a "Pop-Under" campaign and copy the script tag.
   3. Paste it in Section A below.
   4. For banner ads, copy the code into the <div> placeholders
      inside locked.html (search for "PASTE YOUR" in that file).
   ================================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────────
   ADS CONFIGURATION OBJECT
   Change any value here to customize behavior.
   ────────────────────────────────────────────────────────────────── */
const ADS_CONFIG = {

  /**
   * ENABLE / DISABLE ADS GLOBALLY
   * Set to false to turn off all ads loaded by this file at once.
   * Useful for testing your layout without showing real ads.
   */
  enabled: true,

  /**
   * LOAD ADS ONLY ON LOCKED PAGE?
   * true  → Ads from this file only fire on locked.html
   * false → Ads fire on every page that loads this script
   * Recommended: true (prevents pop-unders on your landing page)
   */
  onlyOnLockedPage: true,

  /**
   * AD DELAY (milliseconds)
   * Wait this many ms after page load before injecting ad scripts.
   * Helps ensure your page content loads first, improving UX score.
   * 0 = inject immediately.
   */
  loadDelay: 1500,

};

/* ──────────────────────────────────────────────────────────────────
   HELPER: Check if we're on the locked page
   ────────────────────────────────────────────────────────────────── */
function _isLockedPage() {
  return !!document.getElementById('countdown-section');
}

/* ──────────────────────────────────────────────────────────────────
   HELPER: Inject a script tag into the document <head>
   ─────────────────────────────────────────────────────────────────
   @param {string} src   - The URL of the external script to load
   @param {Object} attrs - Optional extra attributes (e.g., data-*)
   ────────────────────────────────────────────────────────────────── */
function _injectScript(src, attrs) {
  const script = document.createElement('script');
  script.src   = src;
  script.async = true;
  if (attrs) {
    Object.keys(attrs).forEach(function (key) {
      script.setAttribute(key, attrs[key]);
    });
  }
  document.head.appendChild(script);
}

/* ──────────────────────────────────────────────────────────────────
   HELPER: Inject an inline script block
   ─────────────────────────────────────────────────────────────────
   @param {string} code - Raw JavaScript code to execute
   ────────────────────────────────────────────────────────────────── */
function _injectInlineScript(code) {
  const script  = document.createElement('script');
  script.textContent = code;
  document.head.appendChild(script);
}


/* ================================================================
   SECTION A — POP-UNDER / POP-UP ADS
   ─────────────────────────────────────────────────────────────────
   These trigger when a visitor clicks anywhere on the page.
   They open your monetized URL in a new tab/window behind the
   current page (pop-under) or in front of it (pop-up).

   HOW TO SET UP (Adsterra example):
   1. Log in to Adsterra → Sites → Get Code
   2. Choose "Pop-under" format
   3. Copy the <script src="..."> URL
   4. Paste it into the _injectScript() call below

   HOW TO SET UP (PropellerAds example):
   1. Log in → Sites → Add Site → Direct Links
   2. Copy the script snippet
   3. Paste the inline JS into _injectInlineScript() below
   ================================================================ */
function _loadPopUnderAd() {

  /* ─── OPTION 1: External script URL (most common) ───
     Replace the src URL below with your network's script URL.
     Example Adsterra URL format:
     '//www.highperformanceformat.com/UNIQUE_ID/invoke.js'          */

  // _injectScript('//www.YOURNETWORK.com/YOUR_UNIQUE_POPUNDER_ID/invoke.js');


  /* ─── OPTION 2: Inline script block ───
     Some networks give you an inline snippet instead of a URL.
     Paste the entire code (without <script> tags) inside the backticks below. */

  // _injectInlineScript(`
  //   // Paste your PropellerAds / HilltopAds inline script here
  //   var _pop = _pop || [];
  //   _pop.push(['siteId', 'YOUR_SITE_ID']);
  //   // ... rest of their code
  // `);

}


/* ================================================================
   SECTION B — PUSH NOTIFICATION ADS
   ─────────────────────────────────────────────────────────────────
   These ask the visitor to subscribe to push notifications.
   The subscription is monetized by the ad network.

   HOW TO SET UP:
   1. Get your push subscription script URL from your ad network.
   2. Uncomment the _injectScript() line below and paste your URL.
   ================================================================ */
function _loadPushNotificationAd() {

  // _injectScript('//www.YOURNETWORK.com/YOUR_PUSH_ID/push.js');

}


/* ================================================================
   SECTION C — NATIVE / IN-PAGE PUSH ADS
   ─────────────────────────────────────────────────────────────────
   In-page push ads look like native notifications within the page
   itself. They don't require browser permission prompts.

   HOW TO SET UP:
   1. Create an In-Page Push campaign in your ad network dashboard.
   2. Paste the script below.
   ================================================================ */
function _loadInPagePushAd() {

  // _injectScript('//www.YOURNETWORK.com/YOUR_INPAGE_ID/inpage.js');

}


/* ================================================================
   SECTION D — CUSTOM JAVASCRIPT (Advanced)
   ─────────────────────────────────────────────────────────────────
   Run any custom JavaScript when the page loads.
   Useful for direct link integrations, custom trackers, etc.
   ================================================================ */
function _loadCustomCode() {

  // _injectInlineScript(`
  //   // Your custom tracking or ad initialization code here
  //   console.log('Custom ad code loaded');
  // `);

}


/* ================================================================
   AD LOADER — Main entry point
   Checks configuration flags and fires the appropriate ad loaders.
   ================================================================ */
function _loadAllAds() {
  // Global kill switch
  if (!ADS_CONFIG.enabled) return;

  // Optional: only load on the locked page
  if (ADS_CONFIG.onlyOnLockedPage && !_isLockedPage()) return;

  // Fire all configured ad sections
  _loadPopUnderAd();
  _loadPushNotificationAd();
  _loadInPagePushAd();
  _loadCustomCode();
}

/* ── Kick off the ad loader after the configured delay ── */
if (ADS_CONFIG.loadDelay > 0) {
  setTimeout(_loadAllAds, ADS_CONFIG.loadDelay);
} else {
  // Wait for DOM to be ready, then load immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _loadAllAds);
  } else {
    _loadAllAds();
  }
}


/* ================================================================
   NOTES FOR BUYERS
   ─────────────────────────────────────────────────────────────────
   Q: Where do I put my banner ad codes?
   A: In locked.html, search for "PASTE YOUR ... AD CODE HERE".
      There are 3 zones: header banner, content square, sticky footer.

   Q: Where do I put my pop-under script?
   A: In Section A above — uncomment and fill in your script URL.

   Q: How do I add a new ad zone to the page?
   A: Copy one of the <div id="ad-*-placeholder"> blocks in
      locked.html, give it a new ID and class, then style it
      in style.css using the .ad-zone classes as a template.

   Q: My ad network needs a specific variable before the script loads.
   A: Use _injectInlineScript() in Section D to set global vars first,
      then use _injectScript() to load the network's main script.

   Q: Can I show ads on index.html too?
   A: Yes — set ADS_CONFIG.onlyOnLockedPage = false in the config above.
      Then add ad zone divs to index.html just like in locked.html.
   ================================================================ */
