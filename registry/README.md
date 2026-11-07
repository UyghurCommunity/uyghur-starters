# Uyghur UI source registry

Six original registry:block items generated from the application examples and the local core source. Each file includes content, a relative target, and an additional SHA256 integrity field. These are framework-independent HTML blocks; they do not install React, Tailwind, or npm dependencies.

Use the Uyghur Starters offline installer: `create-uyghur --ui writing-field --dir ./my-ui`. Source snapshots are bundled with that CLI. Remote shadcn installation is not required or promised.

Run `npm run build:registry` after changing source/examples, and keep all generated JSON committed. The CLI snapshot must be refreshed for the same release. No font binaries are included; the supplied ALKATIP Basma stylesheet registers external URLs.
