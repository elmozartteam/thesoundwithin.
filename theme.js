/* TSW — toggle dark/light. Default: dark (Royal Navy). Disimpan di localStorage 'tsw_theme'. */
(function () {
  var KEY = 'tsw_theme', root = document.documentElement;
  function apply(t) { root.setAttribute('data-theme', t); var m = document.querySelector('meta[name=theme-color]'); if (m) m.content = t === 'light' ? '#F4F2EC' : '#263F68'; }
  var cur = 'dark'; try { cur = localStorage.getItem(KEY) || 'dark'; } catch (e) {}
  apply(cur);
  var bar = document.querySelector('.navbar'); if (!bar) return;
  var b = document.createElement('button');
  b.type = 'button'; b.className = 'theme-toggle';
  b.innerHTML = '<svg class="i-moon" viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><svg class="i-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>';
  function label() { b.setAttribute('aria-label', cur === 'dark' ? 'Ganti ke tema terang' : 'Ganti ke tema gelap'); }
  b.addEventListener('click', function () {
    cur = cur === 'dark' ? 'light' : 'dark'; apply(cur); label();
    try { localStorage.setItem(KEY, cur); } catch (e) {}
  });
  label();
  var btn = bar.querySelector('.nav-button'); btn ? btn.after(b) : bar.appendChild(b);
})();
