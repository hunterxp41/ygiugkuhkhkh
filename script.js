// Snake Game - Enhanced with Mobile Controls, Pause, and Visual Effects
(function () {
  'use strict';

  const GRID_SIZE = 20;
  const INITIAL_SPEED = 150;
  const SPEED_INCREMENT = 5;
  const MIN_SPEED = 60;
  const POINTS_PER_FOOD = 10;
  
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('high-score');
  const overlay = document.getElementById('overlay');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayMessage = document.getElementById('overlay-message');
  const startBtn = document.getElementById('start-btn');
  const restartBtn = document.getElementById('restart-btn');
  const finalScoreDisplay = document.getElementById('final-score-display');
  const finalScoreEl = document.getElementById('final-score');
  
  // Responsive canvas sizing
  function resizeCanvas() {
    const wrapper = canvas.parentElement;
    const size = Math.min(wrapper.clientWidth, 400);
    canvas.width = size;
    canvas.height = size;
  }
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  let CELL_SIZE = canvas.width / GRID_SIZE;
  
  // Update cell size on resize
  const observer = new ResizeObserver(() => {
    resizeCanvas();
    CELL_SIZE = canvas.width / GRID_SIZE;
    if (gameState !== 'playing') render();
  });
  observer.observe(canvas.parentElement);

  let snake = [];
  let food = { x: 0, y: 0 };
  let direction = { x: 1, y: 0 };
  let nextDirection = { x: 1, y: 0 };
  let score = 0;
  let highScore = 0;
  let gameState = 'idle'; // idle, playing, paused, gameover
  let speed = INITIAL_SPEED;
  let lastTime = 0;
  let accumulator = 0;
  let particles = []; // For visual effects
  
  // Load high score
  highScore = parseInt(localStorage.getItem('snakeHighScore'), 10) || 0;
  highScoreEl.textContent = highScore;

  // Particle system for visual effects
  class Particle {
    constructor(x, y, color) {
      this.x = x;
      this.y = y;
      this.color = color;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 4;
      this.speedY = (Math.random() - 0.5) * 4;
      this.life = 1.0;
      this.decay = Math.random() * 0.03 + 0.02;
    }
    
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life -= this.decay;
      this.size *= 0.95;
    }
    
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.life;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(x, y, color));
    }
  }

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
    particles = [];
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
      
      // Create particle effect when eating food
      const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
      createParticles(foodX, foodY, '#ff0066', 15);
      
      if (score > highScore) {
        highScore = score;
        highScoreEl.textContent = highScore;
        localStorage.setItem('snakeHighScore', highScore);
      }
      if (speed > MIN_SPEED) {
        speed = Math.max(MIN_SPEED, speed - SPEED_INCREMENT);
      }
      spawnFood();
    } else {
      snake.pop();
    }
  }

  function render() {
    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#111');
    gradient.addColorStop(1, '#1a1a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake with glow effect
    snake.forEach((seg, index) => {
      const isHead = index === 0;
      const hue = 160 + index * 3;
      const lightness = 50 - index * 1.2;
      
      if (isHead) {
        ctx.fillStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
      } else {
        ctx.fillStyle = `hsl(${hue}, 100%, ${lightness}%)`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
      }
      
      // Rounded rectangle for snake segments
      const padding = 2;
      const radius = 4;
      const x = seg.x * CELL_SIZE + padding;
      const y = seg.y * CELL_SIZE + padding;
      const w = CELL_SIZE - padding * 2;
      const h = CELL_SIZE - padding * 2;
      
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, radius);
      ctx.fill();
      
      // Draw eyes on head
      if (isHead) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        const eyeSize = CELL_SIZE / 6;
        const eyeOffset = CELL_SIZE / 4;
        
        let eye1X, eye1Y, eye2X, eye2Y;
        
        if (direction.x === 1) { // Right
          eye1X = x + w - eyeOffset; eye1Y = y + eyeOffset;
          eye2X = x + w - eyeOffset; eye2Y = y + h - eyeOffset;
        } else if (direction.x === -1) { // Left
          eye1X = x + eyeOffset; eye1Y = y + eyeOffset;
          eye2X = x + eyeOffset; eye2Y = y + h - eyeOffset;
        } else if (direction.y === -1) { // Up
          eye1X = x + eyeOffset; eye1Y = y + eyeOffset;
          eye2X = x + w - eyeOffset; eye2Y = y + eyeOffset;
        } else { // Down
          eye1X = x + eyeOffset; eye1Y = y + h - eyeOffset;
          eye2X = x + w - eyeOffset; eye2Y = y + h - eyeOffset;
        }
        
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Draw food with pulsing effect
    const time = Date.now() * 0.005;
    const pulse = Math.sin(time) * 0.2 + 1;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const foodRadius = (CELL_SIZE / 2 - 3) * pulse;
    
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#ff0066';
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner glow for food
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff6699';
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    
    // Update and draw particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
      p.update();
      p.draw(ctx);
    });
    
    // Draw pause indicator
    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00ffff';
      ctx.font = 'bold 30px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    }
  }

  function gameLoop(timestamp) {
    if (gameState !== 'playing' && gameState !== 'paused') return;

    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    
    if (gameState === 'playing') {
      accumulator += delta;
      while (accumulator >= speed) {
        update();
        accumulator -= speed;
        if (gameState !== 'playing') break;
      }
    }
    
    render();
    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    initGame();
    gameState = 'playing';
    overlay.classList.add('hidden');
    finalScoreDisplay.style.display = 'none';
    lastTime = 0;
    accumulator = 0;
    requestAnimationFrame(gameLoop);
  }

  function togglePause() {
    if (gameState === 'playing') {
      gameState = 'paused';
      overlayTitle.textContent = 'بازی متوقف شد';
      overlayMessage.textContent = 'برای ادامه Space را بزنید';
      startBtn.textContent = 'ادامه بازی';
      overlay.classList.remove('hidden');
    } else if (gameState === 'paused') {
      gameState = 'playing';
      overlay.classList.add('hidden');
      lastTime = 0;
      requestAnimationFrame(gameLoop);
    }
  }

  function gameOver() {
    gameState = 'gameover';
    overlayTitle.textContent = 'پایان بازی';
    finalScoreEl.textContent = score;
    finalScoreDisplay.style.display = 'block';
    overlayMessage.textContent = score >= highScore && score > 0 ? '🎉 رکورد جدید!' : 'دوباره تلاش کن';
    startBtn.textContent = 'بازی مجدد';
    overlay.classList.remove('hidden');
    
    // Add game over animation
    overlay.querySelector('.menu-content').classList.add('game-over-animation');
    setTimeout(() => {
      overlay.querySelector('.menu-content').classList.remove('game-over-animation');
    }, 2000);
  }

  function handleKeyDown(e) {
    // Prevent default for arrow keys and space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
      e.preventDefault();
    }

    // Handle pause
    if (e.key === ' ' && (gameState === 'playing' || gameState === 'paused')) {
      togglePause();
      return;
    }

    // Start game from idle state
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
          if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; break;
        case 'ArrowDown': case 's': case 'S':
          if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; break;
        case 'ArrowLeft': case 'a': case 'A':
          if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; break;
        case 'ArrowRight': case 'd': case 'D':
          if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; break;
      }
    }

    if (e.key === 'r' || e.key === 'R') {
      startGame();
    }
  }
  
  // Mobile controls
  function setupMobileControls() {
    const ctrlBtns = document.querySelectorAll('.ctrl-btn');
    ctrlBtns.forEach(btn => {
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const dir = btn.getAttribute('data-dir');
        handleMobileInput(dir);
      });
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const dir = btn.getAttribute('data-dir');
        handleMobileInput(dir);
      });
    });
  }
  
  function handleMobileInput(dir) {
    if (gameState === 'idle') {
      switch (dir) {
        case 'up': nextDirection = { x: 0, y: -1 }; startGame(); break;
        case 'down': nextDirection = { x: 0, y: 1 }; startGame(); break;
        case 'left': nextDirection = { x: -1, y: 0 }; startGame(); break;
        case 'right': nextDirection = { x: 1, y: 0 }; startGame(); break;
      }
    } else if (gameState === 'playing') {
      switch (dir) {
        case 'up':
          if (direction.y !== 1) nextDirection = { x: 0, y: -1 }; break;
        case 'down':
          if (direction.y !== -1) nextDirection = { x: 0, y: 1 }; break;
        case 'left':
          if (direction.x !== 1) nextDirection = { x: -1, y: 0 }; break;
        case 'right':
          if (direction.x !== -1) nextDirection = { x: 1, y: 0 }; break;
      }
    }
  }

  // Event listeners
  document.addEventListener('keydown', handleKeyDown);
  startBtn.addEventListener('click', () => {
    if (gameState === 'paused') {
      togglePause();
    } else {
      startGame();
    }
  });
  restartBtn.addEventListener('click', startGame);
  
  setupMobileControls();

  initGame();
  render();
})();
