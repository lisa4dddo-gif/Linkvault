/* ================================================================
   LinkVault — Translation File
   File: assets/js/lang.js

   ════════════════════════════════════════════════════════════════
   HOW TO TRANSLATE THIS FILE
   ════════════════════════════════════════════════════════════════

   1. Duplicate this file and rename it for your language:
        lang.js        → lang.fr.js  (French)
        lang.js        → lang.de.js  (German)
        lang.js        → lang.es.js  (Spanish)
        …etc.

   2. Replace every English string VALUE with your translation.
        • Keys  (left of the colon) — NEVER change these.
        • Values (right of the colon, inside quotes) — translate these.

   3. In both index.html and locked.html, change the lang.js
      <script> tag in the <head> to point to your file:
        <script src="assets/js/lang.fr.js"></script>

   4. Save and reload — all UI text updates automatically.
      No other files need to be touched.

   ════════════════════════════════════════════════════════════════
   SPECIAL SYNTAX NOTES
   ════════════════════════════════════════════════════════════════

   • The strings for toast_paused and toast_resumed are set by JS
     (the Page Visibility timer) — translate them here and they
     will automatically appear in the correct language.

   • Strings for error_* keys are also set by JS (form validation
     and copy errors) — same rule applies.

   • The features_heading and how_heading keys use a literal \n
     to represent the line break in those two-line headings. The
     i18n engine in script.js converts \n → <br> automatically.
     Keep a \n in the translated version wherever you want a break.

   ════════════════════════════════════════════════════════════════
   SCRIPT LOAD ORDER  (both HTML pages)
   ════════════════════════════════════════════════════════════════

     <script src="assets/js/lang.js"></script>   ← FIRST (in <head>)
     <script src="assets/js/ads.js"></script>
     <script src="assets/js/script.js"></script>  ← SECOND (end of body)

   lang.js must be loaded before script.js so window.LV_LANG
   exists when the i18n engine runs.

   ================================================================ */

