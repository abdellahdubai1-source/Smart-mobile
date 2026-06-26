/* ===================================================================
   SMART MOBILE — APPLICATION SCRIPT
   Vanilla ES6 JavaScript. No jQuery, no external libraries.

   NOTE ON DYNAMIC STYLES:
   The testimonial slider (arrows/dots) and the back-to-top button
   have no matching markup or CSS in the existing index.html/style.css,
   and those files are not being regenerated here. To deliver both
   features without touching either file, this script injects one
   small, scoped <style> block at runtime and creates the missing
   elements itself. Every other feature uses only the classes/IDs
   already present in the existing HTML.
   =================================================================== */

(() => {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* -----------------------------------------------------------------
     DYNAMIC STYLES (required only for the slider + back-to-top button)
     ----------------------------------------------------------------- */
  function injectDynamicStyles() {
    const css = `
      .js-reveal {
        opacity: 0;
        transform: translateY(28px);
        transition: opacity .7s cubic-bezier(.16,1,.3,1),
                    transform .7s cubic-bezier(.16,1,.3,1);
        will-change: opacity, transform;
      }
      .js-reveal.is-visible { opacity: 1; transform: translateY(0); }

      .testimonials-grid.is-slider {
        display: flex;
        flex-wrap: nowrap;
        overflow: hidden;
        touch-action: pan-y;
        transition: transform .5s cubic-bezier(.16,1,.3,1);
      }
      .testimonials-grid.is-slider .testimonial-card { flex: 0 0 100%; }

      .testimonial-controls {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.25rem;
        margin-top: 2.5rem;
      }
      .testimonial-arrow {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid var(--border, #e3e8f0);
        background: var(--surface, #fff);
        color: var(--ink-700, #2c3444);
        font-size: 1.2rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background-color .25s ease, color .25s ease, transform .25s ease;
      }
      .testimonial-arrow:hover {
        background: var(--blue-600, #2f6fed);
        color: #fff;
        transform: translateY(-2px);
      }
      .testimonial-dots { display: flex; align-items: center; gap: .5rem; }
      .testimonial-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: none;
        padding: 0;
        background: var(--border, #e3e8f0);
        cursor: pointer;
        transition: background-color .25s ease, transform .25s ease;
      }
      .testimonial-dot.is-active {
        background: var(--blue-600, #2f6fed);
        transform: scale(1.3);
      }

      .back-to-top-btn {
        position: fixed;
        right: 1.5rem;
        bottom: 6.25rem;
        width: 46px;
        height: 46px;
        border-radius: 50%;
        border: none;
        background: var(--navy-900, #0a1228);
        color: #fff;
        font-size: 1.15rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(10, 18, 40, .35);
        opacity: 0;
        transform: translateY(14px);
        pointer-events: none;
        transition: opacity .3s ease, transform .3s ease, background-color .25s ease;
        z-index: 899;
      }
      .back-to-top-btn.is-visible {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
      }
      .back-to-top-btn:hover { background: var(--blue-600, #2f6fed); }
    `;

    const styleTag = document.createElement('style');
    styleTag.id = 'sm-dynamic-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  /* -----------------------------------------------------------------
     1. MOBILE MENU
     Opens/closes the hamburger menu and closes it whenever a nav
     link is clicked.
     ----------------------------------------------------------------- */
  function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const nav = document.getElementById('main-nav');
    if (!menuBtn || !nav) return;

    const openMenu = () => {
      nav.classList.add('is-open');
      menuBtn.classList.add('is-active');
      menuBtn.setAttribute('aria-expanded', 'true');
    };

    const closeMenu = () => {
      nav.classList.remove('is-open');
      menuBtn.classList.remove('is-active');
      menuBtn.setAttribute('aria-expanded', 'false');
    };

    menuBtn.addEventListener('click', () => {
      nav.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    nav.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) closeMenu();
    });
  }

  /* -----------------------------------------------------------------
     2 & 8. STICKY HEADER + BACK-TO-TOP BUTTON
     Share a single rAF-throttled scroll listener for performance.
     ----------------------------------------------------------------- */
  function createBackToTopButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'back-to-top-btn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '&#8593;';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    return btn;
  }

  function initScrollEffects() {
    const header = document.getElementById('site-header');
    const backToTopBtn = createBackToTopButton();

    const HEADER_THRESHOLD = 40;
    const BACK_TO_TOP_THRESHOLD = 400;
    let ticking = false;

    const update = () => {
      const scrollY = window.scrollY;

      if (header) header.classList.toggle('is-scrolled', scrollY > HEADER_THRESHOLD);
      backToTopBtn.classList.toggle('is-visible', scrollY > BACK_TO_TOP_THRESHOLD);

      ticking = false;
    };

    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );

    update(); // correct state if the page loads already scrolled
  }

  /* -----------------------------------------------------------------
     3. SMOOTH SCROLLING
     Applies to every internal anchor link, offsetting for the fixed
     header so the target section is never hidden behind it.
     ----------------------------------------------------------------- */
  function initSmoothScroll() {
    const header = document.getElementById('site-header');
    const getOffset = () => (header ? header.offsetHeight : 0) + 12;

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const hash = link.getAttribute('href');
        if (!hash || hash === '#') return;

        const target = document.querySelector(hash);
        if (!target) return;

        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - getOffset();
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });

        if (history.pushState) history.pushState(null, '', hash);
      });
    });
  }

  /* -----------------------------------------------------------------
     4. ACTIVE NAVIGATION LINKS
     Highlights the nav link matching whichever section is currently
     in view, using Intersection Observer (no scroll polling).
     ----------------------------------------------------------------- */
  function initActiveNavOnScroll() {
    const header = document.getElementById('site-header');
    const navLinks = Array.from(document.querySelectorAll('.nav-link'));
    if (!navLinks.length) return;

    const linkMap = new Map();
    navLinks.forEach((link) => {
      const id = (link.getAttribute('href') || '').replace('#', '');
      const section = id ? document.getElementById(id) : null;
      if (section) linkMap.set(section, link);
    });

    if (!linkMap.size) return;

    const setActive = (activeLink) => {
      navLinks.forEach((link) => {
        const isActive = link === activeLink;
        link.classList.toggle('active', isActive);
        if (isActive) {
          link.setAttribute('aria-current', 'page');
          link.style.color = 'var(--cyan-400)';
        } else {
          link.removeAttribute('aria-current');
          link.style.color = '';
        }
      });
    };

    const headerHeight = header ? header.offsetHeight : 0;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const link = linkMap.get(entry.target);
            if (link) setActive(link);
          }
        });
      },
      { rootMargin: `-${headerHeight + 20}px 0px -55% 0px`, threshold: 0 }
    );

    linkMap.forEach((_, section) => observer.observe(section));
  }

  /* -----------------------------------------------------------------
     5. FAQ ACCORDION
     Only one item stays open at a time. Height animation is already
     handled by the CSS grid-rows transition on .faq-answer.
     ----------------------------------------------------------------- */
  function initFaqAccordion() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach((item) => {
      const question = item.querySelector('.faq-question');
      if (!question) return;

      question.addEventListener('click', () => {
        const wasActive = item.classList.contains('active');

        items.forEach((other) => {
          other.classList.remove('active');
          const otherQuestion = other.querySelector('.faq-question');
          if (otherQuestion) otherQuestion.setAttribute('aria-expanded', 'false');
        });

        if (!wasActive) {
          item.classList.add('active');
          question.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  /* -----------------------------------------------------------------
     6. TESTIMONIAL SLIDER
     Auto-advances every 5s, supports prev/next buttons, dot
     indicators, pause-on-hover, and touch swipe on mobile.
     ----------------------------------------------------------------- */
  function initTestimonialSlider() {
    const grid = document.querySelector('.testimonials-grid');
    if (!grid) return;

    const cards = Array.from(grid.children).filter((el) =>
      el.classList.contains('testimonial-card')
    );
    if (cards.length < 2) return;

    grid.classList.add('is-slider');

    // Controls are built here since they don't exist in the markup
    const controls = document.createElement('div');
    controls.className = 'testimonial-controls';
    controls.innerHTML = `
      <button type="button" class="testimonial-arrow testimonial-prev" aria-label="Previous testimonial">&#8249;</button>
      <div class="testimonial-dots"></div>
      <button type="button" class="testimonial-arrow testimonial-next" aria-label="Next testimonial">&#8250;</button>
    `;
    grid.insertAdjacentElement('afterend', controls);

    const dotsWrap = controls.querySelector('.testimonial-dots');
    const dots = cards.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'testimonial-dot';
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(i);
        restartAutoplay();
      });
      dotsWrap.appendChild(dot);
      return dot;
    });

    let activeIndex = 0;
    let autoplayId = null;

    const render = () => {
      grid.style.transform = `translateX(-${activeIndex * 100}%)`;
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeIndex));
    };

    const goToSlide = (index) => {
      activeIndex = (index + cards.length) % cards.length;
      render();
    };

    const nextSlide = () => goToSlide(activeIndex + 1);
    const prevSlide = () => goToSlide(activeIndex - 1);

    const stopAutoplay = () => {
      if (autoplayId) clearInterval(autoplayId);
      autoplayId = null;
    };

    const startAutoplay = () => {
      if (prefersReducedMotion) return;
      stopAutoplay();
      autoplayId = setInterval(nextSlide, 5000);
    };

    const restartAutoplay = () => startAutoplay();

    controls.querySelector('.testimonial-prev').addEventListener('click', () => {
      prevSlide();
      restartAutoplay();
    });
    controls.querySelector('.testimonial-next').addEventListener('click', () => {
      nextSlide();
      restartAutoplay();
    });

    // Pause autoplay while the user's pointer is over the slider
    [grid, controls].forEach((el) => {
      el.addEventListener('mouseenter', stopAutoplay);
      el.addEventListener('mouseleave', startAutoplay);
    });

    // Touch swipe support
    let touchStartX = 0;
    const SWIPE_THRESHOLD = 45;

    grid.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
      },
      { passive: true }
    );

    grid.addEventListener(
      'touchend',
      (e) => {
        const touchEndX = e.changedTouches[0].screenX;
        const delta = touchStartX - touchEndX;
        if (Math.abs(delta) > SWIPE_THRESHOLD) {
          delta > 0 ? nextSlide() : prevSlide();
        }
        startAutoplay();
      },
      { passive: true }
    );

    render();
    startAutoplay();
  }

  /* -----------------------------------------------------------------
     7. REVEAL ON SCROLL
     Fades/slides product cards, service cards, the AI section,
     testimonials, and the contact section into view as they enter
     the viewport, using Intersection Observer.
     ----------------------------------------------------------------- */
  function initRevealOnScroll() {
    const selectors = [
      '.product-card',
      '.service-card',
      '.ai-assistant-content',
      '.ai-chat-preview',
      '.testimonial-card',
      '.contact-content',
      '.contact-map',
    ];

    const targets = document.querySelectorAll(selectors.join(','));
    if (!targets.length) return;

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    targets.forEach((el, index) => {
      el.classList.add('js-reveal');
      el.style.transitionDelay = `${(index % 4) * 90}ms`;
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
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* -----------------------------------------------------------------
     9. AI QUICK ACTION BUTTONS
     Clicking any quick-action button scrolls smoothly to the
     AI Assistant section.
     ----------------------------------------------------------------- */
  function initAiQuickActions() {
    const section = document.getElementById('ai-assistant');
    const header = document.getElementById('site-header');
    const quickButtons = document.querySelectorAll('.ai-quick-btn');

    if (!section || !quickButtons.length) return;

    quickButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const offset = (header ? header.offsetHeight : 0) + 12;
        const top = section.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      });
    });
  }

  /* -----------------------------------------------------------------
     10. WHATSAPP LINKS
     Ensures every WhatsApp button/link opens the correct number in
     a new tab safely, regardless of which element it is.
     ----------------------------------------------------------------- */
  function initWhatsAppLinks() {
    const WHATSAPP_URL = 'https://wa.me/971581197208';

    document.querySelectorAll('a[href*="wa.me"]').forEach((link) => {
      const href = link.getAttribute('href') || '';

      // Normalize the number in case a link is ever added without it
      if (!href.includes('971581197208')) {
        link.setAttribute('href', WHATSAPP_URL);
      }

      if (!link.hasAttribute('target')) link.setAttribute('target', '_blank');
      if (!link.getAttribute('rel')) link.setAttribute('rel', 'noopener noreferrer');
    });
  }

  /* -----------------------------------------------------------------
     INIT — run everything once the DOM is ready
     ----------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', () => {
    injectDynamicStyles();
    initMobileMenu();
    initScrollEffects();
    initSmoothScroll();
    initActiveNavOnScroll();
    initFaqAccordion();
    initTestimonialSlider();
    initRevealOnScroll();
    initAiQuickActions();
    initWhatsAppLinks();
  });
})();
