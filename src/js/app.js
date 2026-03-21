'use strict';

/* PulseGrowth · application logic
 * Depends on I18N being defined (i18n.js loaded first).
 */

const MW = {
  glc: 180.156, // g/mol
  gln: 146.145  // g/mol
};

    const APP = {
      lang: "es",
      activeTab: "kin",
      deferredInstallPrompt: null
    };

    const DOM = {
      // language
      langEs: document.getElementById("lang-es"),
      langEn: document.getElementById("lang-en"),

      // top actions
      btnClearAll: document.getElementById("btn-clear-all"),
      btnInstall: document.getElementById("install-btn"),
      btnInfo: document.getElementById("btn-info"),

      // sheet
      sheetBackdrop: document.getElementById("sheet-backdrop"),
      btnCloseSheet: document.getElementById("btn-close-sheet"),

      // tabs + panels
      panels: {
        kin: document.getElementById('panel-kin'),
        met: document.getElementById('panel-met'),
        feed: document.getElementById('panel-feed')
      },
      tiles: Array.from(document.querySelectorAll('[data-go]')),

      cards: {
        kinetics: document.getElementById("card-kinetics"),
        metabolics: document.getElementById("card-metabolics"),
        feed: document.getElementById("card-feed")
      },

      // kinetics
      dtHours: document.getElementById("dt-hours"),
      dtUnit: document.getElementById("dt-unit"),
      x0: document.getElementById("x0"),
      x1: document.getElementById("x1"),
      btnKinetics: document.getElementById("btn-kinetics"),
      resKin: document.getElementById("res-kin"),
      outMu: document.getElementById("out-mu"),
      outTd: document.getElementById("out-td"),
      outExp: document.getElementById("out-exp"),
      outIvcd: document.getElementById("out-ivcd"),
      kinMeta: document.getElementById("kin-meta"),
      kinStatusPill: document.getElementById("kin-status-pill"),

      // metabolics
      glc0: document.getElementById("glc0"),
      chipQglc: document.getElementById("chip-qglc"),
      chipQgln: document.getElementById("chip-qgln"),
      glc1m: document.getElementById("glc1m"),
      uGlc: document.getElementById("u-glc"),
      gln0: document.getElementById("gln0"),
      gln1m: document.getElementById("gln1m"),
      uGln: document.getElementById("u-gln"),
      btnMetabolics: document.getElementById("btn-metabolics"),
      resMet: document.getElementById("res-met"),
      outQglc: document.getElementById("out-qglc"),
      outQglcPg: document.getElementById("out-qglc-pg"),
      outQgln: document.getElementById("out-qgln"),
      outQglnPg: document.getElementById("out-qgln-pg"),
      metMeta: document.getElementById("met-meta"),
      metStatusPill: document.getElementById("met-status-pill"),

      // feed
      chipFeedGlc: document.getElementById("chip-feed-glc"),
      chipFeedGln: document.getElementById("chip-feed-gln"),
      uSGlc: document.getElementById("u-s-glc"),
      uSGln: document.getElementById("u-s-gln"),
      curGlc: document.getElementById("cur-glc"),
      curGln: document.getElementById("cur-gln"),
      uCurGlc: document.getElementById("u-cur-glc"),
      uCurGln: document.getElementById("u-cur-gln"),
      sGlc: document.getElementById("s-glc"),
      sGln: document.getElementById("s-gln"),
      vCult: document.getElementById("v-cult"),
      tGlc: document.getElementById("t-glc"),
      tGln: document.getElementById("t-gln"),
      feedSafety: document.getElementById("feed-safety"),
      btnFeed: document.getElementById("btn-feed"),
      btnFeedDefaults: document.getElementById("btn-feed-defaults"),
      btnFeedSync: document.getElementById("btn-feed-sync"),
      resFeed: document.getElementById("res-feed"),
      outFglc: document.getElementById("out-fglc"),
      outFgln: document.getElementById("out-fgln"),
      feedMeta: document.getElementById("feed-meta"),
      feedStatusPill: document.getElementById("feed-status-pill")
    };

    /* ---------- i18n ---------- */
    function t(key) {
      const pack = I18N[APP.lang] || I18N.es;
      return pack[key] ?? key;
    }

    function applyTranslations(lang) {
      const pack = I18N[lang] || I18N.es;

      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const key = el.getAttribute('data-i18n');
        if (pack[key]) el.innerHTML = pack[key];
      });

      document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (pack[key]) el.setAttribute('placeholder', pack[key]);
      });

      DOM.langEs.classList.toggle('active', lang === 'es');
      DOM.langEn.classList.toggle('active', lang === 'en');
      DOM.langEs.setAttribute('aria-selected', String(lang === 'es'));
      DOM.langEn.setAttribute('aria-selected', String(lang === 'en'));

      // Feed mode options
      const optExact = DOM.feedSafety.querySelector('option[value="exact"]');
      const optFloor = DOM.feedSafety.querySelector('option[value="floor"]');
      if (optExact) optExact.textContent = pack.f_exact;
      if (optFloor) optFloor.textContent = pack.f_floor;
    }

    function setLanguage(lang) {
      if (!I18N[lang]) return;
      APP.lang = lang;
      applyTranslations(lang);
      try { localStorage.setItem('pulsegrowth_lang', lang); } catch (_) {}

      // Update any visible status pills (in case language changed)
      if (DOM.resKin.classList.contains('visible')) renderKinetics();
      if (DOM.resMet.classList.contains('visible')) renderMetabolics();
      if (DOM.resFeed.classList.contains('visible')) renderFeed();
    }

    function loadSavedLanguage() {
      try {
        const saved = localStorage.getItem('pulsegrowth_lang');
        if (saved && I18N[saved]) APP.lang = saved;
      } catch (_) {}
    }

    /* ---------- Tabs ---------- */
    function setActiveTab(key) {
      if (!DOM.panels[key]) return;
      APP.activeTab = key;

      DOM.tiles.forEach((tile) => {
        const isOn = tile.dataset.go === key;
        tile.classList.toggle('active', isOn);
      });

      Object.entries(DOM.panels).forEach(([k, el]) => {
        el.classList.toggle('active', k === key);
      });

      try { localStorage.setItem('pulsegrowth_tab', key); } catch (_) {}

      // scroll to top of content for iOS feel
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function loadSavedTab() {
      try {
        const saved = localStorage.getItem('pulsegrowth_tab');
        if (saved && DOM.panels[saved]) APP.activeTab = saved;
      } catch (_) {}
    }

    /* ---------- utilities ---------- */
    function parseNum(el) {
      const v = Number.parseFloat(el.value);
      return Number.isFinite(v) ? v : NaN;
    }

    function parsePositive(el) {
      const v = parseNum(el);
      return Number.isFinite(v) && v > 0 ? v : NaN;
    }

    function toHours(value, unit) {
      if (!Number.isFinite(value)) return NaN;
      return unit === 'd' ? value * 24 : value;
    }

    function formatNumber(value, decimals = 4) {
      if (!Number.isFinite(value)) return 'ERR';
      const abs = Math.abs(value);
      if (abs >= 1000 || (abs > 0 && abs < 0.001)) return value.toExponential(3);
      return value.toFixed(decimals).replace(/\.?0+$/, '');
    }

    function setCardValidity(cardEl, isValid = true) {
      cardEl.classList.toggle('invalid', !isValid);
    }

    function showBox(boxEl, mode = 'normal') {
      boxEl.classList.add('visible');
      boxEl.classList.remove('error', 'warn');
      if (mode === 'error') boxEl.classList.add('error');
      if (mode === 'warn') boxEl.classList.add('warn');
    }

    function hideBox(boxEl) {
      boxEl.classList.remove('visible', 'error', 'warn');
    }

    function concentrationToMilliMolar(value, unitCode, mw_gmol) {
      if (!Number.isFinite(value)) return NaN;
      if (unitCode === 'mm') return value;
      if (unitCode === 'gl') return (value / mw_gmol) * 1000; // g/L -> mM
      return NaN;
    }

    function mMTo_gL(value_mM, mw_gmol) {
      if (!Number.isFinite(value_mM)) return NaN;
      return (value_mM * mw_gmol) / 1000; // mM -> g/L
    }



    function stockTo_gL(value, unitCode, mw_gmol) {
      if (!Number.isFinite(value)) return NaN;
      switch (unitCode) {
        case 'gL': return value;
        case 'gml': return value * 1000; // g/mL -> g/L
        case 'mgml': return value; // mg/mL == g/L
        case 'pct': return value * 10; // % w/v (g/100 mL) -> g/L
        case 'mM': return mMTo_gL(value, mw_gmol);
        case 'M':  return mMTo_gL(value * 1000, mw_gmol);
        default: return NaN;
      }
    }

    function stockTo_mM(value, unitCode, mw_gmol) {
      if (!Number.isFinite(value)) return NaN;
      switch (unitCode) {
        case 'mM': return value;
        case 'M':  return value * 1000;
        case 'gL': return concentrationToMilliMolar(value, 'gl', mw_gmol);
        case 'gml': return concentrationToMilliMolar(value * 1000, 'gl', mw_gmol);
        case 'mgml': return concentrationToMilliMolar(value, 'gl', mw_gmol);
        case 'pct': return concentrationToMilliMolar(value * 10, 'gl', mw_gmol);
        default: return NaN;
      }
    }

    function qFromDeltaMolarity(delta_mM, ivcd_h) {
      // q [pmol/cell/day] = (ΔC[mM] / IVCD) * 24
      return (delta_mM / ivcd_h) * 24;
    }

    function pmolToPg(pmolPerCellDay, mw_gmol) {
      // MW (g/mol) numerically equals pg/pmol
      return pmolPerCellDay * mw_gmol;
    }

    function growthStateTag(mu_h) {
      if (!Number.isFinite(mu_h)) return { text: 'μ invalid', className: 'warn' };
      if (mu_h < 0)    return { text: t('stat_warn_decline'),  className: 'warn' };
      if (mu_h === 0)  return { text: t('stat_warn_nogrowth'), className: 'warn' };
      if (mu_h < 0.015) return { text: t('stat_warn_low'),    className: 'warn' };
      return { text: t('stat_ok'), className: 'ok' };
    }

    /* ---------- kinetics ---------- */
    function getDeltaTHours() {
      const dtRaw = parsePositive(DOM.dtHours);
      const unit = DOM.dtUnit.value;
      const dt_h = toHours(dtRaw, unit);
      return Number.isFinite(dt_h) && dt_h > 0 ? dt_h : NaN;
    }

    function computeKinetics() {
      const x0 = parsePositive(DOM.x0);
      const x1 = parsePositive(DOM.x1);
      const dt_h = getDeltaTHours();

      if (!(x0 > 0 && x1 > 0 && dt_h > 0)) {
        return { ok: false, error: t('err_missing') };
      }

      const mu_h = Math.log(x1 / x0) / dt_h;
      const td_h = mu_h > 0 ? Math.log(2) / mu_h : NaN;

      // IVCD: integral exacto para crecimiento exponencial.
      // Límite cuando X0 = X1 (μ = 0): la fórmula es 0/0, pero el límite matemático es X0·Δt.
      let ivcd;
      if (x1 !== x0) {
        ivcd = ((x1 - x0) / Math.log(x1 / x0)) * dt_h;
      } else {
        ivcd = x0 * dt_h; // límite correcto: densidad constante × tiempo
      }

      return {
        ok: true,
        x0, x1, dt_h,
        mu_h,
        mu_d: mu_h * 24,
        td_h,
        td_d: Number.isFinite(td_h) ? td_h / 24 : NaN,
        expansion: x1 / x0,
        ivcd
      };
    }

    function setStatusPill(el, { text, className }) {
      if (!el) return;
      el.hidden = false;
      el.textContent = text;
      el.classList.remove('ok', 'warn');
      el.classList.add(className);
    }

    function hideStatusPill(el) {
      if (!el) return;
      el.hidden = true;
      el.textContent = '';
      el.classList.remove('ok', 'warn');
    }

    function renderKinetics() {
      const k = computeKinetics();

      if (!k.ok) {
        setCardValidity(DOM.cards.kinetics, false);
        showBox(DOM.resKin, 'error');
        hideStatusPill(DOM.kinStatusPill);

        DOM.outMu.textContent = 'ERR';
        DOM.outTd.textContent = 'ERR';
        DOM.outExp.textContent = 'ERR';
        DOM.outIvcd.textContent = 'ERR';
        DOM.kinMeta.textContent = k.error;
        return null;
      }

      setCardValidity(DOM.cards.kinetics, true);
      showBox(DOM.resKin);

      DOM.outMu.textContent = `${formatNumber(k.mu_h, 5)} h⁻¹  |  ${formatNumber(k.mu_d, 4)} d⁻¹`;
      DOM.outTd.textContent = Number.isFinite(k.td_h)
        ? `${formatNumber(k.td_h, 2)} h  |  ${formatNumber(k.td_d, 2)} d`
        : t('na_mu');
      DOM.outExp.textContent = `${formatNumber(k.expansion, 3)}x`;
      DOM.outIvcd.textContent = Number.isFinite(k.ivcd) ? formatNumber(k.ivcd, 4) : 'N/A';

      const tag = growthStateTag(k.mu_h);
      setStatusPill(DOM.kinStatusPill, tag);

      DOM.kinMeta.innerHTML = `
        <div class="tags">
          <span class="tag ${tag.className}">${tag.text}</span>
          <span class="tag">${t('meta_dt')} = ${formatNumber(k.dt_h, 2)} h</span>
          <span class="tag">${t('meta_x0')} = ${formatNumber(k.x0, 3)}</span>
          <span class="tag">${t('meta_x1')} = ${formatNumber(k.x1, 3)}</span>
        </div>
      `;

      return k;
    }

    /* ---------- metabolics ---------- */
    function computeSingleQ({ c0Input, c1Input, unitCode, mw, kinetics }) {
      if (!(Number.isFinite(c0Input) && Number.isFinite(c1Input))) return { ok: false, skipped: true };

      const c0_mM = concentrationToMilliMolar(c0Input, unitCode, mw);
      const c1_mM = concentrationToMilliMolar(c1Input, unitCode, mw);
      if (!(Number.isFinite(c0_mM) && Number.isFinite(c1_mM))) {
        return { ok: false, error: 'Unit conversion error.' };
      }
      if (c0_mM < 0 || c1_mM < 0) {
        return { ok: false, error: (APP.lang === 'es') ? 'Las concentraciones no pueden ser negativas.' : 'Concentrations cannot be negative.' };
      }

      const k = kinetics || computeKinetics();
      if (!k.ok || !(k.ivcd > 0)) {
        return { ok: false, error: t('err_ivcd') };
      }

      const delta_mM = c0_mM - c1_mM;
      const q_pmol = qFromDeltaMolarity(delta_mM, k.ivcd);
      const q_pg = pmolToPg(q_pmol, mw);

      return { ok: true, delta_mM, q_pmol, q_pg };
    }

        function renderMetabolics() {
      const doGlc = DOM.chipQglc?.getAttribute('aria-pressed') === 'true';
      const doGln = DOM.chipQgln?.getAttribute('aria-pressed') === 'true';

      if (!doGlc && !doGln) {
        setCardValidity(DOM.cards.metabolics, false);
        showBox(DOM.resMet, 'warn');
        hideStatusPill(DOM.metStatusPill);

        DOM.outQglc.textContent = '---';
        DOM.outQglcPg.textContent = '---';
        DOM.outQgln.textContent = '---';
        DOM.outQglnPg.textContent = '---';
        DOM.metMeta.textContent = (APP.lang === 'es')
          ? 'Selecciona al menos un analito (Glc o Gln).'
          : 'Select at least one analyte (Glc or Gln).';
        return;
      }

      const kin = computeKinetics();

      const glc0 = parseNum(DOM.glc0);
      const glc1 = parseNum(DOM.glc1m);
      const gln0 = parseNum(DOM.gln0);
      const gln1 = parseNum(DOM.gln1m);

      const qGlc = doGlc
        ? computeSingleQ({ c0Input: glc0, c1Input: glc1, unitCode: DOM.uGlc.value, mw: MW.glc, kinetics: kin })
        : { ok: false, skipped: true };

      const qGln = doGln
        ? computeSingleQ({ c0Input: gln0, c1Input: gln1, unitCode: DOM.uGln.value, mw: MW.gln, kinetics: kin })
        : { ok: false, skipped: true };

      const anyOk = (qGlc.ok || qGln.ok);
      const anyHardError = [qGlc, qGln].some(r => r.ok === false && !r.skipped && r.error);

      // If kinetics is missing but user provided concentrations, surface as a gentle error
      const needsKinetics = (doGlc && Number.isFinite(glc0) && Number.isFinite(glc1)) || (doGln && Number.isFinite(gln0) && Number.isFinite(gln1));
      const kinOk = kin.ok && (kin.ivcd > 0);

      if (!kinOk && needsKinetics && !anyOk) {
        setCardValidity(DOM.cards.metabolics, false);
        showBox(DOM.resMet, 'warn');
        hideStatusPill(DOM.metStatusPill);

        DOM.outQglc.textContent = '---';
        DOM.outQglcPg.textContent = '---';
        DOM.outQgln.textContent = '---';
        DOM.outQglnPg.textContent = '---';
        DOM.metMeta.textContent = t('err_ivcd');
        return;
      }

      if (!anyOk && anyHardError) {
        setCardValidity(DOM.cards.metabolics, false);
        showBox(DOM.resMet, 'error');
        hideStatusPill(DOM.metStatusPill);

        DOM.outQglc.textContent = doGlc ? 'ERR' : '---';
        DOM.outQglcPg.textContent = doGlc ? 'ERR' : '---';
        DOM.outQgln.textContent = doGln ? 'ERR' : '---';
        DOM.outQglnPg.textContent = doGln ? 'ERR' : '---';
        DOM.metMeta.textContent = (qGlc.error || qGln.error || 'Error.');
        return;
      }

      if (!anyOk) {
        setCardValidity(DOM.cards.metabolics, false);
        showBox(DOM.resMet, 'warn');
        hideStatusPill(DOM.metStatusPill);

        DOM.outQglc.textContent = '---';
        DOM.outQglcPg.textContent = '---';
        DOM.outQgln.textContent = '---';
        DOM.outQglnPg.textContent = '---';
        DOM.metMeta.textContent = (APP.lang === 'es')
          ? 'Ingresa C0→C1 para el/los analito(s) seleccionado(s).'
          : 'Enter C0→C1 for the selected analyte(s).';
        return;
      }

      setCardValidity(DOM.cards.metabolics, true);
      showBox(DOM.resMet);

      // status: mirror kinetics state
      if (kin.ok) {
        const tag = growthStateTag(kin.mu_h);
        setStatusPill(DOM.metStatusPill, tag);
      } else {
        hideStatusPill(DOM.metStatusPill);
      }

      // outputs
      if (doGlc && qGlc.ok) {
        DOM.outQglc.textContent = formatNumber(qGlc.q_pmol, 3);
        DOM.outQglcPg.textContent = formatNumber(qGlc.q_pg, 2);
      } else {
        DOM.outQglc.textContent = '---';
        DOM.outQglcPg.textContent = '---';
      }

      if (doGln && qGln.ok) {
        DOM.outQgln.textContent = formatNumber(qGln.q_pmol, 3);
        DOM.outQglnPg.textContent = formatNumber(qGln.q_pg, 2);
      } else {
        DOM.outQgln.textContent = '---';
        DOM.outQglnPg.textContent = '---';
      }

      const tags = [];
      tags.push(`<span class="tag">ΔC = C0 − C1</span>`);
      tags.push(`<span class="tag">${APP.lang === 'es' ? 'q > 0 consumo' : 'q > 0 consumption'}</span>`);
      tags.push(`<span class="tag">${APP.lang === 'es' ? 'q < 0 acumulación' : 'q < 0 accumulation'}</span>`);
      if (kinOk) tags.push(`<span class="tag">IVCD = ${formatNumber(kin.ivcd, 4)} (10⁶ cell·h/mL)</span>`);

      DOM.metMeta.innerHTML = `<div class="tags">${tags.join('')}</div>`;
    }

    /* ---------- feed ---------- */
    function computeFeedVolume({ current, target, stock, cultureVolume }) {
      if (!(Number.isFinite(current) && Number.isFinite(target) && Number.isFinite(stock) && Number.isFinite(cultureVolume))) {
        return { ok: false, error: 'Invalid feed inputs.' };
      }
      if (!(cultureVolume > 0 && stock > 0 && target >= 0)) return { ok: false, error: 'Invalid parameters.' };
      if (stock <= target) return { ok: false, error: 'Stock must be higher than target.' };

      const vfeed = ((target - current) * cultureVolume) / (stock - target);
      return { ok: true, vfeed };
    }

    function getMetabolicsC1AsFeedCurrent() {
      const glcFinalRaw = parseNum(DOM.glc1m);
      const glnFinalRaw = parseNum(DOM.gln1m);

      const currentGlc_gL = Number.isFinite(glcFinalRaw)
        ? (DOM.uGlc.value === 'gl' ? glcFinalRaw : mMTo_gL(glcFinalRaw, MW.glc))
        : NaN;

      const currentGln_mM = Number.isFinite(glnFinalRaw)
        ? (DOM.uGln.value === 'mm' ? glnFinalRaw : concentrationToMilliMolar(glnFinalRaw, 'gl', MW.gln))
        : NaN;

      return { currentGlc_gL, currentGln_mM };
    }

    function applyFeedDefaults() {
      DOM.sGlc.value = '200';
      if (DOM.uSGlc) DOM.uSGlc.value = 'gL';
      DOM.sGln.value = '200';
      if (DOM.uSGln) DOM.uSGln.value = 'mM';
      if (DOM.uCurGlc) DOM.uCurGlc.value = 'gL';
      if (DOM.uCurGln) DOM.uCurGln.value = 'mM';
      DOM.vCult.value = '30';
      DOM.tGlc.value = '5';
      DOM.tGln.value = '4';
      DOM.feedSafety.value = 'exact';
    }

    function syncFeedCurrentFromMetabolics() {
      const { currentGlc_gL, currentGln_mM } = getMetabolicsC1AsFeedCurrent();
      if (Number.isFinite(currentGlc_gL)) {
        DOM.curGlc.value = String(currentGlc_gL);
        if (DOM.uCurGlc) DOM.uCurGlc.value = 'gL';
      }
      if (Number.isFinite(currentGln_mM)) {
        DOM.curGln.value = String(currentGln_mM);
        if (DOM.uCurGln) DOM.uCurGln.value = 'mM';
      }
    }

        function renderFeed() {
      const doGlc = DOM.chipFeedGlc?.getAttribute('aria-pressed') === 'true';
      const doGln = DOM.chipFeedGln?.getAttribute('aria-pressed') === 'true';

      if (!doGlc && !doGln) {
        setCardValidity(DOM.cards.feed, false);
        showBox(DOM.resFeed, 'warn');
        hideStatusPill(DOM.feedStatusPill);

        DOM.outFglc.textContent = '---';
        DOM.outFgln.textContent = '---';
        DOM.feedMeta.textContent = (APP.lang === 'es')
          ? 'Selecciona al menos un analito (Glc o Gln).'
          : 'Select at least one analyte (Glc or Gln).';
        return;
      }

      const vol = parsePositive(DOM.vCult);
      const mode = DOM.feedSafety.value;

      const tGlc = parseNum(DOM.tGlc);
      const tGln = parseNum(DOM.tGln);

      // Stock conversions (to match target units)
      const sGlcRaw = parsePositive(DOM.sGlc);
      const sGlnRaw = parsePositive(DOM.sGln);

      const sGlc_gL = doGlc ? stockTo_gL(sGlcRaw, DOM.uSGlc.value, MW.glc) : NaN; // used with g/L targets
      const sGln_mM = doGln ? stockTo_mM(sGlnRaw, DOM.uSGln.value, MW.gln) : NaN; // used with mM targets

      // Current values with unit conversion
      const curGlcRaw = parseNum(DOM.curGlc);
      const uCurGlc = DOM.uCurGlc?.value || 'gL';
      let currentGlc_gL = Number.isFinite(curGlcRaw)
        ? (uCurGlc === 'gL' ? curGlcRaw : mMTo_gL(curGlcRaw, MW.glc))
        : NaN;

      const curGlnRaw = parseNum(DOM.curGln);
      const uCurGln = DOM.uCurGln?.value || 'mM';
      let currentGln_mM = Number.isFinite(curGlnRaw)
        ? (uCurGln === 'mM' ? curGlnRaw : concentrationToMilliMolar(curGlnRaw, 'gl', MW.gln))
        : NaN;
      let usedFromMet = false;

      if ((doGlc && !Number.isFinite(currentGlc_gL)) || (doGln && !Number.isFinite(currentGln_mM))) {
        const met = getMetabolicsC1AsFeedCurrent();
        if (doGlc && !Number.isFinite(currentGlc_gL) && Number.isFinite(met.currentGlc_gL)) {
          currentGlc_gL = met.currentGlc_gL;
          usedFromMet = true;
        }
        if (doGln && !Number.isFinite(currentGln_mM) && Number.isFinite(met.currentGln_mM)) {
          currentGln_mM = met.currentGln_mM;
          usedFromMet = true;
        }
      }

      function computeOne({ enabled, current, target, stock, unit }) {
        if (!enabled) return { ok: false, skipped: true };

        // Missing inputs -> skip (warn), not a hard error
        if (!(Number.isFinite(vol) && vol > 0)) return { ok: false, skipped: true, need: 'vol' };
        if (!Number.isFinite(current)) return { ok: false, skipped: true, need: 'current' };
        if (!Number.isFinite(target)) return { ok: false, skipped: true, need: 'target' };
        if (!(Number.isFinite(stock) && stock > 0)) return { ok: false, skipped: true, need: 'stock' };

        const r = computeFeedVolume({ current, target, stock, cultureVolume: vol });
        if (!r.ok) return { ok: false, error: r.error };

        let v = r.vfeed;
        if (mode === 'floor' && v < 0) v = 0;
        return { ok: true, vfeed: v, unit };
      }

      const glcFeed = computeOne({
        enabled: doGlc,
        current: currentGlc_gL,
        target: tGlc,
        stock: sGlc_gL,
        unit: 'mL'
      });

      const glnFeed = computeOne({
        enabled: doGln,
        current: currentGln_mM,
        target: tGln,
        stock: sGln_mM,
        unit: 'mL'
      });

      const anyOk = glcFeed.ok || glnFeed.ok;
      const anyHardError = [glcFeed, glnFeed].some(r => r.ok === false && !r.skipped && r.error);

      if (!anyOk && anyHardError) {
        setCardValidity(DOM.cards.feed, false);
        showBox(DOM.resFeed, 'error');
        hideStatusPill(DOM.feedStatusPill);

        DOM.outFglc.textContent = doGlc ? 'ERR' : '---';
        DOM.outFgln.textContent = doGln ? 'ERR' : '---';

        const msg = (glcFeed.error || glnFeed.error || 'Error.');
        DOM.feedMeta.textContent = msg;
        return;
      }

      if (!anyOk) {
        setCardValidity(DOM.cards.feed, false);
        showBox(DOM.resFeed, 'warn');
        hideStatusPill(DOM.feedStatusPill);

        DOM.outFglc.textContent = '---';
        DOM.outFgln.textContent = '---';

        const needs = [];
        const addNeeds = (r, label) => { if (r.need) needs.push(`${label}: ${r.need}`); };
        addNeeds(glcFeed, 'Glc');
        addNeeds(glnFeed, 'Gln');

        DOM.feedMeta.textContent = (APP.lang === 'es')
          ? 'Completa los campos requeridos (current, target, stock, volumen).'
          : 'Fill required fields (current, target, stock, volume).';
        return;
      }

      // Normal render
      setCardValidity(DOM.cards.feed, true);
      showBox(DOM.resFeed);

      DOM.outFglc.textContent = (doGlc && glcFeed.ok) ? formatNumber(glcFeed.vfeed, 4) : '---';
      DOM.outFgln.textContent = (doGln && glnFeed.ok) ? formatNumber(glnFeed.vfeed, 4) : '---';

      // status pill: show mode
      setStatusPill(DOM.feedStatusPill, { text: (mode === 'floor') ? (APP.lang === 'es' ? 'No negativo' : 'Non-negative') : (APP.lang === 'es' ? 'Exacto' : 'Exact'), className: 'ok' });

      const notes = [];
      if (doGlc && Number.isFinite(currentGlc_gL)) notes.push(`Glc current = ${formatNumber(currentGlc_gL, 3)} g/L`);
      if (doGln && Number.isFinite(currentGln_mM)) notes.push(`Gln current = ${formatNumber(currentGln_mM, 3)} mM`);
      if (doGlc && Number.isFinite(sGlc_gL)) notes.push(`Glc stock = ${formatNumber(sGlc_gL, 3)} g/L`);
      if (doGln && Number.isFinite(sGln_mM)) notes.push(`Gln stock = ${formatNumber(sGln_mM, 3)} mM`);
      if (usedFromMet) notes.push(t('feed_used_from_met'));

      const modeText = (mode === 'floor') ? t('feed_mode_floor') : t('feed_mode_exact');

      DOM.feedMeta.innerHTML = `
        <div class="tags">
          ${notes.map(n => `<span class="tag">${n}</span>`).join('')}
        </div>
        <div class="meta" style="margin-top:10px;">${modeText}</div>
      `;
    }

    /* ---------- Clear all ---------- */
    function clearAll() {
      // kinetics
      DOM.dtHours.value = '';
      DOM.dtUnit.value = 'h';
      DOM.x0.value = '';
      DOM.x1.value = '';

      // metabolics — reset chips to active
      [DOM.chipQglc, DOM.chipQgln].forEach(c => { if (c) c.setAttribute('aria-pressed', 'true'); });
      DOM.glc0.value = '';
      DOM.glc1m.value = '';
      DOM.uGlc.value = 'gl';
      DOM.gln0.value = '';
      DOM.gln1m.value = '';
      DOM.uGln.value = 'mm';

      // feed — reset chips to active
      [DOM.chipFeedGlc, DOM.chipFeedGln].forEach(c => { if (c) c.setAttribute('aria-pressed', 'true'); });
      if (DOM.uSGlc) DOM.uSGlc.value = 'gL';
      if (DOM.uSGln) DOM.uSGln.value = 'mM';
      if (DOM.uCurGlc) DOM.uCurGlc.value = 'gL';
      if (DOM.uCurGln) DOM.uCurGln.value = 'mM';
      DOM.curGlc.value = '';
      DOM.curGln.value = '';
      DOM.sGlc.value = '';
      DOM.sGln.value = '';
      DOM.vCult.value = '';
      DOM.tGlc.value = '';
      DOM.tGln.value = '';
      DOM.feedSafety.value = 'exact';

      // Hide results + reset visuals
      hideBox(DOM.resKin);
      hideBox(DOM.resMet);
      hideBox(DOM.resFeed);
      setCardValidity(DOM.cards.kinetics, true);
      setCardValidity(DOM.cards.metabolics, true);
      setCardValidity(DOM.cards.feed, true);

      // Reset outputs
      DOM.outMu.textContent = '---';
      DOM.outTd.textContent = '---';
      DOM.outExp.textContent = '---';
      DOM.outIvcd.textContent = '---';
      DOM.kinMeta.textContent = '';
      hideStatusPill(DOM.kinStatusPill);

      DOM.outQglc.textContent = '---';
      DOM.outQglcPg.textContent = '---';
      DOM.outQgln.textContent = '---';
      DOM.outQglnPg.textContent = '---';
      DOM.metMeta.textContent = '';
      hideStatusPill(DOM.metStatusPill);

      DOM.outFglc.textContent = '---';
      DOM.outFgln.textContent = '---';
      DOM.feedMeta.textContent = '';
      hideStatusPill(DOM.feedStatusPill);
    }

    /* ---------- Info sheet ---------- */
    function openSheet() {
      DOM.sheetBackdrop.classList.add('open');
      DOM.sheetBackdrop.setAttribute('aria-hidden', 'false');
    }

    function closeSheet() {
      DOM.sheetBackdrop.classList.remove('open');
      DOM.sheetBackdrop.setAttribute('aria-hidden', 'true');
    }

    /* ---------- PWA install + SW ---------- */
    function setupInstallPrompt() {
      window.addEventListener('beforeinstallprompt', (event) => {
        event.preventDefault();
        APP.deferredInstallPrompt = event;
        DOM.btnInstall.hidden = false;
      });

      DOM.btnInstall.addEventListener('click', async () => {
        if (!APP.deferredInstallPrompt) return;
        APP.deferredInstallPrompt.prompt();
        APP.deferredInstallPrompt = null;
        DOM.btnInstall.hidden = true;
      });

      window.addEventListener('appinstalled', () => {
        DOM.btnInstall.hidden = true;
      });
    }

    function registerServiceWorker() {
      if (!('serviceWorker' in navigator)) return;
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch((error) => {
          console.warn('Service worker registration failed:', error);
        });
      });
    }

    /* ---------- events ---------- */
    function bindEvents() {
      // language
      DOM.langEs.addEventListener('click', () => setLanguage('es'));
      DOM.langEn.addEventListener('click', () => setLanguage('en'));

      // tabs
      DOM.tiles.forEach((tile) => tile.addEventListener('click', () => setActiveTab(tile.dataset.go)));

      // calculators
      DOM.btnKinetics.addEventListener('click', renderKinetics);
      DOM.btnMetabolics.addEventListener('click', renderMetabolics);
      DOM.btnFeed.addEventListener('click', renderFeed);

      // feed helpers
      DOM.btnFeedDefaults.addEventListener('click', () => {
        applyFeedDefaults();
        // keep current values untouched
      });

      DOM.btnFeedSync.addEventListener('click', () => {
        syncFeedCurrentFromMetabolics();
      });

      // clear
      DOM.btnClearAll.addEventListener('click', clearAll);

      // info
      DOM.btnInfo.addEventListener('click', openSheet);
      DOM.btnCloseSheet.addEventListener('click', closeSheet);
      DOM.sheetBackdrop.addEventListener('click', (e) => {
        if (e.target === DOM.sheetBackdrop) closeSheet();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && DOM.sheetBackdrop.classList.contains('open')) closeSheet();
      });

      // Enter key triggers the action for the active panel
      document.querySelectorAll('input, select').forEach((el) => {
        el.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter') return;
          event.preventDefault();

          const panel = el.closest('.panel');
          if (!panel) return;

          if (panel.id === 'panel-kin') renderKinetics();
          else if (panel.id === 'panel-met') renderMetabolics();
          else if (panel.id === 'panel-feed') renderFeed();
        });

        // soft reset invalid state while typing
        el.addEventListener('input', () => {
          const card = el.closest('.card');
          if (card) setCardValidity(card, true);
        });
      });

      // Optional: auto-refresh results if already visible (feels more "app-like")
      const debounce = (fn, ms = 150) => {
        let t;
        return (...args) => {
          clearTimeout(t);
          t = setTimeout(() => fn(...args), ms);
        };
      };

      const autoKin = debounce(() => {
        if (DOM.resKin.classList.contains('visible')) renderKinetics();
        if (DOM.resMet.classList.contains('visible')) renderMetabolics();
      }, 180);
      const autoMet = debounce(() => { if (DOM.resMet.classList.contains('visible')) renderMetabolics(); }, 180);
      const autoFeed = debounce(() => { if (DOM.resFeed.classList.contains('visible')) renderFeed(); }, 180);

      // Kinetics inputs
      [DOM.dtHours, DOM.dtUnit, DOM.x0, DOM.x1].forEach((el) => el.addEventListener('input', autoKin));
      // Metabolics inputs
      [DOM.glc0, DOM.glc1m, DOM.uGlc, DOM.gln0, DOM.gln1m, DOM.uGln].forEach((el) => el && el.addEventListener('input', autoMet));
      // Metabolics chips
      [DOM.chipQglc, DOM.chipQgln].forEach((chip) => chip && chip.addEventListener('click', () => {
        const pressed = chip.getAttribute('aria-pressed') !== 'true';
        chip.setAttribute('aria-pressed', String(pressed));
        autoMet();
      }));
      // Feed inputs
      [DOM.curGlc, DOM.uCurGlc, DOM.curGln, DOM.uCurGln, DOM.sGlc, DOM.uSGlc, DOM.sGln, DOM.uSGln, DOM.vCult, DOM.tGlc, DOM.tGln, DOM.feedSafety].forEach((el) => el && el.addEventListener('input', autoFeed));
      // Feed chips
      [DOM.chipFeedGlc, DOM.chipFeedGln].forEach((chip) => chip && chip.addEventListener('click', () => {
        const pressed = chip.getAttribute('aria-pressed') !== 'true';
        chip.setAttribute('aria-pressed', String(pressed));
        autoFeed();
      }));
    }

    function setupiOSInstallBanner() {
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      const isStandalone = window.navigator.standalone === true;
      const dismissed = (() => { try { return localStorage.getItem('pg_ios_banner'); } catch(_){} return null; })();
      if (!isIOS || isStandalone || dismissed) return;

      const banner = document.getElementById('ios-install-banner');
      if (banner) banner.classList.add('visible');

      document.getElementById('btn-ios-dismiss')?.addEventListener('click', () => {
        banner?.classList.remove('visible');
        try { localStorage.setItem('pg_ios_banner', '1'); } catch(_) {}
      });
    }

    function init() {
      loadSavedLanguage();
      applyTranslations(APP.lang);
      bindEvents();
      setupInstallPrompt();
      setupiOSInstallBanner();
      registerServiceWorker();

      // Start clean
      clearAll();
      setActiveTab('kin');
    }

    init();
