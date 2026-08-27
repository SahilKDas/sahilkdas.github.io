# Sahil K. Das — Portfolio

A Nuxt 4 portfolio for software engineer and systems architect Sahil K. Das.

## Development

```bash
npm install
npm run dev
```

## Production Node server

Build the Nitro Node server and start it in production mode:

```bash
npm run build
npm start
```

The server listens on port `3000` by default. Set `PORT` and `HOST` to override it.

## GitHub Pages

Every push to `main` runs the Pages workflow, creates a static build using Nitro's `github_pages` preset, and deploys `.output/public`.

The public site is available at [sahilkdas.github.io](https://sahilkdas.github.io/).
