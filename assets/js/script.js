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
     • Shows a "Start Destination Timer" button; countdown only
       begins AFTER the user clicks it
     • Runs the countdown timer with SVG ring animation
     • Pauses/resumes the timer via the Page Visibility API
     • Shows toast messages on pause and resume
     • Reveals the "Get Link" button when the timer reaches 0
     • Detects ad blockers and applies a "soft penalty":
         – Doubles the countdown timer
         – Shows a persistent amber warning toast
         – Does NOT hard-block the user
     • Closes the sticky ad zone when the user clicks the X button

   CONFIGURATION:
     • Ad network settings  → assets/js/ads.js
     • All UI text strings  → assets/js/lang.js  (load BEFORE this file)
     • Timer duration       → CONFIG.COUNTDOWN_SECONDS below

   CHANGELOG:
     [FIX 1] URL Security: dest param now uses reversed-Base64
             encoding (btoa + string reversal) instead of plain
             encodeURIComponent.
     [FIX 2] Auto HTTPS: If the user types a URL without a scheme,
             https:// is automatically prepended.
     [FIX 3] AdBlocker: Now a "soft penalty" — doubles the timer
             and shows a warning toast instead of a hard block.
     [FIX 4] Toast Spam: showToast() removes any existing toast
             before injecting a new one.
     [NEW 1] Start Timer Button: countdown is user-initiated, not
             automatic. A pulsing button appears inside the ring area.
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
   ================================================================ */
function encodeDestUrl(str) {
  var utf8Safe = unescape(encodeURIComponent(str));
  var reversed = utf8Safe.split('').reverse().join('');
  return btoa(reversed);
}

