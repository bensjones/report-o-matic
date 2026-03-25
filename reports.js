function generateAll() {
  const lic   = document.getElementById('g_licnum').value.trim();
  const biz   = document.getElementById('g_bizname').value.trim();
  const month = document.getElementById('g_month').value;
  const year  = document.getElementById('g_year').value;
  const sub   = document.getElementById('g_submitter').value.trim();

  if (!lic || !biz || !month || !year || !sub) {
    showMsg('gen-msg', 'err', 'Complete all required fields in General Information before generating.');
    return;
  }
  clearMsg('gen-msg');

  if (activeState === 'ca') {
    generateCA(lic, biz, month, year, sub);
  } else {
    generateFL(lic, biz, month, year, sub);
  }

  document.getElementById('report-preview-wrap').style.display = 'block';
  toast('Report generated!');
}

function generateFL(lic, biz, month, year, sub) {
  const taxTotal = recalcTax();
  const low = v('cat_low'), mid = v('cat_mid'), high = v('cat_high');
  const amended = document.getElementById('g_amended').value;
  const county  = document.getElementById('g_county').value;
  const addr    = document.getElementById('g_address').value;

  const bySection = { bulk_spirits: [], case_goods: [], bottling: [] };
  transactions.forEach(t => { (bySection[t.report_section] || bySection.case_goods).push(t); });

  const tHead = `<tr><th>Type</th><th>FL Lic / Name</th><th>Invoice #</th><th>Date</th><th>Gallons</th><th>Proof</th><th>Proof Gal</th></tr>`;
  const tRows = txns => txns.length
    ? txns.slice(0,12).map(t => {
        const pg = t.proof > 0 ? (t.gallons * t.proof / 100).toFixed(3) : '—';
        return `<tr>
          <td><span class="txn-type-badge" style="font-size:10px">${t.transaction_type}</span></td>
          <td>${t.fl_license || t.supplier_name || '—'}</td>
          <td class="r" style="font-family:'Space Mono',monospace">${t.invoice_number}</td>
          <td class="r">${t.invoice_date}</td>
          <td class="r">${t.gallons.toFixed(3)}</td>
          <td class="r">${t.proof || '—'}</td>
          <td class="r">${pg}</td>
        </tr>`;
      }).join('') + (txns.length > 12 ? `<tr><td colspan="7" style="text-align:center;color:#888;font-style:italic;padding:5px">… ${txns.length-12} more rows in EDS CSV export</td></tr>` : '')
    : '<tr><td colspan="7" style="text-align:center;color:#aaa;font-style:italic;padding:5px">None</td></tr>';

  document.getElementById('report-preview').innerHTML = `
    <div class="rp-header">
      <div>
        <h3>DBPR ABT 4000A-110CD — Craft Distillery Monthly Report</h3>
        <p>FLORIDA DIV. OF ALCOHOLIC BEVERAGES &amp; TOBACCO · §61A-4.009 FAC · §565.12 F.S.</p>
      </div>
      <div class="rp-stamp">
        ${amended === 'Yes' ? '<div style="background:var(--amber);color:var(--dark);padding:2px 8px;border-radius:3px;font-weight:700;font-size:11px;margin-bottom:4px;">AMENDED REPORT</div>' : ''}
        Generated: ${new Date().toLocaleDateString()}<br>For period: ${month} ${year}
      </div>
    </div>
    <div class="rp-body">
      <div class="rp-section">
        <div class="rp-section-title">General Information</div>
        <div class="rp-fields">
          <div class="rp-field"><div class="fl">License Number</div><div class="fv">${lic}</div></div>
          <div class="rp-field"><div class="fl">Business Name</div><div class="fv">${biz}</div></div>
          <div class="rp-field"><div class="fl">Reporting Period</div><div class="fv">${month} ${year}</div></div>
          <div class="rp-field"><div class="fl">County</div><div class="fv">${county || '—'}</div></div>
          <div class="rp-field"><div class="fl">Address</div><div class="fv">${addr || '—'}</div></div>
          <div class="rp-field"><div class="fl">Amended?</div><div class="fv">${amended}</div></div>
        </div>
      </div>
      <div class="rp-section">
        <div class="rp-section-title">Bulk Spirits Detail (${bySection.bulk_spirits.length} transactions)</div>
        <table class="rp-table"><thead>${tHead}</thead><tbody>${tRows(bySection.bulk_spirits)}</tbody></table>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;font-size:12px;">
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Beginning (PG)</div><div style="font-family:'Space Mono',monospace">${v('b_begin').toFixed(3)}</div></div>
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Distilled (PG)</div><div style="font-family:'Space Mono',monospace">${v('b_distilled').toFixed(3)}</div></div>
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Loss (PG)</div><div style="font-family:'Space Mono',monospace">${v('b_loss').toFixed(3)}</div></div>
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Ending (PG)</div><div style="font-family:'Space Mono',monospace;font-weight:600">${v('b_end').toFixed(3)}</div></div>
        </div>
      </div>
      <div class="rp-section">
        <div class="rp-section-title">Bottling Activity (${bySection.bottling.length} transactions)</div>
        <table class="rp-table"><thead>${tHead}</thead><tbody>${tRows(bySection.bottling)}</tbody></table>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:10px;font-size:12px;">
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Under 17.259% ABV (WG)</div><div style="font-family:'Space Mono',monospace">${low.toFixed(3)}</div></div>
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">17.259%–55.78% ABV (WG)</div><div style="font-family:'Space Mono',monospace">${mid.toFixed(3)}</div></div>
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Over 55.780% ABV (WG)</div><div style="font-family:'Space Mono',monospace">${high.toFixed(3)}</div></div>
        </div>
      </div>
      <div class="rp-section">
        <div class="rp-section-title">Case Goods Detail (${bySection.case_goods.length} transactions)</div>
        <table class="rp-table"><thead>${tHead}</thead><tbody>${tRows(bySection.case_goods)}</tbody></table>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;font-size:12px;">
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Beginning (Gal)</div><div style="font-family:'Space Mono',monospace">${v('c_begin').toFixed(3)}</div></div>
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Consumer Sales (Gal)</div><div style="font-family:'Space Mono',monospace">${v('c_consumer').toFixed(3)}</div></div>
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Dist. Sales (Gal)</div><div style="font-family:'Space Mono',monospace">${v('c_dist').toFixed(3)}</div></div>
          <div><div class="fl" style="font-size:9.5px;color:var(--muted)">Ending (Gal)</div><div style="font-family:'Space Mono',monospace;font-weight:600">${v('c_end').toFixed(3)}</div></div>
        </div>
      </div>
      <div class="rp-section">
        <div class="rp-section-title">Computation of Tax — §565.12 F.S.</div>
        <div class="rp-tax-grid">
          <div class="rp-tax-row head"><div>Category</div><div>Wine Gallons</div><div>Tax Due</div></div>
          <div class="rp-tax-row"><div>Under 17.259% ABV @ $2.25/gal</div><div>${low.toFixed(3)}</div><div>$${(low*2.25).toFixed(2)}</div></div>
          <div class="rp-tax-row"><div>17.259%–55.780% ABV @ $6.50/gal</div><div>${mid.toFixed(3)}</div><div>$${(mid*6.50).toFixed(2)}</div></div>
          <div class="rp-tax-row"><div>Over 55.780% ABV @ $9.53/gal</div><div>${high.toFixed(3)}</div><div>$${(high*9.53).toFixed(2)}</div></div>
          <div class="rp-tax-row foot"><div>TOTAL FLORIDA EXCISE TAX DUE</div><div>${(low+mid+high).toFixed(3)}</div><div>$${taxTotal.toFixed(2)}</div></div>
        </div>
      </div>
      <div class="rp-sig">
        I swear under oath or affirmation under penalty of perjury as provided in §§559.791, 562.45, and 837.06, Florida Statutes, that the foregoing information is true and correct.
        <br><br>
        <strong>Submitted By:</strong> ${sub} &nbsp;|&nbsp; <strong>Title:</strong> ${document.getElementById('g_title').value || '—'} &nbsp;|&nbsp; <strong>Date:</strong> ${document.getElementById('g_submitdate').value || '—'}
      </div>
    </div>`;

  showMsg('gen-msg', 'ok', `Report generated — ${transactions.length} transactions · Tax due: $${taxTotal.toFixed(2)}`);
}

