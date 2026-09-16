/* KeyMate — site vitrine : thème, ouverture du héros, scrollytelling, cascade. Aucune dépendance. */
(() => {
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

  /* ---------- thème : posé dans le <head>, bascule mémorisée ---------- */
  const themeBtn = $('#theme');
  const SUN = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>';
  const syncTheme = () => {                                         // le bouton dit l'action, pas l'état
    const dark = root.dataset.theme !== 'light';
    const label = dark ? 'Passer en clair' : 'Passer en sombre';
    themeBtn.innerHTML = `${dark ? SUN : MOON}<span class="theme-label">${label}</span>`;
    themeBtn.setAttribute('aria-label', label);
  };
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      root.dataset.theme = root.dataset.theme === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('km-theme', root.dataset.theme); } catch (_) { /* navigation privée */ }
      syncTheme();
    });
    syncTheme();
  }

  const nav = $('.site-nav');
  const navH = () => root.style.setProperty('--nav-h', `${nav.offsetHeight}px`);
  navH();
  addEventListener('resize', navH);

  /* ---------- cascade : seulement pour ce qui n'est pas déjà à l'écran ---------- */
  $$('[data-cascade]').forEach((box) => {
    if (reduced || box.getBoundingClientRect().top < innerHeight) return;
    box.classList.add('armed');
    new IntersectionObserver(([e], io) => {
      if (e.isIntersecting) { box.classList.remove('armed'); io.disconnect(); }
    }, { threshold: 0.15 }).observe(box);
  });

  /* ---------- scène : clavier vu de face, rail, modules ---------- */
  const KX = 60, KW = 36, KEYS = 30, RAIL = 150;
  const keyX = (k) => KX + k * KW + KW / 2 - 1;
  const moduleSVG = () => `<g class="mod"><g class="rodg"><rect class="m-rod" x="-3" y="0" width="6" height="104"/><rect class="m-tip" x="-8" y="100" width="16" height="12" rx="6"/></g>
    <g class="bodyg"><rect class="m-chariot" x="-48" y="-14" width="96" height="14" rx="3"/><circle class="m-wheel" cx="-30" cy="3" r="6"/><circle class="m-wheel" cx="30" cy="3" r="6"/>
    <rect class="m-body" x="-34" y="-72" width="68" height="58" rx="4"/><rect class="m-screen" x="-24" y="-60" width="30" height="12" rx="2"/><circle class="m-led" cx="20" cy="-54" r="4.5"/></g></g>`;
  function consoleSVG(slots = [], opts = {}) {
    const BLACK = [1, 1, 0, 1, 1, 1, 0];                            // do# ré# — fa# sol# la# —
    const a11y = opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"';
    let s = `<svg class="console" viewBox="0 40 1200 400" ${a11y}><rect class="bed" x="0" y="250" width="1200" height="190"/><rect class="cheek" x="40" y="264" width="1120" height="10"/>`;
    for (let i = 0; i < KEYS; i++) s += `<rect class="k-w" data-k="${i}" x="${KX + i * KW}" y="280" width="${KW - 2}" height="160" rx="2"/>`;
    for (let i = 0; i < KEYS - 1; i++) if (BLACK[i % 7]) s += `<rect class="k-b" x="${KX + (i + 1) * KW - 12}" y="280" width="22" height="96" rx="2"/>`;
    if (opts.note !== undefined) s += `<text class="svg-note" x="${keyX(opts.note)}" y="262" text-anchor="middle">touche tenue à la main</text>`;
    s += `<g class="railg"><rect class="rail" x="40" y="${RAIL}" width="1120" height="18" rx="3"/><rect class="rail-top" x="40" y="${RAIL}" width="1120" height="3"/>`;
    s += `<rect class="rail-top" x="40" y="${RAIL - 8}" width="14" height="34" rx="2"/><rect class="rail-top" x="1146" y="${RAIL - 8}" width="14" height="34" rx="2"/></g>`;
    slots.forEach((k) => { s += `<g class="slot" data-k="${k}" transform="translate(${keyX(k)} ${RAIL})">${moduleSVG()}</g>`; });
    return `${s}</svg>`;
  }

  /* ---------- héros : les lettres se déposent, les modules atterrissent, puis la vidéo ---------- */
  const hero = $('#hero');
  if (hero) {
    const video = $('#heroVideo'), illus = $('#heroIllus'), skip = $('#skipIntro'), playBtn = $('#playVideo');
    illus.innerHTML = consoleSVG([6, 15, 24]);
    const word = $('#heroWord');
    const text = word.textContent.trim();
    word.setAttribute('aria-label', text);
    word.innerHTML = [...text].map((c) => `<span aria-hidden="true">${c}</span>`).join('');
    const letters = [...word.children];
    const mods = $$('.slot', illus).map((slot) => ({ body: $('.bodyg', slot), rod: $('.rodg', slot), led: $('.m-led', slot), key: $(`.k-w[data-k="${slot.dataset.k}"]`, illus) }));
    const anims = [], timers = [];
    let done = false;
    const A = (node, kf, ms, o = {}) => { const a = node.animate(kf, { duration: ms, fill: 'both', easing: 'ease-out', ...o }); anims.push(a); return a; };
    const at = (ms, fn) => timers.push(setTimeout(fn, ms));
    const hidden = [{ opacity: 0 }, { opacity: 0 }];

    const syncVideoBtn = () => { playBtn.textContent = video.paused ? 'Lire l’animation' : 'Mettre en pause'; };
    video.addEventListener('play', syncVideoBtn);
    video.addEventListener('pause', syncVideoBtn);
    playBtn.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
    const playVideo = () => { playBtn.hidden = false; syncVideoBtn(); video.play().catch(syncVideoBtn); };   // la vidéo boucle : toujours un bouton pause

    function finish() {
      if (done) return;
      done = true;
      timers.forEach(clearTimeout);
      anims.forEach((a) => a.cancel());
      hero.classList.remove('is-intro');
      skip.hidden = true;
      playVideo();
    }

    if (reduced) {
      playBtn.hidden = false;                                      // état de repos : affiche, texte, aucun mouvement
      syncVideoBtn();
    } else {
      hero.classList.add('is-intro');
      skip.hidden = false;
      letters.forEach((n) => A(n, hidden, 1));                     // texte et boutons visibles dès le départ, seules les lettres tombent
      mods.forEach((m) => { A(m.body, hidden, 1); A(m.rod, hidden, 1); });
      skip.addEventListener('click', finish);
      const onScroll = () => { if (scrollY > hero.offsetHeight * 0.6) { finish(); removeEventListener('scroll', onScroll); } };
      addEventListener('scroll', onScroll, { passive: true });

      document.fonts.ready.then(() => {
        if (done) return;
        letters.forEach((L, i) => at(200 + i * 110, () => {
          const r = (Math.random() * 2 - 1) * 28, dx = (Math.random() * 2 - 1) * 0.5;
          A(L, [
            { opacity: 0, transform: `translate(${dx}em,-1.6em) rotate(${r}deg)`, filter: 'blur(6px)' },
            { offset: 0.6, opacity: 1, transform: `translate(0,.06em) rotate(${-r / 5}deg)`, filter: 'blur(0)' },
            { offset: 0.82, transform: 'translate(0,-.03em) rotate(0deg)' },
            { opacity: 1, transform: 'none', filter: 'blur(0)' },
          ], 1000, { easing: 'cubic-bezier(.25,.1,.3,1)' });
        }));
        mods.forEach((m, i) => at(1300 + i * 380, () => {
          A(m.body, [
            { opacity: 0, transform: 'translate(-70px,-560px) rotate(-11deg)' }, { offset: 0.15, opacity: 1 },
            { offset: 0.45, transform: 'translate(46px,-310px) rotate(8deg)' },
            { offset: 0.74, transform: 'translate(-12px,-64px) rotate(-3deg)', easing: 'ease-in' },
            { offset: 0.86, transform: 'translate(0,0) scale(1.09,.86)' },
            { offset: 0.94, transform: 'translate(0,-7px) scale(.97,1.04)' },
            { opacity: 1, transform: 'none' },
          ], 1500, { easing: 'cubic-bezier(.3,.1,.3,1)' });
          at(1290, () => { A(m.rod, [{ opacity: 0 }, { opacity: 1 }], 160); m.led.classList.add('on'); });
          at(1650, () => {                                          // le doigt salue sa touche
            A(m.rod, [{ transform: 'none' }, { transform: 'translateY(22px)' }, { transform: 'none' }], 460, { easing: 'ease-in-out', fill: 'none' });
            m.key.classList.add('on');
            at(460, () => m.key.classList.remove('on'));
          });
        }));
        at(4200, finish);
      });
    }
  }

  /* ---------- comment ça marche : le défilement pilote la scène ---------- */
  const track = $('#storyTrack');
  if (track) {
    const steps = $$('.story-steps li', track);
    const NOTE = 17;
    const reading = '<div class="reading"><span class="note">Do 4</span><div class="kn-gauge" aria-hidden="true"><div class="kn-gauge__zone"></div><div class="kn-gauge__needle"></div></div><span class="value kn-num">—</span><span class="state"></span></div>';

    function makeScene(host) {
      host.innerHTML = consoleSVG([4], { note: NOTE, label: 'Clavier vu de face : rail, module KeyMate et touche en cours' }) + reading;
      const railG = $('.railg', host), slot = $('.slot', host), mod = $('.mod', slot), rod = $('.rodg', slot), led = $('.m-led', slot);
      const hold = $('.svg-note', host), keys = $$('.k-w', host);
      const gauge = $('.kn-gauge', host), value = $('.value', host), state = $('.state', host), note = $('.note', host);
      return (p) => {
        railG.setAttribute('transform', `translate(${-1250 * (1 - ease(seg(p, 0.2, 0.34)))} 0)`);
        const shown = p >= 0.4;
        const fall = 1 - ease(seg(p, 0.4, 0.47));
        const k = 4 + (NOTE - 4) * ease(seg(p, 0.47, 0.55)) + ease(seg(p, 0.87, 0.95));
        const press = ease(seg(p, 0.55, 0.6)) * (1 - ease(seg(p, 0.82, 0.87)));
        slot.setAttribute('transform', `translate(${keyX(k)} ${RAIL})`);
        mod.setAttribute('transform', `translate(0 ${-420 * fall})`);
        mod.style.opacity = shown ? 1 : 0;
        rod.setAttribute('transform', `translate(0 ${press * 26})`);
        led.classList.toggle('on', shown && fall === 0);
        const held = p < 0.2 || press > 0.92;
        keys.forEach((key) => key.classList.toggle('on', held && +key.dataset.k === NOTE));
        hold.style.opacity = p < 0.2 ? 1 : 0;

        const cents = p >= 0.61 && p < 0.82 ? Math.round(22 * (1 - ease(seg(p, 0.66, 0.78)))) : null;
        const st = cents === null ? '' : cents > 10 ? 'sharp' : cents < -10 ? 'flat' : 'tuned';
        gauge.style.setProperty('--kn-cents', cents ?? 0);
        gauge.dataset.state = st;
        value.textContent = cents === null ? '—' : cents > 0 ? `+${cents}` : String(cents);
        value.style.color = st ? `var(--kn-${st})` : 'var(--kn-text-faint)';
        note.textContent = p > 0.92 ? 'Ré 4' : 'Do 4';
        state.textContent =
          p < 0.2 ? 'Sans KeyMate : quelqu’un tient la touche au clavier'
          : p < 0.4 ? 'Rail posé au-dessus du clavier'
          : p < 0.55 ? 'Module en route vers Do 4'
          : p < 0.61 ? 'Do 4 enfoncé et tenu'
          : st === 'sharp' ? '+ Trop haut · sortir la calotte'
          : st === 'tuned' ? '✓ Juste · dans la tolérance de ± 10 cents'
          : 'Note suivante : Ré 4';
        return Math.min(4, Math.floor(p * 5));
      };
    }

    if (reduced) {
      track.classList.add('is-static');                            // une image fixe par étape, à côté de son texte
      [0.1, 0.3, 0.6, 0.64, 0.93].forEach((p, i) => {
        const shot = document.createElement('div');
        shot.className = 'story-shot';
        steps[i].appendChild(shot);
        $('.story-step', steps[i]).disabled = true;
        makeScene(shot)(p);
      });
    } else {
      // lecture automatique à l'entrée dans l'écran, pause hors écran ; Pause/Lecture/Rejouer et étapes cliquables
      const draw = makeScene($('#storyStage'));
      const btn = $('#storyPlay'), bar = $('#storyProgress i');
      const DURATION = 13000;
      let p = 0, playing = false, last = 0, raf = 0, autoPaused = false;
      const render = () => {
        const idx = draw(p);
        bar.style.transform = `scaleX(${p})`;
        steps.forEach((li, i) => {
          li.classList.toggle('is-on', i === idx);
          $('.story-step', li).setAttribute('aria-current', i === idx ? 'step' : 'false');
        });
        btn.textContent = playing ? 'Pause' : p >= 1 ? 'Rejouer' : 'Lecture';
      };
      const tick = (now) => {
        if (!playing) return;
        p = Math.min(1, p + (now - last) / DURATION);
        last = now;
        if (p >= 1) playing = false;
        render();
        if (playing) raf = requestAnimationFrame(tick);
      };
      const play = () => { if (p >= 1) p = 0; playing = true; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); render(); };
      const pause = () => { playing = false; cancelAnimationFrame(raf); render(); };
      btn.addEventListener('click', () => { autoPaused = false; playing ? pause() : play(); });
      steps.forEach((li, i) => $('.story-step', li).addEventListener('click', () => { autoPaused = false; p = i / 5; play(); }));
      let started = false;
      new IntersectionObserver(([e]) => {                          // démarre quand la scène est presque entière à l'écran
        if (e.intersectionRatio >= 0.85) {
          if (!started) { started = true; play(); } else if (autoPaused) { autoPaused = false; play(); }
        } else if (!e.isIntersecting && playing) { autoPaused = true; pause(); }
      }, { threshold: [0, 0.85] }).observe($('#storyStage'));
      render();
    }
  }

  /* ---------- contact : copier l'adresse (mailto ne marche pas sans logiciel de messagerie) ---------- */
  $$('[data-copy]').forEach((btn) => btn.addEventListener('click', async () => {
    const status = $(btn.dataset.status);
    try { await navigator.clipboard.writeText(btn.dataset.copy); status.textContent = 'Adresse copiée.'; }
    catch (_) { status.textContent = 'Copie impossible : sélectionnez l’adresse ci-dessus.'; }
  }));
})();
