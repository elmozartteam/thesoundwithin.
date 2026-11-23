/* THE SOUND WITHIN · navigasi antar level (dipakai di level-0.html, level-1.html, level-2.html, dst.)
   Cara pakai: taruh <div id="levelSwitch" data-levelnav="chips"></div> di tempat yang diinginkan
   lalu muat <script src="levelnav.js"></script> sebelum </body>.
   Level yang sudah rilis: ubah READY. Total level: ubah TOTAL. Pola nama file: level-N.html */
(function () {
  'use strict';
  var TOTAL = 5, READY = [0, 1, 2];
  var m = /level-(\d+)/i.exec(location.pathname), cur = m ? +m[1] : -1;
  var file = function (n) { return 'level-' + n + '.html'; };
  var ready = function (n) { return READY.indexOf(n) >= 0; };

  if (!document.getElementById('lvlnav-css')) {
    var st = document.createElement('style'); st.id = 'lvlnav-css';
    st.textContent = '.lvlnav{display:flex;gap:8px;flex-wrap:wrap;align-items:center;font-family:Lora,Georgia,serif}' +
      '.lvlnav a,.lvlnav .soon{font-size:14px;border:1px solid #4a5d86;border-radius:99px;padding:5px 16px;color:#F4EEDD;text-decoration:none;white-space:nowrap;background:transparent}' +
      '.lvlnav a:hover{border-color:#D8BE82}' +
      '.lvlnav a.cur{background:#D8BE82;color:#14233F;border-color:#D8BE82;font-weight:700}' +
      '.lvlnav .soon{opacity:.6;border-style:dashed;cursor:not-allowed}' +
      '.lvlnav .soon small{font-size:9px;letter-spacing:.1em;margin-left:7px;color:#D8BE82}' +
      '.lvlnav a.next,.lvlnav a.prev{border-color:#D8BE82;color:#D8BE82;font-weight:700}' +
      '.lvlnav.float{position:fixed;left:14px;bottom:14px;z-index:30;background:#14233F;padding:8px 10px;border-radius:18px;border:1px solid #3a4c74;box-shadow:0 4px 16px rgba(0,0,0,.35);max-width:calc(100vw - 90px)}';
    document.head.appendChild(st);
  }
  function chip(n) {
    return ready(n) ? '<a href="' + file(n) + '"' + (n === cur ? ' class="cur" aria-current="page"' : '') + '>Level ' + n + '</a>'
      : '<span class="soon" aria-disabled="true" title="Segera hadir">Level ' + n + '<small>SEGERA</small></span>';
  }
  function nextBtn() {
    var n = cur + 1; if (cur < 0 || n > TOTAL) return '';
    return ready(n) ? '<a class="next" href="' + file(n) + '">Lanjut ke Level ' + n + ' →</a>' : '<span class="soon">Level ' + n + ' segera hadir</span>';
  }
  function prevBtn() { return cur > 0 && ready(cur - 1) ? '<a class="prev" href="' + file(cur - 1) + '">← Level ' + (cur - 1) + '</a>' : ''; }
  function html(kind) {
    if (kind === 'pager') return prevBtn() + nextBtn();
    var s = ''; for (var i = 0; i <= TOTAL; i++) s += chip(i);
    return s + (kind === 'float' ? '' : nextBtn());
  }
  var hosts = document.querySelectorAll('[data-levelnav]');
  if (!hosts.length) { var f = document.createElement('nav'); f.setAttribute('data-levelnav', 'float'); f.setAttribute('aria-label', 'Pindah level'); f.className = 'float'; document.body.appendChild(f); hosts = [f]; }
  Array.prototype.forEach.call(hosts, function (h) {
    var kind = h.getAttribute('data-levelnav'); h.classList.add('lvlnav'); h.setAttribute('aria-label', h.getAttribute('aria-label') || 'Pindah level'); h.innerHTML = html(kind);
  });
})();
