/* ================================================================
   LinkVault — Main Application Logic
   File: assets/js/script.js

   WHAT THIS FILE DOES:
   ─────────────────────────────────────────────────────────────────
   On index.html:
     • Runs the i18n engine (applyTranslations) to swap all UI text
       from window.LV_LANG (defined in lang.js)
     • Validates the user's input URL
     • Encodes it (+ optional title/size meta) and builds a locked link
     • Handles the "Copy" button for the generated link

   On locked.html:
     • Runs the i18n engine
     • Reads and validates the destination URL from query params
     • Reads optional ?title= and ?size= params and renders the
       "File Details" card above the countdown if present
     • Runs the countdown timer with SVG ring animation
     • Pauses/resumes the timer via the Page Visibility API
     • Shows toast messages on pause and resume
     • Reveals the "Get Link" button when the timer reaches 0
     • Detects ad blockers and shows an overlay if one is found
     • Closes the sticky ad zone when the user clicks the X button

   CONFIGURATION:
     • Ad network settings  → assets/js/ads.js
     • All UI text strings  → assets/js/lang.js  (load BEFORE this file)
     • Timer duration       → CONFIG.COUNTDOWN_SECONDS below

   CHANGELOG (fixes applied):
     [FIX 1] URL Security: dest param now uses reversed-Base64
             encoding (btoa + string reversal) instead of plain
             encodeURIComponent. Decoder on locked.html uses the
             matching atob + reversal. Obfuscates URLs from casual
             inspection without breaking any browser.
     [FIX 2] Auto HTTPS: If the user types a URL without a scheme
             (e.g. "google.com"), https:// is automatically prepended
             before validation and encoding.
     [FIX 3] AdBlocker Dismiss: Clicking "I've Disabled My AdBlocker"
             now calls window.location.reload() instead of just hiding
             the modal, so the adblock bait test is re-run.
     [FIX 4] Toast Spam: showToast() now removes any existing toast
             from the DOM instantly before injecting a new one,
             preventing stacked/overlapping toasts.
   ================================================================ */

'use strict';

/* ──────────────────────────────────────────────
   SHARED CONFIGURATION
   ────────────────────────────────────────────── */

const CONFIG = {
  COUNTDOWN_SECONDS  : window.LV_SITE ? window.LV_SITE.COUNTDOWN_SECONDS : 10,
  URL_PARAM          : 'dest',
  TITLE_PARAM        : 'title',
  SIZE_PARAM         : 'size',
  ENABLE_ANTI_ADBLOCK: window.LV_SITE ? window.LV_SITE.ENABLE_ANTI_ADBLOCK : true,
  BASE_URL           : window.LV_SITE ? window.LV_SITE.SITE_URL + '/' : '',
};

/* ──────────────────────────────────────────────
   PAGE DETECTION
   ────────────────────────────────────────────── */
const IS_LOCKED_PAGE = !!document.getElementById('countdown-section');
const IS_INDEX_PAGE  = !!document.getElementById('lock-btn');


/* ================================================================
   i18n ENGINE
   ─────────────────────────────────────────────────────────────────
   Reads window.LV_LANG (set by lang.js) and applies translations
   to the DOM using three data attributes:

   data-i18n="key"
     → Sets element.textContent to LV_LANG[key].
       Safe: never interprets HTML.  Use for all plain text.

   data-i18n-html="key"
     → Sets element.innerHTML to LV_LANG[key] with \n → <br>.
       Use only for headings that need a translated line break.
       Never use on user-supplied strings.

   data-i18n-placeholder="key"
     → Sets the placeholder attribute on <input> elements.

   The engine also:
     • Updates document.title from page_title_index / page_title_locked.
     • Silently skips any key that doesn't exist in LV_LANG (so
       partially-translated lang files degrade gracefully).
   ================================================================ */
