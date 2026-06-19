# Deployment Guide – GitHub Pages

This project is configured as a **static React app using Vite**.

## 1) Create a repository

Repository example:

```text
ecosystem-steward-serious-game
```

## 2) Update configuration

In `package.json`, change:

```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/ecosystem-steward-serious-game/"
```

In `vite.config.js`, confirm:

```js
base: '/ecosystem-steward-serious-game/'
```

If your repo name changes, update both values.

## 3) Push code

```bash
git init
git add .
git commit -m "Initial commit - Ecosystem Steward MVP"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ecosystem-steward-serious-game.git
git push -u origin main
```

## 4) Enable GitHub Pages

Use the repository's Pages settings and configure publishing to use **GitHub Actions** if available.

This project includes a GitHub Actions workflow at:

```text
.github/workflows/deploy.yml
```

## 5) Deployment behavior

Every push to `main` triggers a static build and deploys the site.

## 6) If GitHub Pages is unavailable in your enterprise environment

Use this same project, run:

```bash
npm install
npm run build
```

Then publish the contents of `dist/` to an approved static host.
