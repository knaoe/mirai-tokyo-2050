/* ============================================
   MIRAI TOKYO 2050 - Encyclopedia App
   ============================================ */

(function () {
  'use strict';

  // Category icons for placeholders
  const CATEGORY_ICONS = {
    district: '▣',
    technology: '⚡',
    creature: '◈',
    culture: '✦',
    transport: '▷',
    food: '◉',
    architecture: '△'
  };

  const CATEGORY_LABELS = {
    district: 'DISTRICT',
    technology: 'TECHNOLOGY',
    creature: 'CREATURE',
    culture: 'CULTURE',
    transport: 'TRANSPORT',
    food: 'FOOD',
    architecture: 'ARCHITECTURE'
  };

  let entries = [];
  let currentFilter = 'all';

  // ============================================
  // SAFE DOM HELPERS
  // ============================================

  function el(tag, attrs, ...children) {
    const element = document.createElement(tag);
    if (attrs) {
      for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') element.className = value;
        else if (key === 'textContent') element.textContent = value;
        else if (key.startsWith('on')) element.addEventListener(key.slice(2).toLowerCase(), value);
        else element.setAttribute(key, value);
      }
    }
    for (const child of children) {
      if (typeof child === 'string') element.appendChild(document.createTextNode(child));
      else if (child) element.appendChild(child);
    }
    return element;
  }

  // ============================================
  // DATA LOADING
  // ============================================

  async function loadEntries() {
    try {
      const response = await fetch('entries.json');
      entries = await response.json();
      renderCards(entries);
      updateEntryCount(entries.length, entries.length);
    } catch (err) {
      console.error('Failed to load entries:', err);
      const grid = document.getElementById('cards-grid');
      const p = el('p', {
        className: 'error-msg',
        textContent: '// ERROR: FAILED TO LOAD ENCYCLOPEDIA DATA //',
        style: 'text-align:center;color:var(--text-dim);font-family:Share Tech Mono,monospace;grid-column:1/-1;padding:4rem;'
      });
      grid.replaceChildren(p);
    }
  }

  // ============================================
  // CARD RENDERING (DOM-based)
  // ============================================

  function createCardImageEl(entry) {
    const wrapper = el('div', { className: 'card-image' });
    const badge = el('span', {
      className: 'card-category',
      'data-cat': entry.category,
      textContent: CATEGORY_LABELS[entry.category]
    });

    if (entry.image_path && entry.image_path.length > 0) {
      const img = el('img', { src: entry.image_path, alt: entry.title_en, loading: 'lazy' });
      wrapper.appendChild(img);
    } else {
      const placeholder = el('div', { className: 'card-image-placeholder' },
        el('div', { className: 'placeholder-grid' }),
        el('span', { className: 'placeholder-icon', textContent: CATEGORY_ICONS[entry.category] || '◆' })
      );
      wrapper.appendChild(placeholder);
    }
    wrapper.appendChild(badge);
    return wrapper;
  }

  function createCardEl(entry) {
    const card = el('article', {
      className: 'card',
      'data-id': entry.id,
      'data-category': entry.category
    });

    card.appendChild(createCardImageEl(entry));

    const body = el('div', { className: 'card-body' });
    body.appendChild(el('h2', { className: 'card-title-ja', textContent: entry.title_ja }));
    body.appendChild(el('div', { className: 'card-title-en', textContent: entry.title_en }));
    body.appendChild(el('p', { className: 'card-summary', textContent: entry.summary_ja }));

    const tagsDiv = el('div', { className: 'card-tags' });
    entry.tags.forEach(t => tagsDiv.appendChild(el('span', { className: 'card-tag', textContent: t })));
    body.appendChild(tagsDiv);

    if (entry.specs && entry.specs.year_introduced) {
      body.appendChild(el('div', { className: 'card-year', textContent: 'EST. ' + entry.specs.year_introduced }));
    }

    card.appendChild(body);

    card.addEventListener('click', () => openModal(entry));

    return card;
  }

  function renderCards(data) {
    const grid = document.getElementById('cards-grid');
    const fragment = document.createDocumentFragment();
    data.forEach(entry => fragment.appendChild(createCardEl(entry)));
    grid.replaceChildren(fragment);
  }

  function updateEntryCount(shown, total) {
    const countEl = document.getElementById('entry-count');
    countEl.textContent = '// DISPLAYING ' + shown + ' OF ' + total + ' ENTRIES //';
  }

  // ============================================
  // FILTERING
  // ============================================

  function filterEntries(category) {
    currentFilter = category;
    const grid = document.getElementById('cards-grid');

    // Hide existing cards
    const existingCards = grid.querySelectorAll('.card');
    existingCards.forEach(card => card.classList.add('hiding'));

    setTimeout(() => {
      const filtered = category === 'all'
        ? entries
        : entries.filter(e => e.category === category);

      renderCards(filtered);
      updateEntryCount(filtered.length, entries.length);
    }, 300);

    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
  }

  // ============================================
  // MODAL (DOM-based)
  // ============================================

  function createModalImageEl(entry) {
    const wrapper = el('div', { className: 'modal-image' });
    if (entry.image_path && entry.image_path.length > 0) {
      wrapper.appendChild(el('img', { src: entry.image_path, alt: entry.title_en }));
    } else {
      const placeholder = el('div', { className: 'modal-image-placeholder' },
        el('div', { className: 'placeholder-grid' }),
        el('span', { className: 'placeholder-icon', textContent: CATEGORY_ICONS[entry.category] || '◆' })
      );
      wrapper.appendChild(placeholder);
    }
    return wrapper;
  }

  function createSpecsEl(entry) {
    if (!entry.specs) return null;

    const items = [];

    if (entry.specs.year_introduced) {
      items.push({ key: 'Year Introduced', value: String(entry.specs.year_introduced) });
    }
    if (entry.specs.population) {
      items.push({ key: 'Population', value: entry.specs.population });
    }
    if (entry.specs.danger_level) {
      items.push({ key: 'Danger Level', value: '__danger__' + entry.specs.danger_level });
    }
    if (entry.specs.custom_fields) {
      for (const [key, value] of Object.entries(entry.specs.custom_fields)) {
        const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        items.push({ key: label, value: String(value) });
      }
    }

    if (items.length === 0) return null;

    const specsDiv = el('div', { className: 'modal-specs' });
    specsDiv.appendChild(el('div', { className: 'modal-specs-title', textContent: '// SPECIFICATIONS' }));

    const grid = el('div', { className: 'specs-grid' });
    items.forEach(item => {
      const specItem = el('div', { className: 'spec-item' });
      specItem.appendChild(el('span', { className: 'spec-key', textContent: item.key }));

      if (item.value.startsWith('__danger__')) {
        const level = parseInt(item.value.replace('__danger__', ''));
        const dangerDiv = el('span', { className: 'spec-value' });
        const dangerLevel = el('div', { className: 'danger-level' });
        for (let i = 0; i < 5; i++) {
          dangerLevel.appendChild(el('span', {
            className: 'danger-dot' + (i < level ? ' active' : '')
          }));
        }
        dangerDiv.appendChild(dangerLevel);
        specItem.appendChild(dangerDiv);
      } else {
        specItem.appendChild(el('span', { className: 'spec-value', textContent: item.value }));
      }

      grid.appendChild(specItem);
    });

    specsDiv.appendChild(grid);
    return specsDiv;
  }

  function openModal(entry) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');

    const catColors = {
      district: '#00f0ff',
      technology: '#b84dff',
      creature: '#00ff88',
      culture: '#ff2d7b',
      transport: '#ffe156',
      food: '#ff8844',
      architecture: '#44aaff'
    };

    const catColor = catColors[entry.category] || '#ffffff';

    const fragment = document.createDocumentFragment();

    // Image
    fragment.appendChild(createModalImageEl(entry));

    // Body
    const body = el('div', { className: 'modal-body' });

    // Category badge
    const badge = el('div', { className: 'modal-category', textContent: CATEGORY_LABELS[entry.category] });
    badge.setAttribute('data-cat', entry.category);
    badge.style.color = catColor;
    badge.style.borderColor = catColor;
    body.appendChild(badge);

    body.appendChild(el('h1', { className: 'modal-title-ja', textContent: entry.title_ja }));
    body.appendChild(el('div', { className: 'modal-title-en', textContent: entry.title_en }));
    body.appendChild(el('p', { className: 'modal-summary', textContent: entry.summary_ja }));
    body.appendChild(el('div', { className: 'modal-text', textContent: entry.body_ja }));
    body.appendChild(el('div', { className: 'modal-text-en', textContent: entry.body_en }));

    // Specs
    const specsEl = createSpecsEl(entry);
    if (specsEl) body.appendChild(specsEl);

    // Tags
    const tagsDiv = el('div', { className: 'modal-tags' });
    entry.tags.forEach(t => tagsDiv.appendChild(el('span', { className: 'modal-tag', textContent: t })));
    body.appendChild(tagsDiv);

    fragment.appendChild(body);

    content.replaceChildren(fragment);

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  // ============================================
  // BACKGROUND ANIMATION
  // ============================================

  function initBackground() {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function createParticles() {
      particles = [];
      const count = Math.min(Math.floor((w * h) / 15000), 120);
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5,
          color: Math.random() > 0.5
            ? 'rgba(0, 240, 255, ' + (Math.random() * 0.3 + 0.1) + ')'
            : 'rgba(255, 45, 123, ' + (Math.random() * 0.2 + 0.05) + ')'
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });

      // Draw connections (limit comparisons for perf)
      const maxCheck = Math.min(particles.length, 80);
      for (let i = 0; i < maxCheck; i++) {
        for (let j = i + 1; j < maxCheck; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = dx * dx + dy * dy;

          if (dist < 14400) { // 120^2
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(0, 240, 255, ' + (0.05 * (1 - Math.sqrt(dist) / 120)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    resize();
    createParticles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
  }

  // ============================================
  // EVENT LISTENERS
  // ============================================

  function initEvents() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterEntries(btn.dataset.category);
      });
    });

    // Modal close
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ============================================
  // INIT
  // ============================================

  document.addEventListener('DOMContentLoaded', () => {
    initBackground();
    initEvents();
    loadEntries();
  });
})();