function generateCA(lic, biz, month, year, sub) {
  const taxTotal = recalcCATax();
  const amended = document.getElementById('g_amended').value;
  const addr    = document.getElementById('g_address').value;

  const g = id => parseFloat(document.getElementById(id)?.value) || 0;
  const el = id => { const e = document.getElementById(id); return e ? e.textContent : '0.00'; };

  // Group transactions by schedule
  const schedules = { '240-A':[], '241-A':[], '242-A':[], '243-B':[], '244-B':[] };
  transactions.forEach(t => { if (schedules[t.transaction_type]) schedules[t.transaction_type].push(t); });

  const tHead240 = `<tr><th>Owner / Bottled For</th><th>Date</th><th>≤100 Proof (WG)</th><th>Over 100 Proof (WG)</th></tr>`;
  const tHead241 = `<tr><th>Purchased From</th><th>City</th><th>CDTFA Acct</th><th>Invoice #</th><th>Date Rcvd</th><th>≤100 (WG)</th><th>>100 (WG)</th></tr>`;
  const tHeadGen = `<tr><th>Party</th><th>Invoice #</th><th>Date</th><th>≤100 Proof (WG)</th><th>Over 100 Proof (WG)</th></tr>`;

  const schedRow = t => `<tr>
    <td>${t.supplier_name || '—'}</td>
    <td style="font-family:'Space Mono',monospace">${t.invoice_number}</td>
    <td style="font-family:'Space Mono',monospace">${t.invoice_date}</td>
    <td style="text-align:right;font-family:'Space Mono',monospace">${(t.ca_low||0).toFixed(2)}</td>
    <td style="text-align:right;font-family:'Space Mono',monospace">${(t.ca_high||0).toFixed(2)}</td>
  </tr>`;
  const emptyRow = cols => `<tr><td colspan="${cols}" style="text-align:center;color:#aaa;font-style:italic;padding:5px">No entries</td></tr>`;

  const stmtRow = (num, label, a, b, cls='') => `
    <div class="rp-tax-row ${cls}">
      <div style="font-family:'Space Mono',monospace;font-size:10px;color:var(--copper-dk);font-weight:700">${num}</div>
      <div>${label}</div>
      <div style="font-family:'Space Mono',monospace;text-align:right">${typeof a === 'number' ? a.toFixed(2) : a}</div>
      <div style="font-family:'Space Mono',monospace;text-align:right">${typeof b === 'number' ? b.toFixed(2) : b}</div>
    </div>`;

  // Statement I values
  const s = n => [g(`ca_s1_l${n}a`), g(`ca_s1_l${n}b`)];
  const l7a  = g('ca_s1_l1a')+g('ca_s1_l2a')+g('ca_s1_l3a')+g('ca_s1_l4a')+g('ca_s1_l5a')+g('ca_s1_l6a');
  const l7b  = g('ca_s1_l1b')+g('ca_s1_l2b')+g('ca_s1_l3b')+g('ca_s1_l4b')+g('ca_s1_l5b')+g('ca_s1_l6b');
  const l11a = l7a - g('ca_s1_l8a') - g('ca_s1_l9a') - g('ca_s1_l10a');
  const l11b = l7b - g('ca_s1_l8b') - g('ca_s1_l9b') - g('ca_s1_l10b');

  // Statement II values
  const l14a=g('ca_t_l14a'), l14b=g('ca_t_l14b');
  const l15a=g('ca_t_l15a'), l15b=g('ca_t_l15b');
  const l16a=l14a-l15a,      l16b=l14b-l15b;
  const l17a=g('ca_t_l17a'), l17b=g('ca_t_l17b');
  const l18a=g('ca_t_l18a'), l18b=g('ca_t_l18b');
  const l19a=g('ca_t_l19a'), l19b=g('ca_t_l19b');
  const l20a=l17a+l18a+l19a, l20b=l17b+l18b+l19b;
  const l21a=Math.max(0,l16a-l20a), l21b=Math.max(0,l16b-l20b);
  const taxA=l21a*3.30, taxB=l21b*6.60;

  document.getElementById('report-preview').innerHTML = `
    <div class="rp-header">
      <div>
        <h3>CDTFA-501-DS — Distilled Spirits Tax Return</h3>
        <p>CALIFORNIA DEPT. OF TAX &amp; FEE ADMINISTRATION · Revenue &amp; Taxation Code §32001 et seq.</p>
      </div>
      <div class="rp-stamp">
        ${amended === 'Yes' ? '<div style="background:var(--amber);color:var(--dark);padding:2px 8px;border-radius:3px;font-weight:700;font-size:11px;margin-bottom:4px;">AMENDED RETURN</div>' : ''}
        Generated: ${new Date().toLocaleDateString()}<br>For period: ${month} ${year}<br>
        <span style="color:var(--copper-lt)">Due: 15th of following month</span>
      </div>
    </div>
    <div class="rp-body">

      <div class="rp-section">
        <div class="rp-section-title">General Information</div>
        <div class="rp-fields">
          <div class="rp-field"><div class="fl">CDTFA Account #</div><div class="fv">${lic}</div></div>
          <div class="rp-field"><div class="fl">Business Name</div><div class="fv">${biz}</div></div>
          <div class="rp-field"><div class="fl">Reporting Period</div><div class="fv">${month} ${year}</div></div>
          <div class="rp-field"><div class="fl">License Type</div><div class="fv">ABC Type 74 (Craft Distiller) / Type 04</div></div>
          <div class="rp-field"><div class="fl">Address</div><div class="fv">${addr || '—'}</div></div>
          <div class="rp-field"><div class="fl">Amended Return?</div><div class="fv">${amended}</div></div>
        </div>
      </div>

      <div class="rp-section">
        <div class="rp-section-title">Schedule 240-A — Received from Own Bottling / Packaging Dept (${schedules['240-A'].length} entries)</div>
        <table class="rp-table"><thead>${tHead240}</thead><tbody>
          ${schedules['240-A'].length ? schedules['240-A'].map(t=>`<tr><td>${t.supplier_name||'—'}</td><td>${t.invoice_date}</td><td style="text-align:right;font-family:'Space Mono',monospace">${(t.ca_low||0).toFixed(2)}</td><td style="text-align:right;font-family:'Space Mono',monospace">${(t.ca_high||0).toFixed(2)}</td></tr>`).join('') : emptyRow(4)}
        </tbody></table>
      </div>

      <div class="rp-section">
        <div class="rp-section-title">Schedule 241-A — Purchased from CA Licensed Manufacturers / Importers / Wholesalers (${schedules['241-A'].length} entries)</div>
        <table class="rp-table"><thead>${tHeadGen}</thead><tbody>
          ${schedules['241-A'].length ? schedules['241-A'].map(schedRow).join('') : emptyRow(5)}
        </tbody></table>
      </div>

      <div class="rp-section">
        <div class="rp-section-title">Schedule 242-A — Imported into California (${schedules['242-A'].length} entries)</div>
        <table class="rp-table"><thead>${tHeadGen}</thead><tbody>
          ${schedules['242-A'].length ? schedules['242-A'].map(schedRow).join('') : emptyRow(5)}
        </tbody></table>
      </div>

      <div class="rp-section">
        <div class="rp-section-title">Schedule 243-B — Exempt Sales to CA Licensed Manufacturers / Wholesalers (${schedules['243-B'].length} entries)</div>
        <table class="rp-table"><thead>${tHeadGen}</thead><tbody>
          ${schedules['243-B'].length ? schedules['243-B'].map(schedRow).join('') : emptyRow(5)}
        </tbody></table>
      </div>

      <div class="rp-section">
        <div class="rp-section-title">Schedule 244-B — Exports / Common Carriers / Armed Forces (${schedules['244-B'].length} entries)</div>
        <table class="rp-table"><thead>${tHeadGen}</thead><tbody>
          ${schedules['244-B'].length ? schedules['244-B'].map(schedRow).join('') : emptyRow(5)}
        </tbody></table>
      </div>

      <div class="rp-section">
        <div class="rp-section-title">Statement I — Inventory Reconciliation</div>
        <div class="rp-tax-grid" style="grid-template-columns:36px 1fr 120px 120px;">
          <div class="rp-tax-row head"><div>#</div><div>Description</div><div style="text-align:right">Col A ≤100 Proof</div><div style="text-align:right">Col B >100 Proof</div></div>
          ${stmtRow(1,'Inventory, beginning of period',g('ca_s1_l1a'),g('ca_s1_l1b'))}
          ${stmtRow(2,'Received from own bottling dept (240-A)',g('ca_s1_l2a'),g('ca_s1_l2b'))}
          ${stmtRow(3,'Purchased from CA licensees (241-A)',g('ca_s1_l3a'),g('ca_s1_l3b'))}
          ${stmtRow(4,'Imported into California (242-A)',g('ca_s1_l4a'),g('ca_s1_l4b'))}
          ${stmtRow(5,'Returns from CA retailers',g('ca_s1_l5a'),g('ca_s1_l5b'))}
          ${stmtRow(6,'Other receipts',g('ca_s1_l6a'),g('ca_s1_l6b'))}
          ${stmtRow(7,'Total available (Lines 1–6)',l7a,l7b,'subtotal')}
          ${stmtRow(8,'Total sales',g('ca_s1_l8a'),g('ca_s1_l8b'))}
          ${stmtRow(9,'Losses (unaccounted-for)',g('ca_s1_l9a'),g('ca_s1_l9b'))}
          ${stmtRow(10,'Other deductions',g('ca_s1_l10a'),g('ca_s1_l10b'))}
          ${stmtRow(11,'Inventory, end of period (carry forward)',l11a,l11b,'subtotal')}
        </div>
      </div>

      <div class="rp-section">
        <div class="rp-section-title">Statement II — Tax Computation (R&amp;TC §32201)</div>
        <div class="rp-tax-grid" style="grid-template-columns:36px 1fr 120px 120px;">
          <div class="rp-tax-row head"><div>#</div><div>Description</div><div style="text-align:right">Col A ≤100 Proof</div><div style="text-align:right">Col B >100 Proof</div></div>
          ${stmtRow(14,'Total sales (from Stmt I, Line 8)',l14a,l14b)}
          ${stmtRow(15,'Less: returns from CA retailers',l15a,l15b)}
          ${stmtRow(16,'Net sales',l16a,l16b,'subtotal')}
          ${stmtRow(17,'Exempt: sales to CA licensees (243-B)',l17a,l17b)}
          ${stmtRow(18,'Exempt: exports / carriers / armed forces (244-B)',l18a,l18b)}
          ${stmtRow(19,'Other exemptions (R&TC §32053)',l19a,l19b)}
          ${stmtRow(20,'Total exempt sales (Lines 17–19)',l20a,l20b,'subtotal')}
          ${stmtRow(21,'Taxable sales (Line 16 − Line 20)',l21a,l21b,'subtotal')}
          ${stmtRow(22,'Tax rate per wine gallon','$3.30','$6.60')}
          ${stmtRow(23,`<strong>Total CA Excise Tax Due</strong>`,'$'+taxA.toFixed(2),'<strong style="color:var(--gold)">$'+taxTotal.toFixed(2)+'</strong>','foot')}
        </div>
      </div>

      <div class="rp-sig">
        I hereby certify that this return, including any accompanying schedules and statements, has been examined by me and to the best of my knowledge and belief is a true, correct, and complete return. (CDTFA-501-DS certification)
        <br><br>
        <strong>Submitted By:</strong> ${sub} &nbsp;|&nbsp; <strong>Title:</strong> ${document.getElementById('g_title').value || '—'} &nbsp;|&nbsp; <strong>Date:</strong> ${document.getElementById('g_submitdate').value || '—'}
      </div>
    </div>`;

  showMsg('gen-msg', 'ok', `Report generated — ${transactions.length} schedule entries · Total CA tax due: $${taxTotal.toFixed(2)}`);
}

