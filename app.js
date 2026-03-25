// ───────────────────────────────────────────────
// GLOBAL STATE
// ───────────────────────────────────────────────
let transactions = [];

function showSection(id, el) {
  document.querySelectorAll('.app-section').forEach(s => s.classList.remove('visible'));
  document.getElementById('sec-' + id).classList.add('visible');
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchIngest(name, el) {
  document.querySelectorAll('.ingest-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.ingest-pane').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('pane-' + name).classList.add('active');
}

function switchInvTab(name, el) {
  el.closest('.panel-body').querySelectorAll('.inv-tab').forEach(t => t.classList.remove('active'));
  el.closest('.panel-body').querySelectorAll('.inv-pane').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('inv-' + name).classList.add('active');
}

function dlFile(name, content, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name;
  a.click();
}

function showMsg(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `msg show msg-${type === 'warn' ? 'err' : type === 'info' ? 'info' : type === 'ok' ? 'ok' : 'err'}`;
  el.textContent = text;
}

function clearMsg(id) { const el = document.getElementById(id); if (el) { el.className = 'msg'; el.textContent = ''; } }

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function loadSampleData() {
  const cfg = STATE_CONFIG[activeState];
  const sg  = cfg.sampleGeneral;

  // General Info (state-agnostic fields from STATE_CONFIG)
  document.getElementById('g_bizname').value    = sg.bizname;
  document.getElementById('g_licnum').value     = sg.licnum;
  document.getElementById('g_month').value      = 'January';
  document.getElementById('g_year').value       = '2025';
  document.getElementById('g_title').value      = 'Owner / Head Distiller';
  document.getElementById('g_county').value     = sg.county;
  document.getElementById('g_phone').value      = sg.phone;
  document.getElementById('g_address').value    = sg.address;
  document.getElementById('g_amended').value    = 'No';
  document.getElementById('g_submitdate').value = '2025-02-07';

  if (activeState === 'ca') {
    document.getElementById('g_submitter').value = 'Elena M. Vasquez';

    // CA transactions — CDTFA schedule format
    transactions = [
      { report_section: 'cdtfa_240a', transaction_type: '240-A', fl_license: '',          supplier_name: 'Golden Gate Craft Distillery LLC', invoice_number: 'OWN-2501',  invoice_date: '2025-01-31', gallons: 340.000, proof: 0, notes: 'Own bottling — vodka/gin (≤100pf) + cask whiskey (>100pf)', ca_low: 280.00, ca_high: 60.00 },
      { report_section: 'cdtfa_241a', transaction_type: '241-A', fl_license: '400-123456', supplier_name: 'Bay Area Spirits Wholesale',        invoice_number: 'BASW-9814', invoice_date: '2025-01-07', gallons: 100.000, proof: 0, notes: 'Neutral grain spirits — vodka base (≤100pf)',             ca_low: 100.00, ca_high: 0    },
      { report_section: 'cdtfa_241a', transaction_type: '241-A', fl_license: '400-234567', supplier_name: 'Southern California Beverage Dist.', invoice_number: 'SCBD-4401', invoice_date: '2025-01-14', gallons: 40.000,  proof: 0, notes: 'High-proof neutral spirits for blending (>100pf)',          ca_low: 0,      ca_high: 40.00 },
      { report_section: 'cdtfa_244b', transaction_type: '244-B', fl_license: '',          supplier_name: 'Pacific Rim Export LLC',            invoice_number: 'PRE-0125',  invoice_date: '2025-01-29', gallons: 24.000,  proof: 0, notes: 'Export to Japan — vodka (≤100pf), documented',             ca_low: 24.00,  ca_high: 0    },
    ];

    // Statement I — Inventory Reconciliation (wine gallons)
    // Col A: ≤100 proof  |  Col B: >100 proof
    document.getElementById('ca_s1_l1a').value  = '180.00';  // Beginning inventory ≤100pf
    document.getElementById('ca_s1_l1b').value  = '45.00';   // Beginning inventory >100pf
    document.getElementById('ca_s1_l2a').value  = '280.00';  // Own bottling ≤100pf (240-A)
    document.getElementById('ca_s1_l2b').value  = '60.00';   // Own bottling >100pf (240-A)
    document.getElementById('ca_s1_l3a').value  = '100.00';  // In-state purchases ≤100pf (241-A)
    document.getElementById('ca_s1_l3b').value  = '40.00';   // In-state purchases >100pf (241-A)
    document.getElementById('ca_s1_l4a').value  = '0';
    document.getElementById('ca_s1_l4b').value  = '0';
    document.getElementById('ca_s1_l5a').value  = '0';
    document.getElementById('ca_s1_l5b').value  = '0';
    document.getElementById('ca_s1_l6a').value  = '0';
    document.getElementById('ca_s1_l6b').value  = '0';
    // L7 auto-calculated
    document.getElementById('ca_s1_l8a').value  = '210.00';  // Sales to in-state retailers ≤100pf (242-A)
    document.getElementById('ca_s1_l8b').value  = '40.00';   // Sales to in-state retailers >100pf (242-A)
    document.getElementById('ca_s1_l9a').value  = '12.00';   // Consumer (on-premises) sales ≤100pf
    document.getElementById('ca_s1_l9b').value  = '0';
    document.getElementById('ca_s1_l10a').value = '24.00';   // Exempt: exports (244-B)
    document.getElementById('ca_s1_l10b').value = '0';
    // L11 ending inventory auto-calculated
    if (typeof recalcCAStatement === 'function') recalcCAStatement();

    // Tax Computation
    // Taxable = retailer sales + consumer sales = 210+12=222 (≤100pf), 40 (>100pf)
    document.getElementById('ca_t_l14a').value  = '222.00'; // Total taxable gallons ≤100pf
    document.getElementById('ca_t_l14b').value  = '40.00';  // Total taxable gallons >100pf
    document.getElementById('ca_t_l15a').value  = '0';      // Returns/allowances
    document.getElementById('ca_t_l15b').value  = '0';
    // L16 net taxable auto-calculated
    document.getElementById('ca_t_l17a').value  = '0';      // Deductions
    document.getElementById('ca_t_l17b').value  = '0';
    document.getElementById('ca_t_l18a').value  = '0';      // Exempt amount
    document.getElementById('ca_t_l18b').value  = '0';
    document.getElementById('ca_t_l19a').value  = '0';      // Credits
    document.getElementById('ca_t_l19b').value  = '0';
    if (typeof recalcCATax === 'function') recalcCATax();

  } else {
    document.getElementById('g_submitter').value = 'Marcus T. Holloway';

    // FL transactions
    transactions = [
      { report_section: 'bulk_spirits', transaction_type: 'DISTILLED',  fl_license: '',             supplier_name: '',                    invoice_number: 'DIST-2501', invoice_date: '2025-01-08', gallons: 620.000, proof: 140, notes: 'New make Florida corn whiskey' },
      { report_section: 'bulk_spirits', transaction_type: 'DISTILLED',  fl_license: '',             supplier_name: '',                    invoice_number: 'DIST-2502', invoice_date: '2025-01-22', gallons: 480.000, proof: 136, notes: 'New make Florida sugar cane rum' },
      { report_section: 'bulk_spirits', transaction_type: 'PURCHASE',   fl_license: '57-DD-000421', supplier_name: 'Gulf Coast Spirits',  invoice_number: 'GCS-88214', invoice_date: '2025-01-05', gallons: 150.000, proof: 95,  notes: 'Neutral grain spirits — vodka base' },
      { report_section: 'bulk_spirits', transaction_type: 'RECTIFIED',  fl_license: '',             supplier_name: '',                    invoice_number: 'RECT-2501', invoice_date: '2025-01-14', gallons: 210.000, proof: 80,  notes: 'Spiced rum blend — barrel rested' },
      { report_section: 'bulk_spirits', transaction_type: 'LOSS',       fl_license: '',             supplier_name: '',                    invoice_number: 'LOSS-JAN25',invoice_date: '2025-01-31', gallons: 18.500,  proof: 130, notes: "Barrel evaporation — angel's share" },
      { report_section: 'bottling',     transaction_type: 'BOTTLED',    fl_license: '',             supplier_name: '',                    invoice_number: 'BOT-2501',  invoice_date: '2025-01-18', gallons: 310.000, proof: 80,  notes: 'Palmetto Gold Bourbon — 750ml run' },
      { report_section: 'bottling',     transaction_type: 'BOTTLED',    fl_license: '',             supplier_name: '',                    invoice_number: 'BOT-2502',  invoice_date: '2025-01-27', gallons: 185.000, proof: 94,  notes: 'Cane & Copper Rum — 750ml run' },
      { report_section: 'case_goods',   transaction_type: 'SALE_DIST',  fl_license: '57-DD-009341', supplier_name: 'Tampa Bay Wholesale', invoice_number: 'TBW-44021', invoice_date: '2025-01-21', gallons: 124.000, proof: 80,  notes: 'Bourbon — 24 × 750ml cases' },
      { report_section: 'case_goods',   transaction_type: 'SALE_DIST',  fl_license: '57-DD-009341', supplier_name: 'Tampa Bay Wholesale', invoice_number: 'TBW-44039', invoice_date: '2025-01-28', gallons: 62.000,  proof: 94,  notes: 'Rum — 12 × 750ml cases' },
      { report_section: 'case_goods',   transaction_type: 'SALE_CONS',  fl_license: '',             supplier_name: 'Gift Shop',           invoice_number: 'GS-JAN-01', invoice_date: '2025-01-11', gallons: 3.750,   proof: 80,  notes: 'Walk-in customer — bourbon' },
      { report_section: 'case_goods',   transaction_type: 'SALE_CONS',  fl_license: '',             supplier_name: 'Gift Shop',           invoice_number: 'GS-JAN-02', invoice_date: '2025-01-18', gallons: 2.250,   proof: 94,  notes: 'Walk-in customer — rum' },
      { report_section: 'case_goods',   transaction_type: 'TASTING',    fl_license: '',             supplier_name: 'Tasting Room',        invoice_number: 'TASTE-JAN', invoice_date: '2025-01-31', gallons: 1.125,   proof: 80,  notes: 'Monthly tasting room samples' },
    ];

    // Bulk Spirits inventory
    document.getElementById('b_begin').value       = '842.500';
    document.getElementById('b_recv').value        = '150.000';
    document.getElementById('b_distilled').value   = '1044.000'; // 620×140/100 + 480×136/100 proof gal
    document.getElementById('b_to_bottling').value = '756.200';
    document.getElementById('b_to_case').value     = '0.000';
    document.getElementById('b_loss').value        = '29.713';   // 18.5×130/100 + rounding
    recalcBulk();

    // Bottling inventory
    document.getElementById('bot_begin').value = '124.000';
    document.getElementById('bot_in').value    = '756.200';
    document.getElementById('bot_out').value   = '634.500';

    // Tax categories (wine gallons)
    // BOT-2501: 310 gal at 80pf → 310 wine gal (17.259%–55.78% tier)
    // BOT-2502: 185 gal at 94pf → 185 wine gal (17.259%–55.78% tier)
    document.getElementById('cat_low').value  = '0.000';
    document.getElementById('cat_mid').value  = '495.000';
    document.getElementById('cat_high').value = '0.000';

    // Case Goods inventory
    document.getElementById('c_begin').value    = '98.250';
    document.getElementById('c_recv').value     = '495.000';
    document.getElementById('c_consumer').value = '6.000';
    document.getElementById('c_dist').value     = '186.000';
    document.getElementById('c_tasting').value  = '1.125';
    document.getElementById('c_export').value   = '0.000';
    document.getElementById('c_loss').value     = '0.000';
    recalcCase();
  }

  renderTransactions();
  recalcTax();
  toast('Sample data loaded — ready to generate report');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('g_submitdate').value = new Date().toISOString().split('T')[0];
  recalcTax();
  renderTransactions();
});

// ── Expose all functions to window scope ──
