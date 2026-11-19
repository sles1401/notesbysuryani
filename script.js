document.addEventListener('DOMContentLoaded', () => {
  const revealElements = document.querySelectorAll('.reveal');
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  // Beri jeda halus bertahap pada kartu di dalam grid agar muncul seperti lembaran yang dibuka pelan
  const staggerContainers = document.querySelectorAll(
    '.pillars-grid, .notes-grid'
  );
  staggerContainers.forEach((container) => {
    const cards = container.querySelectorAll('.reveal');
    cards.forEach((card, index) => {
      card.style.transitionDelay = `${index * 90}ms`;
    });
  });

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((el) => observer.observe(el));
});
