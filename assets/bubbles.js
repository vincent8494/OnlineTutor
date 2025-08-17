// Floating logo bubbles - site-wide
// Creates a fixed layer and periodically spawns semi-transparent bubbles
// that rise from bottom to top with a gentle horizontal drift.
(function(){
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return; // respect user preference

  const MAX_BUBBLES = 12;        // max bubbles present at once
  const SPAWN_INTERVAL = 1200;   // ms between spawns
  const MIN_SIZE = 36;           // px
  const MAX_SIZE = 96;           // px
  const MIN_DURATION = 12;       // seconds
  const MAX_DURATION = 24;       // seconds

  // Create or reuse bubble layer
  let layer = document.querySelector('.bubble-layer');
  if (!layer){
    layer = document.createElement('div');
    layer.className = 'bubble-layer';
    document.body.appendChild(layer);
  }

  const activeBubbles = new Set();

  function rand(min, max){
    return Math.random() * (max - min) + min;
  }

  function spawnBubble(){
    if (!layer || activeBubbles.size >= MAX_BUBBLES) return;

    const size = rand(MIN_SIZE, MAX_SIZE);
    const left = rand(-10, 100); // percent; allow offscreen slightly for variety
    const duration = rand(MIN_DURATION, MAX_DURATION);

    // gentle horizontal drift from start to end
    const driftStart = rand(-30, 30);  // px
    const driftEnd = driftStart + rand(-60, 60); // px

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${left}%`;
    bubble.style.setProperty('--drift-x', `${driftStart}px`);
    bubble.style.setProperty('--drift-x-end', `${driftEnd}px`);
    bubble.style.animation = `bubbleRise ${duration}s linear forwards`;

    const img = document.createElement('img');
    img.src = 'assets/logo.png';
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'lazy';
    bubble.appendChild(img);

    activeBubbles.add(bubble);
    layer.appendChild(bubble);

    const cleanup = () => {
      bubble.removeEventListener('animationend', cleanup);
      bubble.removeEventListener('transitionend', cleanup);
      if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
      activeBubbles.delete(bubble);
    };
    bubble.addEventListener('animationend', cleanup);
    bubble.addEventListener('transitionend', cleanup);

    // Safety cleanup in case events are missed
    setTimeout(() => cleanup(), (duration + 1) * 1000);
  }

  // Start spawning after DOM is ready
  const start = () => {
    // spawn a few initial bubbles
    for (let i = 0; i < 4; i++) {
      setTimeout(spawnBubble, i * 350);
    }
    setInterval(spawnBubble, SPAWN_INTERVAL);
  };

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
