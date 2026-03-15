// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let gameTimer;
let collisionChecker;
let score = 0;
let timeLeft = 30;
const maxProgressScore = 20;

const scoreDisplay = document.getElementById("score");
const timeDisplay = document.getElementById("time");
const gameContainer = document.getElementById("game-container");
const scoreProgressFill = document.getElementById("score-progress-fill");
const bucket = document.getElementById("bucket");
const gameMessage = document.getElementById("game-message");

const winningMessages = [
  "Great work! You helped save more clean water today.",
  "Amazing catch! Clean water impact unlocked.",
  "You did it! More families can access safe water.",
];

const losingMessages = [
  "Nice effort. Try again to collect even more clean water.",
  "Keep going. One more round can make a bigger splash.",
  "So close. Reset and catch a few more good drops.",
];

let bucketX = 0;
const bucketStep = 28;

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);
document.getElementById("reset-btn").addEventListener("click", resetGame);
gameContainer.addEventListener("pointermove", moveBucketWithPointer);
document.addEventListener("keydown", moveBucketWithKeyboard);
window.addEventListener("resize", centerBucket);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;
  score = 0;
  timeLeft = 30;
  updateScoreDisplay();
  updateTimeDisplay();
  clearEndMessage();
  centerBucket();

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);
  gameTimer = setInterval(updateTimer, 1000);
  collisionChecker = setInterval(checkBucketCollisions, 50);
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
  drop.dataset.pointChange = isDirtyDrop ? "-1" : "1";

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
  drop.style.setProperty("--drop-fall-distance", `${gameContainer.clientHeight + 30}px`);

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Remove drops that reach the bottom without being caught
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
  clearInterval(collisionChecker);

  // Remove remaining drops when the round is over
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());

  showEndMessage();
}

function resetGame() {
  gameRunning = false;
  clearInterval(dropMaker);
  clearInterval(gameTimer);
  clearInterval(collisionChecker);

  score = 0;
  timeLeft = 30;
  updateScoreDisplay();
  updateTimeDisplay();
  clearEndMessage();
  centerBucket();

  // Clear any drops currently visible in the game area
  gameContainer.querySelectorAll(".water-drop").forEach((drop) => drop.remove());
}

function moveBucketWithPointer(event) {
  if (!gameRunning) return;

  const containerRect = gameContainer.getBoundingClientRect();
  const targetX = event.clientX - containerRect.left - bucket.offsetWidth / 2;
  setBucketPosition(targetX);
}

function moveBucketWithKeyboard(event) {
  if (!gameRunning) return;

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    setBucketPosition(bucketX - bucketStep);
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    setBucketPosition(bucketX + bucketStep);
  }
}

function setBucketPosition(nextX) {
  const maxX = Math.max(0, gameContainer.clientWidth - bucket.offsetWidth);
  bucketX = Math.max(0, Math.min(nextX, maxX));
  bucket.style.left = `${bucketX}px`;
}

function centerBucket() {
  const centeredX = (gameContainer.clientWidth - bucket.offsetWidth) / 2;
  setBucketPosition(centeredX);
}

function checkBucketCollisions() {
  if (!gameRunning) return;

  const bucketRect = bucket.getBoundingClientRect();

  gameContainer.querySelectorAll(".water-drop").forEach((drop) => {
    const dropRect = drop.getBoundingClientRect();
    const overlapsBucket =
      dropRect.bottom >= bucketRect.top &&
      dropRect.top <= bucketRect.bottom &&
      dropRect.right >= bucketRect.left &&
      dropRect.left <= bucketRect.right;

    if (overlapsBucket) {
      const pointChange = Number(drop.dataset.pointChange || "1");
      score = Math.max(0, score + pointChange);
      updateScoreDisplay();
      drop.remove();
    }
  });
}

function updateScoreDisplay() {
  scoreDisplay.textContent = score;

  const progressRatio = Math.min(score / maxProgressScore, 1);
  scoreProgressFill.style.height = `${progressRatio * 100}%`;
}

function showEndMessage() {
  const wonRound = score >= maxProgressScore;
  const baseMessage = getRandomMessage(wonRound ? winningMessages : losingMessages);
  const finalMessage = `${baseMessage} Final score: ${score}.`;

  gameMessage.textContent = finalMessage;
  gameMessage.classList.remove("win", "lose");
  gameMessage.classList.add(wonRound ? "win" : "lose");
}

function clearEndMessage() {
  gameMessage.textContent = "";
  gameMessage.classList.remove("win", "lose");
}

function getRandomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}

updateScoreDisplay();
updateTimeDisplay();
centerBucket();
clearEndMessage();
