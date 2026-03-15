// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let gameTimer;
let collisionChecker;
let score = 0;
const gameDurationSeconds = 30;
let timeLeft = gameDurationSeconds;
const maxProgressScore = 20;
const spawnTickMs = 250;
let spawnAccumulator = 0;

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
let bucketTargetX = 0;
let bucketAnimationFrame = null;
const bucketStep = 28;
const bucketSmoothing = 0.22;

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
  timeLeft = gameDurationSeconds;
  spawnAccumulator = 0;
  updateScoreDisplay();
  updateTimeDisplay();
  clearEndMessage();
  centerBucket();

  // Spawn drops in short ticks so drop count can scale with difficulty
  dropMaker = setInterval(runDropSpawnerTick, spawnTickMs);
  gameTimer = setInterval(updateTimer, 1000);
  collisionChecker = setInterval(checkBucketCollisions, 50);
}

function createDrop() {
  if (!gameRunning) return;

  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Randomly mark some drops as dirty so both drop types appear
  const isDirtyDrop = Math.random() < getDirtyDropChance();
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
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * Math.max(gameWidth - size, 0);
  drop.style.left = xPosition + "px";

  // Fall speed increases over time and scales with target score rate
  drop.style.animationDuration = `${getDropFallDurationSeconds()}s`;
  drop.style.setProperty("--drop-fall-distance", `${gameContainer.clientHeight + 30}px`);

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Remove drops that reach the bottom without being caught
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}

function runDropSpawnerTick() {
  if (!gameRunning) return;

  const dropsPerSecond = getDropsPerSecondForCurrentTime();
  spawnAccumulator += (dropsPerSecond * spawnTickMs) / 1000;

  const dropsToCreate = Math.floor(spawnAccumulator);
  if (dropsToCreate <= 0) return;

  spawnAccumulator -= dropsToCreate;
  for (let i = 0; i < dropsToCreate; i += 1) {
    createDrop();
  }
}

function getDropsPerSecondForCurrentTime() {
  const baseDropsPerSecond = (maxProgressScore / gameDurationSeconds) * 2.75;
  const dropsPerSecond = baseDropsPerSecond * getCurrentPhaseMultiplier();
  return clamp(dropsPerSecond, 1.1, 6);
}

function getDropFallDurationSeconds() {
  let phaseBaseDuration = 3.9;

  if (timeLeft <= gameDurationSeconds / 3) {
    phaseBaseDuration = 2.1;
  } else if (timeLeft <= (gameDurationSeconds * 2) / 3) {
    phaseBaseDuration = 2.9;
  }

  return clamp(phaseBaseDuration / getScoreRateDifficultyScale(), 1.5, 4.6);
}

function getCurrentPhaseMultiplier() {
  if (timeLeft <= gameDurationSeconds / 3) return 1.85;
  if (timeLeft <= (gameDurationSeconds * 2) / 3) return 1.35;
  return 1;
}

function getDirtyDropChance() {
  if (timeLeft <= gameDurationSeconds / 3) return 0.52;
  if (timeLeft <= (gameDurationSeconds * 2) / 3) return 0.45;
  return 0.38;
}

function getScoreRateDifficultyScale() {
  const targetScoreRate = maxProgressScore / gameDurationSeconds;
  return clamp(targetScoreRate * 1.5, 0.8, 1.8);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  spawnAccumulator = 0;

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
  timeLeft = gameDurationSeconds;
  spawnAccumulator = 0;
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
  setBucketTarget(targetX);
}

function moveBucketWithKeyboard(event) {
  if (!gameRunning) return;

  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    setBucketTarget(bucketTargetX - bucketStep);
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    event.preventDefault();
    setBucketTarget(bucketTargetX + bucketStep);
  }
}

function setBucketPositionImmediate(nextX) {
  bucketTargetX = clamp(nextX, 0, getBucketMaxX());
  bucketX = bucketTargetX;
  bucket.style.left = `${bucketX}px`;

  if (bucketAnimationFrame !== null) {
    cancelAnimationFrame(bucketAnimationFrame);
    bucketAnimationFrame = null;
  }
}

function setBucketTarget(nextX) {
  bucketTargetX = clamp(nextX, 0, getBucketMaxX());

  if (bucketAnimationFrame === null) {
    bucketAnimationFrame = requestAnimationFrame(animateBucketMovement);
  }
}

function animateBucketMovement() {
  const distance = bucketTargetX - bucketX;

  if (Math.abs(distance) < 0.5) {
    bucketX = bucketTargetX;
    bucket.style.left = `${bucketX}px`;
    bucketAnimationFrame = null;
    return;
  }

  bucketX += distance * bucketSmoothing;
  bucket.style.left = `${bucketX}px`;
  bucketAnimationFrame = requestAnimationFrame(animateBucketMovement);
}

function getBucketMaxX() {
  return Math.max(0, gameContainer.clientWidth - bucket.offsetWidth);
}

function centerBucket() {
  const centeredX = getBucketMaxX() / 2;
  setBucketPositionImmediate(centeredX);
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
