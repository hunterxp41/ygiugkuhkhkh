// Snake Game - Complete Game Logic
(function () {
  'use strict';

  const GRID_SIZE = 20;
  const CANVAS_SIZE = 400;
  const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
  const INITIAL_SPEED = 150;
  const SPEED_INCREMENT = 10;
  const POINTS_PER_FOOD = 1;

  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMessage = document.getElementById('overlay-message');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');

  let snake = [];
  let food = { x: 0, y: 0 };
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let score = 0;
  let highScore = 0;
  let gameState = 'idle';
  let speed = INITIAL_SPEED;
  let lastTime = 0;
  let accumulator = 0;

  highScore = parseInt(localStorage.getItem('snakeHighScore'), 10) || 0;
  highScoreEl.textContent = highScore;

  function initGame() {
    snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    speed = INITIAL_SPEED;
    scoreEl.textContent = score;
    spawnFood();
  }

  function spawnFood() {
    let newFood;
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 1000) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      valid = !snake.some(seg => seg.x === newFood.x && seg.y === newFood.y);
      attempts++;
    }
    if (!valid) {
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let y = 0; y < GRID_SIZE; y++) {
          if (!snake.some(seg => seg.x === x && seg.y === y)) {
            newFood = { x, y };
            valid = true;
            break;
          }
        }
        if (valid) break;
      }
    }
    food = newFood;
  }

  function update() {
    if (nextDirection.x !== -direction.x || nextDirection.y !== -direction.y) {
      direction = { ...nextDirection };
    }

    const head = {
      x: snake[0].x + direction.x,
      y: snake[0].y + direction.y
    };

    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      gameOver();
      return;
    }

    if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      gameOver();
      return;
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += POINTS_PER_FOOD;
      scoreEl.textContent = score;
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
      }
      if (score % 5 === 0 && speed > 50) {
        speed -= SPEED_INCREMENT;
      }
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function render() {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    snake.forEach((seg, index) => {
      if (index === 0) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 15;
      } else {
        ctx.fillStyle = `hsl(${140 + index * 2}, 100%, ${50 - index * 1.5}%)`;
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(
        seg.x * CELL_SIZE + 1,
        seg.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
    });

    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ff0066';
    ctx.beginPath();
    ctx.arc(
      food.x * CELL_SIZE + CELL_SIZE / 2,
      food.y * CELL_SIZE + CELL_SIZE / 2,
      CELL_SIZE / 2 - 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  function gameLoop(timestamp) {
    if (gameState !== 'playing') return;

    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    accumulator += delta;

    while (accumulator >= speed) {
      update();
      accumulator -= speed;
      if (gameState !== 'playing') break;
    }

    render();
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    initGame();
    gameState = 'playing';
    overlay.classList.add('hidden');
    lastTime = 0;
    accumulator = 0;
    requestAnimationFrame(gameLoop);
  }

  function gameOver() {
    gameState = 'gameover';
    overlayTitle.textContent = 'Game Over';
    overlayMessage.textContent = `Score: ${score}`;
    startBtn.textContent = 'Play Again';
    overlay.classList.remove('hidden');
  }

  function handleKeyDown(e) {
    if (e.key.startsWith('Arrow')) {
      e.preventDefault();
    }

    if (gameState === 'idle' && (e.key === 'Enter' || e.key === ' ')) {
      startGame();
      return;
    }

    if (gameState === 'idle') {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          nextDirection = { x: 0, y: -1 }; startGame(); break;
        case 'ArrowDown': case 's': case 'S':
          nextDirection = { x: 0, y: 1 }; startGame(); break;
        case 'ArrowLeft': case 'a': case 'A':
          nextDirection = { x: -1, y: 0 }; startGame(); break;
        case 'ArrowRight': case 'd': case 'D':
          nextDirection = { x: 1, y: 0 }; startGame(); break;
      }
      return;
    }

    if (gameState === 'playing') {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W':
          nextDirection = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': case 'S':
          nextDirection = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': case 'A':
          nextDirection = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': case 'D':
          nextDirection = { x: 1, y: 0 }; break;
      }
    }

    if (e.key === 'r' || e.key === 'R') {
      startGame();
    }
  }

  document.addEventListener('keydown', handleKeyDown);
  startBtn.addEventListener('click', startGame);
  restartBtn.addEventListener('click', startGame);

  initGame();
  render();
})();
