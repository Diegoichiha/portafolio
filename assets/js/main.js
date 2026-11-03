/* ==========================================================================
   Diego Torres · Portafolio v2
   Lenis (scroll suave) + GSAP / ScrollTrigger (scrollytelling).
   - Home: tarjeta 3D que recorre la historia, proceso fijo con escena 3D,
     tarjetas de proyectos apiladas, acordeón de servicios, marquees.
   - Proyectos: filtros animados + rejilla con tilt.
   ========================================================================== */
(() => {
  'use strict';

  const root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('is-loading'); return; }

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const page = document.body.dataset.page;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ───────── Scroll suave ───────── */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop(); // se libera cuando termina el loader
    window.__lenis = lenis; // útil para depurar desde la consola
  }

  const goTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (t) => 1 - Math.pow(1 - t, 4), ...opts });
    else if (typeof target === 'number') scrollTo({ top: target, behavior: 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
  };

  /* ───────── Menú ───────── */
  const toggle = $('.pill__toggle');
  const menu = $('#menu');
  let menuOpen = false;
  const setMenu = (open) => {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.setAttribute('aria-hidden', String(!open));
    root.classList.toggle('menu-open', open);
    if (lenis) { open ? lenis.stop() : lenis.start(); } else { document.body.style.overflow = open ? 'hidden' : ''; }
    if (open && !reduce) {
      gsap.fromTo('.menu__list li', { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.2 });
    }
  };
  toggle.addEventListener('click', () => setMenu(!menuOpen));
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) setMenu(false); });

  /* Enlaces internos: scroll suave y cierre del menú */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || a.target === '_blank') return;
    if (a.hasAttribute('data-scroll-top')) { e.preventDefault(); goTo(0); return; }
    let u;
    try { u = new URL(a.href, location.href); } catch { return; }
    if (u.origin !== location.origin || u.pathname !== location.pathname) return;
    const id = u.hash.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (id && !target) return;
    e.preventDefault();
    if (menuOpen) setMenu(false);
    setTimeout(() => goTo(target || 0), menuOpen ? 350 : 0);
  });

  /* ───────── Cursor, imán y tilt ───────── */
  if (fine && !reduce) {
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12 }), dy = gsap.quickTo(dot, 'y', { duration: 0.12 });
    addEventListener('pointermove', (e) => { cur.classList.add('is-on'); rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('a,button,[data-cursor]');
      const txt = t && t.closest('[data-cursor]') ? t.closest('[data-cursor]').dataset.cursor : '';
      cur.classList.toggle('is-link', !!t);
      cur.classList.toggle('has-label', !!txt);
      label.textContent = txt || '';
    });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));

    $$('[data-magnetic]').forEach((el) => {
      const qx = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }), qy = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); qx((e.clientX - r.left - r.width / 2) * 0.3); qy((e.clientY - r.top - r.height / 2) * 0.45); });
      el.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });

    $$('[data-tilt]').forEach((el) => {
      const glare = $('.glare', el);
      gsap.set(el, { transformPerspective: 900 });
      const qrx = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' }), qry = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        qry((px - 0.5) * 14); qrx(-(py - 0.5) * 12);
        if (glare) { glare.style.setProperty('--gx', px * 100 + '%'); glare.style.setProperty('--gy', py * 100 + '%'); }
      });
      el.addEventListener('pointerleave', () => { qrx(0); qry(0); });
    });
  }

  /* ───────── Texto: partir en palabras / letras ───────── */
  const words = (el, cls, wrap) => {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', text);
    el.innerHTML = text.split(' ').map((w) => (wrap ? `<span class="w" aria-hidden="true"><span class="wi">${w}</span></span>` : `<span class="${cls}" aria-hidden="true">${w}</span>`)).join(' ');
    return $$(wrap ? '.wi' : '.' + cls, el);
  };
  const chars = (el) => {
    const text = el.textContent.trim();
    el.innerHTML = [...text].map((c) => `<span class="cm"><span class="ci">${c}</span></span>`).join('');
    return $$('.ci', el);
  };

  /* ───────── Marquees ───────── */
  $$('.marquee__track').forEach((tr) => {
    const orig = tr.innerHTML;
    const w1 = tr.scrollWidth || 600;
    const k = Math.max(1, Math.ceil((innerWidth * 1.1) / w1));
    tr.innerHTML = orig.repeat(k * 2);
    const half = tr.children.length / 2;
    [...tr.children].forEach((c, i) => { if (i >= half) c.setAttribute('aria-hidden', 'true'); });
    tr.style.animationDirection = (+tr.dataset.dir || 1) > 0 ? 'normal' : 'reverse';
  });

  /* ───────── Estados iniciales de las revelaciones ───────── */
  const heroChars = $$('[data-chars]').flatMap(chars);
  const splitHeads = $$('[data-split]').map((el) => ({ el, ws: words(el, '', true) }));
  const revealEls = $$('[data-reveal]');
  const heroIn = $$('[data-hero-in]');
  const scrubBlocks = $$('[data-scrub-words]').map((el) => ({ el, ws: words(el, 'sw', false) }));
  const counters = $$('[data-count]');

  if (!reduce) {
    gsap.set(heroChars, { yPercent: 118 });
    heroIn.forEach((el) => gsap.set(el, { opacity: 0, y: 30 }));
    splitHeads.forEach(({ ws }) => gsap.set(ws, { yPercent: 118 }));
    gsap.set(revealEls, { opacity: 0, y: 36 });
    scrubBlocks.forEach(({ ws }) => gsap.set(ws, { opacity: 0.16 }));
    counters.forEach((el) => { el.textContent = '0' + (el.dataset.suffix || ''); });
    $$('.pr .draw').forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    gsap.set($$('.pr .bar'), { scaleY: 0, transformBox: 'fill-box', transformOrigin: '50% 100%' });
  }

  /* ───────── Barra de progreso ───────── */
  const bar = $('.progress i');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; } });

  /* ───────── Revelaciones al hacer scroll ───────── */
  const initReveals = () => {
    if (reduce) return;
    splitHeads.forEach(({ el, ws }) => ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(ws, { yPercent: 0, duration: 1.1, ease: 'power4.out', stagger: 0.055 }) }));
    ScrollTrigger.batch(revealEls, { start: 'top 90%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.95, ease: 'power3.out', stagger: 0.09, overwrite: 'auto' }) });
    scrubBlocks.forEach(({ el, ws }) => gsap.to(ws, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true } }));
    counters.forEach((el) => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '', o = { v: 0 };
      ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(o, { v: end, duration: 2, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(o.v) + suf; } }) });
    });
    $$('.pr').forEach((card) => ScrollTrigger.create({
      trigger: card, start: 'top 85%', once: true,
      onEnter: () => {
        const draws = $$('.draw', card), bars = $$('.bar', card);
        if (draws.length) gsap.to(draws, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.18 });
        if (bars.length) gsap.to(bars, { scaleY: 1, duration: 1, ease: 'back.out(1.5)', stagger: 0.12, delay: 0.2 });
      },
    }));
  };

  /* ───────── Servicios: acordeón ───────── */
  $$('.svc').forEach((li) => {
    const btn = $('.svc__btn', li);
    btn.addEventListener('click', () => {
      const wasOpen = li.classList.contains('is-open');
      $$('.svc').forEach((o) => { o.classList.remove('is-open'); $('.svc__btn', o).setAttribute('aria-expanded', 'false'); });
      if (!wasOpen) { li.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
      setTimeout(() => ScrollTrigger.refresh(), 760);
    });
  });

  /* ───────── Proyectos destacados: tarjetas apiladas ───────── */
  const initStack = () => {
    if (reduce || innerWidth < 900) return;
    const cards = $$('.pcard');
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const inner = $('.pcard__inner', c);
      gsap.set(inner, { transformPerspective: 1400 });
      gsap.to(inner, { scale: 0.92, rotationX: 5, filter: 'brightness(0.42)', ease: 'none', scrollTrigger: { trigger: next, start: 'top 88%', end: 'top 16%', scrub: true } });
    });
  };

  /* ───────── Hero y tarjeta 3D ───────── */
  const initHeroScrub = () => {
    if (reduce || !$('.hero')) return;
    const t = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__word--a', { xPercent: -16, ease: 'none', scrollTrigger: t });
    gsap.to('.hero__word--b', { xPercent: 16, ease: 'none', scrollTrigger: t });
    gsap.to('.hero__foot, .hero__tag', { opacity: 0, y: -50, ease: 'none', scrollTrigger: { ...t, end: '60% top' } });
  };

  const initJourney = () => {
    const card = $('.scard'), tilt = $('.scard__tilt'), flip = $('.scard__flip'), hi = $('.scard__hi'), chips = $$('.scard__chip'), plate = $('.scard__plate');
    if (!card) return () => {};

    // el tilt sigue al cursor (afecta a todas las posiciones de la tarjeta)
    let offMove = () => {};
    if (fine) {
      const qrx = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3' }), qry = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3' });
      const move = (e) => {
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        qry(nx * 26); qrx(-ny * 20);
        plate.style.setProperty('--sx', (50 + nx * 80) + '%'); plate.style.setProperty('--sy', (20 + ny * 80) + '%');
      };
      addEventListener('pointermove', move, { passive: true });
      offMove = () => removeEventListener('pointermove', move);
    }

    const stop = (k) => { const el = $(`[data-card-stop="${k}"]`); return el ? el.getBoundingClientRect().top + scrollY : 0; };
    let tl;
    const build = () => {
      if (tl) tl.kill();
      const vw = (n) => (n * innerWidth) / 100, vh = (n) => (n * innerHeight) / 100;
      const S = {
        hero: { x: 0, y: vh(2), scale: 0.94, rz: 0, ry: 0, o: 1, flip: 0, hi: 1, orbit: 1 },
        manifesto: { x: vw(27), y: vh(2), scale: 0.66, rz: 3, ry: -14, o: 1, flip: 0, hi: 0, orbit: 0 },
        away1: { x: 0, y: -vh(46), scale: 0.07, rz: 0, ry: 0, o: 0, flip: 0, hi: 0, orbit: 0 },
        about: { x: -vw(25), y: vh(2), scale: 0.9, rz: -3, ry: 12, o: 1, flip: 180, hi: 0, orbit: 0 },
        away2: { x: 0, y: -vh(46), scale: 0.07, rz: 0, ry: 0, o: 0, flip: 180, hi: 0, orbit: 0 },
        contact: { x: vw(25), y: vh(2), scale: 0.76, rz: 3, ry: -12, o: 1, flip: 360, hi: 1, orbit: 0 },
        away3: { x: 0, y: -vh(46), scale: 0.07, rz: 0, ry: 0, o: 0, flip: 360, hi: 0, orbit: 0 },
      };
      const apply = (s) => ({ x: s.x, y: s.y, scale: s.scale, rotationZ: s.rz, opacity: s.o });
      const seg = (at, from, to, dur) => {
        tl.fromTo(card, apply(from), { ...apply(to), duration: dur, immediateRender: false }, at);
        tl.fromTo(flip, { rotationY: from.flip + from.ry }, { rotationY: to.flip + to.ry, duration: dur, immediateRender: false }, at);
        tl.fromTo(hi, { opacity: from.hi, scale: 0.4 + 0.6 * from.hi }, { opacity: to.hi, scale: 0.4 + 0.6 * to.hi, duration: dur, immediateRender: false }, at);
        tl.fromTo(chips, { opacity: from.orbit, scale: 0.5 + 0.5 * from.orbit }, { opacity: to.orbit, scale: 0.5 + 0.5 * to.orbit, duration: dur, immediateRender: false }, at);
      };
      tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
      tl.set(card, apply(S.hero), 0).set(flip, { rotationY: 0 }, 0);
      const win = (k) => { const t = stop(k); return [t - vh(92), vh(58)]; };
      const seq = [['manifesto', 'hero', 'manifesto'], ['away1', 'manifesto', 'away1'], ['about', 'away1', 'about'], ['away2', 'about', 'away2'], ['contact', 'away2', 'contact']];
      seq.forEach(([k, a, b]) => { const [at, d] = win(k); seg(Math.max(0, at), S[a], S[b], d); });
      // al llegar al pie de página la tarjeta se guarda de nuevo en la píldora (termina antes del final del scroll)
      const maxS = ScrollTrigger.maxScroll(window), end = Math.min(stop('foot') - vh(40), maxS - 4);
      seg(Math.max(0, end - vh(34)), S.contact, S.away3, vh(34));
      tl.set({}, {}, ScrollTrigger.maxScroll(window) + 10); // extiende la duración hasta el final de la página
      tl.time(scrollY, true);
    };
    const st = ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (self) => tl && tl.time(self.scroll(), true) });
    ScrollTrigger.addEventListener('refresh', build);
    build();
    return () => { ScrollTrigger.removeEventListener('refresh', build); tl && tl.kill(); st.kill(); offMove(); gsap.set([card, flip, hi, chips, tilt], { clearProps: 'all' }); };
  };

  /* ───────── Proceso: escena 3D fija ───────── */
  const initProcess = (pinned) => {
    const sec = $('.process');
    if (!sec) return () => {};
    const steps = $$('.step', sec), layers = $$('.player', sec), stack = $('.pstack', sec), fill = $('.process__progress i', sec), pin = $('.process__pin', sec);
    const setActive = (n) => { steps.forEach((s, k) => s.classList.toggle('is-active', k === n)); layers.forEach((l, k) => l.classList.toggle('is-active', k === n)); };
    if (!pinned) {
      sec.classList.add('process--static');
      steps.forEach((s) => s.classList.add('is-active'));
      layers.forEach((l) => l.classList.add('is-active'));
      return () => { sec.classList.remove('process--static'); gsap.set(stack, { clearProps: 'all' }); };
    }
    setActive(0);
    let cur = 0;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: pin, start: 'top top', end: '+=460%', pin: true, scrub: 0.6, anticipatePin: 1,
        onUpdate: (self) => {
          const t = self.progress * 10;
          const idx = t >= 9 ? 3 : Math.min(3, Math.max(0, Math.floor((t - 0.6) / 2.1)));
          if (idx !== cur) { cur = idx; setActive(idx); }
        },
      },
    });
    tl.fromTo(stack, { '--gap': '4px', '--rx': '72deg', '--rz': '-58deg', '--sc': 0.82 }, { '--gap': '96px', '--rx': '58deg', '--rz': '-38deg', '--sc': 1, duration: 1, ease: 'power2.out' }, 0)
      .to(stack, { '--rz': '-30deg', '--rx': '54deg', duration: 8 }, 1)
      .to(stack, { '--gap': '14px', '--rx': '6deg', '--rz': '0deg', '--sc': 1.05, duration: 1, ease: 'power2.inOut' }, 9)
      .fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: 10 }, 0);
    return () => { tl.scrollTrigger && tl.scrollTrigger.kill(true); tl.kill(); sec.classList.remove('process--static'); gsap.set([stack, fill], { clearProps: 'all' }); steps.forEach((s, k) => s.classList.toggle('is-active', k === 0)); layers.forEach((l) => l.classList.remove('is-active')); };
  };

  /* ───────── Página de proyectos ───────── */
  const initProjects = () => {
    const btns = $$('.filter'), items = $$('.gcard'), countEl = $('[data-visible-count]');
    if (!reduce) {
      gsap.set(items, { opacity: 0, y: 50 });
      ScrollTrigger.batch(items, { start: 'top 94%', once: true, onEnter: (b) => gsap.to(b, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.07, overwrite: 'auto' }) });
    }
    btns.forEach((b) => b.addEventListener('click', () => {
      btns.forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      const k = b.dataset.filter;
      const show = items.filter((i) => k === 'all' || i.dataset.kind === k);
      const hide = items.filter((i) => !show.includes(i));
      countEl.textContent = show.length;
      const swap = () => { hide.forEach((i) => { i.hidden = true; }); show.forEach((i) => { i.hidden = false; }); ScrollTrigger.refresh(); };
      if (reduce) { swap(); return; }
      gsap.timeline()
        .to(hide.filter((i) => !i.hidden), { opacity: 0, scale: 0.94, duration: 0.25, ease: 'power2.in' })
        .add(() => { swap(); gsap.fromTo(show, { opacity: 0, y: 34, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power3.out', stagger: 0.045, overwrite: true }); });
    }));
  };

  /* ───────── Intro (loader → hero) ───────── */
  const intro = () => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (heroChars.length) tl.to(heroChars, { yPercent: 0, duration: 1.3, stagger: 0.05 }, 0);
    tl.to(heroIn, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.3);
    if ($('.stage') && innerWidth >= 900) {
      tl.fromTo('.stage', { opacity: 0, y: 90, scale: 0.78 }, { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'expo.out' }, 0.1)
        .fromTo('.scard__chip', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(2)', stagger: 0.1, clearProps: 'scale,opacity' }, 0.9)
        .fromTo('.scard__hi', { scale: 0 }, { scale: 1, duration: 0.8, ease: 'back.out(2.4)', clearProps: 'scale' }, 1.3);
    }
    if (page === 'projects') tl.from('.gcard:nth-child(-n+3)', { y: 60, opacity: 0, duration: 1, stagger: 0.1 }, 0.7);
    return tl;
  };

  const start = () => {
    root.classList.remove('is-loading');
    if (lenis) lenis.start();
    ScrollTrigger.refresh();
  };

  const runLoader = () => {
    const loader = $('.loader');
    if (reduce || !loader) { start(); return; }
    const count = $('.loader__count b'), barL = $('.loader__bar i');
    const seen = sessionStorage.getItem('dt_seen');
    sessionStorage.setItem('dt_seen', '1');
    const o = { v: 0 };
    const tl = gsap.timeline({ onComplete: () => { loader.style.display = 'none'; } });
    tl.to(o, { v: 100, duration: seen ? 0.55 : 1.4, ease: 'power2.inOut', onUpdate: () => { count.textContent = Math.round(o.v); barL.style.transform = `scaleX(${o.v / 100})`; } })
      .to('.loader__inner', { y: -50, opacity: 0, duration: 0.45, ease: 'power2.in' })
      .to(loader, { yPercent: -100, duration: 1, ease: 'power4.inOut' }, '>-0.1')
      .add(() => { intro(); }, '-=0.7')
      .add(start, '-=0.2');
  };

  /* ───────── Arranque ───────── */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', () => {
    const offProcess = page === 'home' ? initProcess(true) : () => {};
    const offJourney = page === 'home' ? initJourney() : () => {};
    return () => { offJourney(); offProcess(); };
  });
  mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => (page === 'home' ? initProcess(false) : undefined));
  mm.add('(min-width: 900px) and (prefers-reduced-motion: reduce)', () => {
    if (page !== 'home') return;
    const st = ScrollTrigger.create({ trigger: '.hero', start: 'bottom 60%', onEnter: () => gsap.to('.stage', { opacity: 0, duration: 0.3 }), onLeaveBack: () => gsap.to('.stage', { opacity: 1, duration: 0.3 }) });
    return () => st.kill();
  });

  initReveals();
  if (page === 'home') { initHeroScrub(); initStack(); }
  if (page === 'projects') initProjects();

  addEventListener('load', () => ScrollTrigger.refresh());

  const imgReady = Promise.all($$('.scard__cutout, .hero__photo img').map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())));
  Promise.race([Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), imgReady]), new Promise((r) => setTimeout(r, 2800))]).then(runLoader);
})();
