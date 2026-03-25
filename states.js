// ───────────────────────────────────────────────
// STATE CONFIGURATION
// ───────────────────────────────────────────────
const STATE_CONFIG = {
  fl: {
    name: 'Florida',
    reportName: 'Craft Distillery Monthly Report — DBPR EDS Submission',
    formRef: 'Form DBPR ABT 4000A-110CD · §61A-4.009 FAC · Division of Alcoholic Beverages &amp; Tobacco',
    dueChip: 'Due: 10th of Each Month',
    licenseChip: 'Craft Distillery (DD / ERB)',
    licNumLabel: 'FL License Number',
    licNumPlaceholder: '57-DD-000000',
    licNumHint: 'DD or ERB license',
    complianceText: 'Monthly reports must be submitted via DBPR EDS by <span class="due">11:59 PM on the 10th</span> of the following month (§61A-4.009 FAC). If the 10th falls on a weekend or holiday, the next business day applies.',
    taxPanelSub: 'EDS Computation of Tax tab — Florida excise taxes per §565.12 F.S.',
    taxTiers: [
      { id: 'low',  label: 'Spirits under 17.259% ABV',  sub: '§564 rate applies (ch.564 F.S.) — e.g. low-ABV liqueurs, RTDs', rate: 2.25, hint: 'Rate: $2.25/gal (ch. 564 F.S.)' },
      { id: 'mid',  label: 'Spirits 17.259% – 55.780% ABV', sub: '§565.12(1) F.S. — standard spirits: whiskey, rum, vodka, gin, tequila', rate: 6.50, hint: 'Rate: $6.50/gal (§565.12(1) F.S.)' },
      { id: 'high', label: 'Spirits over 55.780% ABV',   sub: '§565.12(2) F.S. — high-proof spirits: overproofs, navy strength, cask strength', rate: 9.53, hint: 'Rate: $9.53/gal (§565.12(2) F.S.)' },
    ],
    bottlingTaxNote: 'These ABV tiers determine the Florida excise tax rate per §565.12 F.S.',
    taxCatHeader: 'Taxable Categories (Wine Gallons) — §565.12 F.S.',
    caseGoodsNote: 'A craft distillery may sell directly to consumers per §565.03(2) up to 75,000 gallons/year from its gift shop/tasting room.',
    taxNote: 'Note: Tax rates shown are statutory rates per Ch. 564–565 F.S. Verify current rates with DBPR before remitting. Federal TTB taxes apply separately. Credits may reduce amount owed — click "View Credits" in EDS after uploading. Tax is calculated on wine gallons (total volume), not proof gallons.',
    txnHeaderLicense: 'FL License / Name',
    sampleDistributors: [
      { license: '57-DD-009341', name: 'Tampa Bay Wholesale Spirits' },
      { license: '57-DD-007218', name: 'Gulf &amp; Sun Distributors Inc.' },
      { license: '57-DD-011094', name: 'Central Florida Beverage LLC' },
    ],
    sampleGeneral: {
      bizname: 'Palmetto Still Craft Distillery LLC', licnum: '57-DD-001842',
      county: 'Hillsborough', phone: '(813) 555-0192',
      address: '4401 N. Copper Kettle Way, Tampa, FL 33603',
    },
  },
  ca: {
    name: 'California',
    reportName: 'Distilled Spirits Tax Return — CDTFA Alcoholic Beverage Tax',
    formRef: 'Form CDTFA-501-DS · California Dept. of Tax and Fee Administration · Revenue &amp; Taxation Code §32001',
    dueChip: 'Due: 15th of Each Month',
    licenseChip: 'Craft Distiller (Type 74) / DSM (Type 04)',
    licNumLabel: 'CDTFA Account Number',
    licNumPlaceholder: '123-456789',
    licNumHint: 'ABC Type 74 or Type 04 · 9-digit CDTFA account',
    complianceText: 'California CDTFA-501-DS returns must be filed electronically by <span class="due">11:59 PM on the 15th</span> of the following month (Regulation 2535). A return must be filed each period even if no tax is due.',
    taxPanelSub: 'CDTFA Tax Computation — California Alcoholic Beverage Tax (Revenue &amp; Taxation Code §32201)',
    taxTiers: [
      { id: 'low',  label: '100 Proof and Under',  sub: 'R&TC §32201 — all spirits at or below 100 proof (50% ABV)', rate: 3.30, hint: 'Rate: $3.30/wine gal (R&TC §32201)' },
      { id: 'mid',  label: 'Over 100 Proof',       sub: 'R&TC §32201 — spirits above 100 proof (over 50% ABV)', rate: 6.60, hint: 'Rate: $6.60/wine gal (R&TC §32201)' },
      { id: 'high', label: 'Exempt Transactions',  sub: 'Sales to licensed manufacturers, wholesalers, rectifiers, importers; exports; armed forces', rate: 0, hint: 'Rate: $0.00 — claim via CDTFA-243-B / 244-B' },
    ],
    bottlingTaxNote: 'California uses two proof tiers: 100 proof and under ($3.30/wine gal) and over 100 proof ($6.60/wine gal) per R&TC §32201.',
    taxCatHeader: 'Taxable Categories (Wine Gallons) — R&TC §32201',
    caseGoodsNote: 'California Type 74 craft distillers may sell up to 4.5 liters/consumer/day on-premises, and up to 150,000 gallons/fiscal year total (BPC §23502).',
    taxNote: 'Note: Tax rates per R&TC §32201 — $3.30/wine gal (≤100 proof) and $6.60/wine gal (>100 proof). Tax is due on sales to in-state retailers and consumer sales by craft distillers. Transfers to other licensed manufacturers, wholesalers, and exports are exempt. Verify current rates at cdtfa.ca.gov.',
    txnHeaderLicense: 'CDTFA Acct / Name',
    sampleDistributors: [
      { license: '400-123456', name: 'Bay Area Spirits Wholesale' },
      { license: '400-234567', name: 'Southern California Beverage Dist.' },
      { license: '400-345678', name: 'Golden State Spirits LLC' },
    ],
    sampleGeneral: {
      bizname: 'Golden Gate Craft Distillery LLC', licnum: '400-987654',
      county: 'San Francisco', phone: '(415) 555-0142',
      address: '1201 Distillery Row, San Francisco, CA 94103',
    },
  },
};

