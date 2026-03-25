# Report-o-matic

> Multi-state distillery regulatory report generator. Upload or enter transaction data and generate state-compliant monthly reports with tax computations.

## Supported States

| State | Form | Agency | Due Date |
|-------|------|--------|----------|
| Florida | DBPR ABT 4000A-110CD | Division of Alcoholic Beverages & Tobacco | 10th of month |
| California | CDTFA-501-DS | Dept. of Tax & Fee Administration | 15th of month |

## Usage

Open `index.html` in any modern browser. No build step, no server required.

Or deploy to GitHub Pages:
1. Push this folder to a GitHub repo
2. Settings → Pages → Deploy from branch `main` / `/ (root)`
3. Your URL: `https://yourusername.github.io/reportomatic`

## File Structure

```
reportomatic/
├── index.html          # Shell — HTML structure only, no inline JS or CSS
├── styles.css          # All styles — variables, layout, components
├── states.js           # STATE_CONFIG for each state + state switcher logic
├── calculations.js     # FL and CA tax/inventory math
├── transactions.js     # Transaction entry, ledger rendering, validation
├── ingest.js           # CSV/XLS/JSON/paste loading + column mapper
├── reports.js          # Report preview generation + CSV export
└── app.js              # Navigation, utilities, sample data, init
```

## Adding a New State

1. Open `states.js`
2. Add a new key to `STATE_CONFIG` following the FL or CA pattern
3. Add a `<div class="state-option">` entry in `index.html` inside `#stateDropdown`
4. Add state-specific section panels in `index.html` (ingest, inventory, tax) with `id="inv-XX"` etc.
5. Update `switchState()` in `states.js` to toggle the new panels

## Notes

- All transaction type codes (FL) and schedule numbers (CA) should be verified against official agency documentation before filing
- FL: EDS Lookup Legend available inside the DBPR EDS portal after login
- CA: CDTFA-240-DS Excel template available at cdtfa.ca.gov/formspubs/cdtfa240ds.xlsx
- Tax rates are statutory but verify current rates before remitting
