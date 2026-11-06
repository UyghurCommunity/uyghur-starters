# Uyghur Starters · ئۇيغۇرچە باشلاش قېلىپلىرى

Four independent, buildless Uyghur RTL websites and a safe offline copying CLI, maintained by [UyghurCommunity](https://github.com/UyghurCommunity).

[Gallery and previews](https://uyghurcommunity.github.io/uyghur-starters/) · [Issues](https://github.com/UyghurCommunity/uyghur-starters/issues)

## ئۇيغۇرچە

بىلوگ، قوللانما، ئىجادىيەت ۋە جەمئىيەت بېتى ئۈچۈن تۆت مۇستەقىل قېلىپ. ھەر بىرى HTML، CSS، JavaScript ۋە JSON دىن تۈزۈلگەن. قۇرۇش باسقۇچى، قوشۇمچە كۈتۈپخانا ياكى مەخپىي ئاچقۇچ تەلەپ قىلمايدۇ.

ھەر بىر قېلىپتىكى ئۈلگە مەزمۇننى ۋە ئالاقە ئادرېسىنى ئۆز ئۇچۇرىڭىز بىلەن ئالماشتۇرۇڭ. پائالىيەتلەر تەسەۋۋۇرىي؛ ئۇلار ھەقىقىي ۋاقىت ياكى تىزىملىتىشنى بىلدۈرمەيدۇ. مەزمۇن AI ياردىمىدە ئەسلىدىن يېزىلغان، مۇتەخەسسىس تىل تەكشۈرۈشىدىن ئۆتمىگەن.

~~~sh
node bin/create-uyghur.js --list
node bin/create-uyghur.js --template blog --dir ./my-site
cd my-site
node server.mjs
~~~

## The four templates

| Template | Working features | Preview |
| --- | --- | --- |
| blog | Full-text search, categories, article reading and shareable hash URLs | [Open blog](https://uyghurcommunity.github.io/uyghur-starters/templates/blog/) |
| docs | Searchable article navigation, section links, code copy, direct article URLs | [Open docs](https://uyghurcommunity.github.io/uyghur-starters/templates/docs/) |
| portfolio | Category filters, native accessible project dialog, placeholder contact email | [Open portfolio](https://uyghurcommunity.github.io/uyghur-starters/templates/portfolio/) |
| community | Combined project/event search, type filters, event disclosures, real public source links | [Open community](https://uyghurcommunity.github.io/uyghur-starters/templates/community/) |

The community directory includes links to real UyghurCommunity repositories. Its event cards are explicitly illustrative and unscheduled. Portfolio projects and blog posts are original example content, not claims of clients, users, attendees, completed professional work, or testimonials.

## Create a site

Requires Node.js 18 or newer. No dependencies need to be installed.

~~~sh
git clone https://github.com/UyghurCommunity/uyghur-starters.git
cd uyghur-starters
node bin/create-uyghur.js --template docs --dir ./my-docs
cd my-docs
node server.mjs
~~~

Open the printed local URL. You can also use npm start in the generated folder; its package.json is private and has no dependencies. Python is an alternative:

~~~sh
python3 -m http.server 4173 --bind 127.0.0.1
~~~

Serve over HTTP, rather than opening an HTML file directly: content is loaded from the adjacent data.json file. The included Node server binds to 127.0.0.1 and is intended for local preview. Deploy the static files to your own hosting service for a public site. There is no build command or server-side application to deploy.

Each ZIP download in the gallery contains a complete standalone template. Extract a ZIP, open its folder, and run the same local server command.

## CLI contract

~~~text
create-uyghur --list
create-uyghur --template <blog|docs|portfolio|community> --dir <new-relative-folder>
create-uyghur --help
~~~

The CLI copies only bundled files. It never runs a shell command, downloads a dependency, creates a Git repository, or performs a network request. It refuses any existing destination (including empty folders), parent symlinks, absolute paths, and directory traversal. Use a new relative path inside your current working directory. Nested new folders are supported.

Success exits with 0; invalid arguments or a refused copy exit with 2. No existing destination files are overwritten.

## Package availability

The npm-ready CLI package is @uyghurcommunity/create v0.1.0. **npm registry publication is pending.** Run the source checkout directly today. Once the GitHub v0.1.0 release exists, you can install its pinned source archive:

~~~sh
npm install --global https://github.com/UyghurCommunity/uyghur-starters/archive/refs/tags/v0.1.0.tar.gz
create-uyghur --template portfolio --dir ./my-portfolio
~~~

No npm registry install is claimed. The package includes all four complete templates.

## Customize a template

- Edit data.json for the sample posts, articles, projects, or events.
- Edit index.html for brand text, introductory copy, metadata, and navigation. Replace the portfolio email hello@example.com before publishing.
- Edit CSS variables at the start of style.css to change colors and spacing.
- Keep labels, visible focus, semantic controls, and the lang/dir attributes when changing layouts.
- Each template has its own README, source files, license, package.json, and local server. It does not import gallery files or another template.

All Uyghur UI text uses **ALKATIP Basma**, loaded from the user-specified external WOFF2/WOFF/TTF URLs at db.onlinewebfonts.com. No font binary is distributed. System fonts take over when the font cannot load. English and code keep their own font stacks; code includes Basma as a fallback for Uyghur characters.

Original SVG motifs are decorative digital illustrations inspired by embroidery geometry. They do not claim to reproduce a documented traditional motif. A visible Uyghur pause/play control stops decorative motion; reduced-motion preferences take priority from first paint. Motion also pauses when the page is hidden or the motif is outside the viewport. There are no animation frame loops or timers. Without JavaScript, explanatory content and sample fallback cards remain visible; search, routing, and dialogs require JavaScript.

There are no analytics, account systems, stored submissions, or external data calls. The external font is the only automatic third-party request. Contact links open the user's mail application; source links navigate to public GitHub pages.

## Verify

~~~sh
npm test
npm run check
npm pack --dry-run
~~~

Tests cover CLI output and argument validation, refusal to overwrite, traversal and symlink safety, copying every complete template, standalone serving, content structure, and local template links. GitHub Actions runs these checks with Node 22 using pinned official action commits.

To preview the gallery from the repository root:

~~~sh
python3 -m http.server 4173 --bind 127.0.0.1
~~~

## Contribute

[Open an issue](https://github.com/UyghurCommunity/uyghur-starters/issues) for an accessibility bug, improved Uyghur wording, or a focused new template idea. Contributions should preserve independent template folders and keep example content honestly labeled.

## License

Code, documentation, original illustrations, and original sample content: [MIT](LICENSE). The external font remains subject to its own terms and is not bundled.