function applyTranslations() {
  var lang = window.LV_LANG;

  // Guard: if lang.js failed to load or is empty, do nothing.
  if (!lang || typeof lang !== 'object') return;

  /* ── 1. Plain text nodes ── */
  var textEls = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < textEls.length; i++) {
    var el  = textEls[i];
    var key = el.getAttribute('data-i18n');
    if (key && lang[key] !== undefined) {
      // <title> is a special case: it has no child nodes to worry about
      if (el.tagName === 'TITLE') {
        document.title = lang[key];
      } else {
        el.textContent = lang[key];
      }
    }
  }

  /* ── 2. HTML nodes  (line-break headings only) ── */
  var htmlEls = document.querySelectorAll('[data-i18n-html]');
  for (var j = 0; j < htmlEls.length; j++) {
    var hEl  = htmlEls[j];
    var hKey = hEl.getAttribute('data-i18n-html');
    if (hKey && lang[hKey] !== undefined) {
      // Convert literal \n in the lang value to <br> tags
      hEl.innerHTML = lang[hKey].replace(/\\n/g, '<br />');
    }
  }

  /* ── 3. Placeholder attributes ── */
  var phEls = document.querySelectorAll('[data-i18n-placeholder]');
  for (var k = 0; k < phEls.length; k++) {
    var phEl  = phEls[k];
    var phKey = phEl.getAttribute('data-i18n-placeholder');
    if (phKey && lang[phKey] !== undefined) {
      phEl.setAttribute('placeholder', lang[phKey]);
    }
  }
}

/* ── Helper: get a translation string, or fall back to a default ── */
function t(key, fallback) {
  var lang = window.LV_LANG;
  if (lang && lang[key] !== undefined) return lang[key];
  return fallback !== undefined ? fallback : key;
}

/* ── Run immediately so text is correct before any JS runs ── */
applyTranslations();


/* ================================================================
   [FIX 1] URL SECURITY — REVERSED BASE64 HELPERS
   ─────────────────────────────────────────────────────────────────
   encodeDestUrl(str)  : reverse the string, then base64-encode it.
   decodeDestUrl(str)  : base64-decode it, then reverse it back.

   Why reversed Base64?
   • Pure btoa(url) is trivially readable (just atob() it).
   • Reversing the string before encoding means a casual inspection
     of the URL parameter produces meaningless output even after a
     single atob() call, deterring URL-bypass attempts.
   • This is obfuscation, not encryption — it keeps the codebase
     dependency-free while raising the bar beyond plain encoding.

   Unicode safety: btoa() only handles Latin-1. We use
   encodeURIComponent + unescape trick to safely encode any Unicode
   character (emoji, non-ASCII) before base64.
   ================================================================ */
function encodeDestUrl(str) {
  // Step 1: percent-encode any non-ASCII characters so btoa() is safe
  var utf8Safe = unescape(encodeURIComponent(str));
  // Step 2: reverse the string
  var reversed = utf8Safe.split('').reverse().join('');
  // Step 3: base64-encode the reversed string
  return btoa(reversed);
}

function decodeDestUrl(encoded) {
  try {
    // Step 1: base64-decode
    var reversed = atob(encoded);
    // Step 2: reverse back to get the utf8-safe string
    var utf8Safe = reversed.split('').reverse().join('');
    // Step 3: decode percent-encoding to recover original Unicode
    return decodeURIComponent(escape(utf8Safe));
  } catch (_) {
    return null;
  }
}


/* ================================================================
   TOAST NOTIFICATION SYSTEM
   ─────────────────────────────────────────────────────────────────
   Self-contained; injects its own <style> tag.
   Call: showToast(message, type, duration)
   Types: 'pause' | 'resume' | 'info'

   [FIX 4] Toast Spam: Before inserting a new toast, all existing
   toasts inside the container are removed from the DOM immediately
   (no wait for their exit animation) so they never stack/overlap.
   ================================================================ */
(function initToastStyles() {
  var style = document.createElement('style');
  style.textContent = [
    '#lv-toast-container{',
      'position:fixed;top:1.25rem;left:50%;transform:translateX(-50%);',
      'z-index:9999;display:flex;flex-direction:column;align-items:center;',
      'gap:0.5rem;pointer-events:none;',
    '}',
    '.lv-toast{',
      'display:inline-flex;align-items:center;gap:0.55rem;',
      'padding:0.65rem 1.2rem;border-radius:999px;',
      'font-family:inherit;font-size:0.875rem;font-weight:600;',
      'letter-spacing:0.01em;line-height:1;color:#fff;',
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);',
      'box-shadow:0 4px 24px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.08);',
      'pointer-events:none;',
      'animation:lv-toast-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;',
      'white-space:nowrap;',
    '}',
    '.lv-toast--pause {background:linear-gradient(135deg,rgba(255,160,0,0.92),rgba(230,81,0,0.92));}',
    '.lv-toast--resume{background:linear-gradient(135deg,rgba(0,200,200,0.92),rgba(0,120,255,0.92));}',
    '.lv-toast--info  {background:linear-gradient(135deg,rgba(120,80,255,0.92),rgba(180,60,220,0.92));}',
    '.lv-toast__icon  {font-size:1rem;line-height:1;flex-shrink:0;}',
    '.lv-toast--out   {animation:lv-toast-out 0.3s ease forwards;}',
    '@keyframes lv-toast-in  {0%{opacity:0;transform:translateY(-14px) scale(0.92)}100%{opacity:1;transform:translateY(0) scale(1)}}',
    '@keyframes lv-toast-out {0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-10px) scale(0.94)}}',
  ].join('');
  document.head.appendChild(style);
})();

