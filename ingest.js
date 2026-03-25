// ── Shared pending-import state ──
let pendingHeaders = [], pendingRows = [], pendingSource = '';

const EDS_FIELDS = [
  { key: 'report_section',   label: 'Report Section',        required: true  },
  { key: 'transaction_type', label: 'Transaction Type',       required: true  },
  { key: 'fl_license',       label: 'FL License / Acct #',   required: false },
  { key: 'supplier_name',    label: 'Supplier / Purchaser',   required: false },
  { key: 'invoice_number',   label: 'Invoice Number',         required: true  },
  { key: 'invoice_date',     label: 'Invoice Date',           required: true  },
  { key: 'gallons',          label: 'Gallons',                required: true  },
  { key: 'proof',            label: 'Proof',                  required: false },
  { key: 'notes',            label: 'Notes',                  required: false },
];

const AUTO_MAP = {
  report_section:   ['report_section','section','category','type_group','txn_section'],
  transaction_type: ['transaction_type','txn_type','type','activity','operation'],
  fl_license:       ['fl_license','license','license_number','fl_lic','acct','account'],
  supplier_name:    ['supplier_name','supplier','vendor','purchaser','name','company'],
  invoice_number:   ['invoice_number','invoice','inv_num','invoice_no','doc_number','ref'],
  invoice_date:     ['invoice_date','date','txn_date','transaction_date','inv_date'],
  gallons:          ['gallons','gal','volume','wine_gallons','quantity','qty'],
  proof:            ['proof','alcohol','abv_proof','pf'],
  notes:            ['notes','description','memo','comment','details'],
};

const EDS_FIELDS_CA = [
  { key: 'report_section',   label: 'Schedule Section (e.g. cdtfa_240a)',  required: true  },
  { key: 'transaction_type', label: 'Schedule # (240-A, 241-A…)',           required: true  },
  { key: 'fl_license',       label: 'CDTFA Account #',                     required: false },
  { key: 'supplier_name',    label: 'Supplier / Purchaser Name',            required: false },
  { key: 'invoice_number',   label: 'Invoice Number',                       required: true  },
  { key: 'invoice_date',     label: 'Invoice Date',                         required: true  },
  { key: 'ca_low',           label: '≤100 Proof Wine Gal (Col A)',           required: true  },
  { key: 'ca_high',          label: '>100 Proof Wine Gal (Col B)',           required: false },
  { key: 'notes',            label: 'Notes',                                required: false },
];

const AUTO_MAP_CA = {
  report_section:   ['report_section','section','schedule','schedule_section','cdtfa_section'],
  transaction_type: ['transaction_type','txn_type','type','schedule_number','sched_num','schedule_no'],
  fl_license:       ['fl_license','cdtfa_account','account','license','cdtfa_acct','acct'],
  supplier_name:    ['supplier_name','supplier','vendor','purchaser','name','company'],
  invoice_number:   ['invoice_number','invoice','inv_num','invoice_no','doc_number','ref'],
  invoice_date:     ['invoice_date','date','txn_date','transaction_date','inv_date'],
  ca_low:           ['ca_low','col_a','gal_low','low_proof','under_100','at_or_under_100','wine_gal_low','gallons_low'],
  ca_high:          ['ca_high','col_b','gal_high','high_proof','over_100','above_100','wine_gal_high','gallons_high'],
  notes:            ['notes','description','memo','comment','details'],
};

function loadCSV(ev) {
  const file = ev.target.files[0];
  if (file) processTextFile(file);
}

function processTextFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = e.target.result;
      const delim = text.includes('\t') ? '\t' : ',';
      const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('#'));
      if (lines.length < 2) throw new Error('File needs a header row + data rows');
      const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map(l => l.split(delim).map(v => v.trim().replace(/^"|"$/g, '')));
      pendingHeaders = headers;
      pendingRows = rows;
      pendingSource = 'csv';
      showMsg('csv-msg', 'info', `Loaded ${rows.length} rows with columns: ${headers.join(', ')}`);
      buildMapper('csv-mapper', headers, 'csv');
    } catch(err) {
      showMsg('csv-msg', 'err', '' + err.message);
    }
  };
  reader.readAsText(file);
}

function loadExcel(ev) {
  const file = ev.target.files[0];
  if (file) processExcelFile(file);
}

function processExcelFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (data.length < 2) throw new Error('Spreadsheet needs a header row + data');
      const headers = data[0].map(h =>String(h).trim());
      const rows = data.slice(1).filter(r => r.some(v => v !== '')).map(r => r.map(v =>String(v).trim()));
      pendingHeaders = headers;
      pendingRows = rows;
      pendingSource = 'xl';
      showMsg('xl-msg', 'info', `Loaded ${rows.length} rows from "${wb.SheetNames[0]}" with ${headers.length} columns`);
      buildMapper('xl-mapper', headers, 'xl');
    } catch(err) {
      showMsg('xl-msg', 'err', '' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function loadJSON() {
  try {
    const raw = document.getElementById('inp-json').value.trim();
    let data = JSON.parse(raw);
    if (!Array.isArray(data)) data = [data];
    if (!data.length) throw new Error('JSON array is empty');
    const headers = [...new Set(data.flatMap(r =>Object.keys(r)))];
    const rows = data.map(r => headers.map(h =>String(r[h] ?? '')));
    pendingHeaders = headers;
    pendingRows = rows;
    pendingSource = 'json';
    showMsg('json-msg', 'info', `Parsed ${rows.length} records with keys: ${headers.join(', ')}`);
    buildMapper('json-mapper', headers, 'json');
  } catch(err) {
    showMsg('json-msg', 'err', 'JSON parse error: ' + err.message);
  }
}

function loadSampleJSON() {
  // ── Realistic craft distillery: Palmetto Still, Tampa FL ──
  // Generates a full January 2025 operating month:
  //   • 8 distillation runs (bourbon, rum, vodka, gin, whiskey variants)
  //   • Daily barrel fills (aging program)
  //   • Weekly NGS/GNS purchases
  //   • Barrel-to-barrel transfers & blending
  //   • Daily gift shop consumer sales (open Wed–Sun)
  //   • Twice-weekly distributor invoices (3 distributors)
  //   • Tasting room pours tracked per session
  //   • Weekly bottling runs (3 SKUs)
  //   • Monthly angel's share / loss entries per barrel group
  //   • Online order fulfillments shipped in-state

  const txns = [];
  let seq = 1;
  const pad = n => String(n).padStart(4, '0');
  const inv = prefix => `${prefix}-${pad(seq++)}`;
  const date = (d) => `2025-01-${String(d).padStart(2,'0')}`;
  const r = (min, max, dp=3) => parseFloat((Math.random()*(max-min)+min).toFixed(dp));

  // ── DISTRIBUTORS ──
  const distributors = [
    { license: '57-DD-009341', name: 'Tampa Bay Wholesale Spirits' },
    { license: '57-DD-007218', name: 'Gulf & Sun Distributors Inc.' },
    { license: '57-DD-011094', name: 'Central Florida Beverage LLC' },
  ];

  // ── PRODUCTS (SKUs) ──
  const products = [
    { name: 'Palmetto Gold Straight Bourbon',       proof: 80,  abv: 40.0, bottleGal: 0.1875, case12: 2.25 },
    { name: 'Copper Key Florida Rum',               proof: 80,  abv: 40.0, bottleGal: 0.1875, case12: 2.25 },
    { name: 'Silver Still Vodka',                   proof: 80,  abv: 40.0, bottleGal: 0.1875, case12: 2.25 },
    { name: 'Saw Palmetto Gin',                     proof: 88,  abv: 44.0, bottleGal: 0.1875, case12: 2.25 },
    { name: 'Single Barrel Cask Strength Bourbon',  proof: 118, abv: 59.0, bottleGal: 0.1875, case12: 2.25 },
    { name: 'Dark Spiced Rum',                      proof: 70,  abv: 35.0, bottleGal: 0.1875, case12: 2.25 },
  ];

  // ────────────────────────────────────────────
  // BULK SPIRITS — Distillation Runs
  // 8 runs across the month, alternating product types
  // ────────────────────────────────────────────
  const distRuns = [
    { day:  2, gallons: 638.0, proof: 138, notes: 'New make Florida corn whiskey — Run 1 of 4' },
    { day:  4, gallons: 512.0, proof: 142, notes: 'New make Florida sugar cane rum — Run 1 of 3' },
    { day:  7, gallons: 294.0, proof: 190, notes: 'High-proof Florida wheat vodka base — stripping run' },
    { day:  9, gallons: 641.0, proof: 136, notes: 'New make Florida corn whiskey — Run 2 of 4' },
    { day: 13, gallons: 318.0, proof: 188, notes: 'Florida wheat vodka base — spirit run' },
    { day: 16, gallons: 518.0, proof: 140, notes: 'New make Florida sugar cane rum — Run 2 of 3' },
    { day: 21, gallons: 644.0, proof: 134, notes: 'New make Florida corn whiskey — Run 3 of 4' },
    { day: 24, gallons: 496.0, proof: 144, notes: 'New make Florida sugar cane rum — Run 3 of 3' },
    { day: 27, gallons: 628.0, proof: 138, notes: 'New make Florida corn whiskey — Run 4 of 4' },
    { day: 29, gallons: 210.0, proof: 86,  notes: 'Florida botanical gin — compounding & re-distillation' },
  ];
  distRuns.forEach(run => {
    txns.push({ section:'bulk_spirits', type:'DISTILLED', invoice:inv('DIST'), date:date(run.day), gallons:run.gallons, proof:run.proof, notes:run.notes });
  });

  // ────────────────────────────────────────────
  // BULK SPIRITS — NGS/GNS Purchases (4 orders)
  // ────────────────────────────────────────────
  const ngsPurchases = [
    { day: 3,  gallons: 264.0, proof: 192, supplier_license:'57-DD-004401', supplier_name:'Fermentis Supply Co.',      notes:'GNS 96% — vodka & gin base stock' },
    { day: 10, gallons: 198.0, proof: 192, supplier_license:'57-DD-004401', supplier_name:'Fermentis Supply Co.',      notes:'GNS 96% — vodka & gin base stock' },
    { day: 17, gallons: 176.0, proof: 190, supplier_license:'57-DD-006812', supplier_name:'Southern Grain Solutions',  notes:'GNS 95% — supplemental base' },
    { day: 24, gallons: 210.0, proof: 192, supplier_license:'57-DD-004401', supplier_name:'Fermentis Supply Co.',      notes:'GNS 96% — vodka & gin base stock' },
  ];
  ngsPurchases.forEach(p => {
    txns.push({ section:'bulk_spirits', type:'PURCHASE', license:p.supplier_license, name:p.supplier_name, invoice:inv('NGS'), date:date(p.day), gallons:p.gallons, proof:p.proof, notes:p.notes });
  });

  // ────────────────────────────────────────────
  // BULK SPIRITS — Rectification / Blending
  // ────────────────────────────────────────────
  const rectifications = [
    { day:  8, gallons: 312.0, proof: 80, notes: 'Spiced rum compound blend — barrel rested cane + botanicals' },
    { day: 15, gallons: 418.0, proof: 80, notes: 'Bourbon blend — 2yr barrel + 3yr barrel marriage' },
    { day: 22, gallons: 196.0, proof: 88, notes: 'Gin redistillation — botanical basket pass' },
    { day: 28, gallons: 284.0, proof: 80, notes: 'Vodka polish filtration & reduction to proof' },
  ];
  rectifications.forEach(rect => {
    txns.push({ section:'bulk_spirits', type:'RECTIFIED', invoice:inv('RECT'), date:date(rect.day), gallons:rect.gallons, proof:rect.proof, notes:rect.notes });
  });

  // ────────────────────────────────────────────
  // BULK SPIRITS — Barrel Fills (aging inventory)
  // Daily fills on production days — individual barrel entries
  // ────────────────────────────────────────────
  const barrelDays = [2,4,9,13,16,21,24,27];
  let barrelNum = 2401;
  barrelDays.forEach(day => {
    const barrelsThisDay = Math.floor(r(8, 18, 0));
    for (let b = 0; b < barrelsThisDay; b++) {
      const gal = r(51.5, 55.5, 2);
      const prf = r(118, 125, 1);
      txns.push({
        section:'bulk_spirits', type:'TRANSFER',
        invoice:`BFILL-${barrelNum++}`,
        date:date(day),
        gallons:gal, proof:prf,
        notes:`New oak barrel fill #${barrelNum-1} — aging program`
      });
    }
  });

  // ────────────────────────────────────────────
  // BULK SPIRITS — Barrel Dumps (mature spirit out of aging)
  // ────────────────────────────────────────────
  const barrelDumps = [
    { day: 6,  count: 6,  galEach: [52.1,51.8,53.4,52.9,51.2,53.0], proof: 116, notes: '24-month bourbon — batch dump for blending' },
    { day: 14, count: 4,  galEach: [54.2,53.8,52.6,54.0],           proof: 110, notes: '18-month rum barrel dump' },
    { day: 23, count: 8,  galEach: [51.9,52.4,53.1,52.8,51.5,53.6,52.2,51.7], proof: 118, notes: '30-month single barrel program dump' },
  ];
  barrelDumps.forEach(dump => {
    dump.galEach.forEach((gal, i) => {
      txns.push({
        section:'bulk_spirits', type:'PURCHASE',
        license:'', name:'Aging Cellar — Internal Barrel Dump',
        invoice:`BDUMP-${pad(seq++)}`,
        date:date(dump.day),
        gallons:gal, proof:dump.proof,
        notes:`${dump.notes} — Barrel ${i+1} of ${dump.count}`
      });
    });
  });

  // ────────────────────────────────────────────
  // BULK SPIRITS — Angel's Share / Loss
  // Monthly entries per barrel group in warehouse
  // ────────────────────────────────────────────
  const losses = [
    { day:31, gallons:22.840, proof:118, notes:"Angel's share — bourbon warehouse A (42 barrels, avg 0.54 gal/barrel)" },
    { day:31, gallons:14.210, proof:112, notes:"Angel's share — rum warehouse B (28 barrels, avg 0.51 gal/barrel)" },
    { day:31, gallons: 4.620, proof:190, notes:'Evaporation loss — GNS holding tank, month-end adjustment' },
    { day:31, gallons: 1.875, proof: 80, notes:'Breakage — 10× 750ml bottles damaged during bottling run' },
  ];
  losses.forEach(l => {
    txns.push({ section:'bulk_spirits', type:'LOSS', invoice:inv('LOSS'), date:date(l.day), gallons:l.gallons, proof:l.proof, notes:l.notes });
  });

  // ────────────────────────────────────────────
  // BOTTLING — Weekly production runs, 3 SKUs each
  // ────────────────────────────────────────────
  const bottlingRuns = [
    { day:  6, sku: products[0], cases: 86,  notes:'750ml — Palmetto Gold Straight Bourbon' },
    { day:  6, sku: products[1], cases: 64,  notes:'750ml — Copper Key Florida Rum' },
    { day:  6, sku: products[2], cases: 48,  notes:'750ml — Silver Still Vodka' },
    { day: 13, sku: products[0], cases: 92,  notes:'750ml — Palmetto Gold Straight Bourbon' },
    { day: 13, sku: products[3], cases: 42,  notes:'750ml — Saw Palmetto Gin' },
    { day: 13, sku: products[5], cases: 38,  notes:'750ml — Dark Spiced Rum' },
    { day: 20, sku: products[0], cases: 78,  notes:'750ml — Palmetto Gold Straight Bourbon' },
    { day: 20, sku: products[1], cases: 72,  notes:'750ml — Copper Key Florida Rum' },
    { day: 20, sku: products[4], cases: 24,  notes:'750ml — Single Barrel Cask Strength Bourbon' },
    { day: 27, sku: products[0], cases: 96,  notes:'750ml — Palmetto Gold Straight Bourbon' },
    { day: 27, sku: products[2], cases: 52,  notes:'750ml — Silver Still Vodka' },
    { day: 27, sku: products[3], cases: 36,  notes:'750ml — Saw Palmetto Gin' },
  ];
  bottlingRuns.forEach(run => {
    const gal = parseFloat((run.cases * run.sku.case12).toFixed(3));
    txns.push({ section:'bottling', type:'BOTTLED', invoice:inv('BOT'), date:date(run.day), gallons:gal, proof:run.sku.proof, notes:run.notes });
  });

  // ────────────────────────────────────────────
  // CASE GOODS — Gift Shop Consumer Sales
  // Open Wed–Sun, 11am–6pm. Daily individual transaction entries.
  // Typical craft distillery: 15–45 walk-in sales per open day.
  // Each transaction = one customer visit (1–6 bottles)
  // ────────────────────────────────────────────
  const openDays = [1,2,3,4,5, 8,9,10,11,12, 15,16,17,18,19, 22,23,24,25,26, 29,30,31];
  // Wed=1,Thu=2,Fri=3,Sat=4,Sun=5 in Jan 2025 (Jan 1 = Wed)
  const weekendDays = new Set([4,5,11,12,18,19,25,26]);

  openDays.forEach(day => {
    const isWeekend = weekendDays.has(day);
    const salesCount = isWeekend ? Math.floor(r(55, 90, 0)) : Math.floor(r(30, 55, 0));
    for (let s = 0; s < salesCount; s++) {
      const sku = products[Math.floor(Math.random() * products.length)];
      const bottles = Math.floor(r(1, 7, 0));  // 1–6 bottles (FL: max 6/brand/year, but monthly realistic)
      const gal = parseFloat((bottles * sku.bottleGal).toFixed(4));
      txns.push({
        section:'case_goods', type:'SALE_CONS',
        name:'Gift Shop / Tasting Room',
        invoice:inv('GS'),
        date:date(day),
        gallons:gal, proof:sku.proof,
        notes:`${sku.name} — ${bottles}× 750ml`
      });
    }
  });

  // ────────────────────────────────────────────
  // CASE GOODS — Tasting Room Pours (separate from bottle sales)
  // Tracked per tasting session/flight. 4–8 sessions per open day.
  // Florida craft distillery can offer tastings on premises.
  // ────────────────────────────────────────────
  openDays.forEach(day => {
    const isWeekend = weekendDays.has(day);
    const sessions = isWeekend ? Math.floor(r(14, 22, 0)) : Math.floor(r(8, 15, 0));
    for (let s = 0; s < sessions; s++) {
      const participants = Math.floor(r(2, 8, 0));
      const samplingSku = products[Math.floor(Math.random() * products.length)];
      const pourGal = parseFloat((participants * 0.025).toFixed(4)); // ~1oz per person per pour
      txns.push({
        section:'case_goods', type:'TASTING',
        name:'Tasting Room',
        invoice:inv('TR'),
        date:date(day),
        gallons:pourGal, proof:samplingSku.proof,
        notes:`${samplingSku.name} — ${participants}-person flight session`
      });
    }
  });

  // ────────────────────────────────────────────
  // CASE GOODS — Distributor Sales (3 distributors, 2× weekly invoices each)
  // Typical: larger case volume, specific SKU batches per delivery
  // ────────────────────────────────────────────
  const distDeliveryDays = [3,6,10,13,17,20,24,27,31];
  distDeliveryDays.forEach(day => {
    distributors.forEach(dist => {
      // Each distributor gets 2–4 line items per invoice (different SKUs)
      const skuCount = Math.floor(r(2, 5, 0));
      const skuPool = [...products].sort(() => Math.random()-0.5).slice(0, skuCount);
      skuPool.forEach(sku => {
        const cases = Math.floor(r(8, 48, 0));
        const gal = parseFloat((cases * sku.case12).toFixed(3));
        txns.push({
          section:'case_goods', type:'SALE_DIST',
          license:dist.license, name:dist.name,
          invoice:inv('DIST'),
          date:date(day),
          gallons:gal, proof:sku.proof,
          notes:`${sku.name} — ${cases} cases × 12× 750ml`
        });
      });
    });
  });

  // ────────────────────────────────────────────
  // CASE GOODS — Online / Direct Ship (in-state)
  // Florida allows direct-to-consumer for craft distilleries
  // Track per order, daily fulfillment batches
  // ────────────────────────────────────────────
  const shipDays = [2,5,7,9,12,14,16,19,21,23,26,28,30];
  shipDays.forEach(day => {
    const ordersToday = Math.floor(r(12, 28, 0));
    for (let o = 0; o < ordersToday; o++) {
      const sku = products[Math.floor(Math.random() * products.length)];
      const bottles = Math.floor(r(1, 4, 0));
      const gal = parseFloat((bottles * sku.bottleGal).toFixed(4));
      txns.push({
        section:'case_goods', type:'SALE_CONS',
        name:'Direct Ship — In-State Consumer',
        invoice:inv('SHIP'),
        date:date(day),
        gallons:gal, proof:sku.proof,
        notes:`${sku.name} — ${bottles}× 750ml — online order`
      });
    }
  });

  // ────────────────────────────────────────────
  // CASE GOODS — Promotional & Trade Samples
  // Distributor rep samples, trade show allocations
  // ────────────────────────────────────────────
  const tradesamples = [
    { day: 8,  dist: distributors[0], sku: products[0], bottles: 6,  notes:'Trade rep samples — new SKU presentation' },
    { day: 15, dist: distributors[1], sku: products[3], bottles: 6,  notes:'Gin launch — distributor sales rep kits' },
    { day: 15, dist: distributors[2], sku: products[4], bottles: 3,  notes:'Cask strength — specialty account samples' },
    { day: 22, dist: distributors[0], sku: products[1], bottles: 6,  notes:'Rum samples — on-premise account push' },
    { day: 29, dist: distributors[1], sku: products[0], bottles: 6,  notes:'Bourbon samples — chain account review' },
  ];
  tradesamples.forEach(s => {
    const gal = parseFloat((s.bottles * s.sku.bottleGal).toFixed(4));
    txns.push({
      section:'case_goods', type:'TASTING',
      license:s.dist.license, name:s.dist.name,
      invoice:inv('SMPL'),
      date:date(s.day),
      gallons:gal, proof:s.sku.proof,
      notes:s.notes
    });
  });

  // ── Safety pad: guarantee at least 2000 transactions ──
  while (txns.length < 2000) {
    const day = openDays[Math.floor(Math.random() * openDays.length)];
    const sku = products[Math.floor(Math.random() * products.length)];
    const bottles = Math.floor(r(1, 4, 0));
    txns.push({
      section:'case_goods', type:'SALE_CONS',
      name:'Gift Shop / Tasting Room',
      invoice:inv('GS'),
      date:date(day),
      gallons:parseFloat((bottles * sku.bottleGal).toFixed(4)),
      proof:sku.proof,
      notes:`${sku.name} — ${bottles}× 750ml`
    });
  }

  // ── display count and populate textarea ──
  const textarea = document.getElementById('inp-json');
  textarea.value = JSON.stringify(txns, null, 2);

  // Show summary info below textarea
  const bulkCount  = txns.filter(t => t.section === 'bulk_spirits').length;
  const bottleCount= txns.filter(t => t.section === 'bottling').length;
  const caseCount  = txns.filter(t => t.section === 'case_goods').length;
  showMsg('json-msg', 'info',
    `Generated ${txns.length} transactions — ` +
    `${bulkCount} bulk spirits · ${bottleCount} bottling · ${caseCount} case goods. ` +
    `Click "Parse JSON" to map columns and import.`
  );
}

function loadPaste() {
  try {
    const raw = document.getElementById('inp-paste').value.trim();
    if (!raw) throw new Error('Nothing pasted yet');
    const delim = raw.includes('\t') ? '\t' : ',';
    const lines = raw.split('\n').filter(l => l.trim());
    const headers = lines[0].split(delim).map(h => h.trim());
    const rows = lines.slice(1).map(l => l.split(delim).map(v => v.trim()));
    pendingHeaders = headers;
    pendingRows = rows;
    pendingSource = 'paste';
    showMsg('paste-msg', 'info', `Parsed ${rows.length} rows`);
    buildMapper('paste-mapper', headers, 'paste');
  } catch(err) {
    showMsg('paste-msg', 'err', '' + err.message);
  }
}

function autoDetect(headers) {
  const mapping = {};
  const hn = headers.map(h => h.toLowerCase().replace(/[\s\-]/g, '_'));
  EDS_FIELDS.forEach(f => {
    const synonyms = AUTO_MAP[f.key] || [];
    const idx = hn.findIndex(h => synonyms.includes(h));
    mapping[f.key] = idx >= 0 ? idx : -1;
  });
  return mapping;
}

function buildMapper(containerId, headers, source) {
  const container = document.getElementById(containerId);
  const detected = autoDetect(headers);
  const opts = ['<option value="-1">— skip —</option>',
    ...headers.map((h, i) => `<option value="${i}">${h}</option>`)].join('');

  let html = `<h4>Map Your Columns to EDS Fields</h4>
  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">Auto-detected where possible — verify and adjust, then click Import.</p>
  <div class="mapper-grid">`;

  EDS_FIELDS.forEach(f => {
    const sel = detected[f.key];
    const selOpts = opts.replace(`value="${sel}"`, `value="${sel}" selected`);
    html += `
    <div class="mapper-label">${f.label}${f.required ? ' <span style="color:var(--copper)">*</span>' : ''}</div>
    <div class="mapper-arrow">→</div>
    <div><select id="map_${f.key}_${source}" style="width:100%">${selOpts}</select></div>`;
  });

  html += `</div>
  <div style="margin-top:14px;display:flex;gap:8px;">
    <button class="btn btn-primary btn-sm" onclick="applyMapping('${source}')">Import ${pendingRows.length} Rows</button>
    <button class="btn btn-ghost btn-sm" onclick="document.getElementById('${containerId}').style.display='none'">Cancel</button>
  </div>`;

  container.innerHTML = html;
  container.style.display = 'block';
}

function applyMapping(source) {
  const getIdx = key => parseInt(document.getElementById(`map_${key}_${source}`)?.value ?? -1);
  const imported = [];
  const errors = [];

  pendingRows.forEach((row, i) => {
    const get = key => { const idx = getIdx(key); return idx >= 0 ? (row[idx] || '').trim() : ''; };

    const section = normalizeSection(get('report_section'));
    const txnType = get('transaction_type').toUpperCase();
    const invNum = get('invoice_number');
    const invDate = get('invoice_date');
    const gallonsRaw = get('gallons');
    const gallons = parseFloat(gallonsRaw);
    const proof = parseFloat(get('proof')) || 0;

    if (!invNum) { errors.push(`Row ${i+2}: missing invoice number`); return; }
    if (isNaN(gallons)) { errors.push(`Row ${i+2}: invalid gallons "${gallonsRaw}"`); return; }

    imported.push({
      report_section: section || 'case_goods',
      transaction_type: txnType || 'PURCHASE',
      fl_license: get('fl_license'),
      supplier_name: get('supplier_name'),
      invoice_number: invNum,
      invoice_date: invDate,
      gallons,
      proof,
      notes: get('notes'),
    });
  });

  if (imported.length) {
    transactions.push(...imported);
    renderTransactions();
    recalcTax();
    toast(`Imported ${imported.length} transactions` + (errors.length ? ` (${errors.length} skipped)` : ''));
    document.querySelector(`#pane-${source === 'xl' ? 'excel' : source} .col-mapper`)?.style &&
      (document.querySelector(`#pane-${source === 'xl' ? 'excel' : source} .col-mapper`).style.display = 'none');
  }
  if (errors.length) {
    const msgId = source === 'xl' ? 'xl-msg' : source + '-msg';
    showMsg(msgId, 'warn', `${errors.length} row(s) skipped: ${errors.slice(0,3).join('; ')}`);
  }
}

function normalizeSection(val) {
  const v = val.toLowerCase().replace(/[\s\-_]/g, '');
  if (v.includes('bulk') || v.includes('spirit')) return 'bulk_spirits';
  if (v.includes('bottl')) return 'bottling';
  if (v.includes('case') || v.includes('good')) return 'case_goods';
  return val || 'case_goods';
}

// ── CA Import Functions ──

function loadCSVCA(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const text = e.target.result;
      const delim = text.includes('\t') ? '\t' : ',';
      const lines = text.trim().split('\n').filter(l => l.trim() && !l.startsWith('#'));
      if (lines.length < 2) throw new Error('File needs a header row + data rows');
      const headers = lines[0].split(delim).map(h => h.trim().replace(/^"|"$/g, ''));
      const rows = lines.slice(1).map(l => l.split(delim).map(v => v.trim().replace(/^"|"$/g, '')));
      pendingHeaders = headers;
      pendingRows = rows;
      pendingSource = 'ca-csv';
      showMsg('ca-csv-msg', 'info', `Loaded ${rows.length} rows with columns: ${headers.join(', ')}`);
      buildMapperCA('ca-csv-mapper', headers, 'ca-csv');
    } catch(err) {
      showMsg('ca-csv-msg', 'err', '' + err.message);
    }
  };
  reader.readAsText(file);
}

