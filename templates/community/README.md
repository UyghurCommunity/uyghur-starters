# COMMUNITY · جەمئىيەت قېلىپى

بۇ مۇستەقىل ئۇيغۇرچە RTL قېلىپى. قۇرۇش باسقۇچى ياكى قوشۇمچە كۈتۈپخانا يوق.

## Start locally

~~~sh
node server.mjs
~~~

Requires Node.js 18+. Alternatively run npm start, or python3 -m http.server 4173 --bind 127.0.0.1. Open the printed local HTTP URL. Opening index.html directly as a file will prevent JSON/module loading. The server is for local preview and binds only to 127.0.0.1.

## Make it yours

Edit data.json for content; index.html for the brand, introduction, links and metadata; style.css for colors and layout. app.js implements this template's features; ui.js provides shared local helpers and motion controls. Every file is contained in this folder, with no dependency on another site or template.

Features: ئىزدەشكە بولىدىغان مەنبە كاتالوگى ۋە ئېنىق بەلگىلەنگەن پائالىيەت ئۈلگىلىرى.

Sample content is original, AI-assisted draft material, not expert-reviewed Uyghur prose. Replace it before publication. Portfolio projects are illustrative, and hello@example.com is a placeholder. Community event cards are unscheduled illustrations; public project source links are real.

The Uyghur interface loads ALKATIP Basma from the user-specified external db.onlinewebfonts.com URLs (WOFF2, WOFF, TTF), with system fallbacks. Font binaries are not bundled. Code remains LTR and uses a monospace stack with a Basma fallback.

The motion button controls the original decorative SVG. Reduced-motion preferences take priority from first paint, and motion pauses while hidden or offscreen. No prediction, user input, or content is animated. Basic copy remains visible without JavaScript; interactive content requires JavaScript.

Upload the static HTML/CSS/JS/JSON files to your chosen static hosting service. No build step or API key is needed. Review sample text, links, email addresses and page metadata first.

## License and source

MIT: see LICENSE. Original template from [UyghurCommunity](https://github.com/UyghurCommunity/uyghur-starters).
