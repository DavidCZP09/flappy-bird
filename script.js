(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  const WIDTH = 360;
  const HEIGHT = 640;

  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = WIDTH * dpr;
  canvas.height = HEIGHT * dpr;
  ctx.scale(dpr, dpr);

  const GRAVITY = 1500;
  const FLAP_VELOCITY = -420;
  const PIPE_GAP = 160;
  const PIPE_WIDTH = 60;
  const PIPE_SPACING = 200;
  const PIPE_SPEED = 140;
  const GROUND_HEIGHT = 80;
  const BIRD_X = WIDTH * 0.3;
  const BIRD_RADIUS = 14;

  const STORAGE_KEY = 'flappy-bird-high-score';

  const hud = document.getElementById('hud');
  const scoreEl = document.getElementById('score');
  const startScreen = document.getElementById('start-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const startHighScoreEl = document.getElementById('start-high-score');
  const finalScoreEl = document.getElementById('final-score');
  const finalHighScoreEl = document.getElementById('final-high-score');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');

  let highScore = Number(localStorage.getItem(STORAGE_KEY) || 0);
  startHighScoreEl.textContent = highScore;

  const STATE = { READY: 'ready', PLAYING: 'playing', GAME_OVER: 'gameover' };
  let state = STATE.READY;

  let bird, pipes, score, groundOffset, lastTime, flashTime;

  function resetGame() {
    bird = { x: BIRD_X, y: HEIGHT / 2, vy: 0, rotation: 0 };
    pipes = [];
    score = 0;
    groundOffset = 0;
    flashTime = 0;
    spawnPipe(WIDTH + 100);
    spawnPipe(WIDTH + 100 + PIPE_SPACING);
    spawnPipe(WIDTH + 100 + PIPE_SPACING * 2);
    scoreEl.textContent = '0';
  }

  function spawnPipe(x) {
    const margin = 60;
    const top = margin + Math.random() * (HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin * 2);
    pipes.push({ x, top, passed: false });
  }

  function flap() {
    if (state === STATE.READY) {
      startGame();
    } else if (state === STATE.PLAYING) {
      bird.vy = FLAP_VELOCITY;
    }
  }

  function startGame() {
    resetGame();
    state = STATE.PLAYING;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hud.classList.remove('hidden');
    bird.vy = FLAP_VELOCITY;
  }

  function endGame() {
    state = STATE.GAME_OVER;
    flashTime = 0.15;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem(STORAGE_KEY, String(highScore));
    }
    finalScoreEl.textContent = score;
    finalHighScoreEl.textContent = highScore;
    hud.classList.add('hidden');
    gameOverScreen.classList.remove('hidden');
  }

  function update(dt) {
    groundOffset = (groundOffset + PIPE_SPEED * dt) % 24;

    if (state !== STATE.PLAYING) return;

    bird.vy += GRAVITY * dt;
    bird.y += bird.vy * dt;
    bird.rotation = Math.max(-0.5, Math.min(1.2, bird.vy / 500));

    if (bird.y - BIRD_RADIUS < 0) {
      bird.y = BIRD_RADIUS;
      bird.vy = 0;
    }
    if (bird.y + BIRD_RADIUS > HEIGHT - GROUND_HEIGHT) {
      bird.y = HEIGHT - GROUND_HEIGHT - BIRD_RADIUS;
      endGame();
      return;
    }

    for (const pipe of pipes) {
      pipe.x -= PIPE_SPEED * dt;

      if (!pipe.passed && pipe.x + PIPE_WIDTH < bird.x - BIRD_RADIUS) {
        pipe.passed = true;
        score += 1;
        scoreEl.textContent = String(score);
      }

      const withinX = bird.x + BIRD_RADIUS > pipe.x && bird.x - BIRD_RADIUS < pipe.x + PIPE_WIDTH;
      const withinGap = bird.y - BIRD_RADIUS > pipe.top && bird.y + BIRD_RADIUS < pipe.top + PIPE_GAP;
      if (withinX && !withinGap) {
        endGame();
        return;
      }
    }

    while (pipes.length && pipes[0].x + PIPE_WIDTH < 0) {
      pipes.shift();
      spawnPipe(pipes[pipes.length - 1].x + PIPE_SPACING);
    }

    if (flashTime > 0) flashTime -= dt;
  }

  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#70c5ce');
    grad.addColorStop(1, '#a9e3ea');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    drawCloud(60, 90, 0.8);
    drawCloud(260, 150, 1.1);
    drawCloud(150, 60, 0.6);
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.arc(20, -6, 14, 0, Math.PI * 2);
    ctx.arc(22, 8, 16, 0, Math.PI * 2);
    ctx.arc(-18, 6, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawPipes() {
    for (const pipe of pipes) {
      const bottomY = pipe.top + PIPE_GAP;
      const bottomH = HEIGHT - GROUND_HEIGHT - bottomY;

      ctx.fillStyle = '#4ec04e';
      ctx.strokeStyle = '#2f8f2f';
      ctx.lineWidth = 3;

      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
      ctx.fillRect(pipe.x - 4, pipe.top - 24, PIPE_WIDTH + 8, 24);
      ctx.strokeRect(pipe.x - 4, pipe.top - 24, PIPE_WIDTH + 8, 24);

      ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, bottomH);
      ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, bottomH);
      ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 24);
      ctx.strokeRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, 24);
    }
  }

  function drawGround() {
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, GROUND_HEIGHT);
    ctx.fillStyle = '#c8b968';
    ctx.fillRect(0, HEIGHT - GROUND_HEIGHT, WIDTH, 10);

    ctx.fillStyle = '#b5a655';
    for (let x = -groundOffset; x < WIDTH; x += 24) {
      ctx.fillRect(x, HEIGHT - GROUND_HEIGHT + 10, 12, 6);
    }
  }

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    ctx.fillStyle = '#ffd93d';
    ctx.strokeStyle = '#c99a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, BIRD_RADIUS, BIRD_RADIUS * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(5, -4, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(7, -4, 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff8c00';
    ctx.beginPath();
    ctx.moveTo(BIRD_RADIUS - 2, -2);
    ctx.lineTo(BIRD_RADIUS + 10, 2);
    ctx.lineTo(BIRD_RADIUS - 2, 6);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawPipes();
    drawGround();
    if (bird) drawBird();

    if (flashTime > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flashTime / 0.15 * 0.6})`;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
  }

  function loop(time) {
    if (lastTime == null) lastTime = time;
    const dt = Math.min(0.033, (time - lastTime) / 1000);
    lastTime = time;

    update(dt);
    draw();

    requestAnimationFrame(loop);
  }

  function handleInput(e) {
    if (e.type === 'keydown' && e.code !== 'Space') return;
    e.preventDefault();
    if (state === STATE.GAME_OVER) return;
    flap();
  }

  canvas.addEventListener('pointerdown', handleInput);
  window.addEventListener('keydown', handleInput);
  startBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame(); });
  restartBtn.addEventListener('click', (e) => { e.stopPropagation(); startGame(); });

  bird = { x: BIRD_X, y: HEIGHT / 2, vy: 0, rotation: 0 };
  pipes = [];
  spawnPipe(WIDTH + 100);
  spawnPipe(WIDTH + 100 + PIPE_SPACING);
  spawnPipe(WIDTH + 100 + PIPE_SPACING * 2);

  requestAnimationFrame(loop);
})();
