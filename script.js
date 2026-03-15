/**
 * ideo. — script.js
 * ─────────────────────────────────────────────
 * SEGURIDAD:
 *  - sanitizeInput()  → elimina caracteres XSS antes de procesar
 *  - validateEmail()  → regex estricto
 *  - Rate limiting    → máx 3 envíos por 60 s
 *  - Honeypot field   → anti-bot (campo oculto)
 *  - No innerHTML     → solo textContent / classList
 *  - passive listeners en scroll
 *
 * SEO / ACCESIBILIDAD:
 *  - aria-expanded en hamburger
 *  - IntersectionObserver con rootMargin optimizado
 *  - Stats counter ease-out cúbico
 *  - Scroll spy para active link
 * ─────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Utilidades de seguridad ─────────────── */

  function sanitizeInput(str) {
    return str
      .trim()
      .replace(/[<>"'`]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .slice(0, 1000);
  }

  function validateEmail(email) {
    return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  const rateLimiter = (() => {
    const MAX = 3, WINDOW = 60_000;
    let attempts = 0, windowStart = Date.now();
    return {
      check() {
        const now = Date.now();
        if (now - windowStart > WINDOW) { attempts = 0; windowStart = now; }
        if (attempts >= MAX) return false;
        attempts++;
        return true;
      }
    };
  })();

  /* ── Navbar scroll ───────────────────────── */
  const navbar = document.getElementById('navbar');
  function handleScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  /* ── Hamburger menu ──────────────────────── */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });
    mobileMenu.querySelectorAll('.mob-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── CTA → contacto ──────────────────────── */
  document.getElementById('navCta')?.addEventListener('click', () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  });

  /* ── Smooth scroll todos los anchors ────── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ── Reveal on scroll ────────────────────── */
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal-enabled');
    const revealObs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const delay = Number(entry.target.dataset.delay) || 0;
        setTimeout(() => entry.target.classList.add('visible'), delay);
        revealObs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  }

  /* ── Stats counter ───────────────────────── */
  const statObs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target || '0', 10);
      if (!target || el.dataset.done === 'true') { statObs.unobserve(el); return; }
      el.dataset.done = 'true';
      const duration = 1400, startTime = performance.now();
      function step(now) {
        const p = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = String(Math.floor(eased * target));
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = String(target);
      }
      requestAnimationFrame(step);
      statObs.unobserve(el);
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.stat-num').forEach(el => statObs.observe(el));

  /* ── Scroll spy ──────────────────────────── */
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  function updateActiveLink() {
    const pos = window.scrollY + 120;
    let current = '';
    sections.forEach(s => {
      if (pos >= s.offsetTop && pos < s.offsetTop + s.offsetHeight) current = s.id;
    });
    navLinks.forEach(link =>
      link.classList.toggle('active', link.getAttribute('href') === `#${current}`)
    );
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  /* ── Formulario seguro ───────────────────── */
  const submitBtn  = document.getElementById('submitBtn');
  const formNote   = document.getElementById('formNote');
  const nameInput  = document.getElementById('fname');
  const emailInput = document.getElementById('femail');
  const msgInput   = document.getElementById('fmsg');
  const honeypot   = document.getElementById('f_website'); // campo anti-bot

  function showNote(msg, type) {
    if (!formNote) return;
    formNote.textContent = msg; // NUNCA innerHTML
    formNote.className = `form-note ${type}`;
    if (type === 'success') setTimeout(() => {
      formNote.textContent = ''; formNote.className = 'form-note';
    }, 6000);
  }

  function setLoading(on) {
    if (!submitBtn) return;
    submitBtn.disabled = on;
    const t = submitBtn.querySelector('.btn-text');
    const i = submitBtn.querySelector('.btn-icon');
    if (t) t.textContent = on ? 'Enviando...' : 'Enviar mensaje';
    if (i) i.textContent = on ? '⏳' : '→';
  }

  if (submitBtn && formNote && nameInput && emailInput && msgInput) {
    submitBtn.addEventListener('click', async e => {
      e.preventDefault();

      // Anti-bot honeypot
      if (honeypot && honeypot.value.trim() !== '') {
        showNote('Gracias por tu mensaje. Te contactamos pronto.', 'success');
        return;
      }

      // Rate limit
      if (!rateLimiter.check()) {
        showNote('Demasiados intentos. Esperá unos minutos e intentá de nuevo.', 'error');
        return;
      }

      const name  = sanitizeInput(nameInput.value);
      const email = sanitizeInput(emailInput.value);
      const msg   = sanitizeInput(msgInput.value);

      if (!name) { showNote('Por favor ingresá tu nombre.', 'error'); nameInput.focus(); return; }
      if (!email || !validateEmail(email)) { showNote('Ingresá un email válido.', 'error'); emailInput.focus(); return; }
      if (msg.length < 10) { showNote('Contanos un poco más sobre tu proyecto.', 'error'); msgInput.focus(); return; }

      setLoading(true);
      try {
        // ─── Reemplazar con fetch() a tu backend o Formspree ───
        // const res = await fetch('https://formspree.io/f/TU_ID', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ name, email, message: msg })
        // });
        // if (!res.ok) throw new Error('server error');
        await new Promise(r => setTimeout(r, 1200)); // simulado
        showNote('¡Gracias! Te respondemos en menos de 24 hs. 🚀', 'success');
        nameInput.value = emailInput.value = msgInput.value = '';
      } catch {
        showNote('Error al enviar. Escribinos a hola@ideo.dev', 'error');
      } finally {
        setLoading(false);
      }
    });
  }

  /* ── Cursor glow (desktop only) ─────────── */
  if (window.matchMedia('(pointer: fine)').matches) {
    const glow = document.createElement('div');
    glow.setAttribute('aria-hidden', 'true');
    glow.style.cssText = 'position:fixed;width:300px;height:300px;pointer-events:none;z-index:0;border-radius:50%;background:radial-gradient(circle,rgba(74,143,255,.06),transparent 70%);transform:translate(-50%,-50%);will-change:left,top';
    document.body.appendChild(glow);
    let mx = 0, my = 0, gx = 0, gy = 0;
    document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function tick() {
      gx += (mx - gx) * .08; gy += (my - gy) * .08;
      glow.style.left = gx + 'px'; glow.style.top = gy + 'px';
      requestAnimationFrame(tick);
    })();
  }

});