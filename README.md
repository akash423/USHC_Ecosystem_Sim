# Ecosystem Steward – Serious Game MVP

A web-based leadership training prototype that helps senior managers explore the U.S. healthcare ecosystem through a blend of:

- **Strategy / systems simulation**
- **Narrative decision cards**
- **Facilitator mode for live workshops**

## What is included

- 16 scenario cards across providers, payers, producers, intermediaries, regulation, workforce, and digital health
- 4 strategic actions
- 10-turn simulation loop
- Delayed ripple effects
- Facilitator mode with discussion prompts, watch-for KPIs, and debrief guidance
- GitHub-ready Vite + React app structure

## Local setup

1. Install **Node.js 18+**.
2. Open a terminal in this project folder.
3. Run:

```bash
npm install
npm run dev
```

4. Open the local URL shown in the terminal.

## Production build

```bash
npm run build
```

This creates a static build in the `dist/` folder.

## Project structure

```text
.
├── .github/workflows/deploy.yml
├── index.html
├── package.json
├── vite.config.js
├── README.md
├── README-GitHub-Pages.md
├── README-Google-Sites.md
└── src
    ├── App.jsx
    ├── main.jsx
    ├── data
    │   └── gameData.js
    └── components
        ├── ActionButton.jsx
        ├── ChoiceButton.jsx
        ├── DeltaPill.jsx
        ├── MetricBar.jsx
        ├── StakeholderChip.jsx
        └── SummaryCard.jsx
```

## Notes before sharing internally

- Update `homepage` in `package.json`.
- Update `base` in `vite.config.js` if the repo name changes.
- If GitHub Pages is not available in your environment, build the app and host `dist/` on any approved static host.
- To embed in Google Sites, the final hosted URL must be HTTPS and allow iframe embedding.
