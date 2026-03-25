function v(id) { return parseFloat(document.getElementById(id)?.value) || 0; }

function sv(id, val) { const el = document.getElementById(id); if (el) el.value = val.toFixed(3); }

function recalcBulk() {
  const end = v('b_begin') + v('b_recv') + v('b_distilled') - v('b_to_bottling') - v('b_to_case') - v('b_loss');
  sv('b_end', end);
  updateStats();
}

function recalcBottling() { updateStats(); }

function recalcCase() {
  const end = v('c_begin') + v('c_recv') - v('c_consumer') - v('c_dist') - v('c_tasting') - v('c_export') - v('c_loss');
  sv('c_end', end);
  updateStats();
}

function recalcTax() {
  const cfg = STATE_CONFIG[activeState];
  const tiers = cfg.taxTiers;
  const low  = v('cat_low'),  mid  = v('cat_mid'),  high = v('cat_high');
  const tl   = low  * tiers[0].rate;
  const tm   = mid  * tiers[1].rate;
  const th   = high * tiers[2].rate;
  const total = tl + tm + th;

  document.getElementById('tr-low-gal').textContent  = low.toFixed(3);
  document.getElementById('tr-mid-gal').textContent  = mid.toFixed(3);
  document.getElementById('tr-high-gal').textContent = high.toFixed(3);
  document.getElementById('tr-low-due').textContent  = '$' + tl.toFixed(2);
  document.getElementById('tr-mid-due').textContent  = '$' + tm.toFixed(2);
  document.getElementById('tr-high-due').textContent = '$' + th.toFixed(2);
  document.getElementById('tr-total').textContent    = '$' + total.toFixed(2);

  updateStats();
  return total;
}

function updateStats() {
  const cfg   = STATE_CONFIG[activeState];
  const tiers = cfg.taxTiers;
  const totalBulk = v('b_distilled') + v('b_recv');
  const totalWine = v('cat_low') + v('cat_mid') + v('cat_high');
  const tax = (v('cat_low') * tiers[0].rate) + (v('cat_mid') * tiers[1].rate) + (v('cat_high') * tiers[2].rate);

  document.getElementById('st-txns').textContent = transactions.length;
  document.getElementById('st-bulk').textContent = totalBulk.toFixed(3);
  document.getElementById('st-wine').textContent = totalWine.toFixed(3);
  document.getElementById('st-tax').textContent  = '$' + tax.toFixed(2);
}

function recalcCAStatement() {
  const g = id => parseFloat(document.getElementById(id)?.value) || 0;
  const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val.toFixed(2); };

  const l7a = g('ca_s1_l1a')+g('ca_s1_l2a')+g('ca_s1_l3a')+g('ca_s1_l4a')+g('ca_s1_l5a')+g('ca_s1_l6a');
  const l7b = g('ca_s1_l1b')+g('ca_s1_l2b')+g('ca_s1_l3b')+g('ca_s1_l4b')+g('ca_s1_l5b')+g('ca_s1_l6b');
  s('ca_s1_l7a', l7a); s('ca_s1_l7b', l7b);

  const l11a = l7a - g('ca_s1_l8a') - g('ca_s1_l9a') - g('ca_s1_l10a');
  const l11b = l7b - g('ca_s1_l8b') - g('ca_s1_l9b') - g('ca_s1_l10b');
  s('ca_s1_l11a', l11a); s('ca_s1_l11b', l11b);

  // Push Line 8 totals into the tax section placeholders as hints
  const l14a = document.getElementById('ca_t_l14a');
  const l14b = document.getElementById('ca_t_l14b');
  if (l14a) l14a.placeholder = 'Stmt I Line 8: ' + g('ca_s1_l8a').toFixed(2);
  if (l14b) l14b.placeholder = 'Stmt I Line 8: ' + g('ca_s1_l8b').toFixed(2);

  recalcCATax();
}

function recalcCATax() {
  const g = id => parseFloat(document.getElementById(id)?.value) || 0;
  const s = (id, val, dollar) => {
    const el = document.getElementById(id);
    if (el) el.textContent = dollar ? '$' + val.toFixed(2) : val.toFixed(2);
  };

  const l14a = g('ca_t_l14a'), l14b = g('ca_t_l14b');
  const l15a = g('ca_t_l15a'), l15b = g('ca_t_l15b');
  const l16a = l14a - l15a, l16b = l14b - l15b;
  s('ca_t_l16a', l16a); s('ca_t_l16b', l16b);

  const l17a = g('ca_t_l17a'), l17b = g('ca_t_l17b');
  const l18a = g('ca_t_l18a'), l18b = g('ca_t_l18b');
  const l19a = g('ca_t_l19a'), l19b = g('ca_t_l19b');
  const l20a = l17a + l18a + l19a, l20b = l17b + l18b + l19b;
  s('ca_t_l20a', l20a); s('ca_t_l20b', l20b);

  const l21a = Math.max(0, l16a - l20a), l21b = Math.max(0, l16b - l20b);
  s('ca_t_l21a', l21a); s('ca_t_l21b', l21b);

  const tax_a = l21a * 3.30, tax_b = l21b * 6.60;
  const total = tax_a + tax_b;
  s('ca_t_l23a', tax_a, true);
  s('ca_t_tax_total', total, true);

  if (activeState === 'ca') {
    const totalWine = l21a + l21b;
    document.getElementById('st-txns').textContent = transactions.length;
    document.getElementById('st-bulk').textContent = (g('ca_s1_l2a') + g('ca_s1_l2b')).toFixed(3);
    document.getElementById('st-wine').textContent = totalWine.toFixed(3);
    document.getElementById('st-tax').textContent  = '$' + total.toFixed(2);
  }
  return total;
}
