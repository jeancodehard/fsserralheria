/* ============================================================
   FS Serralheria — interações
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var header = document.querySelector('[data-header]');

  /* ---------- Cabeçalho ---------- */
  var wpp = document.querySelector('.wpp');
  var contactSection = document.getElementById('contato');
  var heroSection = document.querySelector('.hero');

  function updateWpp() {
    if (!wpp) return;
    var trigger = heroSection ? heroSection.offsetHeight * 0.55 : window.innerHeight * 0.7;
    var pastHero = window.scrollY > trigger;
    var contactNear = contactSection
      ? contactSection.getBoundingClientRect().top < window.innerHeight * 0.85
      : false;
    wpp.classList.toggle('is-visible', pastHero && !contactNear);
  }

  function onScroll() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 12);
    updateWpp();
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateWpp);

  /* ---------- Menu móvel ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  var pageRegions = [
    document.getElementById('conteudo'),
    document.querySelector('.footer'),
    document.querySelector('.skip-link'),
    wpp
  ];

  function setMenu(open) {
    if (!toggle || !menu) return;
    if (open) {
      menu.hidden = false;
      window.requestAnimationFrame(function () { menu.classList.add('is-visible'); });
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Fechar menu');
      header.classList.add('is-open');
      document.body.classList.add('is-locked');
      pageRegions.forEach(function (el) { if (el) el.inert = true; });
      var first = menu.querySelector('a');
      if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-visible');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Abrir menu');
      header.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      pageRegions.forEach(function (el) { if (el) el.inert = false; });
      window.setTimeout(function () {
        if (toggle.getAttribute('aria-expanded') === 'false') menu.hidden = true;
      }, 240);
    }
  }

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && toggle.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  /* ---------- Revelação ao rolar ---------- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Faíscas do hero ---------- */
  var canvas = document.querySelector('[data-sparks]');
  var hero = canvas ? canvas.closest('.hero') : null;
  var sparkSource = document.querySelector('[data-spark-source]');

  if (canvas && hero) {
    var ctx = canvas.getContext('2d');
    var dpr = 1;
    var w = 0;
    var h = 0;
    var particles = [];
    var sprite = null;
    var origin = { x: 0, y: 0 };
    var bX = 0, bY = 0, bW = 0, bH = 0;
    var perimeter = 0;
    var progress = 0;
    var side = 0; // 0: topo, 1: direita, 2: fundo, 3: esquerda
    var ghostBtn = document.querySelector('.hero__btn-ghost') || document.querySelector('.hero__actions .btn--ghost');
    var gBox = { left: 0, top: 0, right: 0, bottom: 0 };
    var raf = null;
    var last = 0;
    var emitAcc = 0;
    var burstTimer = 0;
    var nextBurst = 0.6;
    var running = false;
    var visible = true;
    var maxParticles = window.innerWidth < 760 ? 120 : 280;

    function makeSprite() {
      var s = document.createElement('canvas');
      s.width = s.height = 48;
      var c = s.getContext('2d');
      var g = c.createRadialGradient(24, 24, 0, 24, 24, 24);
      g.addColorStop(0, 'rgba(255, 248, 224, 0.98)');
      g.addColorStop(0.25, 'rgba(255, 190, 88, 0.75)');
      g.addColorStop(0.65, 'rgba(255, 110, 24, 0.22)');
      g.addColorStop(1, 'rgba(255, 90, 10, 0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 48, 48);
      sprite = s;
    }

    function updateRectOrigin() {
      if (!sparkSource || perimeter <= 0) return;
      var d = progress % perimeter;
      if (d < bW) {
        // Topo (esquerda -> direita)
        side = 0;
        origin.x = bX + d;
        origin.y = bY + 1;
      } else if (d < bW + bH) {
        // Lado direito (cima -> baixo)
        side = 1;
        origin.x = bX + bW - 1;
        origin.y = bY + (d - bW);
      } else if (d < 2 * bW + bH) {
        // Fundo (direita -> esquerda)
        side = 2;
        origin.x = bX + bW - (d - (bW + bH));
        origin.y = bY + bH;
      } else {
        // Lado esquerdo (baixo -> cima)
        side = 3;
        origin.x = bX + 1;
        origin.y = bY + bH - (d - (2 * bW + bH));
      }
    }

    function measure() {
      var r = hero.getBoundingClientRect();
      w = r.width;
      h = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles.length = 0;

      if (sparkSource) {
        var box = sparkSource.getBoundingClientRect();
        bX = box.left - r.left;
        bY = box.top - r.top;
        bW = box.width;
        bH = box.height;
        perimeter = 2 * (bW + bH);
        updateRectOrigin();
      } else {
        origin.x = w * 0.5;
        origin.y = h * 0.66;
      }
    }

    function spawn(count) {
      for (var i = 0; i < count; i++) {
        if (particles.length >= maxParticles) break;

        var vx = 0;
        var vy = 0;
        var life = 0.55 + Math.random() * 0.9;
        var speed = 140 + Math.pow(Math.random(), 0.58) * 480;

        // Espalhamento de espessura da tocha ao longo da borda (mais encorpado, não num ponto só)
        var offsetX = (Math.random() - 0.5) * (side === 0 || side === 2 ? 20 : 8);
        var offsetY = (Math.random() - 0.5) * (side === 1 || side === 3 ? 20 : 8);

        if (side === 0) {
          // Topo: espirra para cima com leque ligeiramente mais aberto
          var dir = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
          vx = Math.cos(dir) * speed + (Math.random() - 0.5) * 35;
          vy = Math.sin(dir) * speed - 25;
        } else if (side === 1) {
          // Lado direito: espirra para a direita em leque
          var dir = (Math.random() - 0.5) * 1.25;
          vx = Math.cos(dir) * speed + 30;
          vy = Math.sin(dir) * speed - 20;
        } else if (side === 3) {
          // Lado esquerdo: espirra para a esquerda em leque
          var dir = Math.PI + (Math.random() - 0.5) * 1.25;
          vx = Math.cos(dir) * speed - 30;
          vy = Math.sin(dir) * speed - 20;
        } else {
          // Fundo (lado 2): fogo sai para baixo e para os lados naturalmente
          var dir = Math.PI / 2 + (Math.random() - 0.5) * 1.45;
          vx = Math.cos(dir) * speed;
          vy = Math.sin(dir) * (speed * 0.75) + 15;
        }

        particles.push({
          x: origin.x + offsetX,
          y: origin.y + offsetY,
          px: 0,
          py: 0,
          vx: vx,
          vy: vy,
          life: life,
          age: 0,
          size: 0.7 + Math.random() * 1.3,
          glow: 2.5 + Math.random() * 4.5
        });
      }
    }

    function step(now) {
      if (!running) return;
      var dt = Math.min((now - last) / 1000, 0.034);
      last = now;

      // Auto-alinha as coordenadas do botão em relação ao hero
      if (sparkSource) {
        var r = hero.getBoundingClientRect();
        var box = sparkSource.getBoundingClientRect();
        var curBX = box.left - r.left;
        var curBY = box.top - r.top;
        if (Math.abs(curBY - bY) > 0.5 || Math.abs(curBX - bX) > 0.5 || bW !== box.width) {
          bX = curBX;
          bY = curBY;
          bW = box.width;
          bH = box.height;
          perimeter = 2 * (bW + bH);
        }

        if (ghostBtn) {
          var gb = ghostBtn.getBoundingClientRect();
          gBox.left = gb.left - r.left;
          gBox.top = gb.top - r.top;
          gBox.right = gBox.left + gb.width;
          gBox.bottom = gBox.top + gb.height;
        }

        // Avança a tocha em percurso retangular contornando o botão bem devagar (~22s por volta)
        if (perimeter > 0) {
          var speedPx = perimeter / 22;
          progress = (progress + dt * speedPx) % perimeter;
          updateRectOrigin();
        }
      }

      burstTimer += dt;
      if (burstTimer > nextBurst && visible) {
        burstTimer = 0;
        nextBurst = 0.8 + Math.random() * 1.6;
        spawn(12 + Math.floor(Math.random() * 18));
      }
      if (visible) {
        emitAcc += dt * (maxParticles < 150 ? 110 : 170);
        var count = Math.min(8, Math.floor(emitAcc));
        emitAcc -= count;
        if (count > 0) spawn(count);
      }

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      // Halo luminoso da tocha incandescente
      if (sprite) {
        var halo = 145;
        ctx.globalAlpha = 0.42;
        ctx.drawImage(sprite, origin.x - halo / 2, origin.y - halo / 2, halo, halo);
        ctx.globalAlpha = 1;
      }

      // Limite estrito: faíscas NUNCA ultrapassam para dentro da faixa marquee lá embaixo
      var maxBottomLimit = h - 25;

      for (var i = particles.length - 1; i >= 0; i--) {
        var p = particles[i];
        p.age += dt;

        if (p.age >= p.life || p.y >= maxBottomLimit) {
          particles.splice(i, 1);
          continue;
        }

        p.px = p.x;
        p.py = p.y;
        p.vy += 320 * dt;
        p.vx *= 1 - 0.55 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.y >= maxBottomLimit) {
          particles.splice(i, 1);
          continue;
        }

        // Protege o botão "Ver trabalhos": as faíscas não passam na frente de suas bordas e letras
        if (ghostBtn && p.x >= gBox.left - 2 && p.x <= gBox.right + 2 && p.y >= gBox.top - 2 && p.y <= gBox.bottom + 2) {
          continue;
        }

        var t = p.age / p.life;
        var alpha = Math.max(0, 1 - t * t);

        // Desvanece suavemente ao chegar próximo da faixa marquee lá embaixo
        if (p.y > maxBottomLimit - 45) {
          alpha *= Math.max(0, (maxBottomLimit - p.y) / 45);
        }

        var tailX = p.x - p.vx * 0.045;
        var tailY = p.y - p.vy * 0.045;

        ctx.strokeStyle = 'rgba(255, 172, 76, ' + (alpha * 0.88).toFixed(3) + ')';
        ctx.lineWidth = p.size * (1 - t * 0.55);
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();

        if (sprite) {
          var gsize = p.glow * (1 - t * 0.45);
          ctx.globalAlpha = alpha * 0.55;
          ctx.drawImage(sprite, p.x - gsize / 2, p.y - gsize / 2, gsize, gsize);
          ctx.globalAlpha = 1;
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(step);
    }

    function start() {
      if (reduceMotion || running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 70; i++) {
        var angle = -Math.PI * (0.06 + Math.random() * 0.88);
        var dist = 30 + Math.pow(Math.random(), 0.72) * Math.min(w * 0.62, 660);
        var x = origin.x + Math.cos(angle) * dist;
        var y = origin.y + Math.sin(angle) * dist + dist * dist * 0.0012;
        var size = 2 + Math.random() * 10;
        ctx.globalAlpha = 0.25 + Math.random() * 0.55;
        if (sprite) ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function init() {
      makeSprite();
      measure();
      if (sparkSource) {
        sparkSource.addEventListener('animationend', measure, { once: true });
      }
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(measure);
      }
      if (reduceMotion) {
        drawStatic();
      } else {
        start();
      }
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        var wasRunning = running;
        stop();
        particles.length = 0;
        measure();
        if (reduceMotion) drawStatic();
        else if (wasRunning) start();
      }, 180);
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (!visible) {
          particles.length = 0;
          ctx.clearRect(0, 0, w, h);
        }
      }, { threshold: 0 }).observe(hero);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else if (visible) start();
    });

    init();
  }

  /* ---------- Galeria / lightbox ---------- */
  var dialog = document.querySelector('[data-lightbox]');
  var gallery = [
    {
      full: 'assets/fotos/grade-residencial-1448.webp',
      title: 'Grade residencial',
      cat: 'Grades',
      alt: 'Grade metálica preta instalada sobre muro de alvenaria em frente a uma residência'
    },
    {
      full: 'assets/fotos/protecao-metalica-1086.webp',
      title: 'Proteção metálica',
      cat: 'Proteções',
      alt: 'Proteção metálica branca fixada na parede, com porta e fechadura'
    },
    {
      full: 'assets/fotos/soldagem-detalhe-900.webp',
      title: 'Soldagem em estrutura',
      cat: 'Soldagem',
      alt: 'Detalhe de soldagem em estrutura metálica, com faíscas na união das peças'
    },
    {
      full: 'assets/fotos/estrutura-caminhao-1448.webp',
      title: 'Estrutura para caminhão',
      cat: 'Veículos',
      alt: 'Estrutura metálica instalada na carroceria de um caminhão'
    }
  ];

  if (dialog && typeof dialog.showModal === 'function') {
    var lbImg = dialog.querySelector('[data-lb-img]');
    var lbTitle = dialog.querySelector('[data-lb-title]');
    var lbCat = dialog.querySelector('[data-lb-cat]');
    var lbIndex = dialog.querySelector('[data-lb-index]');
    var current = 0;
    var lastTrigger = null;
    var touchX = null;

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    function render(i) {
      current = (i + gallery.length) % gallery.length;
      var item = gallery[current];
      lbImg.src = item.full;
      lbImg.alt = item.alt;
      lbTitle.textContent = item.title;
      lbCat.textContent = item.cat;
      lbIndex.textContent = pad(current + 1);
      var next = gallery[(current + 1) % gallery.length];
      var prev = gallery[(current - 1 + gallery.length) % gallery.length];
      new Image().src = next.full;
      new Image().src = prev.full;
    }

    function open(i, trigger) {
      lastTrigger = trigger || null;
      render(i);
      dialog.showModal();
      document.body.classList.add('is-locked');
      var closeBtn = dialog.querySelector('[data-lb-close]');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }

    function close() {
      if (dialog.open) dialog.close();
    }

    document.querySelectorAll('[data-work]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        open(parseInt(btn.getAttribute('data-work'), 10) || 0, btn);
      });
    });

    dialog.querySelector('[data-lb-close]').addEventListener('click', close);
    dialog.querySelector('[data-lb-prev]').addEventListener('click', function () { render(current - 1); });
    dialog.querySelector('[data-lb-next]').addEventListener('click', function () { render(current + 1); });

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) close();
    });

    dialog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); render(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); render(current + 1); }
    });

    dialog.addEventListener('touchstart', function (e) {
      touchX = e.changedTouches[0].clientX;
    }, { passive: true });

    dialog.addEventListener('touchend', function (e) {
      if (touchX === null) return;
      var dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 55) render(current + (dx < 0 ? 1 : -1));
      touchX = null;
    }, { passive: true });

    dialog.addEventListener('close', function () {
      document.body.classList.remove('is-locked');
      if (lastTrigger) lastTrigger.focus({ preventScroll: true });
    });
  }

  /* ---------- Ano ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
