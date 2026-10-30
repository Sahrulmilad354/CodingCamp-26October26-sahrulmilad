/* Life Dashboard - vanilla JavaScript, data saved in Local Storage */

(function () {
  'use strict';

  // ---------- Storage helpers ----------
  var KEYS = {
    tasks: 'ld_tasks',
    links: 'ld_links',
    name: 'ld_name',
    theme: 'ld_theme',
    duration: 'ld_duration'
  };

  function load(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // Storage may be full or blocked; the app keeps working in memory.
    }
  }

  function pad(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function makeId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  // ---------- Greeting, clock & custom name ----------
  var clockEl = document.getElementById('clock');
  var dateEl = document.getElementById('date');
  var greetingEl = document.getElementById('greeting');
  var nameForm = document.getElementById('name-form');
  var nameInput = document.getElementById('name-input');

  var userName = load(KEYS.name, '');

  function getGreeting(hour) {
    if (hour >= 5 && hour < 12) return 'Good Morning';
    if (hour >= 12 && hour < 17) return 'Good Afternoon';
    if (hour >= 17 && hour < 21) return 'Good Evening';
    return 'Good Night';
  }

  function updateClock() {
    var now = new Date();
    clockEl.textContent =
      pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    dateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    var text = getGreeting(now.getHours());
    greetingEl.textContent = userName ? text + ', ' + userName : text;
  }

  nameForm.addEventListener('submit', function (e) {
    e.preventDefault();
    userName = nameInput.value.trim();
    save(KEYS.name, userName);
    updateClock();
  });

  nameInput.value = userName;
  updateClock();
  setInterval(updateClock, 1000);

  // ---------- Light / Dark mode ----------
  var themeBtn = document.getElementById('theme-toggle');

  var particleRGB = '255,255,255';

  function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
    particleRGB = theme === 'dark' ? '94,234,212' : '13,148,136';
    themeBtn.textContent = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    themeBtn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
  }

  var savedTheme = load(KEYS.theme, null);
  if (!savedTheme) {
    savedTheme =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
  }
  applyTheme(savedTheme);

  themeBtn.addEventListener('click', function () {
    var next = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.body.classList.add('theme-fade');
    applyTheme(next);
    setTimeout(function () {
      document.body.classList.remove('theme-fade');
    }, 600);
    save(KEYS.theme, next);
  });

  // ---------- Focus timer (changeable duration) ----------
  var timerDisplay = document.getElementById('timer-display');
  var startBtn = document.getElementById('timer-start');
  var stopBtn = document.getElementById('timer-stop');
  var resetBtn = document.getElementById('timer-reset');
  var durationForm = document.getElementById('duration-form');
  var durationInput = document.getElementById('duration-input');

  var durationMin = load(KEYS.duration, 25);
  var remaining = durationMin * 60;
  var timerId = null;

  function renderTimer() {
    timerDisplay.textContent = pad(Math.floor(remaining / 60)) + ':' + pad(remaining % 60);
  }

  function stopTimer() {
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
    timerDisplay.classList.remove('running');
  }

  function startTimer() {
    if (timerId !== null || remaining <= 0) return;
    timerDisplay.classList.add('running');
    timerId = setInterval(function () {
      remaining -= 1;
      renderTimer();
      if (remaining <= 0) {
        stopTimer();
        alert('Time is up! Take a short break.');
      }
    }, 1000);
  }

  function resetTimer() {
    stopTimer();
    remaining = durationMin * 60;
    renderTimer();
  }

  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', stopTimer);
  resetBtn.addEventListener('click', resetTimer);

  durationForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = parseInt(durationInput.value, 10);
    if (isNaN(value) || value < 1 || value > 180) {
      alert('Please enter a number between 1 and 180 minutes.');
      return;
    }
    durationMin = value;
    save(KEYS.duration, durationMin);
    resetTimer();
  });

  durationInput.value = durationMin;
  renderTimer();

  // ---------- To-do list ----------
  var taskForm = document.getElementById('task-form');
  var taskInput = document.getElementById('task-input');
  var taskList = document.getElementById('task-list');
  var taskEmpty = document.getElementById('task-empty');

  var tasks = load(KEYS.tasks, []);
  var editingId = null;

  function saveTasks() {
    save(KEYS.tasks, tasks);
  }

  function makeButton(label, className, handler) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = className;
    btn.textContent = label;
    btn.addEventListener('click', handler);
    return btn;
  }

  function renderTasks() {
    taskList.innerHTML = '';
    taskEmpty.hidden = tasks.length > 0;

    tasks.forEach(function (task) {
      var li = document.createElement('li');
      li.className = 'task-item' + (task.done ? ' done' : '');

      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.setAttribute('aria-label', 'Mark task as done');
      checkbox.addEventListener('change', function () {
        task.done = checkbox.checked;
        saveTasks();
        renderTasks();
      });
      li.appendChild(checkbox);

      var actions = document.createElement('div');
      actions.className = 'task-actions';

      if (editingId === task.id) {
        var editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.className = 'task-edit-input';
        editInput.value = task.text;
        editInput.maxLength = 120;
        li.appendChild(editInput);

        var commit = function () {
          var value = editInput.value.trim();
          if (value) {
            task.text = value;
            saveTasks();
          }
          editingId = null;
          renderTasks();
        };

        editInput.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            editingId = null;
            renderTasks();
          }
        });

        actions.appendChild(makeButton('Save', 'btn btn-primary btn-small', commit));
        li.appendChild(actions);
        taskList.appendChild(li);
        editInput.focus();
        return;
      }

      var text = document.createElement('span');
      text.className = 'task-text';
      text.textContent = task.text;
      li.appendChild(text);

      actions.appendChild(
        makeButton('Edit', 'btn btn-secondary btn-small', function () {
          editingId = task.id;
          renderTasks();
        })
      );
      actions.appendChild(
        makeButton('Delete', 'btn btn-danger', function () {
          tasks = tasks.filter(function (t) {
            return t.id !== task.id;
          });
          saveTasks();
          renderTasks();
        })
      );
      li.appendChild(actions);
      taskList.appendChild(li);
    });
  }

  taskForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var value = taskInput.value.trim();
    if (!value) return;
    tasks.push({ id: makeId(), text: value, done: false });
    saveTasks();
    taskInput.value = '';
    renderTasks();
  });

  renderTasks();

  // ---------- Quick links ----------
  var linkForm = document.getElementById('link-form');
  var linkNameInput = document.getElementById('link-name');
  var linkUrlInput = document.getElementById('link-url');
  var linkList = document.getElementById('link-list');

  var defaultLinks = [
    { id: 'd1', name: 'Google', url: 'https://www.google.com' },
    { id: 'd2', name: 'Gmail', url: 'https://mail.google.com' },
    { id: 'd3', name: 'Calendar', url: 'https://calendar.google.com' }
  ];
  var links = load(KEYS.links, defaultLinks);

  function normalizeUrl(raw) {
    var url = raw.trim();
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    try {
      var parsed = new URL(url);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
      return parsed.href;
    } catch (e) {
      return null;
    }
  }

  function renderLinks() {
    linkList.innerHTML = '';
    links.forEach(function (link) {
      var wrapper = document.createElement('div');
      wrapper.className = 'link-item';

      var anchor = document.createElement('a');
      anchor.className = 'link-btn';
      anchor.href = link.url;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.textContent = link.name;
      anchor.title = link.url;
      wrapper.appendChild(anchor);

      var remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'link-remove';
      remove.textContent = '✕';
      remove.setAttribute('aria-label', 'Remove ' + link.name);
      remove.addEventListener('click', function () {
        links = links.filter(function (l) {
          return l.id !== link.id;
        });
        save(KEYS.links, links);
        renderLinks();
      });
      wrapper.appendChild(remove);

      linkList.appendChild(wrapper);
    });
  }

  linkForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = linkNameInput.value.trim();
    var url = normalizeUrl(linkUrlInput.value);
    if (!name || !linkUrlInput.value.trim()) return;
    if (!url) {
      alert('Please enter a valid URL, for example https://example.com');
      return;
    }
    links.push({ id: makeId(), name: name, url: url });
    save(KEYS.links, links);
    linkNameInput.value = '';
    linkUrlInput.value = '';
    renderLinks();
  });

  renderLinks();

  // ---------- Interactive animated background (canvas particles) ----------
  var canvas = document.getElementById('bg-canvas');
  var ctx = canvas.getContext('2d');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var particles = [];
  var width = 0;
  var height = 0;
  var mouse = { x: -9999, y: -9999, active: false };
  var LINK_DIST = 120;
  var MOUSE_DIST = 160;

  function makeParticle(x, y, burst) {
    var angle = Math.random() * Math.PI * 2;
    var speed = burst ? 1.5 + Math.random() * 2.5 : 0.15 + Math.random() * 0.45;
    return {
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      r: 1.2 + Math.random() * 2.2,
      life: burst ? 1 : -1 // burst particles fade out, normal ones live forever
    };
  }

  function resizeCanvas() {
    var dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var target = Math.min(110, Math.floor((width * height) / 14000));
    var base = particles.filter(function (p) { return p.life < 0; });
    while (base.length < target) {
      base.push(makeParticle(Math.random() * width, Math.random() * height, false));
    }
    base.length = Math.min(base.length, target);
    particles = base.concat(particles.filter(function (p) { return p.life >= 0; }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);
    var i, j, p, q, dx, dy, dist, alpha;

    for (i = particles.length - 1; i >= 0; i--) {
      p = particles[i];

      // mouse repel: particles drift away from the cursor
      if (mouse.active) {
        dx = p.x - mouse.x;
        dy = p.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST && dist > 0.1) {
          var force = (1 - dist / MOUSE_DIST) * 0.9;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }

      // gentle damping so the speed settles back
      p.vx *= 0.985;
      p.vy *= 0.985;
      var minSpeed = p.life < 0 ? 0.12 : 0;
      var sp = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (sp < minSpeed && sp > 0) {
        p.vx = (p.vx / sp) * minSpeed;
        p.vy = (p.vy / sp) * minSpeed;
      }

      p.x += p.vx;
      p.y += p.vy;

      // wrap around the edges
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      if (p.life >= 0) {
        p.life -= 0.012;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
      }

      alpha = p.life >= 0 ? p.life * 0.9 : 0.75;
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + particleRGB + ',' + alpha + ')';
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // lines between nearby particles
    for (i = 0; i < particles.length; i++) {
      p = particles[i];
      for (j = i + 1; j < particles.length; j++) {
        q = particles[j];
        dx = p.x - q.x;
        dy = p.y - q.y;
        dist = dx * dx + dy * dy;
        if (dist < LINK_DIST * LINK_DIST) {
          alpha = (1 - Math.sqrt(dist) / LINK_DIST) * 0.35;
          ctx.strokeStyle = 'rgba(' + particleRGB + ',' + alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      // lines from the cursor to nearby particles
      if (mouse.active) {
        dx = p.x - mouse.x;
        dy = p.y - mouse.y;
        dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_DIST) {
          alpha = (1 - dist / MOUSE_DIST) * 0.5;
          ctx.strokeStyle = 'rgba(' + particleRGB + ',' + alpha + ')';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    }
  }

  var rafId = null;

  function loop() {
    step();
    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (rafId === null && !reduceMotion) loop();
  }

  function stopLoop() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  window.addEventListener('resize', resizeCanvas);

  window.addEventListener('mousemove', function (e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });

  window.addEventListener('mouseleave', function () {
    mouse.active = false;
  });

  // click on empty space: burst of particles
  window.addEventListener('click', function (e) {
    if (reduceMotion) return;
    if (e.target.closest('.card, button, a, input')) return;
    for (var k = 0; k < 14; k++) {
      particles.push(makeParticle(e.clientX, e.clientY, true));
    }
  });

  // pause drawing when the tab is hidden to save battery
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopLoop();
    else startLoop();
  });

  resizeCanvas();
  if (reduceMotion) step(); // draw one static frame
  else startLoop();
})();