function decodeDestUrl(encoded) {
  try {
    var reversed = atob(encoded);
    var utf8Safe = reversed.split('').reverse().join('');
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
   Types: 'pause' | 'resume' | 'info' | 'warning'

   [FIX 4] Toast Spam: Before inserting a new toast, all existing
   toasts inside the container are removed from the DOM immediately.
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
    '.lv-toast--pause   {background:linear-gradient(135deg,rgba(255,160,0,0.92),rgba(230,81,0,0.92));}',
    '.lv-toast--resume  {background:linear-gradient(135deg,rgba(0,200,200,0.92),rgba(0,120,255,0.92));}',
    '.lv-toast--info    {background:linear-gradient(135deg,rgba(120,80,255,0.92),rgba(180,60,220,0.92));}',
    '.lv-toast--warning {background:linear-gradient(135deg,rgba(245,166,35,0.95),rgba(230,81,0,0.95));}',
    '.lv-toast__icon    {font-size:1rem;line-height:1;flex-shrink:0;}',
    '.lv-toast--out     {animation:lv-toast-out 0.3s ease forwards;}',
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
  var existingToasts = container.querySelectorAll('.lv-toast');
  for (var i = 0; i < existingToasts.length; i++) {
    existingToasts[i].remove();
  }

  var icons = { pause: '⏸', resume: '▶', info: 'ℹ', warning: '⚠' };
  var toast = document.createElement('div');
  toast.className = 'lv-toast lv-toast--' + (type || 'info');
  toast.innerHTML =
    '<span class="lv-toast__icon">' + (icons[type] || icons.info) + '</span>' +
    '<span>' + message + '</span>';
  container.appendChild(toast);

  // duration of 0 or negative means "persistent until manually removed"
  if (duration > 0) {
    setTimeout(function () {
      toast.classList.add('lv-toast--out');
      toast.addEventListener('animationend', function () { toast.remove(); }, { once: true });
    }, duration);
  }

  return toast; // Return ref so caller can remove it early if needed
}


/* ================================================================
   INDEX PAGE LOGIC
   ================================================================ */
if (IS_INDEX_PAGE) {

  var lockBtn       = document.getElementById('lock-btn');
   var urlInput      = document.getElementById('destination-url');
  var urlError      = document.getElementById('url-error');
  var clearBtn      = document.getElementById('clear-btn'); // NEW VARIABLE
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

  function buildLockedUrl(destinationUrl, title, size) {
    var base = CONFIG.BASE_URL ||
      window.location.origin +
      window.location.pathname.replace('index.html', '');

    var encodedDest = encodeDestUrl(destinationUrl);

    var url = base + 'locked.html?' + CONFIG.URL_PARAM + '=' + encodedDest;
    if (title && title.trim()) url += '&' + CONFIG.TITLE_PARAM + '=' + encodeURIComponent(title.trim());
    if (size  && size.trim())  url += '&' + CONFIG.SIZE_PARAM  + '=' + encodeURIComponent(size.trim());
    return url;
  }

  async function handleLockUrl() {
    clearError();
    var rawUrl = urlInput.value.trim();

    if (!rawUrl) {
      showError(t('error_empty_url', '⚠ Please enter a destination URL first.'));
      urlInput.focus();
      return;
    }

    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
      urlInput.value = rawUrl;
    }

    if (!isValidUrl(rawUrl)) {
      showError(t('error_invalid_url', '⚠ Invalid URL. Please include http:// or https://'));
      urlInput.focus();
      return;
    }

    if (lockBtn.disabled) return;

    var title = metaTitleInput ? metaTitleInput.value : '';
    var size  = metaSizeInput  ? metaSizeInput.value  : '';

    var lockedUrl = buildLockedUrl(rawUrl, title, size);
    var finalUrl  = lockedUrl;

    var shortenCheckbox = document.getElementById('shorten-checkbox');
    outputWrapper.classList.remove('hidden');
    outputWrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (shortenCheckbox && shortenCheckbox.checked) {

      outputUrl.textContent = t('generating_text', 'Generating short link...');
      outputUrl.style.opacity = '0.6';

      lockBtn.disabled = true;
      lockBtn.style.opacity = '0.7';
      lockBtn.style.cursor = 'not-allowed';

      try {
        const encodedLockedUrl = encodeURIComponent(lockedUrl);

        const apis = [
          'https://is.gd/create.php?format=simple&url=' + encodedLockedUrl,
          'https://v.gd/create.php?format=simple&url=' + encodedLockedUrl,
          'https://tinyurl.com/api-create.php?url=' + encodedLockedUrl
        ];

        let shortUrlSuccess = false;

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

        for (let api of apis) {
          try {
            const proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(api);
            const apiResponse = await fetchWithTimeout(proxyUrl, { timeout: 8000 });

            if (apiResponse.ok) {
              const responseText = await apiResponse.text();
              if (responseText.startsWith('http')) {
                finalUrl = responseText.trim();
                shortUrlSuccess = true;
                break;
              }
            }
          } catch (e) {
            console.warn('[LinkVault] API failed or timed out, trying next fallback...', e.message);
          }
        }

        if (!shortUrlSuccess) {
          console.warn('[LinkVault] All URL Shortener APIs failed. Falling back to long URL.');
          if (typeof showToast === 'function') {
            showToast(t('toast_shorten_fail', 'Shortener servers busy. Using long URL.'), 'pause', 3000);
          }
        }

      } catch (error) {
        console.error('[LinkVault] Critical error during URL shortening:', error);
      } finally {
        outputUrl.style.opacity = '1';
        lockBtn.disabled = false;
        lockBtn.style.opacity = '1';
        lockBtn.style.cursor = 'pointer';
      }
    }

    outputUrl.textContent = finalUrl;
    previewLink.href      = finalUrl;
  }

   lockBtn.addEventListener('click', handleLockUrl);
  
  urlInput.addEventListener('keydown', function (e) { 
    if (e.key === 'Enter') handleLockUrl(); 
  });
  
  // UPDATED: Show or hide the clear button based on input text
  urlInput.addEventListener('input', function() {
    clearError();
    if (clearBtn) {
      if (urlInput.value.trim().length > 0) {
        clearBtn.style.display = 'inline-flex';
      } else {
        clearBtn.style.display = 'none';
      }
    }
  });


  // NEW: Clear Button functionality to reset the UI for a new link
  if (clearBtn) {
    clearBtn.addEventListener('click', function() {
      // 1. Clear main URL input
      urlInput.value = '';
      
      // 2. Clear optional meta fields if they exist
      if (metaTitleInput) metaTitleInput.value = '';
      if (metaSizeInput) metaSizeInput.value = '';
      
      // 3. Hide the generated link output wrapper
      outputWrapper.classList.add('hidden');
      clearError();
      
      // 4. Hide the clear button itself
      clearBtn.style.display = 'none';
      
      // 5. Re-enable the lock button in case it was disabled
      lockBtn.disabled = false;
      lockBtn.style.opacity = '1';
      lockBtn.style.cursor = 'pointer';
      
      // 6. Focus back on the input box ready for a new link
      urlInput.focus();
    });
  }


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
  var startTimerBtn    = document.getElementById('start-timer-btn');

  var RING_CIRCUMFERENCE = 2 * Math.PI * 52;

  /* ── [FIX 1] Read & validate destination URL using reversed-Base64 ── */
  function getDestinationUrl() {
    var params  = new URLSearchParams(window.location.search);
    var encoded = params.get(CONFIG.URL_PARAM);
    if (!encoded) return null;
    try {
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
     [NEW 1] SHOW THE START TIMER BUTTON
     ─────────────────────────────────────────────────────────────────
     Instead of auto-starting the countdown, we render a pulsing
     "Start Destination Timer" button inside the ring number wrapper.
     The countdown only begins when the user clicks it.
     ================================================================ */
  function showStartButton(onStart) {
    if (!startTimerBtn) return;

    // Set initial ring state: full arc, no countdown running
    if (ringProgress) {
      ringProgress.style.strokeDasharray  = RING_CIRCUMFERENCE;
      ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE; // empty ring
    }

    // Hide the number/unit, show the start button
    var numberWrapper = document.querySelector('.countdown-number-wrapper');
    if (numberWrapper) numberWrapper.classList.add('hidden');
    startTimerBtn.classList.remove('hidden');

    startTimerBtn.addEventListener('click', function handleStart() {
      startTimerBtn.removeEventListener('click', handleStart);

      // Animate the button out
      startTimerBtn.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      startTimerBtn.style.opacity    = '0';
      startTimerBtn.style.transform  = 'scale(0.85)';

      setTimeout(function () {
        startTimerBtn.classList.add('hidden');
        if (numberWrapper) {
          numberWrapper.classList.remove('hidden');
          // Animate in
          numberWrapper.style.transition = 'opacity 0.3s ease';
          numberWrapper.style.opacity    = '0';
          setTimeout(function () { numberWrapper.style.opacity = '1'; }, 10);
        }
        onStart();
      }, 250);
    }, { once: true });
  }

  /* ================================================================
     COUNTDOWN WITH PAGE VISIBILITY API
     ─────────────────────────────────────────────────────────────────
     • setInterval drives the 1-second tick.
     • visibilitychange pauses the interval when the user hides the
       tab, and resumes it when they return.
     ================================================================ */
  function startCountdown(destinationUrl, totalSeconds) {
    totalSeconds = totalSeconds || CONFIG.COUNTDOWN_SECONDS;
    var secondsLeft = totalSeconds;
    var intervalId  = null;
    var isPaused    = false;

    ringProgress.style.strokeDasharray  = RING_CIRCUMFERENCE;
    ringProgress.style.strokeDashoffset = 0;
    countdownNumber.textContent         = secondsLeft;

    // Kick the ring to full immediately
    updateRing(secondsLeft, totalSeconds);

    function tick() {
      secondsLeft -= 1;
      countdownNumber.textContent = secondsLeft;
      updateRing(secondsLeft, totalSeconds);
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
          showToast(t('toast_paused', 'Timer paused. Please stay on the page.'), 'pause', 4000);
        }
      } else {
        if (isPaused) {
          isPaused = false;
          startInterval();
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

  /* ================================================================
     [FIX 3] SOFT PENALTY ANTI-ADBLOCK
     ─────────────────────────────────────────────────────────────────
     OLD behaviour: Show a hard-block overlay (#adblock-overlay)
       that prevents the user from proceeding entirely.

     NEW behaviour (Soft Penalty):
       1. Keeps #adblock-overlay hidden — user is NEVER hard-blocked.
       2. Doubles the countdown timer duration.
       3. Shows a prominent persistent amber warning toast/banner
          below the timer: "Adblock Detected. Timer extended…"
       4. The user can still get their link — just with a longer wait.

     The doubled total seconds are passed to startCountdown() so the
     ring animation also reflects the extended duration correctly.
   ================================================================ */
  function checkForAdBlocker(onResult) {
    if (!CONFIG.ENABLE_ANTI_ADBLOCK) {
      onResult(false);
      return;
    }
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
        // ── Soft Penalty: do NOT show adblock-overlay ──
        // Make sure the overlay stays hidden permanently
        if (adblockOverlay) adblockOverlay.classList.add('hidden');

        // Show the persistent amber warning banner below the countdown ring
        showAdblockWarningBanner();
      }

      onResult(isBlocked);
    }, 150);
  }

  /* ── Render the persistent adblock warning banner inside the countdown section ── */
  function showAdblockWarningBanner() {
    // Prevent duplicate banners
    if (document.getElementById('adblock-soft-banner')) return;

    var banner = document.createElement('div');
    banner.id = 'adblock-soft-banner';
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'polite');

    // i18n-ready: use data-i18n attribute on the inner span so lang.js can pick it up
    banner.innerHTML =
      '<span class="adblock-soft-banner__icon">⚠</span>' +
      '<span data-i18n="adblock_soft_penalty">Adblock Detected. Timer extended. Please disable it to support us.</span>';

    // Insert it right after the countdown ring wrapper, before the message paragraph
    var ringWrapper = document.querySelector('.countdown-ring-wrapper');
    if (ringWrapper && ringWrapper.parentNode) {
      ringWrapper.parentNode.insertBefore(banner, ringWrapper.nextSibling);
    } else if (countdownSection) {
      countdownSection.appendChild(banner);
    }

    // Apply i18n to the newly injected element
    applyTranslations();
    lucide.createIcons();
  }

  /* ── AdBlocker Dismiss button (kept for compat but overlay is never shown) ──
     If for any reason the overlay is shown, clicking dismiss reloads the page. */
  if (adblockDismiss) {
    adblockDismiss.addEventListener('click', function () {
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

    // Step 1: Check for adblock (async, ~150ms delay)
    checkForAdBlocker(function (isBlocked) {
      // Step 2: Calculate final timer duration
      var finalSeconds = CONFIG.COUNTDOWN_SECONDS;
      if (isBlocked) {
        finalSeconds = CONFIG.COUNTDOWN_SECONDS * 2; // Soft penalty: double timer
      }

      // Update the displayed number to reflect the correct starting value
      if (countdownNumber) countdownNumber.textContent = finalSeconds;

      // Step 3: Show the Start button; countdown only begins on click
      showStartButton(function () {
        startCountdown(destinationUrl, finalSeconds);
      });
    });
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
