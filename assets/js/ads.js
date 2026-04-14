/* ================================================================
   LinkVault — Ad Network Configuration
   File    : assets/js/ads.js
   Author  : Lisa
   Generated: 2026-04-14 by LinkVault Config Tool

   HOW IT WORKS:
   This file injects your ad codes into the correct placeholder
   divs in locked.html at runtime. It also handles the sticky
   footer close button.

   AD SLOT IDs (in locked.html):
     #ad-header-placeholder  → Header leaderboard (728×90)
     #ad-content-placeholder → Content rectangle  (300×250)
     #ad-sticky-placeholder  → Sticky footer      (728×90)
     Pop-under scripts run on page load automatically.

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
     Runs immediately on page load. Does not inject into a div.
     ════════════════════════════════════════════════════════ */
  (function runPopunder() {
    var html = "<script src=\"https://pl29152099.profitablecpmratenetwork.com/3c/c0/51/3cc05138b92b7a022893047b25aeeb40.js\"></script>";
    if (!html.trim()) return;
    var div = document.createElement("div");
    div.innerHTML = html;
    var scripts = div.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var s = document.createElement("script");
      if (scripts[i].src) s.src = scripts[i].src;
      else s.textContent = scripts[i].textContent;
      document.body.appendChild(s);
    }
  })();
  
})();