function downloadEDSCSV() {
  if (activeState === 'ca') { downloadCDTFACSV(); return; }

  const lic     = document.getElementById('g_licnum').value || 'UNKNOWN';
  const month   = document.getElementById('g_month').value || '';
  const year    = document.getElementById('g_year').value || '';
  const biz     = document.getElementById('g_bizname').value || '';
  const sub     = document.getElementById('g_submitter').value || '';
  const amended = document.getElementById('g_amended').value;

  let csv = `# Florida DBPR EDS Craft Distillery Monthly Report\n`;
  csv += `# Form: DBPR ABT 4000A-110CD | §61A-4.009 FAC (effective 3/2022)\n`;
  csv += `# License: ${lic}\n# Business: ${biz}\n# Period: ${month} ${year}\n`;
  csv += `# Submitted By: ${sub}\n# Amended: ${amended}\n`;
  csv += `# Generated: ${new Date().toISOString()}\n`;
  csv += `# UPLOAD THIS FILE: DBPR EDS Portal → Upload Multiple Transactions\n#\n`;
  csv += `## TRANSACTIONS\n`;
  csv += `report_section,transaction_type,fl_license_number,supplier_purchaser_name,invoice_number,invoice_date,gallons,proof,proof_gallons,notes\n`;
  transactions.forEach(t => {
    const pg = t.proof > 0 ? (t.gallons * t.proof / 100).toFixed(3) : '';
    csv += [t.report_section, t.transaction_type, t.fl_license, `"${t.supplier_name||''}"`, t.invoice_number, t.invoice_date, t.gallons.toFixed(3), t.proof||'', pg, `"${t.notes||''}"`].join(',') + '\n';
  });
  csv += `#\n## BULK_SPIRITS_SUMMARY\nfield,value\n`;
  [['beginning_proof_gallons',v('b_begin')],['received_proof_gallons',v('b_recv')],['distilled_proof_gallons',v('b_distilled')],
   ['to_bottling_proof_gallons',v('b_to_bottling')],['to_case_proof_gallons',v('b_to_case')],
   ['loss_proof_gallons',v('b_loss')],['ending_proof_gallons',v('b_end')]].forEach(([f,n])=>csv+=`${f},${n.toFixed(3)}\n`);
  csv += `#\n## BOTTLING_SUMMARY\nfield,value\n`;
  [['beginning_proof_gallons',v('bot_begin')],['in_from_bulk_proof_gallons',v('bot_in')],['shipped_proof_gallons',v('bot_out')],
   ['under_17259_wine_gallons',v('cat_low')],['17259_55780_wine_gallons',v('cat_mid')],['over_55780_wine_gallons',v('cat_high')]].forEach(([f,n])=>csv+=`${f},${n.toFixed(3)}\n`);
  csv += `#\n## CASE_GOODS_SUMMARY\nfield,value\n`;
  [['beginning_gallons',v('c_begin')],['received_gallons',v('c_recv')],['consumer_sales_gallons',v('c_consumer')],
   ['distributor_sales_gallons',v('c_dist')],['tasting_gallons',v('c_tasting')],['export_gallons',v('c_export')],
   ['loss_gallons',v('c_loss')],['ending_gallons',v('c_end')]].forEach(([f,n])=>csv+=`${f},${n.toFixed(3)}\n`);
  const taxTotal = (v('cat_low')*2.25)+(v('cat_mid')*6.50)+(v('cat_high')*9.53);
  csv += `#\n## TAX_COMPUTATION\ncategory,wine_gallons,rate_per_gallon,tax_due\n`;
  csv += `under_17259_pct,${v('cat_low').toFixed(3)},2.25,${(v('cat_low')*2.25).toFixed(2)}\n`;
  csv += `17259_to_55780_pct,${v('cat_mid').toFixed(3)},6.50,${(v('cat_mid')*6.50).toFixed(2)}\n`;
  csv += `over_55780_pct,${v('cat_high').toFixed(3)},9.53,${(v('cat_high')*9.53).toFixed(2)}\n`;
  csv += `TOTAL_TAX_DUE,,,${taxTotal.toFixed(2)}\n`;

  dlFile(`FL_EDS_${lic.replace(/[^a-zA-Z0-9]/g,'_')}_${month}_${year}.csv`, csv, 'text/csv');
  toast('EDS CSV downloaded!');
}