function loadExcelCA(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (data.length < 2) throw new Error('Spreadsheet needs a header row + data');
      const headers = data[0].map(h => String(h).trim());
      const rows = data.slice(1).filter(r => r.some(v => v !== '')).map(r => r.map(v => String(v).trim()));
      pendingHeaders = headers;
      pendingRows = rows;
      pendingSource = 'ca-xl';
      showMsg('ca-xl-msg', 'info', `Loaded ${rows.length} rows from "${wb.SheetNames[0]}" with ${headers.length} columns`);
      buildMapperCA('ca-xl-mapper', headers, 'ca-xl');
    } catch(err) {
      showMsg('ca-xl-msg', 'err', '' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function loadJSONCA() {
  try {
    const raw = document.getElementById('inp-ca-json').value.trim();
    let data = JSON.parse(raw);
    if (!Array.isArray(data)) data = [data];
    if (!data.length) throw new Error('JSON array is empty');
    const headers = [...new Set(data.flatMap(r => Object.keys(r)))];
    const rows = data.map(r => headers.map(h => String(r[h] ?? '')));
    pendingHeaders = headers;
    pendingRows = rows;
    pendingSource = 'ca-json';
    showMsg('ca-json-msg', 'info', `Parsed ${rows.length} records with keys: ${headers.join(', ')}`);
    buildMapperCA('ca-json-mapper', headers, 'ca-json');
  } catch(err) {
    showMsg('ca-json-msg', 'err', 'JSON parse error: ' + err.message);
  }
}

function loadPasteCA() {
  try {
    const raw = document.getElementById('inp-ca-paste').value.trim();
    if (!raw) throw new Error('Nothing pasted yet');
    const delim = raw.includes('\t') ? '\t' : ',';
    const lines = raw.split('\n').filter(l => l.trim());
    const headers = lines[0].split(delim).map(h => h.trim());
    const rows = lines.slice(1).map(l => l.split(delim).map(v => v.trim()));
    pendingHeaders = headers;
    pendingRows = rows;
    pendingSource = 'ca-paste';
    showMsg('ca-paste-msg', 'info', `Parsed ${rows.length} rows`);
    buildMapperCA('ca-paste-mapper', headers, 'ca-paste');
  } catch(err) {
    showMsg('ca-paste-msg', 'err', '' + err.message);
  }
}

function autoDetectCA(headers) {
  const mapping = {};
  const hn = headers.map(h => h.toLowerCase().replace(/[\s\-]/g, '_'));
  EDS_FIELDS_CA.forEach(f => {
    const synonyms = AUTO_MAP_CA[f.key] || [];
    const idx = hn.findIndex(h => synonyms.includes(h));
    mapping[f.key] = idx >= 0 ? idx : -1;
  });
  return mapping;
}

function buildMapperCA(containerId, headers, source) {
  const container = document.getElementById(containerId);
  const detected = autoDetectCA(headers);
  const opts = ['<option value="-1">— skip —</option>',
    ...headers.map((h, i) => `<option value="${i}">${h}</option>`)].join('');

  let html = `<h4>Map Your Columns to CDTFA-501-DS Fields</h4>
  <p style="font-size:12px;color:var(--muted);margin-bottom:12px;">Auto-detected where possible — verify and adjust, then click Import.</p>
  <div class="mapper-grid">`;

  EDS_FIELDS_CA.forEach(f => {
    const sel = detected[f.key];
    const selOpts = opts.replace(`value="${sel}"`, `value="${sel}" selected`);
    html += `
    <div class="mapper-label">${f.label}${f.required ? ' <span style="color:var(--copper)">*</span>' : ''}</div>
    <div class="mapper-arrow">→</div>
    <div><select id="map_${f.key}_${source}" style="width:100%">${selOpts}</select></div>`;
  });

  html += `</div>
  <div style="margin-top:14px;display:flex;gap:8px;">
    <button class="btn btn-primary btn-sm" onclick="applyMappingCA('${source}')">Import ${pendingRows.length} Rows</button>
    <button class="btn btn-ghost btn-sm" onclick="document.getElementById('${containerId}').style.display='none'">Cancel</button>
  </div>`;

  container.innerHTML = html;
  container.style.display = 'block';
}

function applyMappingCA(source) {
  const getIdx = key => parseInt(document.getElementById(`map_${key}_${source}`)?.value ?? -1);
  const imported = [];
  const errors = [];

  pendingRows.forEach((row, i) => {
    const get = key => { const idx = getIdx(key); return idx >= 0 ? (row[idx] || '').trim() : ''; };

    const section = normalizeCASection(get('report_section'));
    const txnType = get('transaction_type');
    const invNum = get('invoice_number');
    const invDate = get('invoice_date');
    const caLowRaw = get('ca_low');
    const caLow = parseFloat(caLowRaw) || 0;
    const caHigh = parseFloat(get('ca_high')) || 0;

    if (!invNum) { errors.push(`Row ${i+2}: missing invoice number`); return; }
    if (!caLow && !caHigh) { errors.push(`Row ${i+2}: no gallons in col A or col B`); return; }

    imported.push({
      report_section:   section || 'cdtfa_240a',
      transaction_type: txnType || '240-A',
      fl_license:       get('fl_license'),
      supplier_name:    get('supplier_name'),
      invoice_number:   invNum,
      invoice_date:     invDate,
      gallons:          caLow + caHigh,
      proof:            0,
      ca_low:           caLow,
      ca_high:          caHigh,
      notes:            get('notes'),
    });
  });

  if (imported.length) {
    transactions.push(...imported);
    renderTransactions();
    recalcTax();
    toast(`Imported ${imported.length} CA transactions` + (errors.length ? ` (${errors.length} skipped)` : ''));
    const mapperId = source + '-mapper';
    const mapper = document.getElementById(mapperId);
    if (mapper) mapper.style.display = 'none';
  }
  if (errors.length) {
    showMsg(source + '-msg', 'warn', `${errors.length} row(s) skipped: ${errors.slice(0,3).join('; ')}`);
  }
}

function normalizeCASection(val) {
  const v = val.toLowerCase().replace(/[\s\-_]/g, '');
  if (v.includes('240a')) return 'cdtfa_240a';
  if (v.includes('241a')) return 'cdtfa_241a';
  if (v.includes('242a')) return 'cdtfa_242a';
  if (v.includes('243b')) return 'cdtfa_243b';
  if (v.includes('244b')) return 'cdtfa_244b';
  return val || 'cdtfa_240a';
}