function showToast(message, type, duration) {
  duration = duration || 3000;
  var container = document.getElementById('lv-toast-container');
  if (!container) {
    container    = document.createElement('div');
    container.id = 'lv-toast-container';
    document.body.appendChild(container);
  }

  /* ── [FIX 4] Remove any existing toasts instantly ── */
  // Querying all current toasts and removing them prevents the
  // "paused / resumed" messages from piling up when the user
  // rapidly switches tabs back and forth.
  var existingToasts = container.querySelectorAll('.lv-toast');
  for (var i = 0; i < existingToasts.length; i++) {
    existingToasts[i].remove();
  }

  var icons = { pause: '⏸', resume: '▶', info: 'ℹ' };
  var toast = document.createElement('div');
  toast.className = 'lv-toast lv-toast--' + (type || 'info');
  toast.innerHTML =
    '<span class="lv-toast__icon">' + (icons[type] || icons.info) + '</span>' +
    '<span>' + message + '</span>';
  container.appendChild(toast);
  setTimeout(function () {
    toast.classList.add('lv-toast--out');
    toast.addEventListener('animationend', function () { toast.remove(); }, { once: true });
  }, duration);
}


/* ================================================================
   INDEX PAGE LOGIC
   ================================================================ */
if (IS_INDEX_PAGE) {

  var lockBtn       = document.getElementById('lock-btn');
  var urlInput      = document.getElementById('destination-url');
  var urlError      = document.getElementById('url-error');
  var outputWrapper = document.getElementById('output-wrapper');
  var outputUrl     = document.getElementById('output-url');
  var copyBtn       = document.getElementById('copy-btn');
  var copyBtnText   = copyBtn ? copyBtn.querySelector('[data-i18n="copy_btn"]') : null;
  var previewLink   = document.getElementById('preview-link');
  var metaTitleInput = document.getElementById('meta-title');
  var metaSizeInput  = document.getElementById('meta-size');

  function isValidUrl(string) {
    try {
      var url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) { return false; }
  }

  function showError(message) { urlError.textContent = message; }
  function clearError()       { urlError.textContent = ''; }

  /* ── [FIX 1 + FIX 2] buildLockedUrl: Auto-HTTPS + Reversed Base64 ──
     Replace the old:
       encodeURIComponent(destinationUrl)
     with our new encodeDestUrl() helper that reverses then base64-encodes.
  ── */
  function buildLockedUrl(destinationUrl, title, size) {
    var base = CONFIG.BASE_URL ||
      window.location.origin +
      window.location.pathname.replace('index.html', '');

    // [FIX 1] Use reversed-Base64 encoding instead of encodeURIComponent
    var encodedDest = encodeDestUrl(destinationUrl);

    var url = base + 'locked.html?' + CONFIG.URL_PARAM + '=' + encodedDest;
    if (title && title.trim()) url += '&' + CONFIG.TITLE_PARAM + '=' + encodeURIComponent(title.trim());
    if (size  && size.trim())  url += '&' + CONFIG.SIZE_PARAM  + '=' + encodeURIComponent(size.trim());
    return url;
  }

/* ================================================================
     MAIN URL GENERATOR & SHORTENER LOGIC
     ================================================================ */
  /* ================================================================
     MAIN URL GENERATOR & SHORTENER LOGIC
     ================================================================ */
  async function handleLockUrl() {
    clearError();
    var rawUrl = urlInput.value.trim();

    if (!rawUrl) {
      showError(t('error_empty_url', '⚠ Please enter a destination URL first.'));
      urlInput.focus();
      return;
    }

    /* Auto-prepend https:// if no scheme is present */
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
      urlInput.value = rawUrl; 
    }

    if (!isValidUrl(rawUrl)) {
      showError(t('error_invalid_url', '⚠ Invalid URL. Please include http:// or https://'));
      urlInput.focus();
      return;
    }

    /* Prevent multiple rapid clicks while processing */
    if (lockBtn.disabled) return;

    /* Fetch optional meta details */
    var title = metaTitleInput ? metaTitleInput.value : '';
    var size  = metaSizeInput  ? metaSizeInput.value  : '';
    
    /* Generate the long encrypted URL */
    var lockedUrl = buildLockedUrl(rawUrl, title, size);
    var finalUrl  = lockedUrl; // Default to long URL

    /* Reveal the output wrapper immediately for UX feedback */
    var shortenCheckbox = document.getElementById('shorten-checkbox');
    outputWrapper.classList.remove('hidden');
    outputWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    /* Check if user wants to shorten the link */
    if (shortenCheckbox && shortenCheckbox.checked) {
      
      /* Show temporary loading text and disable button */
      outputUrl.textContent = t('generating_text', 'Generating short link...');
      outputUrl.style.opacity = '0.6';
      
      // Strict UI lockdown during API call
      lockBtn.disabled = true;
      lockBtn.style.opacity = '0.7';
      lockBtn.style.cursor = 'not-allowed';
      
      try {
        const encodedLockedUrl = encodeURIComponent(lockedUrl);
        
        /* Target APIs: is.gd, v.gd, and tinyurl (all provide clean, direct redirects) */
        const apis = [
          'https://is.gd/create.php?format=simple&url=' + encodedLockedUrl,
          'https://v.gd/create.php?format=simple&url=' + encodedLockedUrl,
          'https://tinyurl.com/api-create.php?url=' + encodedLockedUrl
        ];

        let shortUrlSuccess = false;

        /* Custom Fetch with Timeout to prevent infinite hanging on free APIs */
        const fetchWithTimeout = async (resource, options = {}) => {
          const { timeout = 5000 } = options; 
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), timeout);
          const response = await fetch(resource, {
            ...options,
            signal: controller.signal  
          });
          clearTimeout(id);
          return response;
        };

        /* Iterate through the APIs sequentially as a strict fallback mechanism */
        for (let api of apis) {
          try {
            // [FIXED] Use corsproxy.io instead of allorigins to bypass blocks
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(api);
            
            // [FIXED] Increased timeout to 8 seconds (8000ms)
            const apiResponse = await fetchWithTimeout(proxyUrl, { timeout: 8000 });
            
            if (apiResponse.ok) {
              const responseText = await apiResponse.text();
              
              // Ensure the response is actually a valid URL (not a proxy error page)
              if (responseText.startsWith('http')) {
                finalUrl = responseText.trim();
                shortUrlSuccess = true;
                break; // Exit the loop on first successful generation
              }
            }
          } catch (e) {
            console.warn(`[LinkVault] API failed or timed out, trying next fallback...`, e.message);
          }
        }

        /* Handle complete failure gracefully */
        if (!shortUrlSuccess) {
          console.warn('[LinkVault] All URL Shortener APIs failed. Falling back to long URL.');
          if (typeof showToast === 'function') {
            showToast(t('toast_shorten_fail', 'Shortener servers busy. Using long URL.'), 'pause', 3000);
          }
        }

      } catch (error) {
        console.error('[LinkVault] Critical error during URL shortening:', error);
      } finally {
        /* Restore UI state regardless of success or failure */
        outputUrl.style.opacity = '1';
        lockBtn.disabled = false;
        lockBtn.style.opacity = '1';
        lockBtn.style.cursor = 'pointer';
      }
    }

    /* Display the final URL (shortened or long) */
    outputUrl.textContent = finalUrl;
    previewLink.href      = finalUrl;
  }




  lockBtn.addEventListener('click', handleLockUrl);
  urlInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') handleLockUrl(); });
  urlInput.addEventListener('input', clearError);

  /* ── Copy button ── */
  copyBtn.addEventListener('click', function () {
    var urlToCopy = outputUrl.textContent;
    if (!urlToCopy) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(urlToCopy).then(showCopiedState).catch(function () {
        fallbackCopy(urlToCopy);
      });
    } else {
      fallbackCopy(urlToCopy);
    }
  });

  function showCopiedState() {
    // Preserve the icon; only update the text span
    var originalText = t('copy_btn', 'Copy');
    var copiedText   = t('copy_btn_copied', 'Copied!');
    if (copyBtnText) {
      copyBtnText.textContent = copiedText;
    }
    copyBtn.style.background = 'rgba(0,224,255,0.25)';
    setTimeout(function () {
      if (copyBtnText) copyBtnText.textContent = originalText;
      copyBtn.style.background = '';
    }, 2000);
  }

  function fallbackCopy(text) {
    var textarea    = document.createElement('textarea');
    textarea.value  = text;
    textarea.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      document.execCommand('copy');
      showCopiedState();
    } catch (err) {
      showError(t('error_copy_fail', 'Could not copy — please select and copy the URL manually.'));
    }
    document.body.removeChild(textarea);
  }

} // end IS_INDEX_PAGE


