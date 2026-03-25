function switchSchedule(name, el) {
  el.closest('.state-panel').querySelectorAll('.schedule-tab').forEach(t => t.classList.remove('active'));
  el.closest('.state-panel').querySelectorAll('.schedule-pane').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('sched-' + name).classList.add('active');
}

function addCASchedule(sched) {
  const msgId = 'msg-' + sched;
  let rec = {};
  let valid = true;
  const req = (id, label) => {
    const val = document.getElementById(id)?.value?.trim();
    if (!val) { showMsg(msgId, 'err', label + ' is required'); valid = false; }
    return val;
  };

  if (sched === '240a') {
    rec = { schedule:'240-A', owner:req('ca240_owner','Owner name'), date:req('ca240_date','Date'),
      street:document.getElementById('ca240_street').value, city:document.getElementById('ca240_city').value,
      low:parseFloat(document.getElementById('ca240_low').value)||0, high:parseFloat(document.getElementById('ca240_high').value)||0 };
    if (!valid) return;
    rec.description = `Own Bottling — ${rec.owner}`;
    rec.invoice_number = `240A-${rec.date}`; rec.invoice_date = rec.date;
  } else if (sched === '241a') {
    rec = { schedule:'241-A', seller:req('ca241_seller','Seller name'), city:req('ca241_city','Seller city'),
      acct:req('ca241_acct','CDTFA account'), recv_date:req('ca241_recvdate','Date received'),
      inv_num:req('ca241_invnum','Invoice number'), inv_date:req('ca241_invdate','Invoice date'),
      low:parseFloat(document.getElementById('ca241_low').value)||0, high:parseFloat(document.getElementById('ca241_high').value)||0 };
    if (!valid) return;
    rec.description = `CA Purchase — ${rec.seller}`;
    rec.invoice_number = rec.inv_num; rec.invoice_date = rec.inv_date;
  } else if (sched === '242a') {
    rec = { schedule:'242-A', shipper:req('ca242_shipper','Shipper name'), state:req('ca242_state','Shipper state'),
      carrier:req('ca242_carrier','Carrier name'), mode:document.getElementById('ca242_mode').value,
      waybill:req('ca242_waybill','Waybill number'), waybill_date:document.getElementById('ca242_waybilldate').value,
      recv_date:req('ca242_recvdate','Date received'), inv_num:req('ca242_invnum','Invoice number'),
      purch_from:document.getElementById('ca242_purchfrom').value,
      low:parseFloat(document.getElementById('ca242_low').value)||0, high:parseFloat(document.getElementById('ca242_high').value)||0 };
    if (!valid) return;
    rec.description = `Import — ${rec.shipper} (${rec.state})`;
    rec.invoice_number = rec.inv_num; rec.invoice_date = rec.waybill_date || rec.recv_date;
  } else if (sched === '243b') {
    rec = { schedule:'243-B', sold_to:req('ca243_soldto','Sold to'), city:req('ca243_city','Delivery city'),
      acct:req('ca243_acct','CDTFA account'), inv_num:req('ca243_invnum','Invoice number'),
      inv_date:req('ca243_invdate','Invoice date'), ship_date:req('ca243_shipdate','Date shipped'),
      low:parseFloat(document.getElementById('ca243_low').value)||0, high:parseFloat(document.getElementById('ca243_high').value)||0 };
    if (!valid) return;
    rec.description = `Exempt Sale (243-B) — ${rec.sold_to}`;
    rec.invoice_number = rec.inv_num; rec.invoice_date = rec.inv_date;
  } else if (sched === '244b') {
    rec = { schedule:'244-B', sold_to:req('ca244_soldto','Sold/shipped to'),
      exemption_type:document.getElementById('ca244_type').value,
      inv_num:req('ca244_invnum','Invoice number'), inv_date:req('ca244_invdate','Invoice date'),
      low:parseFloat(document.getElementById('ca244_low').value)||0, high:parseFloat(document.getElementById('ca244_high').value)||0 };
    if (!valid) return;
    rec.description = `${rec.exemption_type} — ${rec.sold_to}`;
    rec.invoice_number = rec.inv_num; rec.invoice_date = rec.inv_date;
  }

  const gallons = (rec.low||0) + (rec.high||0);
  transactions.push({
    report_section: 'cdtfa_' + sched,
    transaction_type: rec.schedule,
    fl_license: rec.acct || '',
    supplier_name: rec.seller || rec.shipper || rec.sold_to || rec.owner || '',
    invoice_number: rec.invoice_number || '',
    invoice_date: rec.invoice_date || '',
    gallons: gallons,
    proof: 0,
    notes: rec.description,
    ca_low: rec.low || 0,
    ca_high: rec.high || 0,
  });

  showMsg(msgId, 'ok', `Added ${rec.schedule} — ${gallons.toFixed(2)} wine gal`);
  renderTransactions();
  recalcCATax();
}

