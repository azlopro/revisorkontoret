/* ══════════════════════════════════════════════════════════════
   "Har jeg revisionspligt?" — beslutningslogik + værktøj
   Ren logik i afgoer() (testbar). DOM-koden nederst kører kun i browser.
   Reglerne følger årsregnskabsloven § 135 (regnskabsår fra 1/1-2025).
   ══════════════════════════════════════════════════════════════ */

// svar: {form, g1, g2, g3, nystiftet, loft, koncern, risiko}
//   form: 'personlig' | 'klasseB' | 'klasseCD' | 'finansiel'
//   g1/g2/g3: 'ja' | 'nej'   (overskrider grænse i de(t) relevante regnskabsår)
//   loft:     'ja' | 'nej'   (balancesum over 50 mio. kr. i to år)
//   koncern:  'ja' | 'nej'   (kapitalinteresser i andre virksomheder)
//   risiko:   'ja' | 'nej' | 'ved-ikke'  (risikobranche + omsætning over 5 mio.)
//   nystiftet: bool
// returnerer {key, verdict, flags:[...]}   verdict: 'pligt' | 'fravalg' | 'delvis' | 'ingen'
function afgoer(svar) {
  if (svar.form === 'personlig') return { key: 'personlig', verdict: 'ingen', flags: [] };
  if (svar.form === 'klasseCD')  return { key: 'klasseCD', verdict: 'pligt', flags: [] };
  if (svar.form === 'finansiel') return { key: 'finansiel', verdict: 'pligt', flags: [] };

  // Regnskabsklasse B — vurdér fravalg
  var flags = [];
  if (svar.koncern === 'ja') flags.push('koncern');
  if (svar.risiko === 'ved-ikke') flags.push('risiko-usikker');

  // 50 mio.-loftet bortfalder fravalgsretten (§135, stk. 2)
  if (svar.loft === 'ja') return { key: 'loft', verdict: 'pligt', flags: flags };

  var antal = (svar.g1 === 'ja' ? 1 : 0) + (svar.g2 === 'ja' ? 1 : 0) + (svar.g3 === 'ja' ? 1 : 0);

  if (antal >= 2) return { key: 'to-af-tre', verdict: 'pligt', flags: flags };

  // Holder sig under grænserne → kan fravælge. Men risikobranche + 5 mio. kræver erklæring (§135, stk. 5)
  if (svar.risiko === 'ja') return { key: 'risikobranche', verdict: 'delvis', flags: flags };
  return { key: 'fravalg', verdict: 'fravalg', flags: flags };
}

if (typeof module !== 'undefined' && module.exports) module.exports = { afgoer: afgoer };

/* ── DOM ─────────────────────────────────────────────────────── */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('tjekker');
    if (!root) return;

    var trin2 = root.querySelector('[data-trin="2"]');
    var trin3 = root.querySelector('[data-trin="3"]');
    var resultatBoks = document.getElementById('resultat');
    var beregnKnap = document.getElementById('beregn');
    var nulstilKnap = document.getElementById('nulstil');

    // Resultatteksterne ligger i en JSON-datablok (CSP tillader ikke inline JS)
    var TEKSTER = {};
    var teksterEl = document.getElementById('revisionspligt-tekster');
    if (teksterEl) { try { TEKSTER = JSON.parse(teksterEl.textContent); } catch (e) { return; } }

    function valgt(navn) {
      var el = root.querySelector('input[name="' + navn + '"]:checked');
      return el ? el.value : null;
    }
    function vis(el, synlig) { if (el) el.classList.toggle('skjul', !synlig); }

    // Vis/skjul størrelsestrin efter virksomhedsform
    root.querySelectorAll('input[name="form"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var erB = valgt('form') === 'klasseB';
        vis(trin2, erB);
        vis(trin3, erB);
        resultatBoks.classList.add('skjul');
      });
    });

    function fejlMarker(fieldset, fejl) {
      if (!fieldset) return;
      fieldset.classList.toggle('mangler', fejl);
    }

    function beregn() {
      var form = valgt('form');
      if (!form) { fejlMarker(root.querySelector('[data-trin="1"]'), true); return; }
      fejlMarker(root.querySelector('[data-trin="1"]'), false);

      var svar = { form: form, nystiftet: !!(root.querySelector('input[name="nystiftet"]:checked')) };

      if (form === 'klasseB') {
        svar.g1 = valgt('g1'); svar.g2 = valgt('g2'); svar.g3 = valgt('g3');
        svar.loft = valgt('loft'); svar.koncern = valgt('koncern'); svar.risiko = valgt('risiko');
        var mangler2 = !(svar.g1 && svar.g2 && svar.g3);
        var mangler3 = !(svar.loft && svar.koncern && svar.risiko);
        fejlMarker(trin2, mangler2); fejlMarker(trin3, mangler3);
        if (mangler2 || mangler3) return;
      }

      var res = afgoer(svar);
      render(res, svar);
    }

    function render(res, svar) {
      var t = TEKSTER;
      var data = t[res.key] || {};
      var html = '<div class="resultat-kort v-' + res.verdict + '">';
      html += '<p class="resultat-maerkat">' + (t.maerkat[res.verdict] || 'Resultat') + '</p>';
      html += '<h3>' + data.titel + '</h3>';
      html += '<div class="resultat-tekst">' + data.tekst + '</div>';
      if (svar.nystiftet && (res.key === 'fravalg' || res.key === 'to-af-tre' || res.key === 'risikobranche')) {
        html += '<p class="resultat-note">' + t.note.nystiftet + '</p>';
      }
      res.flags.forEach(function (f) {
        if (t.note[f]) html += '<p class="resultat-note">' + t.note[f] + '</p>';
      });
      if (data.lov) html += '<p class="resultat-lov">' + data.lov + '</p>';
      html += '<p class="resultat-forbehold">' + t.forbehold + '</p>';
      html += '<div class="resultat-cta">' +
        '<a class="btn btn-primary" href="' + t.tel + '">' + t.telTekst + '</a>' +
        '<a class="btn btn-ghost" href="' + t.mail + '">Skriv til os</a></div>';
      html += '</div>';
      resultatBoks.innerHTML = html;
      resultatBoks.classList.remove('skjul');
      vis(nulstilKnap, true);
      resultatBoks.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function nulstil() {
      root.querySelectorAll('input').forEach(function (i) { i.checked = false; });
      vis(trin2, false); vis(trin3, false);
      resultatBoks.classList.add('skjul');
      resultatBoks.innerHTML = '';
      vis(nulstilKnap, false);
      root.querySelectorAll('.mangler').forEach(function (f) { f.classList.remove('mangler'); });
      root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    beregnKnap.addEventListener('click', beregn);
    nulstilKnap.addEventListener('click', nulstil);
  });
}
