# LinkVault — Premium Link Monetization Script
### Complete Product Documentation · v1.0

---

> **LinkVault** is a premium, mobile-first link monetization and locking script. Visitors are directed to an ad-gateway page with a countdown timer before accessing the destination URL. Built entirely with pure HTML, CSS, and Vanilla JavaScript — no PHP, no database, no server-side dependencies.

---

## Table of Contents

1. [Introduction & Features Overview](#1-introduction--features-overview)
2. [Folder & File Structure](#2-folder--file-structure)
3. [Quick Start / Installation Guide](#3-quick-start--installation-guide)
4. [Ad Network Integration Guide](#4-ad-network-integration-guide)
5. [Translation & Localization](#5-translation--localization)
6. [Advanced Features](#6-advanced-features)
7. [⚠️ Security Warning](#7-️-security-warning)
8. [Support & Credits](#8-support--credits)

---

## 1. Introduction & Features Overview

LinkVault lets publishers lock any destination URL behind a smart ad-gateway. When a visitor follows one of your locked links, they land on a countdown page that displays your advertisements. Once the timer completes, they can proceed to the original destination. This workflow converts every click you share into ad revenue — automatically, with zero server costs.

### Why LinkVault?

| Feature | Benefit |
|---|---|
| **Zero dependencies** | No PHP, no MySQL, no Node.js on the server. Runs on free static hosting. |
| **No-code setup** | Visual `/admin` config tool generates your configuration files without touching any code. |
| **Mobile-first design** | Fully responsive, touch-optimized UI built for real-world mobile traffic. |
| **PWA-ready** | Installable as a web app on Android & iOS with a full service worker. |
| **Built-in i18n** | Translate every user-facing string by swapping a single JavaScript file. |

### Complete Feature List

#### 🔒 Core Monetization
- **Countdown Ad Gateway** — Visitors wait through a configurable timer (default 10 seconds, recommended range 10–30 seconds) while your ads are displayed.
- **Animated SVG Ring** — A gradient progress ring provides a premium visual countdown experience.
- **"Start Timer" UX** — A pulsing call-to-action button inside the ring lets users explicitly start the timer, improving engagement and reducing bounce.
- **URL Shortener Integration** — The link generator on `index.html` automatically shortens locked links via a waterfall of three public APIs (`is.gd` → `v.gd` → `tinyurl.com`) with a 5-second timeout per service and graceful fallback to the full URL.

#### 📢 Ad Network Support
- **Header Banner** (728×90 Leaderboard) — Displayed at the top of the locked page.
- **Content Square** (300×250 Medium Rectangle) — Displayed beside or below the locked card.
- **Sticky Footer Bar** (728×90) — Fixed to the bottom of the screen with a dismissible close button.
- **Pop-under / Direct Link** — High-CPM format with smart 24-hour cooldown logic.
- Natively configured for **Adsterra**, **PropellerAds**, **HilltopAds**, and **any custom ad network**.

#### 🛡️ Anti-Adblock (Soft Penalty)
- Detects ad blockers using a hidden "bait" element without any server call.
- Instead of a hard block, **doubles the countdown timer** duration when an adblocker is found.
- Displays a persistent amber warning banner: *"Adblock Detected. Timer extended."*
- The user can still reach their link — they simply wait longer — maximizing successful completions while still incentivizing users to disable their adblocker.

#### ⏸️ Page Visibility API
- The countdown timer **automatically pauses** when the visitor switches to another browser tab or minimizes the window.
- A toast notification confirms the pause and resume action, preventing users from gaming the timer in the background.

#### 🍪 Smart Pop-under Logic
- Pop-unders fire **only on specific user interactions**: clicking the "Start Timer" button (`#start-timer-btn`) or the "Get My Link" button (`#get-link-btn`).
- Uses `localStorage` to store a **24-hour cooldown timestamp**, ensuring the pop-under fires at most once per day — across tab closes and browser restarts. This prevents visitor frustration while maintaining revenue.

#### 🌐 Translation Ready (i18n)
- Every user-facing text string is defined in `assets/js/lang.js`.
- To change language, you replace a single `<script>` tag in the HTML. No other files need to be changed.

#### 📱 Progressive Web App (PWA)
- Full service worker (`sw.js`) caches core assets for offline capability.
- `web-app/manifest.json` enables **"Add to Home Screen"** on Android and iOS.
- Configured `theme-color`, Apple touch icons, and splash screen meta tags are included out of the box.

#### 🗺️ SEO Sitemap Generator
- A local Node.js script (`generate-sitemap.js`) scans your project directory and produces a standards-compliant `sitemap.xml` file.
- Automatically excludes private paths (`/admin/`, `locked.html`, `/node_modules/`).
- Requires **zero npm packages** — uses only Node.js built-in modules.

#### 👁️ Admin Safety Mode
- Visit `yoursite.com/?admin=true` to activate Admin Mode.
- In Admin Mode: Google Analytics tracking is disabled and all ad zones are hidden via CSS injection, protecting your ad account from self-click violations.
- Automatically disabled on `localhost` and `192.168.x.x` networks for safe local development.

---

## 2. Folder & File Structure

```
linkvault/
│
├── index.html                  # Homepage — link generator interface
├── locked.html                 # Ad-gateway / countdown page
├── 404.html                    # Custom 404 error page
├── offline.html                # PWA offline fallback page
├── generate-sitemap.js         # Node.js sitemap generator (run locally)
│
├── admin/
│   └── index.html              # ⚙️ Visual Config Tool (DELETE before going live)
│
├── assets/
│   ├── css/
│   │   └── style.css           # Main stylesheet
│   ├── js/
│   │   ├── site-config.js      # ✏️ YOUR site settings (generated by /admin)
│   │   ├── ads.js              # ✏️ YOUR ad network codes (generated by /admin)
│   │   ├── script.js           # Core application logic
│   │   └── lang.js             # Translation strings (English default)
│   └── img/
│       ├── logo.png            # ✏️ Your site logo
│       ├── icon-192.webp       # PWA app icon (192×192)
│       ├── icon-512.webp       # PWA app icon (512×512)
│       └── og-cover.webp       # ✏️ Open Graph / social sharing image (1200×630)
│
└── web-app/
    ├── manifest.json           # PWA Web App Manifest
    └── sw.js                   # Service Worker for offline caching
```

> **Files marked ✏️** are the ones you will customize. All other files should remain unchanged.

---

## 3. Quick Start / Installation Guide

LinkVault is designed so that **non-technical buyers can complete the entire setup without writing a single line of code** using the built-in `/admin` Config Tool.

### Step 1: Upload the Files to Your Host

Upload the entire project folder to your web hosting. LinkVault works on any static host:

| Host | Notes |
|---|---|
| **Cloudflare Pages** | Recommended. Free, fast global CDN. |
| **GitHub Pages** | Free. See [PWA headers note](#pwa-required-headers) for service worker. |
| **Netlify** | Free tier available. |
| **Any Shared Hosting** | Works on cPanel, Hostinger, etc. Just upload via FTP. |

> **Important:** Do not place files inside a subdirectory if you want your site to be at the root domain (e.g., `yourdomain.com`). If you must use a subdirectory, update `BASE_URL` in the config tool accordingly.

---

### Step 2: Open the Admin Config Tool

Navigate to your site in a browser and go to the `/admin/` path:

```
https://yourdomain.com/admin/
```

You will see the **LinkVault Visual Config Tool** — a multi-section form that generates your configuration files.

> 💡 The Config Tool runs **entirely in your browser**. No data is sent to any server. All generation happens locally via JavaScript.

---

### Step 3: Fill In the Configuration Form

The admin panel has five sections:

#### Section 01 — Site Identity

| Field | Description | Example |
|---|---|---|
| **Brand Name** | Your site's display name | `MyDownloads` |
| **Site URL** | Your full live domain (no trailing slash) | `https://mydownloads.com` |
| **Tagline** | Optional subtitle shown on the homepage | `Free Downloads, Fast` |
| **Author Name** | Your name or brand for file headers | `John Doe` |
| **Locked Page Filename** | The name of your redirect page | `locked.html` (keep as default) |

#### Section 02 — Timer & Features

| Field | Description | Recommended |
|---|---|---|
| **Countdown Seconds** | How long the ad timer runs | `15` (10–30 seconds) |
| **Enable Anti-Adblock** | Doubles timer for adblocker users | ✅ Enabled |
| **Pause on Tab Switch** | Pauses timer when tab is hidden | ✅ Enabled |
| **Open Link in New Tab** | Opens destination in a new tab | ✅ Enabled |

#### Section 03 — Theme Colors

Use the color pickers to customize:
- **Page Background** (default: `#080c14` — dark navy)
- **Accent / Highlight Color** (default: `#00e0ff` — cyan)
- **Card / Surface Color** (default: `#0e1420` — dark blue-grey)

These values are injected as CSS custom properties (`--clr-bg`, `--clr-accent`, `--clr-surface`) at runtime, so there is no color flash on page load.

#### Section 04 — Ad Network Integration

Select your ad network tab (Adsterra, PropellerAds, HilltopAds, or Custom) and paste your ad code scripts into the corresponding slots. See **[Section 4](#4-ad-network-integration-guide)** for full details.

#### Section 05 — SEO & Open Graph

| Field | Description |
|---|---|
| **OG Title** | Title shown when your link is shared on social media |
| **OG Image URL** | URL of your 1200×630 social share image |
| **OG Description** | Short description for social previews |
| **Twitter / X Handle** | Your handle including `@`, e.g. `@myhandle` |
| **Google Analytics ID** | Your `G-XXXXXXXXXX` measurement ID (leave empty to disable) |

---

### Step 4: Generate & Download Config Files

Click the **"Generate Configuration Files"** button at the bottom of the form.

Two output tabs will appear:

1. **`site-config.js`** — Contains your site settings, branding, theme, and feature flags.
2. **`ads.js`** — Contains your ad network scripts, injected into the correct slots on `locked.html`.

**For each tab:**
1. Click **"⎘ Copy Code"**.
2. Open your code/text editor.
3. Paste the content and save the file with the correct filename.

---

### Step 5: Replace the Placeholder Files

| Generated File | Save As | Location in Project |
|---|---|---|
| `site-config.js` tab | `site-config.js` | `assets/js/site-config.js` |
| `ads.js` tab | `ads.js` | `assets/js/ads.js` |

Upload the two new files to your server, overwriting the existing placeholder versions.

---

### Step 6: Update Your Domain in HTML Files

Open `index.html` and `locked.html` in a text editor and replace the placeholder domain in the following meta tags:

```html
<!-- Find these lines and replace "https://yourdomain.com" with your real domain -->
<link rel="canonical" href="https://yourdomain.com/index.html" />
<meta property="og:url"   content="https://yourdomain.com/index.html" />
<meta property="og:image" content="https://yourdomain.com/assets/img/og-cover.webp" />
```

> 💡 If you configured your domain in the Config Tool (Section 01 and Section 05), the generated `site-config.js` already contains the correct domain for JavaScript-driven functionality. The meta tags in HTML files still need to be updated manually.

---

### Step 7: Test Your Setup

1. Go to your live site homepage (`index.html`).
2. Paste any URL into the input field (e.g., `https://google.com`) and click **"Lock & Earn"**.
3. A locked link will be generated. Click **"Preview"**.
4. Verify that:
   - ✅ The countdown page loads correctly.
   - ✅ Your ads are visible in their zones.
   - ✅ The timer counts down and the "Get My Link" button appears when it reaches zero.
   - ✅ Clicking "Get My Link" redirects to the correct destination.

---

### Step 8: Delete the `/admin/` Folder

> **⚠️ This is the most important security step. See [Section 7](#7-️-security-warning) for full details.**

---

## 4. Ad Network Integration Guide

Ad codes are pasted into the **Admin Config Tool** (Section 04) and are automatically injected into the correct `<div>` placeholders in `locked.html` at runtime by `ads.js`.

### Ad Slot Reference

| Slot Name | Placeholder ID in HTML | Recommended Size | Location on Page |
|---|---|---|---|
| **Header Banner** | `#ad-header-placeholder` | 728×90 Leaderboard | Top of `locked.html`, above the card |
| **Content Square** | `#ad-content-placeholder` | 300×250 Rectangle | Beside or below the locked card |
| **Sticky Footer** | `#ad-sticky-placeholder` | 728×90 or Mobile Banner | Fixed to bottom of screen |
| **Pop-under** | *(injected into `<body>`)* | N/A — script-based | Triggered on button click |

### Getting Your Ad Codes

#### Adsterra

1. Log in to your **Adsterra** publisher dashboard.
2. Navigate to **Sites → [Your Site] → Get Code**.
3. For the banner slots, select **Banner** format and choose the appropriate size.
4. For the pop-under slot, select **Social Bar** or **Direct Link** (highest CPM options).
5. Copy the complete `<script>` tag and paste it into the corresponding field in the Admin Tool.

#### PropellerAds

1. Log in to your **PropellerAds** dashboard.
2. Navigate to **My Sites → [Your Site] → Ad Units → Get Code**.
3. For banners, select the **Banner** or **Interstitial** format.
4. For push-based revenue, use the **OnClick (Popunder)** or **Push Notifications** code.
5. Copy the full code block and paste it into the Admin Tool.

#### HilltopAds

1. Log in to your **HilltopAds** dashboard.
2. Navigate to **Websites → [Your Site] → Ad Spots → Get Code**.
3. Copy the complete script block, **including any wrapper `<div>`**, into the Admin Tool.

#### Custom / Any Other Network

Use the **"Custom"** tab in the Admin Tool's Ad Network section. The code will be injected verbatim into the correct placeholder elements on `locked.html`. This is compatible with any ad network that provides an HTML/JavaScript embed code, including Google AdSense, Media.net, and others.

### How Ad Injection Works

The generated `ads.js` file uses a secure `injectAd()` function. Each ad code is injected inside a sandboxed `<iframe>` element. This approach:
- Prevents ad scripts from interfering with the main page's JavaScript.
- Ensures consistent ad rendering across all browsers.
- Maintains a clean separation between your page code and third-party ad scripts.

### Pop-under Behavior in Detail

The pop-under logic in `ads.js` is designed for maximum revenue without harming the user experience:

```
User visits locked.html
        │
        ▼
User clicks "Start Timer" button (#start-timer-btn)
        │
        ├── Has it been > 24 hours since last pop-under? → YES → Fire pop-under
        │                                                            │
        └───────────────────────────────────── NO → Skip silently   │
                                                                     ▼
                                                          Save timestamp to localStorage
                                                          Pop-under fires once
```

- **Trigger points:** Only `#start-timer-btn` and `#get-link-btn` click events.
- **Cooldown:** 24 hours, stored in `localStorage` as a Unix timestamp (`lv_popunder_ts`).
- **Single fire per session:** A `hasTriggered` flag prevents the pop-under from firing twice even if the user clicks multiple times.

### Updating Ad Codes After Deployment

To update your ad codes without running the Config Tool again:

1. Open `assets/js/ads.js` in a text editor.
2. Find the relevant `injectAd('ad-header-placeholder', [...]` section.
3. Replace the HTML string with your new ad code.
4. Save and re-upload **only** `ads.js` to your server.

---

## 5. Translation & Localization

LinkVault is fully translation-ready. All user-facing text strings are defined in a single JavaScript dictionary file: `assets/js/lang.js`.

### How It Works

In `index.html` and `locked.html`, the language file is loaded **before** `script.js`:

```html
<!-- In <head> — load BEFORE script.js -->
<script src="assets/js/lang.js"></script>
<script src="assets/js/script.js"></script>
```

At runtime, `script.js` calls `applyTranslations()`, which reads the `window.LV_LANG` object and replaces all elements that have a `data-i18n` attribute with the corresponding translated string.

### Translating the Site

**Step 1:** Open `assets/js/lang.js`. You will see a structure like this:

```javascript
window.LV_LANG = {
  // Navigation
  nav_features:     "Features",
  nav_how_it_works: "How It Works",
  nav_docs:         "Docs",

  // Hero
  hero_title_line1: "Monetize Every",
  hero_title_line2: "Link You Share",
  hero_subtitle:    "Lock your download links, content, or any URL behind a smart ad gateway...",

  // Countdown page
  toast_paused:     "Timer paused. Please stay on the page.",
  toast_resumed:    "Timer resumed. Keep going!",

  // Anti-adblock
  adblock_soft_penalty: "Adblock Detected. Timer extended. Please disable it to support us.",

  // ... and many more
};
```

**Step 2:** Create a copy of `lang.js` and rename it, e.g., `lang.fr.js` for French.

**Step 3:** Translate every string value in your new file.

**Step 4:** In both `index.html` and `locked.html`, swap the `<script>` tag:

```html
<!-- Change this: -->
<script src="assets/js/lang.js"></script>

<!-- To this (French example): -->
<script src="assets/js/lang.fr.js"></script>
```

**Step 5:** Upload the changed files. The entire site is now in your chosen language.

### Important Notes for Translators

| Note | Detail |
|---|---|
| **Do not change the key names** | Only change the values (the text after the colon). Changing keys will break the translations. |
| **Keep `{placeholder}` tokens intact** | Some strings use `{seconds}` or similar tokens. Keep them exactly as-is. |
| **RTL languages** | For right-to-left languages (Arabic, Hebrew, etc.), add `dir="rtl"` to the `<html>` tag in both HTML files. |
| **HTML in translations** | The translation system safely handles plain text. If you need HTML inside a translation, wrap your element in a `<span>` and use `data-i18n-html` instead of `data-i18n`. |

---

## 6. Advanced Features

### 6.1 Admin Safety Mode

You can toggle a special admin viewing mode on any browser to preview your live site without triggering analytics or seeing ads.

**Activate Admin Mode:**
```
https://yourdomain.com/?admin=true
```

**Deactivate Admin Mode:**
```
https://yourdomain.com/?admin=false
```

When active, a browser alert confirms the mode, and:
- Google Analytics tracking is disabled for your session.
- All ad zones are hidden via a dynamically injected CSS rule.
- This setting persists in `localStorage` (`lv_admin_mode`) until you deactivate it.

This mode is also **automatically active** on `localhost`, `127.0.0.1`, and `192.168.x.x` addresses, so you can safely develop locally without worrying about ad clicks or analytics pollution.

---

### 6.2 PWA Setup — Required Headers

The service worker (`web-app/sw.js`) requires that your server serves the page over **HTTPS** and with the correct headers. On most hosts, this works automatically. If you are using **Cloudflare Pages** or **Netlify**, no extra configuration is needed.

**For GitHub Pages**, create a file named `_headers` in your project root (Netlify format) or configure headers via a GitHub Actions workflow. Service workers on GitHub Pages require the page to be served from the repository root or a custom domain.

#### Cloudflare Pages — Recommended Configuration

Create a `_headers` file in your project root with the following content:

```
/*
  Service-Worker-Allowed: /
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
```

#### Verifying PWA Installation

1. Open your live site in **Chrome on Android**.
2. Tap the browser menu (⋮) and look for **"Add to Home screen"** or **"Install app"**.
3. On iOS (Safari), tap the **Share button** → **"Add to Home Screen"**.

The app icon, name, and splash colors are configured in `web-app/manifest.json`. To customize:

```json
{
  "name": "LinkVault",
  "short_name": "LinkVault",
  "theme_color": "#080c14",
  "background_color": "#080c14",
  "icons": [
    { "src": "../assets/img/icon-192.webp", "sizes": "192x192", "type": "image/webp" },
    { "src": "../assets/img/icon-512.webp", "sizes": "512x512", "type": "image/webp" }
  ]
}
```

Replace `icon-192.webp` and `icon-512.webp` in `assets/img/` with your own icons.

---

### 6.3 Running the Node.js Sitemap Generator

The `generate-sitemap.js` script scans your project folder and creates a standards-compliant `sitemap.xml` file for submission to Google Search Console.

#### Requirements

- **Node.js v14 or higher** installed on your local computer.
- Download from [https://nodejs.org](https://nodejs.org) — choose the **LTS version**.
- No `npm install` is required. The script uses only Node.js built-in modules (`fs` and `path`).

#### Configuration

Before running, open `generate-sitemap.js` in a text editor and update the `CONFIG` object at the top of the file:

```javascript
const CONFIG = {
  // ✏️ Replace with your real live domain. No trailing slash.
  SITE_URL: 'https://yourdomain.com',

  // Output file name. Keep as 'sitemap.xml' (standard).
  OUTPUT_FILE: 'sitemap.xml',

  // Directory to scan. '.' = current folder (project root).
  ROOT_DIR: '.',

  // Paths to EXCLUDE from the sitemap (private/dynamic pages).
  EXCLUDE_PATHS: [
    'locked.html',   // Dynamic redirect pages — Google can't use them
    '/admin/',       // Your config tool — must stay private
    '/node_modules/',
    '/.git/',
    '/web-app/',
    '404.html',
    'offline.html',
  ],

  // Default change frequency for all pages.
  DEFAULT_CHANGEFREQ: 'weekly',

  // Default priority for sub-pages (0.0 – 1.0).
  DEFAULT_PRIORITY: '0.8',

  // Homepage always receives the highest priority automatically.
  HOMEPAGE_PRIORITY: '1.0',

  // Optional: override settings for specific pages.
  PAGE_OVERRIDES: {
    'index.html': { changefreq: 'daily' },
    // 'about.html': { priority: '0.6', changefreq: 'monthly' },
  },
};
```

#### Running the Script

1. Open a **Terminal** (macOS/Linux) or **Command Prompt / PowerShell** (Windows).
2. Navigate to your LinkVault project root folder:
   ```bash
   cd /path/to/your/linkvault-project
   ```
3. Run the script:
   ```bash
   node generate-sitemap.js
   ```
4. You will see output similar to:
   ```
   ══════════════════════════════════════════════
     LinkVault Sitemap Generator
   ══════════════════════════════════════════════

   Scanning for HTML files in: /path/to/linkvault-project

     Found: index.html
     Found: about.html
     Skipped (excluded): locked.html
     Skipped (excluded): admin/index.html

   Found 2 HTML file(s) to include.

   ✓  sitemap.xml written to: /path/to/linkvault-project/sitemap.xml
   ```

#### Submitting to Google Search Console

1. Upload `sitemap.xml` to your live site's root directory.
2. Go to [Google Search Console](https://search.google.com/search-console).
3. Select your property (your domain).
4. In the left sidebar, click **Sitemaps**.
5. In the "Add a new sitemap" field, type `sitemap.xml` and click **Submit**.

> **Note:** Re-run `node generate-sitemap.js` and re-upload `sitemap.xml` whenever you add new pages to your site.

---

### 6.4 Customizing the Countdown Timer Duration

The countdown duration is set in `assets/js/site-config.js` under `COUNTDOWN_SECONDS`. You can change it at any time:

```javascript
window.LV_SITE = {
  // ...
  COUNTDOWN_SECONDS: 15,  // Change this value (recommended: 10–30)
  // ...
};
```

**Anti-adblock behavior:** When an adblocker is detected, the script automatically runs:
```javascript
var finalSeconds = CONFIG.COUNTDOWN_SECONDS * 2; // e.g., 15 → 30 seconds
```
This doubling is calculated at runtime — you only need to set the base duration.

---

### 6.5 Adding Optional File Details to Locked Links

When generating a locked link on the homepage, users can optionally expand the **"Add File Details"** panel to include:
- **File Name / Title** — e.g., `Project_Final_v2.zip`
- **File Size** — e.g., `128 MB`

These values are appended as URL parameters (`&t=` and `&s=`) and displayed in a "File Details" card on the locked page. This helps visitors know what they are downloading before the timer starts, improving trust and reducing abandonment.

---

## 7. ⚠️ Security Warning

> ### CRITICAL — READ BEFORE GOING LIVE

**The `/admin/index.html` Config Tool must never be publicly accessible on your live server.**

The admin panel allows anyone who accesses it to:
- Overwrite your `site-config.js` and `ads.js` with their own settings.
- Replace your ad codes with theirs.
- Reconfigure your entire site.

### Required Action: Delete or Protect the `/admin/` Folder

You **must** take one of the following actions **before sharing your site URL** or going live:

#### Option A — Delete the Folder (Recommended)

After you have generated and saved your `site-config.js` and `ads.js` files, permanently delete the entire `/admin/` folder from your server.

```
❌ Delete this from your live server:
   /admin/
   └── index.html
```

Your main site (`index.html`, `locked.html`) will continue to work perfectly. The admin tool is only needed once during initial setup, or again when you want to change your configuration.

#### Option B — Password-Protect the Directory

If you want to keep the admin tool accessible for future use, restrict it with HTTP Basic Authentication.

**For Apache hosting** (cPanel / Hostinger / most shared hosts):

Create a file named `.htaccess` inside the `/admin/` folder with the following content:

```apache
AuthType Basic
AuthName "Admin Area"
AuthUserFile /path/to/your/site/admin/.htpasswd
Require valid-user
```

Then create a `.htpasswd` file using an [htpasswd generator tool](https://www.htaccesstools.com/htpasswd-generator/) and upload it to the `/admin/` folder.

**For Cloudflare Pages / Netlify:**

Use their platform-level access controls:
- **Cloudflare Pages:** Settings → Access → Add an Access Policy for the `/admin/*` path.
- **Netlify:** Site Settings → Identity → Enable Netlify Identity, then protect the `/admin` path.

#### Option C — Use Locally and Never Upload

The safest approach for most users: **never upload the `/admin/` folder to your live server at all.** Run the Config Tool locally by opening `admin/index.html` directly in your browser (`file:///path/to/admin/index.html`), generate your config files, and only upload the resulting `site-config.js` and `ads.js`.

---

### Additional Security Notes

| Topic | Recommendation |
|---|---|
| **HTTPS** | Always deploy on HTTPS. Required for the service worker and recommended for ad network compliance. |
| **URL Encoding** | Destination URLs are encoded using a reversed Base64 scheme to prevent casual inspection in browser URLs. This is obfuscation, not encryption — do not lock private/sensitive URLs. |
| **Sitemap** | The sitemap generator automatically excludes `/admin/` from `sitemap.xml`, so even if the folder exists, search engines will not index it. |

---

## 8. Support & Credits

### Getting Help

If you encounter any issues after following this documentation, please submit a support request through the CodeCanyon item page where you purchased LinkVault. When contacting support, please include:

1. A description of the issue.
2. The URL where the issue occurs (if live).
3. Your browser and operating system.
4. Any error messages shown in the browser console (press `F12` → Console tab).

> **Please note:** Support covers bugs and issues with the script as provided. Customization requests, ad network account issues, and third-party hosting configuration are outside the scope of included support.

### Customization Services

If you require custom modifications — such as a new design theme, additional ad slots, custom redirect logic, or multi-language support — customization services are available at an additional rate. Please contact via the CodeCanyon profile.

### Changelog

| Version | Date | Notes |
|---|---|---|
| `1.0` | 2026 | Initial release |

### Credits & Acknowledgments

| Component | Details |
|---|---|
| **Author** | MD KAWSAR |
| **Icons** | [Lucide Icons](https://lucide.dev) — MIT License |
| **Fonts** | [Syne](https://fonts.google.com/specimen/Syne) & [DM Mono](https://fonts.google.com/specimen/DM+Mono) via Google Fonts — OFL License |
| **URL Shorteners** | is.gd, v.gd, TinyURL — public APIs |
| **Framework** | Pure HTML5, CSS3, Vanilla JavaScript — zero runtime dependencies |

### License

This item is licensed under the **CodeCanyon Regular License** or **Extended License** depending on your purchase. Please refer to the Envato license terms for full details on permitted usage.

- **Regular License** — For use in a single end product for personal or commercial use.
- **Extended License** — Required if you are charging end users for access to the product.

Redistribution, resale, or re-upload of this item is strictly prohibited.

---

*Documentation written for LinkVault v1.0 · Author: MD KAWSAR*
