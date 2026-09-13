// Snake Game - Enhanced Version with Particles, Mobile Controls, and Pause

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const overlay = document.getElementById('overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayMessage = document.getElementById('overlay-message');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const pauseBtn = document.getElementById('pause-btn');
const finalScoreDisplay = document.getElementById('final-score');

// Set canvas size dynamically
function resizeCanvas() {
  const container = document.querySelector('.canvas-wrapper');
  const size = Math.min(container.clientWidth, 400);
  canvas.width = size;
  canvas.height = size;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Game constants
const GRID_SIZE = 20;
let tileCount;
let tileSize;

function updateTileConfig() {
  tileCount = Math.floor(canvas.width / GRID_SIZE);
  tileSize = canvas.width / tileCount;
}

updateTileConfig();

// Game state
let snake = [];
let food = {};
let direction = { x: 0, y: 0 };
let nextDirection = { x: 0, y: 0 };
let score = 0;
let highScore = localStorage.getItem('snakeHighScore') || 0;
let gameLoop;
let gameSpeed = 150;
let isGameRunning = false;
let isPaused = false;
let particles = [];

// Initialize high score display
highScoreElement.textContent = highScore;

// Particle class for effects
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 4 + 2;
    this.speedX = (Math.random() - 0.5) * 6;
    this.speedY = (Math.random() - 0.5) * 6;
    this.life = 1;
    this.decay = Math.random() * 0.03 + 0.02;
  }
  
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
    this.size *= 0.97;
  }
  
  draw() {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function createParticles(x, y, color, count = 15) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    if (particles[i].life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  particles.forEach(particle => particle.draw());
}

// Initialize game
function initGame() {
  snake = [
    { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) },
    { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) + 1 },
    { x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) + 2 }
  ];
  direction = { x: 0, y: -1 };
  nextDirection = { x: 0, y: -1 };
  score = 0;
  gameSpeed = 150;
  scoreElement.textContent = score;
  placeFood();
  particles = [];
}

// Place food at random position
function placeFood() {
  let validPosition = false;
  while (!validPosition) {
    food = {
      x: Math.floor(Math.random() * tileCount),
      y: Math.floor(Math.random() * tileCount)
    };
    validPosition = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
}

// Draw functions
function drawSnake() {
  snake.forEach((segment, index) => {
    const x = segment.x * tileSize;
    const y = segment.y * tileSize;
    
    // Gradient color from head to tail
    const greenValue = Math.max(100, 255 - index * 8);
    const color = `rgb(0, ${greenValue}, 136)`;
    
    ctx.fillStyle = color;
    
    // Draw rounded rectangle for each segment
    const padding = 1;
    const radius = tileSize / 4;
    
    ctx.beginPath();
    ctx.roundRect(x + padding, y + padding, tileSize - padding * 2, tileSize - padding * 2, radius);
    ctx.fill();
    
    // Add glow effect
    ctx.shadowColor = 'rgba(0, 255, 136, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Draw eyes on head
    if (index === 0) {
      drawEyes(x, y);
    }
  });
}

function drawEyes(x, y) {
  const eyeSize = tileSize / 6;
  const eyeOffset = tileSize / 3;
  
  let eye1X, eye1Y, eye2X, eye2Y;
  
  // Position eyes based on direction
  if (direction.x === 1) { // Right
    eye1X = x + tileSize - eyeOffset;
    eye1Y = y + eyeOffset;
    eye2X = x + tileSize - eyeOffset;
    eye2Y = y + tileSize - eyeOffset;
  } else if (direction.x === -1) { // Left
    eye1X = x + eyeOffset;
    eye1Y = y + eyeOffset;
    eye2X = x + eyeOffset;
    eye2Y = y + tileSize - eyeOffset;
  } else if (direction.y === -1) { // Up
    eye1X = x + eyeOffset;
    eye1Y = y + eyeOffset;
    eye2X = x + tileSize - eyeOffset;
    eye2Y = y + eyeOffset;
  } else { // Down
    eye1X = x + eyeOffset;
    eye1Y = y + tileSize - eyeOffset;
    eye2X = x + tileSize - eyeOffset;
    eye2Y = y + tileSize - eyeOffset;
  }
  
  // Draw whites of eyes
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
  ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw pupils
  ctx.fillStyle = 'black';
  const pupilSize = eyeSize / 2;
  ctx.beginPath();
  ctx.arc(eye1X, eye1Y, pupilSize, 0, Math.PI * 2);
  ctx.arc(eye2X, eye2Y, pupilSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawFood() {
  const x = food.x * tileSize + tileSize / 2;
  const y = food.y * tileSize + tileSize / 2;
  const radius = tileSize / 2 - 3;
  
  // Pulsing effect
  const pulse = Math.sin(Date.now() / 200) * 2;
  
  // Outer glow
  const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius + pulse);
  gradient.addColorStop(0, '#ff0055');
  gradient.addColorStop(0.5, '#ff0055');
  gradient.addColorStop(1, 'rgba(255, 0, 85, 0)');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius + pulse, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner circle
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = '#ff0055';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawGrid() {
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  
  for (let i = 0; i <= tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, canvas.height);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(canvas.width, i * tileSize);
    ctx.stroke();
  }
}

// Main draw function
function draw() {
  // Clear canvas
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  drawGrid();
  drawFood();
  drawSnake();
  updateParticles();
  drawParticles();
}

// Move snake
function moveSnake() {
  direction = { ...nextDirection };
  
  const head = { x: snake[0].x + direction.x, y: snake[0].y + direction.y };
  
  // Check wall collision
  if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
    gameOver();
    return;
  }
  
  // Check self collision
  if (snake.some(segment => segment.x === head.x && segment.y === head.y)) {
    gameOver();
    return;
  }
  
  snake.unshift(head);
  
  // Check food collision
  if (head.x === food.x && head.y === food.y) {
    score += 10;
    scoreElement.textContent = score;
    
    // Create particle effect
    const foodX = food.x * tileSize + tileSize / 2;
    const foodY = food.y * tileSize + tileSize / 2;
    createParticles(foodX, foodY, '#ff0055');
    
    placeFood();
    
    // Increase speed gradually
    gameSpeed = Math.max(80, gameSpeed - 3);
  } else {
    snake.pop();
  }
}

// Game over
function gameOver() {
  isGameRunning = false;
  clearInterval(gameLoop);
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHighScore', highScore);
    highScoreElement.textContent = highScore;
  }
  
  overlayTitle.textContent = 'بازی تمام شد!';
  overlayMessage.textContent = `امتیاز شما: ${score}`;
  startBtn.textContent = 'شروع مجدد';
  overlay.classList.remove('hidden');
  pauseBtn.textContent = 'مکث';
}

