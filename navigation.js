(() => {
  const bar = document.querySelector('.site-nav');
  const button = bar.querySelector('.site-menu-toggle');
  const page = location.pathname.split('/').pop() || 'index.html';
  bar.querySelectorAll('.site-menu a').forEach(link => {
    if (link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
  });
  function close() {
    bar.classList.remove('menu-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Abrir menú');
  }
  button.addEventListener('click', () => {
    const open = bar.classList.toggle('menu-open');
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  });
  document.addEventListener('click', event => { if (!bar.contains(event.target)) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { close(); button.focus(); } });
  matchMedia('(max-width:800px)').addEventListener('change', close);
})();
