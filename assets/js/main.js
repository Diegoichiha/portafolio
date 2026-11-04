/* ==========================================================================
   Diego Torres · Portafolio v2
   Lenis (scroll suave) + GSAP / ScrollTrigger (scrollytelling).
   - Home: tarjeta 3D que recorre la historia, proceso fijo con escena 3D,
     tarjetas de proyectos apiladas, acordeón de servicios, marquees.
   - Proyectos: filtros animados + rejilla con tilt.
   ========================================================================== */
/* Botón flotante de WhatsApp: aparece al pasar el banner principal.
   Va aparte del resto para que funcione aunque GSAP no cargue. */
(() => {
  const wa = document.querySelector('.wa');
  if (!wa) return;
  const hero = document.querySelector('.hero');
  let limit = 360;
  let on = false;
  const measure = () => {
    // Home: cuando el banner ya pasó el 60 % de la pantalla. Otras páginas: tras un primer scroll.
    limit = hero ? Math.max(0, hero.getBoundingClientRect().bottom + scrollY - innerHeight * 0.6) : 360;
  };
  const update = () => {
    const next = scrollY > limit;
    if (next === on) return;
    on = next;
    wa.classList.toggle('is-on', on);
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', () => { measure(); update(); });
  addEventListener('load', () => { measure(); update(); });
  measure();
  update();
})();

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
  let menuAnim = null;
  const setMenu = (open) => {
    menuOpen = open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.setAttribute('aria-hidden', String(!open));
    root.classList.toggle('menu-open', open);
    if (lenis) { open ? lenis.stop() : lenis.start(); } else { document.body.style.overflow = open ? 'hidden' : ''; }
    if (!reduce) {
      if (open) menuAnim = gsap.fromTo('.menu__list li', { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.06, delay: 0.2, overwrite: true });
      else if (menuAnim) menuAnim.timeScale(1.8).reverse(); // al cerrar, la misma animación al revés
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
  // Parte el texto en palabras conservando el marcado interno (<em>, <br>) para el efecto de "escritura" con scroll
  const scrubWords = (el) => {
    el.setAttribute('aria-label', el.textContent.trim().replace(/\s+/g, ' '));
    const out = [];
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'sw'; w.setAttribute('aria-hidden', 'true'); w.textContent = part;
            frag.appendChild(w); out.push(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    };
    walk(el);
    return out;
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
    const k = Math.max(1, Math.ceil((Math.max(innerWidth, screen.width || 0) * 1.1) / w1));
    tr.innerHTML = orig.repeat(k * 2);
    const half = tr.children.length / 2;
    [...tr.children].forEach((c, i) => { if (i >= half) c.setAttribute('aria-hidden', 'true'); });
    tr.style.animationDirection = (+tr.dataset.dir || 1) > 0 ? 'normal' : 'reverse';
  });

  /* ───────── Entradas reversibles ─────────
     Cada entrada por scroll se crea en pausa: al bajar se reproduce y, al volver hacia arriba,
     se reproduce al revés (misma animación, mismo ritmo) en vez de desaparecer de golpe. */
  const revPlay = (els, gap) => els.forEach((el, i) => { if (el._d) el._d.kill(); el._d = gsap.delayedCall(i * gap, () => el._rv.play()); });
  const revBack = (els) => els.forEach((el) => { if (el._d) el._d.kill(); el._rv.reverse(); });
  const revealTween = (el, y, dur) => gsap.fromTo(el, { opacity: 0, y }, { opacity: 1, y: 0, duration: dur, ease: 'power3.out', paused: true });

  // Tarjetas de principios: cada una es una línea de tiempo en pausa
  const prFrom = (i) => ({ opacity: 0, y: 150, scale: 0.84, rotationZ: [-7, 4, 7][i % 3] });
  const prBuild = (c, i) => {
    gsap.set(c, prFrom(i));
    gsap.set($('.pr__art', c), { opacity: 0, scale: 0.5, rotation: -12 });
    gsap.set($('.pr__t', c), { opacity: 0, y: 28 });
    const barsInit = $$('.bar', c);
    if (barsInit.length) gsap.set(barsInit, { scaleY: 0, transformBox: 'fill-box', transformOrigin: '50% 100%' });
    const tl = gsap.timeline({ paused: true });
    tl.to(c, { opacity: 1, y: 0, scale: 1, rotationZ: 0, duration: 1.15, ease: 'back.out(1.5)' }, 0)
      .to($('.pr__art', c), { opacity: 1, scale: 1, rotation: 0, duration: 0.9, ease: 'back.out(2.2)' }, 0.25)
      .to($('.pr__t', c), { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' }, 0.45);
    const draws = $$('.draw', c), bars = $$('.bar', c);
    if (draws.length) tl.to(draws, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.18 }, 0.5);
    if (bars.length) tl.to(bars, { scaleY: 1, duration: 1, ease: 'back.out(1.5)', stagger: 0.12 }, 0.6);
    c._rv = tl;
  };

  /* ───────── Estados iniciales de las revelaciones ───────── */
  const heroChars = $$('[data-chars]').flatMap(chars);
  const splitHeads = $$('[data-split]').map((el) => ({ el, ws: scrubWords(el) }));
  const revealEls = $$('[data-reveal]');
  const heroIn = $$('[data-hero-in]');
  const scrubBlocks = $$('[data-scrub-words]').map((el) => ({ el, ws: scrubWords(el) }));
  const counters = $$('[data-count]');

  if (!reduce) {
    gsap.set(heroChars, { opacity: 0 });
    heroIn.forEach((el) => gsap.set(el, { opacity: 0, y: 30 }));
    splitHeads.forEach(({ ws }) => gsap.set(ws, { opacity: 0.14 }));
    revealEls.forEach((el) => { el._rv = revealTween(el, 36, 0.95); });
    scrubBlocks.forEach(({ ws }) => gsap.set(ws, { opacity: 0.16 }));
    counters.forEach((el) => { el.textContent = '0' + (el.dataset.suffix || ''); });
    $$('.pr .draw').forEach((p) => { const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    $$('.pr').forEach((c, i) => prBuild(c, i));
  }

  /* ───────── Barra de progreso ───────── */
  const bar = $('.progress i');
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: (s) => { bar.style.transform = `scaleX(${s.progress})`; } });

  /* ───────── Revelaciones al hacer scroll ───────── */
  const initReveals = () => {
    if (reduce) return;
    splitHeads.forEach(({ el, ws }) => gsap.to(ws, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 88%', end: 'top 52%', scrub: true } }));
    ScrollTrigger.batch(revealEls, { start: 'top 90%', onEnter: (b) => revPlay(b, 0.09), onLeaveBack: (b) => revBack(b) });
    // el texto del manifiesto lo anima initManifesto (fijo en escritorio, scroll normal en móvil)
    scrubBlocks.filter(({ el }) => !el.matches('.manifesto__text')).forEach(({ el, ws }) => gsap.to(ws, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true } }));
    counters.forEach((el) => {
      const end = +el.dataset.count, suf = el.dataset.suffix || '', o = { v: 0 };
      const count = gsap.to(o, { v: end, duration: 2, ease: 'power2.out', paused: true, onUpdate: () => { el.textContent = Math.round(o.v) + suf; } });
      ScrollTrigger.create({ trigger: el, start: 'top 90%', onEnter: () => count.play(), onLeaveBack: () => count.reverse() });
    });
    // las tarjetas entran en cascada y, al volver hacia arriba, hacen la misma animación al revés
    const prs = $$('.pr');
    ScrollTrigger.batch(prs, {
      start: 'top 90%',
      onEnter: (batch) => revPlay(batch, 0.14),
      onLeaveBack: (batch) => revBack(batch),
    });
  };

  /* ───────── Manifiesto: queda fijo, se lee y la sección siguiente sube y lo tapa ───────── */
  const initManifesto = (pinned) => {
    const sec = $('.manifesto'), next = $('.principles-sec'), lead = $('.manifesto__lead'), txt = $('.manifesto__text');
    if (!sec || !next || !lead) return () => {};
    const block = scrubBlocks.find((b) => b.el === txt);
    if (!pinned) {
      // móvil / sin escritorio: las palabras se encienden con el scroll normal
      if (block && !reduce) gsap.to(block.ws, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: txt, start: 'top 82%', end: 'bottom 48%', scrub: true } });
      return () => {};
    }
    root.classList.add('manifesto-pinned'); // antes de medir: la sección pasa a ocupar la pantalla
    ScrollTrigger.create({ trigger: sec, start: 'top top', endTrigger: next, end: 'top top', pin: true, pinSpacing: false, anticipatePin: 1 });
    // lectura: las palabras se encienden mientras el bloque está fijo (y queda un respiro antes de que suba lo siguiente)
    if (block) gsap.to(block.ws, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: sec, start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.7), scrub: true } });
    // al subir la sección siguiente, el manifiesto se aleja y se apaga debajo
    gsap.fromTo(lead, { y: 0, scale: 1, opacity: 1 }, { y: -40, scale: 0.94, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: next, start: 'top 100%', end: 'top 12%', scrub: true } });
    return () => { root.classList.remove('manifesto-pinned'); gsap.set(lead, { clearProps: 'all' }); };
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
    // se crea dentro de gsap.matchMedia (escritorio sin reducción de movimiento): reacciona a cambios de ancho
    const cards = $$('.pcard'), inners = [];
    cards.forEach((c, i) => {
      const next = cards[i + 1];
      if (!next) return;
      const inner = $('.pcard__inner', c);
      gsap.set(inner, { transformPerspective: 1400 });
      // valor de partida explícito: desde `filter: none` GSAP arrancaba en brightness(0) (negro puro)
      gsap.fromTo(inner, { scale: 1, rotationX: 0, filter: 'brightness(1)' }, { scale: 0.93, rotationX: 4, filter: 'brightness(0.5)', ease: 'none', scrollTrigger: { trigger: next, start: 'top 88%', end: 'top 16%', scrub: true } });
      inners.push(inner);
    });
    return () => {
      ScrollTrigger.getAll().filter((t) => cards.includes(t.trigger)).forEach((t) => t.kill(true));
      gsap.set(inners, { clearProps: 'all' });
    };
  };

  /* ───────── Hero y tarjeta 3D ───────── */
  const initHeroScrub = () => {
    if (reduce || !$('.hero')) return;
    const t = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__word--a', { xPercent: -16, ease: 'none', scrollTrigger: t });
    gsap.to('.hero__word--b', { xPercent: -10, ease: 'none', scrollTrigger: t });
    gsap.to('.hero__foot, .hero__tag', { opacity: 0, y: -50, ease: 'none', scrollTrigger: { ...t, end: '60% top' } });
  };

  const initJourney = () => {
    const card = $('.scard'), tilt = $('.scard__tilt'), flip = $('.scard__flip'), hi = $('.scard__hi'), chips = $$('.scard__face--front .scard__chip'), chipsB = $$('.scard__face--back .scard__chip'), plates = card ? $$('.scard__plate', card) : [];
    if (!card) return () => {};

    // el tilt sigue al cursor (afecta a todas las posiciones de la tarjeta)
    let offMove = () => {};
    if (fine) {
      const qrx = gsap.quickTo(tilt, 'rotationX', { duration: 0.9, ease: 'power3' }), qry = gsap.quickTo(tilt, 'rotationY', { duration: 0.9, ease: 'power3' });
      const move = (e) => {
        const nx = e.clientX / innerWidth - 0.5, ny = e.clientY / innerHeight - 0.5;
        qry(nx * 26); qrx(-ny * 20);
        plates.forEach((p) => { p.style.setProperty('--sx', (50 + nx * 80) + '%'); p.style.setProperty('--sy', (20 + ny * 80) + '%'); });
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
        hero: { x: vw(23), y: vh(2), scale: 1, rz: 0, ry: 0, o: 1, flip: 0, hi: 1, orbit: 1 },
        manifesto: { x: vw(22.5), y: vh(2), scale: 0.86, rz: 3, ry: -14, o: 1, flip: 0, hi: 0, orbit: 0 },
        away1: { x: 0, y: -vh(46), scale: 0.07, rz: 0, ry: 0, o: 0, flip: 0, hi: 0, orbit: 0 },
        about: { x: -vw(21), y: vh(2), scale: 1, rz: -3, ry: 12, o: 1, flip: 180, hi: 0, orbit: 0, orbitB: 1 },
        away2: { x: 0, y: -vh(46), scale: 0.07, rz: 0, ry: 0, o: 0, flip: 180, hi: 0, orbit: 0 },
        contact: { x: vw(25), y: vh(2), scale: 0.86, rz: 3, ry: -12, o: 1, flip: 360, hi: 1, orbit: 0 },
        away3: { x: 0, y: -vh(46), scale: 0.07, rz: 0, ry: 0, o: 0, flip: 360, hi: 0, orbit: 0 },
      };
      const apply = (s) => ({ x: s.x, y: s.y, scale: s.scale, rotationZ: s.rz, opacity: s.o });
      const seg = (at, from, to, dur) => {
        tl.fromTo(card, apply(from), { ...apply(to), duration: dur, immediateRender: false }, at);
        tl.fromTo(flip, { rotationY: from.flip + from.ry }, { rotationY: to.flip + to.ry, duration: dur, immediateRender: false }, at);
        tl.fromTo(hi, { opacity: from.hi, scale: 0.4 + 0.6 * from.hi }, { opacity: to.hi, scale: 0.4 + 0.6 * to.hi, duration: dur, immediateRender: false }, at);
        tl.fromTo(chips, { opacity: from.orbit, scale: 0.5 + 0.5 * from.orbit }, { opacity: to.orbit, scale: 0.5 + 0.5 * to.orbit, duration: dur, immediateRender: false }, at);
        const ob0 = from.orbitB || 0, ob1 = to.orbitB || 0; // etiquetas de la cara trasera ("sobre mí")
        tl.fromTo(chipsB, { opacity: ob0, scale: 0.5 + 0.5 * ob0 }, { opacity: ob1, scale: 0.5 + 0.5 * ob1, duration: dur, immediateRender: false }, at);
      };
      tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
      // estado inicial del hero (un timeline pausado en t=0 no renderiza por sí solo)
      const h0 = S.hero;
      gsap.set(card, apply(h0)); gsap.set(flip, { rotationY: h0.flip + h0.ry });
      gsap.set(hi, { opacity: h0.hi, scale: 0.4 + 0.6 * h0.hi }); gsap.set(chips, { opacity: h0.orbit, scale: 0.5 + 0.5 * h0.orbit }); gsap.set(chipsB, { opacity: 0, scale: 0.5 });
      tl.set(card, apply(S.hero), 0).set(flip, { rotationY: h0.flip + h0.ry }, 0);
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
    return () => { ScrollTrigger.removeEventListener('refresh', build); tl && tl.kill(); st.kill(); offMove(); gsap.set([card, flip, hi, chips, chipsB, tilt], { clearProps: 'all' }); };
  };

  /* ───────── Proceso: cuatro pantallas que pasan al frente (una por paso) ───────── */
  const initProcess = (pinned) => {
    const sec = $('.process');
    if (!sec) return () => {};
    const steps = $$('.step', sec), scenes = $$('.sc3d', sec), fill = $('.process__progress i', sec), pin = $('.process__pin', sec), wrap = $('.pscene', sec);

    // las pantallas se diseñan a 600 px de ancho y se escalan para caber en la columna
    const fit = () => wrap.style.setProperty('--k', Math.min(1, Math.max(0.5, (wrap.clientWidth - 8) / 600)).toFixed(3));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    const setActive = (n) => steps.forEach((s, k) => s.classList.toggle('is-active', k === n));
    const clean = () => { ro.disconnect(); gsap.set(scenes, { clearProps: 'all' }); sec.classList.remove('process--static'); };

    if (!pinned) {
      // Sin escena fija: cada paso es una pestaña (acordeón). Al abrirla muestra su pantalla y su texto.
      sec.classList.add('process--static');
      ro.disconnect();
      gsap.set(scenes, { clearProps: 'all' });
      const pcar = $('.pcar', sec), stepsEl = $('.steps', sec), undo = [];
      const kfit = () => {
        const holder = $('.step__scene', sec);
        if (holder) stepsEl.style.setProperty('--k', Math.min(1, Math.max(0.4, holder.clientWidth / 600)).toFixed(3));
      };
      const open = (idx) => steps.forEach((o, k) => {
        o.classList.toggle('is-active', k === idx);
        const b = $('.step__btn', o);
        if (b) b.setAttribute('aria-expanded', String(k === idx));
      });
      steps.forEach((s, i) => {
        const body = $('.step__body', s), p = $('p', body), head = $('.step__head', s), t = $('.step__t', s), label = t.textContent.trim();
        const inner = document.createElement('div');
        inner.className = 'step__inner';
        inner.id = 'paso-' + (i + 1);
        const holder = document.createElement('div');
        holder.className = 'step__scene';
        holder.setAttribute('aria-hidden', 'true');
        holder.appendChild(scenes[i]);
        inner.append(holder, p);
        body.appendChild(inner);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'step__btn';
        btn.textContent = label;
        btn.setAttribute('aria-controls', inner.id);
        t.textContent = '';
        t.appendChild(btn);
        const onHead = () => {
          const willOpen = !s.classList.contains('is-active');
          open(willOpen ? i : -1);
          setTimeout(() => ScrollTrigger.refresh(), 700);
          if (willOpen) {
            // cuando termina de cerrarse la pestaña anterior, si el título quedó fuera de vista se acerca
            setTimeout(() => { const r = head.getBoundingClientRect(); if (r.top < 90 || r.top > innerHeight * 0.55) goTo(s, { offset: -96, duration: 0.9 }); }, 650);
          }
        };
        head.addEventListener('click', onHead);
        undo.push(() => {
          head.removeEventListener('click', onHead);
          t.textContent = label;
          body.appendChild(p);
          pcar.appendChild(scenes[i]);
          inner.remove();
        });
      });
      open(0);
      kfit();
      const rk = new ResizeObserver(kfit);
      rk.observe(stepsEl);
      return () => {
        rk.disconnect();
        undo.forEach((fn) => fn());
        stepsEl.style.removeProperty('--k');
        clean();
        steps.forEach((s, k) => s.classList.toggle('is-active', k === 0));
      };
    }

    // pos = paso "continuo" (0 a 3). La pantalla activa está al frente, las anteriores se van hacia atrás/arriba
    // y las siguientes esperan detrás, asomando por la derecha.
    const proxy = { pos: 0 };
    const place = (pos) => scenes.forEach((el, i) => {
      const o = i - pos;
      if (o <= 0) {
        const a = Math.min(1, -o);
        gsap.set(el, { x: -70 * a, y: -100 * a, z: -300 * a, rotationX: 14 * a, rotationY: 18 * a, scale: 1 - 0.1 * a, autoAlpha: Math.max(0, 1 - a * 1.25), filter: 'none' });
      } else {
        gsap.set(el, { x: 56 * o, y: 38 * o, z: -170 * o, rotationX: 0, rotationY: -9 * o, scale: 1 - 0.05 * o, autoAlpha: Math.min(1, Math.max(0, 2.7 - o)), filter: `brightness(${(1 - 0.3 * Math.min(o, 2)).toFixed(2)})` });
      }
    });
    place(0);
    setActive(0);
    let cur = 0;
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      onUpdate: () => { place(proxy.pos); const n = Math.round(proxy.pos); if (n !== cur) { cur = n; setActive(n); } },
      scrollTrigger: { trigger: pin, start: 'top top', end: '+=400%', pin: true, scrub: 0.6, anticipatePin: 1 },
    });
    tl.to(proxy, { pos: 1, duration: 1, ease: 'power2.inOut' }, 0.7)
      .to(proxy, { pos: 2, duration: 1, ease: 'power2.inOut' }, 2.5)
      .to(proxy, { pos: 3, duration: 1, ease: 'power2.inOut' }, 4.3)
      .fromTo(fill, { scaleY: 0 }, { scaleY: 1, duration: 6.3 }, 0)
      .set({}, {}, 6.3);
    return () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill(true);
      tl.kill();
      clean();
      gsap.set(fill, { clearProps: 'all' });
      steps.forEach((s, k) => s.classList.toggle('is-active', k === 0));
    };
  };

  /* ───────── Skills: logos que recorren un arco y se difuminan en los extremos ───────── */
  const initArc = () => {
    const arc = $('[data-arc]');
    if (!arc) return;
    const items = $$('.arc__item', arc), N = items.length;
    let W = 0, H = 0, phase = 0.06, speed = 1, target = 1, visible = true;
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const measure = () => {
      W = arc.clientWidth; H = arc.clientHeight;
      arc.style.setProperty('--sz', Math.max(52, Math.min(124, W * 0.098)).toFixed(1) + 'px');
    };
    const place = () => {
      const cx = W / 2, cy = H * (innerWidth < 900 ? 0.68 : 0.72), rx = W * 0.46, ry = H * (innerWidth < 900 ? 0.5 : 0.58);
      items.forEach((el, i) => {
        const u = (((i / N + phase) % 1) + 1) % 1;            // 0 = entra por la izquierda, 1 = sale por la derecha
        const th = ((200 - 220 * u) * Math.PI) / 180;         // de 200° a -20° (por encima del centro)
        const x = cx + rx * Math.cos(th), y = cy - ry * Math.sin(th);
        const vis = smooth(0, 0.15, u) * (1 - smooth(0.85, 1, u));
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(0.74 + 0.26 * vis).toFixed(3)})`;
        el.style.opacity = vis.toFixed(3);
        el.style.filter = vis < 0.985 ? `blur(${((1 - vis) * 10).toFixed(1)}px)` : 'none';
      });
    };
    measure();
    place();
    new ResizeObserver(() => { measure(); place(); }).observe(arc);
    if (reduce) return;
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; }, { rootMargin: '120px' }).observe(arc);
    arc.addEventListener('pointerenter', () => { target = 0.2; });
    arc.addEventListener('pointerleave', () => { target = 1; });
    gsap.ticker.add((time, dt) => {
      if (!visible) return;
      speed += (target - speed) * 0.08;
      phase = (phase + (dt / 1000) * speed * 0.018) % 1;      // vuelta completa en ~55 s
      place();
    });
  };

  /* ───────── Página de proyectos ───────── */
  const initProjects = () => {
    const btns = $$('.filter'), items = $$('.gcard'), countEl = $('[data-visible-count]');
    if (!reduce) {
      items.forEach((el) => { el._rv = revealTween(el, 50, 0.9); });
      ScrollTrigger.batch(items, { start: 'top 94%', onEnter: (b) => revPlay(b, 0.07), onLeaveBack: (b) => revBack(b) });
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
        .add(() => { swap(); gsap.fromTo(show, { opacity: 0, y: 34, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: 'power3.out', stagger: 0.045, overwrite: 'auto' }); });
    }));
  };

  /* ───────── Intro (loader → hero) ───────── */
  const intro = () => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
    if (heroChars.length) {
      // efecto de escritura: cada letra aparece una a una con un cursor que la acompaña
      const caret = $('.hero__caret');
      const title = caret ? caret.parentElement : null;
      heroChars.forEach((c, i) => {
        const at = 0.25 + i * 0.09;
        tl.set(c, { opacity: 1 }, at);
        if (caret) {
          tl.call(() => {
            const r = c.getBoundingClientRect(), t = title.getBoundingClientRect();
            caret.style.opacity = '1';
            caret.style.height = r.height * 0.74 + 'px';
            caret.style.width = Math.max(3, r.height * 0.045) + 'px';
            caret.style.transform = `translate(${r.right - t.left + 6}px, ${r.top - t.top + r.height * 0.14}px)`;
          }, null, at);
        }
      });
      if (caret) tl.to(caret, { opacity: 0, duration: 0.4 }, 0.25 + heroChars.length * 0.09 + 1);
    }
    tl.to(heroIn, { opacity: 1, y: 0, duration: 1, stagger: 0.1 }, 0.3);
    if ($('.stage') && matchMedia('(min-width: 900px)').matches) {
      tl.fromTo('.stage', { opacity: 0, y: 90, scale: 0.78 }, { opacity: 1, y: 0, scale: 1, duration: 1.4, ease: 'expo.out' }, 0.1)
        .fromTo('.scard__face--front .scard__chip', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(2)', stagger: 0.1, clearProps: 'scale,opacity' }, 0.9)
        .fromTo('.scard__hi', { scale: 0 }, { scale: 1, duration: 0.8, ease: 'back.out(2.4)', clearProps: 'scale' }, 1.3);
    }
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
    const offManifesto = page === 'home' ? initManifesto(true) : () => {}; // primero: cambia el diseño de la página antes de medir lo demás
    const offProcess = page === 'home' ? initProcess(true) : () => {};
    const offJourney = page === 'home' ? initJourney() : () => {};
    const offStack = page === 'home' ? initStack() : () => {};
    return () => { offStack(); offJourney(); offProcess(); offManifesto(); };
  });
  mm.add('(max-width: 899px), (prefers-reduced-motion: reduce)', () => {
    if (page !== 'home') return undefined;
    initManifesto(false);
    return initProcess(false);
  });
  mm.add('(min-width: 900px) and (prefers-reduced-motion: reduce)', () => {
    if (page !== 'home') return;
    const st = ScrollTrigger.create({ trigger: '.hero', start: 'bottom 60%', onEnter: () => gsap.to('.stage', { opacity: 0, duration: 0.3 }), onLeaveBack: () => gsap.to('.stage', { opacity: 1, duration: 0.3 }) });
    return () => st.kill();
  });

  initReveals();
  if (page === 'home') { initHeroScrub(); initArc(); }
  if (page === 'projects') initProjects();

  addEventListener('load', () => ScrollTrigger.refresh());

  const imgReady = Promise.all($$('.scard__cutout, .hero__photo img').map((im) => (im.decode ? im.decode().catch(() => {}) : Promise.resolve())));
  Promise.race([Promise.all([document.fonts ? document.fonts.ready : Promise.resolve(), imgReady]), new Promise((r) => setTimeout(r, 2800))]).then(runLoader);
})();