window.LV_LANG = {

  /* ──────────────────────────────────────────────────────────────
     PAGE TITLES
     ────────────────────────────────────────────────────────────── */
  page_title_index  : 'LinkVault — Monetize Every Click',
  page_title_locked : 'Please Wait — LinkVault',

  /* ──────────────────────────────────────────────────────────────
     NAVIGATION  (index.html)
     ────────────────────────────────────────────────────────────── */
  nav_features     : 'Features',
  nav_how_it_works : 'How It Works',
  nav_docs         : 'Docs',

  /* ──────────────────────────────────────────────────────────────
     HERO SECTION  (index.html)
     ────────────────────────────────────────────────────────────── */
  hero_badge       : 'Ad-Network Ready · Adsterra · PropellerAds · HilltopAds',
  hero_title_line1 : 'Monetize Every',
  hero_title_line2 : 'Link You Share',
  hero_subtitle    : 'Lock your download links, content, or any URL behind a smart ad gateway. Earn revenue on every single visitor — automatically.',

  /* ── URL form ── */
  url_input_label       : 'Destination URL',
  url_input_placeholder : 'Paste your destination URL here…',
  lock_btn              : 'Lock & Earn',
  shorten_checkbox      : 'Shorten link automatically (is.gd)',
  generating_text       : 'Generating short link...',

  /* ── Output panel ── */
  output_label    : 'Your locked link is ready:',
  copy_btn        : 'Copy',
  copy_btn_copied : 'Copied!',
  preview_link    : 'Preview locked page',

  /* ── JS validation & copy errors (injected by script.js) ── */
  error_empty_url   : '⚠ Please enter a destination URL first.',
  error_invalid_url : '⚠ Invalid URL. Please include http:// or https:// (e.g., https://example.com)',
  error_copy_fail   : 'Could not copy — please select and copy the URL manually.',

  /* ── File Details optional fields ── */
  meta_toggle_label      : 'Add File Details',
  meta_badge_optional    : 'Optional',
  meta_title_label       : 'File Name / Title',
  meta_title_placeholder : 'e.g. Project_Final_v2.zip',
  meta_size_label        : 'File Size',
  meta_size_placeholder  : 'e.g. 128 MB or 1.4 GB',

  /* ──────────────────────────────────────────────────────────────
     STATS BAR  (index.html)
     ────────────────────────────────────────────────────────────── */
  stat_timer_label    : 'Ad Timer',
  stat_network_label  : 'Ad Network Support',
  stat_adblock_number : 'Anti',
  stat_adblock_label  : 'AdBlock Detection',

  /* ──────────────────────────────────────────────────────────────
     FEATURES SECTION  (index.html)
     ────────────────────────────────────────────────────────────── */
  features_section_tag : 'Why LinkVault',
  features_heading     : 'Built for Publishers\nWho Mean Business',

  feature_timer_title     : 'Countdown Timer',
  feature_timer_desc      : 'A configurable 10-second countdown maximizes ad exposure before revealing the final link.',

  feature_adblock_title   : 'Anti-AdBlock Detection',
  feature_adblock_desc    : 'Detects visitors using ad blockers and prompts them to disable it — protecting your revenue.',

  feature_adzones_title   : 'Flexible Ad Zones',
  feature_adzones_desc    : 'Pre-built banner, sticky, and interstitial zones ready for Adsterra, PropellerAds, and more.',

  feature_nodeps_title    : 'Zero Dependencies',
  feature_nodeps_desc     : 'Pure HTML, CSS & Vanilla JS. Runs anywhere — shared hosting, CDN, GitHub Pages.',

  feature_mobile_title    : 'Mobile-First Design',
  feature_mobile_desc     : 'Pixel-perfect on every screen. Your visitors get a seamless experience on any device.',

  feature_customize_title : 'Easy Customization',
  feature_customize_desc  : 'Well-commented code with a dedicated ads.js config file. Set it up in minutes.',

  /* ──────────────────────────────────────────────────────────────
     HOW IT WORKS SECTION  (index.html)
     ────────────────────────────────────────────────────────────── */
  how_section_tag : 'The Flow',
  how_heading     : 'Three Steps to\nPassive Revenue',

  step1_title : 'Paste Your URL',
  step1_desc  : 'Enter the destination link you want to share — a download page, article, resource, or anything else.',

  step2_title : 'Share the Locked Link',
  step2_desc  : 'Copy the generated locked URL and share it anywhere — social media, forums, blogs, messaging apps.',

  step3_title : 'Earn on Every Click',
  step3_desc  : 'Each visitor sees your ads during the countdown, generating impressions and revenue before they get the link.',

  /* ──────────────────────────────────────────────────────────────
     FOOTER  (index.html)
     ────────────────────────────────────────────────────────────── */
  footer_copy : '© 2025 LinkVault. Built for CodeCanyon publishers.',

  /* ──────────────────────────────────────────────────────────────
     LOCKED PAGE — GENERAL  (locked.html)
     ────────────────────────────────────────────────────────────── */
  locked_badge : 'This link is protected',

  /* ── File Details card ── */
  fd_card_heading : 'File Details',
  fd_label_name   : 'File Name',
  fd_label_size   : 'File Size',

  /* ── Countdown ── */
  countdown_unit    : 'sec',
  countdown_message : 'Please wait while your link is being prepared…',

  /* ── Get Link section ── */
  get_link_title    : 'Your Link is Ready!',
  get_link_subtitle : 'Click the button below to access your destination.',
  get_link_btn      : 'Get My Link',
  get_link_note     : 'You will be redirected in a new tab.',

  /* ── Error section ── */
  error_title    : 'Invalid or Missing Link',
  error_desc     : 'This page requires a valid destination URL parameter.',
  error_back_btn : 'Go Back Home',

  /* ──────────────────────────────────────────────────────────────
     ANTI-ADBLOCK OVERLAY  (locked.html)
     ────────────────────────────────────────────────────────────── */
  adblock_title       : 'AdBlock Detected',
  adblock_body        : 'This site is supported by advertising. Please disable your ad blocker or whitelist this site to continue and access your link.',
  adblock_dismiss_btn : "I've Disabled My AdBlocker",

  /* ──────────────────────────────────────────────────────────────
     TOAST NOTIFICATIONS  (script.js — Page Visibility API)
     ────────────────────────────────────────────────────────────── */
  toast_paused  : 'Timer paused. Please stay on the page.',
  toast_resumed : 'Timer resumed. Keep going!',

};