let activeState = 'fl';

// ── State Switcher ──
function closeStateSwitcher() {
  document.getElementById('stateSwitcherBtn')?.classList.remove('open');
  document.getElementById('stateDropdown')?.classList.remove('open');
}

function toggleStateSwitcher() {
  const btn = document.getElementById('stateSwitcherBtn');
  const dd  = document.getElementById('stateDropdown');
  const isOpen = dd.classList.contains('open');
  if (isOpen) {
    closeStateSwitcher();
  } else {
    btn.classList.add('open');
    dd.classList.add('open');
  }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
  const sw = document.getElementById('stateSwitcher');
  if (sw && !sw.contains(e.target)) {
    closeStateSwitcher();
  }
});

function switchState(stateKey) {
  if (stateKey === activeState) {
    closeStateSwitcher();
    return;
  }
  if (transactions.length > 0) {
    if (!confirm('Switching states will clear all loaded transactions and reset the form. Continue?')) {
      closeStateSwitcher();
      return;
    }
    transactions = [];
    renderTransactions();
  }

  activeState = stateKey;
  const cfg = STATE_CONFIG[stateKey];

  // Update active option highlight
  document.querySelectorAll('.state-option').forEach(el => el.classList.remove('active'));
  document.getElementById('opt-' + stateKey)?.classList.add('active');

  // Header
  document.getElementById('activeStateName').textContent = cfg.name;
  const hrn = document.getElementById('headerReportName'); if (hrn) hrn.textContent = cfg.reportName.replace(/&amp;/g,'&');
  const hfr = document.getElementById('headerFormRef');    if (hfr) hfr.innerHTML = cfg.formRef;
  const hdc = document.getElementById('headerDueChip');    if (hdc) hdc.textContent = cfg.dueChip;
  const hlc = document.getElementById('headerLicenseChip');if (hlc) hlc.textContent = cfg.licenseChip;

  // Compliance sidebar
  const ct = document.getElementById('complianceText'); if (ct) ct.innerHTML = cfg.complianceText;

  // General info
  const lnl = document.getElementById('licNumLabel'); if (lnl) lnl.innerHTML = cfg.licNumLabel + ' <span class="req">*</span>';
  const lni = document.getElementById('g_licnum');    if (lni) { lni.placeholder = cfg.licNumPlaceholder; lni.value = ''; }
  const lnh = document.getElementById('licNumHint');  if (lnh) lnh.textContent = cfg.licNumHint;
  // Clear other form fields
  ['g_bizname','g_month','g_county','g_phone','g_address','g_submitter','g_title'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });

  // Tax panel
  const tps = document.getElementById('taxPanelSub'); if (tps) tps.textContent = cfg.taxPanelSub.replace(/&amp;/g,'&');
  cfg.taxTiers.forEach(tier => {
    const labelEl = document.getElementById('tr-' + tier.id + '-label');
    if (labelEl) labelEl.innerHTML = tier.label + '<small>' + tier.sub + '</small>';
    const rateEl = document.getElementById('tr-' + tier.id + '-rate');
    if (rateEl) rateEl.textContent = tier.rate > 0 ? '$' + tier.rate.toFixed(2) : '$0.00';
    const hintEl = document.getElementById('cat-' + tier.id + '-hint');
    if (hintEl) hintEl.textContent = tier.hint;
  });
  const btn = document.getElementById('bottlingTaxNote'); if (btn) btn.innerHTML = cfg.bottlingTaxNote;
  const tch = document.getElementById('taxCatHeader');    if (tch) tch.textContent = cfg.taxCatHeader.replace(/&amp;/g,'&');
  const cgn = document.getElementById('caseGoodsNote');   if (cgn) cgn.innerHTML = cfg.caseGoodsNote;
  const tnt = document.getElementById('taxNoteText');      if (tnt) tnt.textContent = cfg.taxNote.replace(/&amp;/g,'&');

  // Transaction table header
  const licHeader = document.getElementById('txn-lic-header'); if (licHeader) licHeader.textContent = cfg.txnHeaderLicense;

  // Reset inventory fields
  ['b_begin','b_recv','b_distilled','b_to_bottling','b_to_case','b_loss',
   'bot_begin','bot_in','bot_out','cat_low','cat_mid','cat_high',
   'c_begin','c_recv','c_consumer','c_dist','c_tasting','c_export','c_loss'].forEach(id => {
    const el = document.getElementById(id);
    if (el && !el.readOnly) el.value = '0';
  });
  recalcBulk();
  recalcCase();
  recalcTax();

  // Reset CA fields when switching to FL
  if (stateKey === 'fl') {
    ['ca_s1_l1a','ca_s1_l1b','ca_s1_l2a','ca_s1_l2b','ca_s1_l3a','ca_s1_l3b',
     'ca_s1_l4a','ca_s1_l4b','ca_s1_l5a','ca_s1_l5b','ca_s1_l6a','ca_s1_l6b',
     'ca_s1_l8a','ca_s1_l8b','ca_s1_l9a','ca_s1_l9b','ca_s1_l10a','ca_s1_l10b',
     'ca_t_l14a','ca_t_l14b','ca_t_l15a','ca_t_l15b','ca_t_l17a','ca_t_l17b',
     'ca_t_l18a','ca_t_l18b','ca_t_l19a','ca_t_l19b'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '0';
    });
  }

  // Update download button labels
  const dlBtn = document.getElementById('btn-download-csv');
  if (dlBtn) dlBtn.textContent = stateKey === 'ca' ? 'Download CDTFA-501-DS CSV' : 'Download EDS CSV';
  const tplBtn = document.getElementById('btn-template');
  if (tplBtn) tplBtn.textContent = stateKey === 'ca' ? 'CDTFA-501-DS CSV Template' : 'EDS CSV Template';

  // Update ingest panel subtitle
  const ingestSub = document.getElementById('ingest-panel-sub');
  if (ingestSub) ingestSub.textContent = stateKey === 'ca'
    ? 'Load from CSV, Excel, JSON export, or enter by schedule — columns map to CDTFA-501-DS fields'
    : 'Load from CSV, Excel, JSON API export, or enter manually — any format maps to the report fields';

  // Toggle all state panels
  const panels = ['ingest-fl','ingest-ca','txnref-fl','txnref-ca','inv-fl','inv-ca','tax-fl','tax-ca'];
  panels.forEach(pid => {
    const el = document.getElementById(pid);
    if (!el) return;
    const isCurrentState = pid.endsWith('-' + stateKey);
    el.classList.toggle('state-active', isCurrentState);
  });

  // Inventory panel title/sub
  const invTitle = document.getElementById('inv-panel-title');
  const invSub   = document.getElementById('inv-panel-sub');
  if (stateKey === 'ca') {
    if (invTitle) invTitle.textContent = 'Statement I — Inventory Reconciliation';
    if (invSub)   invSub.textContent   = 'CDTFA-501-DS — Finished packaged spirits only, wine gallons, two proof columns';
  } else {
    if (invTitle) invTitle.textContent = 'Inventory Summary';
    if (invSub)   invSub.textContent   = 'EDS Summary Tab — beginning inventory loads from prior month; grey fields auto-calculate';
  }

  // Stat card sub-label for due date
  const dueSub = document.getElementById('st-tax')?.closest('.stat-card')?.querySelector('.s-sub');
  if (dueSub) dueSub.textContent = stateKey === 'ca' ? 'Due by 15th of month' : 'Due by 10th of month';

  // Close dropdown & show toast
  closeStateSwitcher();
  toast('Switched to ' + cfg.name + ' reporting');
}
