// Shared mobile navigation toggle for all pages
(function(){
  // Ensure runs after DOM is parsed if not deferred
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init(){
    // Year stamp if present
    var yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    var btn = document.querySelector('.mobile-menu');
    var nav = document.querySelector('.main-nav');
    if (!btn || !nav) return;

    // Accessibility attributes
    if (!nav.id) nav.id = 'site-nav';
    if (!btn.hasAttribute('type')) btn.setAttribute('type', 'button');
    btn.setAttribute('aria-controls', nav.id);
    btn.setAttribute('aria-expanded', 'false');
    nav.setAttribute('aria-hidden', 'true');

    var suppressCloseUntil = 0;
    var onToggle = function(e){
      e.preventDefault();
      e.stopPropagation();
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      nav.setAttribute('aria-hidden', String(!open));
      suppressCloseUntil = Date.now() + 200; // avoid immediate outside-close on touch
    };

    // Click toggle
    btn.addEventListener('click', onToggle);

    // Keyboard support
    btn.addEventListener('keydown', function(e){
      if (e.key === 'Enter' || e.key === ' ') onToggle(e);
    });

    // Click outside to close
    document.addEventListener('pointerdown', function(e){
      var open = nav.classList.contains('open');
      if (!open) return;
      if (Date.now() < suppressCloseUntil) return;
      if (!nav.contains(e.target) && e.target !== btn) {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        nav.setAttribute('aria-hidden', 'true');
      }
    }, { passive: true });

    // Close after selecting a link
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        nav.setAttribute('aria-hidden', 'true');
      });
    });
  }
})();