function downloadCDTFACSV() {
  const lic     = document.getElementById('g_licnum').value || 'UNKNOWN';
  const month   = document.getElementById('g_month').value || '';
  const year    = document.getElementById('g_year').value || '';
  const biz     = document.getElementById('g_bizname').value || '';
  const sub     = document.getElementById('g_submitter').value || '';
  const amended = document.getElementById('g_amended').value;
  const g = id => parseFloat(document.getElementById(id)?.value) || 0;

  let csv = `# California CDTFA-501-DS Distilled Spirits Tax Return\n`;
  csv += `# CDTFA Account: ${lic}\n# Business: ${biz}\n# Period: ${month} ${year}\n`;
  csv += `# Submitted By: ${sub}\n# Amended: ${amended}\n`;
  csv += `# Generated: ${new Date().toISOString()}\n`;
  csv += `# Submit at: onlineservices.cdtfa.ca.gov — Due 15th of following month\n#\n`;

  // Schedule entries
  csv += `## SCHEDULE_ENTRIES\n`;
  csv += `schedule,party_name,cdtfa_account,invoice_number,invoice_date,gallons_100_proof_under,gallons_over_100_proof,notes\n`;
  transactions.forEach(t => {
    csv += [t.transaction_type, `"${t.supplier_name||''}"`, t.fl_license||'', t.invoice_number, t.invoice_date,
      (t.ca_low||0).toFixed(2), (t.ca_high||0).toFixed(2), `"${t.notes||''}"`].join(',') + '\n';
  });

  // Statement I
  csv += `#\n## STATEMENT_I_INVENTORY_RECONCILIATION\nline,description,col_a_100_proof_under,col_b_over_100_proof\n`;
  const l7a = g('ca_s1_l1a')+g('ca_s1_l2a')+g('ca_s1_l3a')+g('ca_s1_l4a')+g('ca_s1_l5a')+g('ca_s1_l6a');
  const l7b = g('ca_s1_l1b')+g('ca_s1_l2b')+g('ca_s1_l3b')+g('ca_s1_l4b')+g('ca_s1_l5b')+g('ca_s1_l6b');
  const l11a = l7a-g('ca_s1_l8a')-g('ca_s1_l9a')-g('ca_s1_l10a');
  const l11b = l7b-g('ca_s1_l8b')-g('ca_s1_l9b')-g('ca_s1_l10b');
  [['1','Beginning inventory',g('ca_s1_l1a'),g('ca_s1_l1b')],
   ['2','Received from own bottling (240-A)',g('ca_s1_l2a'),g('ca_s1_l2b')],
   ['3','Purchased from CA licensees (241-A)',g('ca_s1_l3a'),g('ca_s1_l3b')],
   ['4','Imported into CA (242-A)',g('ca_s1_l4a'),g('ca_s1_l4b')],
   ['5','Returns from CA retailers',g('ca_s1_l5a'),g('ca_s1_l5b')],
   ['6','Other receipts',g('ca_s1_l6a'),g('ca_s1_l6b')],
   ['7','TOTAL AVAILABLE',l7a,l7b],
   ['8','Total sales',g('ca_s1_l8a'),g('ca_s1_l8b')],
   ['9','Losses (unaccounted-for)',g('ca_s1_l9a'),g('ca_s1_l9b')],
   ['10','Other deductions',g('ca_s1_l10a'),g('ca_s1_l10b')],
   ['11','ENDING INVENTORY',l11a,l11b]
  ].forEach(([ln,desc,a,b])=>csv+=`${ln},"${desc}",${(+a).toFixed(2)},${(+b).toFixed(2)}\n`);

  // Statement II
  csv += `#\n## STATEMENT_II_TAX_COMPUTATION\nline,description,col_a_100_proof_under,col_b_over_100_proof\n`;
  const l14a=g('ca_t_l14a'),l14b=g('ca_t_l14b'),l15a=g('ca_t_l15a'),l15b=g('ca_t_l15b');
  const l16a=l14a-l15a,l16b=l14b-l15b;
  const l17a=g('ca_t_l17a'),l17b=g('ca_t_l17b'),l18a=g('ca_t_l18a'),l18b=g('ca_t_l18b');
  const l19a=g('ca_t_l19a'),l19b=g('ca_t_l19b');
  const l20a=l17a+l18a+l19a,l20b=l17b+l18b+l19b;
  const l21a=Math.max(0,l16a-l20a),l21b=Math.max(0,l16b-l20b);
  const taxA=l21a*3.30,taxB=l21b*6.60,taxTotal=taxA+taxB;
  [['14','Total sales',l14a,l14b],['15','Returns from retailers',l15a,l15b],['16','Net sales',l16a,l16b],
   ['17','Exempt - CA licensees (243-B)',l17a,l17b],['18','Exempt - exports/carriers (244-B)',l18a,l18b],
   ['19','Other exemptions',l19a,l19b],['20','Total exemptions',l20a,l20b],
   ['21','Taxable sales',l21a,l21b],['22','Tax rate','$3.30','$6.60'],
   ['23','TOTAL CA TAX DUE','$'+taxA.toFixed(2),'$'+taxTotal.toFixed(2)]
  ].forEach(([ln,desc,a,b])=>csv+=`${ln},"${desc}",${a},${b}\n`);

  dlFile(`CA_CDTFA501DS_${lic.replace(/[^a-zA-Z0-9]/g,'_')}_${month}_${year}.csv`, csv, 'text/csv');
  toast('CDTFA-501-DS CSV downloaded!');
}