function addManual() {
  const section = document.getElementById('m_section').value;
  const txnType = document.getElementById('m_txntype').value;
  const invNum = document.getElementById('m_inv_num').value.trim();
  const invDate = document.getElementById('m_inv_date').value;
  const gallons = parseFloat(document.getElementById('m_gallons').value);
  const proof = parseFloat(document.getElementById('m_proof').value) || 0;
  const lic = document.getElementById('m_lic').value.trim();
  const notes = document.getElementById('m_notes').value.trim();

  if (!invNum) return showMsg('manual-msg', 'err', 'Invoice number is required');
  if (!invDate) return showMsg('manual-msg', 'err', 'Invoice date is required');
  if (isNaN(gallons) || gallons <= 0) return showMsg('manual-msg', 'err', 'Gallons must be a positive number');

  transactions.push({ report_section: section, transaction_type: txnType, fl_license: lic, supplier_name: '', invoice_number: invNum, invoice_date: invDate, gallons, proof, notes });
  showMsg('manual-msg', 'ok', `Added: ${txnType} · ${gallons} gal · ${invNum}`);
  document.getElementById('m_inv_num').value = '';
  document.getElementById('m_gallons').value = '';
  document.getElementById('m_notes').value = '';
  renderTransactions();
  recalcTax();
}

function sectionBadge(s) {
  const m = { bulk_spirits: ['bulk','badge-bulk'], bottling: ['bottle','badge-bottle'], case_goods: ['case','badge-case'] };
  const [label, cls] = m[s] || [s, 'badge-bulk'];
  return `<span class="txn-badge ${cls}">${label}</span>`;
}

function renderTransactions() {
  const tbody = document.getElementById('txn-tbody');
  document.getElementById('badge-txns').textContent = transactions.length;

  if (!transactions.length) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:30px;color:var(--muted);font-style:italic;">No transactions loaded yet</td></tr>';
    renderValidation();
    return;
  }

  tbody.innerHTML = transactions.map((t, i) => {
    const pg = t.proof > 0 ? (t.gallons * t.proof / 100).toFixed(3) : '—';
    return `<tr>
      <td style="font-family:'Space Mono',monospace;font-size:11px;color:var(--muted)">${i+1}</td>
      <td>${sectionBadge(t.report_section)}</td>
      <td><span class="txn-type-badge">${t.transaction_type}</span></td>
      <td>${t.fl_license || t.supplier_name || '<span style="color:var(--muted);font-style:italic">—</span>'}</td>
      <td style="font-family:'Space Mono',monospace;font-size:12px">${t.invoice_number}</td>
      <td style="font-family:'Space Mono',monospace;font-size:12px">${t.invoice_date}</td>
      <td class="num">${t.gallons.toFixed(3)}</td>
      <td class="num">${t.proof || '—'}</td>
      <td class="num" style="color:var(--copper-dk)">${pg}</td>
      <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;color:var(--muted);font-size:12px">${t.notes || '—'}</td>
      <td><button class="btn-del-row" onclick="deleteTxn(${i})">×</button></td>
    </tr>`;
  }).join('');

  renderValidation();
}

function deleteTxn(i) {
  transactions.splice(i, 1);
  renderTransactions();
  recalcTax();
  toast('Transaction removed');
}

function clearTransactions() {
  if (!transactions.length || confirm('Clear all transactions?')) {
    transactions = [];
    renderTransactions();
    recalcTax();
    toast('All transactions cleared');
  }
}

function renderValidation() {
  const chips = document.getElementById('val-chips');
  if (!transactions.length) { chips.innerHTML = ''; return; }

  const issues = [];
  const seen = new Set();
  transactions.forEach((t, i) => {
    if (!t.invoice_number) issues.push(`Row ${i+1}: missing invoice #`);
    if (!t.invoice_date) issues.push(`Row ${i+1}: missing date`);
    const key = t.invoice_number + '|' + t.report_section;
    if (seen.has(key)) issues.push(`Duplicate invoice "${t.invoice_number}" in ${t.report_section}`);
    seen.add(key);
  });

  const bulk = transactions.filter(t => t.report_section === 'bulk_spirits').length;
  const caseG = transactions.filter(t => t.report_section === 'case_goods').length;
  const bottling = transactions.filter(t => t.report_section === 'bottling').length;

  chips.innerHTML = [
    `<span class="val-chip val-info"> ${transactions.length} total transactions</span>`,
    bulk ? `<span class="val-chip val-ok"> ${bulk} bulk spirits</span>` : '',
    caseG ? `<span class="val-chip val-ok"> ${caseG} case goods</span>` : '',
    bottling ? `<span class="val-chip val-ok"> ${bottling} bottling</span>` : '',
    ...issues.map(e => `<span class="val-chip val-warn"> ${e}</span>`),
  ].join('');
}
