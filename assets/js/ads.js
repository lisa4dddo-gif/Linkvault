/* ================================================================
   LinkVault — Ad Network Configuration
   File    : assets/js/ads.js

   HOW IT WORKS:
   This file injects your ad codes into the correct placeholder
   divs in locked.html at runtime. It also handles the sticky
   footer close button.

   AD SLOT IDs (in locked.html):
     #ad-header-placeholder  → Header leaderboard (728×90)
     #ad-content-placeholder → Content rectangle  (300×250)
     #ad-sticky-placeholder  → Sticky footer      (728×90)

   POP-UNDER LOGIC (UPDATED):
   ─────────────────────────────────────────────────────────────────
   CHANGE: Removed document-wide click/touchstart listeners.
   The pop-under now ONLY fires when the user clicks:
     1. #start-timer-btn   — the new "Start Destination Timer" button
     2. #get-link-btn      — the "Get My Link" button

   CHANGE: Replaced sessionStorage with localStorage + timestamp.
   The pop-under fires at most ONCE per 24 hours, persisting across
   tab closes and browser restarts, using a stored timestamp.

   TO UPDATE AN AD CODE LATER:
   Find the correct slot section below and replace the innerHTML
   string with your new ad code. Re-upload only ads.js.
================================================================ */

'use strict';

(function initAds() {
  /* Only run on the locked page — bail out on index.html */
  if (!document.getElementById('ad-header-placeholder')) return;

  /* ── Utility: safely inject code into a placeholder div ── */
  function injectAd(id, html) {
    var el = document.getElementById(id);
    if (!el || !html.trim()) return;
    var iframe = document.createElement("iframe");
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    el.innerHTML = "";
    el.appendChild(iframe);
    var iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write("<body style=\"margin:0;padding:0;display:flex;justify-content:center;align-items:center;\">" + html + "</body>");
    iframeDoc.close();
  }

  /* ════════════════════════════════════════════════════════
     HEADER BANNER AD (728×90 Leaderboard)
     Displayed at the very top of locked.html.
     ════════════════════════════════════════════════════════ */
  injectAd('ad-header-placeholder', [
    '<script>',
    '  atOptions = {',
    '    \'key\' : \'954133e88cb0189e5fc34337e9048b6b\',',
    '    \'format\' : \'iframe\',',
    '    \'height\' : 90,',
    '    \'width\' : 728,',
    '    \'params\' : {}',
    '  };',
    '</script>',
    '<script src="https://www.highperformanceformat.com/954133e88cb0189e5fc34337e9048b6b/invoke.js"></script>'
  ].join('\n'));

  /* ════════════════════════════════════════════════════════
     CONTENT SQUARE AD (300×250 Medium Rectangle)
     Displayed beside or below the locked card.
     ════════════════════════════════════════════════════════ */
  injectAd('ad-content-placeholder', [
    '<script>',
    '  atOptions = {',
    '    \'key\' : \'5334b648589aa7d83b63c89eeefc8eb1\',',
    '    \'format\' : \'iframe\',',
    '    \'height\' : 250,',
    '    \'width\' : 300,',
    '    \'params\' : {}',
    '  };',
    '</script>',
    '<script src="https://www.highperformanceformat.com/5334b648589aa7d83b63c89eeefc8eb1/invoke.js"></script>'
  ].join('\n'));

  /* ════════════════════════════════════════════════════════
     STICKY FOOTER AD (728×90)
     Fixed to the bottom of the screen.
     ════════════════════════════════════════════════════════ */
  injectAd('ad-sticky-placeholder', [
    '<script>',
    '  atOptions = {',
    '    \'key\' : \'954133e88cb0189e5fc34337e9048b6b\',',
    '    \'format\' : \'iframe\',',
    '    \'height\' : 90,',
    '    \'width\' : 728,',
    '    \'params\' : {}',
    '  };',
    '</script>',
    '<script src="https://www.highperformanceformat.com/954133e88cb0189e5fc34337e9048b6b/invoke.js"></script>'
  ].join('\n'));

  /* ════════════════════════════════════════════════════════
     POP-UNDER / DIRECT LINK AD
     ─────────────────────────────────────────────────────────
     UPDATED BEHAVIOUR:
       • Triggers ONLY on #start-timer-btn or #get-link-btn clicks.
         No document-wide listeners — far less intrusive.
       • Uses localStorage (not sessionStorage) with a Unix
         timestamp so the 24-hour cooldown survives tab/browser
         closes. The user will see the pop-under at most once
         every 24 hours regardless of how many times they visit.
     ════════════════════════════════════════════════════════ */
  (function runPopunderSmart() {
    var STORAGE_KEY    = 'lv_popunder_ts';    // localStorage key for timestamp
    var COOLDOWN_MS    = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    var hasTriggered   = false;               // Guard: fire at most once per page load

    // Replace the URL below with your actual pop-under / direct-link script URL
    var popunderHtml = '<script src="https://pl29152099.profitablecpmratenetwork.com/3c/c0/51/3cc05138b92b7a022893047b25aeeb40.js"><\/script>';

    if (!popunderHtml.trim()) return; // No ad code — bail silently

    /* ── Check whether the 24-hour cooldown has elapsed ── */
    function isCooldownExpired() {
      try {
        var storedTs = localStorage.getItem(STORAGE_KEY);
        if (!storedTs) return true; // Never shown before
        var elapsed = Date.now() - parseInt(storedTs, 10);
        return elapsed >= COOLDOWN_MS;
      } catch (_) {
        // localStorage blocked (private mode, storage quota, etc.) — allow the ad
        return true;
      }
    }

    /* ── Inject the pop-under script into the page ── */
    function triggerPopunder() {
      if (hasTriggered) return;        // Already fired this page load
      if (!isCooldownExpired()) return; // Still within the 24-hour window

      hasTriggered = true;

      // Record the current timestamp so the next fire is blocked for 24h
      try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch (_) {}

      // Dynamically inject each <script> tag from the ad HTML string
      var div = document.createElement('div');
      div.innerHTML = popunderHtml;
      var scripts = div.getElementsByTagName('script');
      for (var i = 0; i < scripts.length; i++) {
        var s = document.createElement('script');
        if (scripts[i].src) {
          s.src = scripts[i].src;
        } else {
          s.textContent = scripts[i].textContent;
        }
        document.body.appendChild(s);
      }
    }

    /* ── Attach listeners to the two allowed trigger buttons ──
       We use event delegation on document so the listeners work
       even if the buttons are rendered after this script runs
       (e.g. #get-link-btn is hidden until the timer completes).
    ── */
    function onButtonClick(e) {
      var target = e.target;
      // Walk up the DOM a few levels to handle clicks on child <span>/<i> elements
      for (var i = 0; i < 4; i++) {
        if (!target) break;
        var id = target.id;
        if (id === 'start-timer-btn' || id === 'get-link-btn') {
          triggerPopunder();
          return;
        }
        target = target.parentElement;
      }
    }

    document.addEventListener('click',      onButtonClick, { passive: true });
    document.addEventListener('touchstart', onButtonClick, { passive: true });

  })();

})();
