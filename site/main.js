import { animate, stagger } from 'animejs';

const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const animations = new Set();

function play(targets, settings) {
  if (motionPreference.matches || !targets.length) return;
  const animation = animate(targets, {
    ...settings,
    ease: 'outCubic',
    onComplete: instance => {
      animations.delete(instance);
      instance.revert();
    },
  });
  animations.add(animation);
}

play(document.querySelectorAll('.hero-copy > *, .sub-copy > *, .quote, .scene-label'), {
  opacity: [0, 1], y: [16, 0], duration: 700, delay: stagger(65),
});

motionPreference.addEventListener('change', event => {
  if (!event.matches) return;
  for (const animation of animations) animation.revert();
  animations.clear();
});

const reveal = new IntersectionObserver(entries => {
  for (const { target, isIntersecting } of entries) {
    if (!isIntersecting) continue;
    reveal.unobserve(target);
    play([target], { opacity: [0.35, 1], y: [15, 0], duration: 550 });
    play(target.querySelectorAll('.preview > div, .setup-steps li'), {
      opacity: [0.5, 1], x: [9, 0], duration: 420, delay: stagger(52, { start: 90 }),
    });
    play(target.querySelectorAll('.chart-row > i, .analytics-bars i, .progress-line, .message-progress i'), {
      scaleX: [0.55, 1], duration: 650, delay: stagger(95, { start: 160 }),
    });
  }
}, { threshold: 0.14 });

for (const element of document.querySelectorAll('.topic, .feature, .page-lead, .setup-steps, .next-page')) reveal.observe(element);

for (const button of document.querySelectorAll('.mock-add-button, .save-mock')) {
  button.removeAttribute('aria-pressed');
  const original = button.innerHTML;
  let timer;
  button.addEventListener('click', () => {
    button.textContent = button.matches('.mock-add-button') ? '✓ 已加入购物车 · 演示' : '✓ 已保存 · 演示';
    play([button], { scale: [0.95, 1], duration: 240 });
    clearTimeout(timer);
    timer = setTimeout(() => { button.innerHTML = original; }, 2200);
  });
}

const clock = document.querySelector('[data-countdown]');
if (clock) {
  const button = document.createElement('button');
  button.className = 'demo-button';
  button.type = 'button';
  button.textContent = '演示倒计时';
  clock.parentElement.append(button);
  let timer;
  let remaining = 0;
  button.addEventListener('click', () => {
    clearInterval(timer);
    remaining = 5;
    clock.textContent = '00:05';
    button.textContent = '重新演示';
    timer = setInterval(() => {
      remaining -= 1;
      clock.textContent = remaining ? `00:0${remaining}` : '优惠已结束';
      play([clock], { opacity: [0.55, 1], y: [4, 0], duration: 180 });
      if (!remaining) clearInterval(timer);
    }, 1000);
  });
}

const ticker = document.querySelector('.price-ticker');
if (ticker) {
  ticker.tabIndex = 0;
  ticker.setAttribute('aria-label', '地区价格示例，可横向滚动');
  ticker.addEventListener('scroll', () => {
    const next = Math.round(ticker.scrollLeft / ticker.firstElementChild.firstElementChild.offsetWidth);
    if (ticker.dataset.active === String(next)) return;
    ticker.dataset.active = next;
    const chip = ticker.querySelectorAll('.price-chip')[next];
    if (chip) play([chip], { opacity: [0.65, 1], duration: 320 });
  }, { passive: true });
}

async function setupScene() {
  const figure = document.querySelector('.hero-visual');
  if (!figure) return;
  const sceneName = document.body.dataset.page;
  let container = figure.querySelector('.globe');
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
    if (!context) return;
    const { mountGlobe } = await import('./globe.js');
    const createScene = !container ? (await import('./topic-scenes.js')).topicScenes[sceneName] : undefined;
    if (!container && !createScene) return;
    if (!container) {
      container = document.createElement('div');
      container.className = 'globe topic-canvas';
      container.setAttribute('aria-hidden', 'true');
      figure.append(container);
      if (!figure.querySelector('.motion-toggle')) {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'motion-toggle';
        toggle.hidden = true;
        figure.append(toggle);
      }
    }
    mountGlobe(container, motionPreference, canvas, context, createScene);
  } catch (error) {
    console.warn('3D scene unavailable', error);
  }
}

setupScene();
