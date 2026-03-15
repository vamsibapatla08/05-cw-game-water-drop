// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let gameTimer;
let score = 0;
let timeLeft = 30;
const maxProgressScore = 20;

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");
const scoreProgressFill = document.getElementById("score-progress-fill");

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("reset-btn").addEventListener("click", resetGame);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timeLeft = 30;
  updateScoreDisplay();
  updateTimeDisplay();

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);
  gameTimer = setInterval(updateTimer, 1000);
}

function createDrop() {
  if (!gameRunning) return;

  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Randomly mark some drops as dirty so both drop types appear
  const isDirtyDrop = Math.random() < 0.4;
  if (isDirtyDrop) {
    drop.classList.add("dirty-drop");
  }

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Good drops give +1, dirty drops give -1, and score never goes below 0
  drop.addEventListener("click", () => {
    const pointChange = isDirtyDrop ? -1 : 1;
    score = Math.max(0, score + pointChange);
    updateScoreDisplay();
    drop.remove();
  });

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}

function updateTimer() {
  timeLeft = Math.max(0, timeLeft - 1);
  updateTimeDisplay();

  if (timeLeft === 0) {
    endGame();
  }
}

function updateTimeDisplay() {
  timeDisplay.textContent = timeLeft;
}

function endGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  // Remove remaining drops when the round is over
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
}

function resetGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);

  score = 0;
  timeLeft = 30;
  updateScoreDisplay();
  updateTimeDisplay();

  // Clear any drops currently visible in the game area
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
}

function updateScoreDisplay() {
  scoreDisplay.textContent = score;

  const progressRatio = Math.min(score / maxProgressScore, 1);
  scoreProgressFill.style.height = `${progressRatio * 100}%`;
}

updateScoreDisplay();
updateTimeDisplay();
