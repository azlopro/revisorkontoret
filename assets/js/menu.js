document.addEventListener('DOMContentLoaded', function () {
  var knap = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if (!knap || !menu) return;
  knap.addEventListener('click', function () {
    var aaben = menu.classList.toggle('open');
    knap.setAttribute('aria-expanded', aaben ? 'true' : 'false');
  });
  menu.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      menu.classList.remove('open');
      knap.setAttribute('aria-expanded', 'false');
    }
  });
});

// Kort på kontaktsiden: Google Maps indlæses først ved klik,
// så der ikke sættes cookies uden den besøgendes aktive valg.
document.addEventListener('DOMContentLoaded', function () {
  var kortKnap = document.getElementById('indlaes-kort');
  var holder = document.getElementById('kort-holder');
  if (!kortKnap || !holder) return;
  kortKnap.addEventListener('click', function () {
    var iframe = document.createElement('iframe');
    iframe.src = 'https://maps.google.com/maps?hl=da&q=S%C3%B8nderbrogade%2043%2C%208700%20Horsens&z=16&output=embed';
    iframe.title = 'Kort: Sønderbrogade 43, 8700 Horsens';
    iframe.loading = 'lazy';
    iframe.setAttribute('allowfullscreen', '');
    holder.replaceChildren(iframe);
    holder.classList.add('kort-aktiv');
  });
});