/* ================================================================
   LOCKED PAGE LOGIC
   ================================================================ */
if (IS_LOCKED_PAGE) {

  var countdownSection = document.getElementById('countdown-section');
  var countdownNumber  = document.getElementById('countdown-number');
  var ringProgress     = document.getElementById('ring-progress');
  var getLinkSection   = document.getElementById('get-link-section');
  var getLinkBtn       = document.getElementById('get-link-btn');
  var errorSection     = document.getElementById('error-section');
  var adblockOverlay   = document.getElementById('adblock-overlay');
  var adblockDismiss   = document.getElementById('adblock-dismiss');
  var stickyClose      = document.getElementById('sticky-close');
  var stickyAd         = document.getElementById('ad-sticky-placeholder');
  var fileDetailsCard  = document.getElementById('file-details-card');
  var fdTitleItem      = document.getElementById('fd-title-item');
  var fdTitleValue     = document.getElementById('fd-title-value');
  var fdSizeItem       = document.getElementById('fd-size-item');
  var fdSizeValue      = document.getElementById('fd-size-value');

  var RING_CIRCUMFERENCE = 2 * Math.PI * 52;

  /* ── [FIX 1] Read & validate destination URL using reversed-Base64 ──
     Replace the old:
       var decoded = decodeURIComponent(encoded);
     with our new decodeDestUrl() helper that reverses+base64-decodes.
  ── */
  function getDestinationUrl() {
    var params  = new URLSearchParams(window.location.search);
    var encoded = params.get(CONFIG.URL_PARAM);
    if (!encoded) return null;
    try {
      // [FIX 1] Use reversed-Base64 decoding instead of decodeURIComponent
      var decoded = decodeDestUrl(encoded);
      if (!decoded) return null;
      var url = new URL(decoded);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
      return decoded;
    } catch (_) { return null; }
  }

  /* ── Render the File Details card from URL params ── */
  function renderFileDetails() {
    if (!fileDetailsCard) return;
    var params = new URLSearchParams(window.location.search);
    var title  = params.get(CONFIG.TITLE_PARAM);
    var size   = params.get(CONFIG.SIZE_PARAM);
    var hasAny = false;

    if (title && title.trim()) {
      var decodedTitle = decodeURIComponent(title.trim());
      fdTitleValue.textContent = decodedTitle;
      fdTitleValue.title       = decodedTitle;
      fdTitleItem.classList.remove('hidden');
      hasAny = true;
    }
    if (size && size.trim()) {
      fdSizeValue.textContent = decodeURIComponent(size.trim());
      fdSizeItem.classList.remove('hidden');
      hasAny = true;
    }
    if (hasAny) {
      fileDetailsCard.classList.remove('hidden');
      lucide.createIcons();
    }
  }

  /* ── SVG gradient injection ── */
  function injectSvgGradient() {
    var svg = document.querySelector('.countdown-ring');
    if (!svg) return;
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = '<linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%"   stop-color="#00e0ff" />' +
      '<stop offset="100%" stop-color="#0078ff" />' +
      '</linearGradient>';
    svg.prepend(defs);
    if (ringProgress) ringProgress.setAttribute('stroke', 'url(#ringGradient)');
  }

  /* ── Update SVG ring arc ── */
  function updateRing(secondsRemaining, totalSeconds) {
    if (!ringProgress) return;
    var offset = RING_CIRCUMFERENCE * (1 - secondsRemaining / totalSeconds);
    ringProgress.style.strokeDashoffset = offset;
  }

  /* ================================================================
     COUNTDOWN WITH PAGE VISIBILITY API
     ─────────────────────────────────────────────────────────────────
     • setInterval drives the 1-second tick.
     • visibilitychange pauses the interval when the user hides the
       tab, and resumes it when they return.
     • Toast text is pulled from lang.js (toast_paused / toast_resumed)
       so it automatically respects the active language.
     • The listener is cleaned up when the timer completes.
     • [FIX 4] showToast() now clears previous toasts before showing
       a new one, so rapid tab-switching never stacks messages.
     ================================================================ */
  function startCountdown(destinationUrl) {
    var secondsLeft = CONFIG.COUNTDOWN_SECONDS;
    var intervalId  = null;
    var isPaused    = false;

    ringProgress.style.strokeDasharray  = RING_CIRCUMFERENCE;
    ringProgress.style.strokeDashoffset = 0;
    countdownNumber.textContent         = secondsLeft;

    function tick() {
      secondsLeft -= 1;
      countdownNumber.textContent = secondsLeft;
      updateRing(secondsLeft, CONFIG.COUNTDOWN_SECONDS);
      if (secondsLeft <= 0) {
        stopInterval();
        cleanup();
        revealGetLinkButton(destinationUrl);
      }
    }

    function startInterval() { intervalId = setInterval(tick, 1000); }
    function stopInterval()  { clearInterval(intervalId); intervalId = null; }
    function cleanup()       { document.removeEventListener('visibilitychange', handleVisibilityChange); }

    function handleVisibilityChange() {
      if (document.hidden) {
        if (!isPaused && intervalId !== null) {
          stopInterval();
          isPaused = true;
          // [FIX 4]: Old toast removed inside showToast() before this new one appears
          showToast(t('toast_paused', 'Timer paused. Please stay on the page.'), 'pause', 4000);
        }
      } else {
        if (isPaused) {
          isPaused = false;
          startInterval();
          // [FIX 4]: Old toast removed inside showToast() before this new one appears
          showToast(t('toast_resumed', 'Timer resumed. Keep going!'), 'resume', 2500);
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startInterval();
  }

  /* ── Reveal the "Get Link" button after timer ── */
  function revealGetLinkButton(destinationUrl) {
    getLinkBtn.href   = destinationUrl;
    getLinkBtn.target = '_blank';
    getLinkBtn.rel    = 'noopener noreferrer';

    countdownSection.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
    countdownSection.style.opacity    = '0';
    countdownSection.style.transform  = 'translateY(-10px)';

    setTimeout(function () {
      countdownSection.classList.add('hidden');
      getLinkSection.classList.remove('hidden');
      lucide.createIcons();
    }, 400);
  }

  /* ── Show error state ── */
  function showErrorState() {
    countdownSection.classList.add('hidden');
    errorSection.classList.remove('hidden');
    lucide.createIcons();
  }

  /* ── Anti-AdBlock detection ── */
  function checkForAdBlocker() {
    if (!CONFIG.ENABLE_ANTI_ADBLOCK) return;
    var bait = document.createElement('div');
    bait.className     = 'pub_300x250 pub_300x250m pub_728x90 text-ad textAd text_ad text_ads text-ads ad-banner adsbox';
    bait.style.cssText = 'width:1px;height:1px;position:absolute;top:-9999px;left:-9999px;opacity:0.001;';
    bait.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bait);
    setTimeout(function () {
      var isBlocked = (
        bait.offsetParent  === null ||
        bait.offsetHeight  === 0   ||
        bait.offsetWidth   === 0   ||
        bait.clientHeight  === 0   ||
        window.getComputedStyle(bait).display    === 'none'   ||
        window.getComputedStyle(bait).visibility === 'hidden'
      );
      document.body.removeChild(bait);
      if (isBlocked) {
        adblockOverlay.classList.remove('hidden');
        lucide.createIcons();
      }
    }, 150);
  }

  /* ── [FIX 3] AdBlocker Dismiss: reload instead of just hiding ──
     The old code did:
       adblockOverlay.classList.add('hidden');
     This only hid the UI — the adblock was still active and the
     overlay would never re-check. Now we reload the full page so
     checkForAdBlocker() runs fresh. If the user actually disabled
     their ad blocker, the bait element will pass the test and the
     overlay will not appear.
  ── */
  if (adblockDismiss) {
    adblockDismiss.addEventListener('click', function () {
      // [FIX 3] Force a full page reload to re-run the adblock bait test
      window.location.reload();
    });
  }

  if (stickyClose && stickyAd) {
    stickyClose.addEventListener('click', function () {
      stickyAd.classList.add('dismissed');
      setTimeout(function () { stickyAd.style.display = 'none'; }, 400);
    });
  }

  /* ── INIT ── */
  (function init() {
    injectSvgGradient();
    renderFileDetails();

    var destinationUrl = getDestinationUrl();
    if (!destinationUrl) {
      showErrorState();
      return;
    }
    checkForAdBlocker();
    startCountdown(destinationUrl);
  })();

} // end IS_LOCKED_PAGE


/* ================================================================
   SCROLL REVEAL ANIMATION
   ================================================================ */
(function initScrollReveal() {
  var revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach(function (el) { observer.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }
})();
