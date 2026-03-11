document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const navCta = document.getElementById('navCta');

  // Navbar background on scroll
  const handleScroll = () => {
    if (window.scrollY > 10) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll();

  // Mobile menu toggle
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('.mob-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
      });
    });
  }

  // Scroll to contact from navbar CTA
  if (navCta) {
    navCta.addEventListener('click', () => {
      const contact = document.getElementById('contact');
      if (contact) {
        contact.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Reveal on scroll
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

  // Stats counter
  const statObserver = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target') || '0', 10);
        if (!target || el.dataset.done === 'true') {
          statObserver.unobserve(el);
          return;
        }
        el.dataset.done = 'true';
        let current = 0;
        const duration = 1200;
        const start = performance.now();
        const step = now => {
          const progress = Math.min((now - start) / duration, 1);
          current = Math.floor(progress * target);
          el.textContent = String(current);
          if (progress < 1) {
            requestAnimationFrame(step);
          } else {
            el.textContent = String(target);
          }
        };
        requestAnimationFrame(step);
        statObserver.unobserve(el);
      });
    },
    { threshold: 0.4 }
  );

  document.querySelectorAll('.stat-num').forEach(el => statObserver.observe(el));

  // Scrollspy active link
  const updateActiveLink = () => {
    let currentId = '';
    const scrollPos = window.scrollY + 120;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollPos >= top && scrollPos < top + height) {
        currentId = section.id;
      }
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href') || '';
      if (href === `#${currentId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  };
  window.addEventListener('scroll', updateActiveLink);
  updateActiveLink();

  // Contact form (frontend only)
  const submitBtn = document.getElementById('submitBtn');
  const formNote = document.getElementById('formNote');
  const nameInput = document.getElementById('fname');
  const emailInput = document.getElementById('femail');
  const msgInput = document.getElementById('fmsg');

  if (submitBtn && formNote && nameInput && emailInput && msgInput) {
    submitBtn.addEventListener('click', e => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const msg = msgInput.value.trim();

      if (!name || !email || !msg) {
        formNote.textContent = 'Completá todos los campos para continuar.';
        formNote.classList.remove('success');
        formNote.classList.add('error');
        return;
      }

      formNote.textContent = 'Gracias por tu mensaje. Te vamos a responder en menos de 24 hs.';
      formNote.classList.remove('error');
      formNote.classList.add('success');
      nameInput.value = '';
      emailInput.value = '';
      msgInput.value = '';
    });
  }
});