// Game loop
function gameStep() {
  if (!isPaused) {
    moveSnake();
    draw();
  }
}

function startGame() {
  initGame();
  isGameRunning = true;
  isPaused = false;
  overlay.classList.add('hidden');
  clearInterval(gameLoop);
  gameLoop = setInterval(gameStep, gameSpeed);
  draw();
}

function togglePause() {
  if (!isGameRunning) return;
  
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? 'ادامه' : 'مکث';
  
  if (isPaused) {
    overlayTitle.textContent = 'بازی متوقف شد';
    overlayMessage.textContent = 'برای ادامه دکمه مکث را بزنید یا Space را فشار دهید';
    startBtn.textContent = 'ادامه';
    overlay.classList.remove('hidden');
  } else {
    overlay.classList.add('hidden');
  }
}

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (!isGameRunning && e.key !== 'Enter') return;
  
  switch(e.key) {
    case 'ArrowUp':
      if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
      break;
    case ' ':
      e.preventDefault();
      if (isGameRunning) togglePause();
      break;
    case 'r':
    case 'R':
      if (isGameRunning) {
        clearInterval(gameLoop);
        startGame();
      }
      break;
    case 'Enter':
      if (!isGameRunning || isPaused) {
        if (isPaused) togglePause();
        else startGame();
      }
      break;
  }
});

// Mobile controls
document.querySelectorAll('.control-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (!isGameRunning) {
      startGame();
      return;
    }
    
    const dir = btn.dataset.direction;
    switch(dir) {
      case 'up':
        if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
        break;
      case 'down':
        if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
        break;
      case 'left':
        if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
        break;
      case 'right':
        if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
        break;
    }
  });
  
  // Prevent double-tap zoom
  btn.addEventListener('touchend', (e) => {
    e.preventDefault();
    btn.click();
  });
});

// Button event listeners
startBtn.addEventListener('click', () => {
  if (isPaused) {
    togglePause();
  } else {
    startGame();
  }
});

restartBtn.addEventListener('click', () => {
  if (isGameRunning) {
    clearInterval(gameLoop);
  }
  startGame();
});

pauseBtn.addEventListener('click', () => {
  if (isGameRunning) {
    togglePause();
  }
});

// Initial draw
draw();