function downloadSummaryCSV() {
  let csv = 'Transaction #,Section,Type,License/Name,Invoice #,Invoice Date,Gallons,Proof,Proof Gallons,Notes\n';
  transactions.forEach((t, i) => {
    const pg = t.proof > 0 ? (t.gallons * t.proof / 100).toFixed(3) : '';
    csv += [i+1, t.report_section, t.transaction_type, t.fl_license || t.supplier_name, t.invoice_number, t.invoice_date, t.gallons.toFixed(3), t.proof, pg, `"${t.notes||''}"`].join(',') + '\n';
  });
  dlFile('distillery_transactions_summary.csv', csv, 'text/csv');
  toast('Summary CSV downloaded!');
}

function downloadEDSTemplate() {
  if (activeState === 'ca') {
    const header = 'report_section,transaction_type,cdtfa_account,supplier_name,invoice_number,invoice_date,ca_low,ca_high,notes';
    const samples = [
      'cdtfa_240a,240-A,,Golden Gate Craft Distillery,OWN-2501,2025-01-31,280.00,60.00,Own bottling — vodka/gin (≤100pf) + whiskey (>100pf)',
      'cdtfa_241a,241-A,400-123456,Bay Area Spirits Wholesale,BASW-9814,2025-01-07,100.00,0,Neutral grain spirits — vodka base (≤100pf)',
      'cdtfa_241a,241-A,400-234567,Southern CA Beverage Dist.,SCBD-4401,2025-01-14,0,40.00,High-proof neutral spirits for blending (>100pf)',
      'cdtfa_242a,242-A,,Kentucky Bourbon Distillers,KBD-5501,2025-01-10,150.00,0,Imported aged bourbon — in-bond transfer',
      'cdtfa_243b,243-B,400-345678,Golden State Spirits LLC,GSS-7712,2025-01-18,60.00,0,Exempt sale to licensed wholesaler',
      'cdtfa_244b,244-B,,Pacific Rim Export LLC,PRE-0125,2025-01-29,24.00,0,Export to Japan — documented per Reg 2535',
    ];
    const csv = '# California CDTFA-501-DS Distilled Spirits Tax Return — Import Template\n# ca_low = wine gallons at 100 proof and under  |  ca_high = wine gallons over 100 proof\n# Delete these comment lines before importing\n' + header + '\n' + samples.join('\n');
    dlFile('ca_cdtfa_501ds_template.csv', csv, 'text/csv');
    toast('CDTFA-501-DS template downloaded!');
  } else {
    const header = 'report_section,transaction_type,fl_license_number,supplier_purchaser_name,invoice_number,invoice_date,gallons,proof,notes';
    const samples = [
      'bulk_spirits,DISTILLED,,,DIST-001,2025-01-15,500.000,180,New make corn whiskey',
      'bulk_spirits,PURCHASE,57-DD-001234,Florida Spirits Dist LLC,INV-5500,2025-01-03,100.000,95,NGS purchase',
      'bulk_spirits,LOSS,,,LOSS-JAN,2025-01-31,2.500,140,Barrel evaporation (angel\'s share)',
      'case_goods,SALE_DIST,57-DD-009876,Tampa Bay Wholesale,INV-D001,2025-01-20,24.500,80,Bourbon 750ml cases',
      'case_goods,SALE_CONS,,Gift Shop Walk-in,GIFT-001,2025-01-22,1.500,80,3x750ml bottles',
      'case_goods,TASTING,,Tasting Room,TASTE-JAN,2025-01-31,0.250,80,Monthly tasting samples',
      'bottling,BOTTLED,,,BOT-001,2025-01-25,200.000,80,Aged bourbon bottling run — 750ml',
    ];
    const csv = '# FL DBPR EDS Craft Distillery Upload Template (DBPR ABT 4000A-110CD)\n# Delete these comment lines before uploading to EDS\n' + header + '\n' + samples.join('\n');
    dlFile('fl_eds_craft_distillery_template.csv', csv, 'text/csv');
    toast('EDS template downloaded!');
  }
}
