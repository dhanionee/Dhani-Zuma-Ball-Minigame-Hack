const canvas = document.getElementById("zumaCanvas");
const ctx = canvas.getContext("2d");
const exitBtn = document.getElementById("exitBtn");
const gameWrapper = document.getElementById("game");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let path = [];
let balls = [];
let shotBall = null;
let colors = ["red", "green", "blue", "yellow", "purple"];
let started = false;

let moveSpeed = 0.07;
let ballSpacing = 28;
let spawnInterval = 100;
let spawnTimer = 0;

let chances = 3;
let difficulty = "easy";
let totalBallsToSpawn = 5;
let remainingBalls = 0;
let currentBallColor = null;
let gameStatus = "playing"; // playing, win, lose

function generatePath() {
    path = [];
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let angle = 0;
    let radius = 60;

    for (let i = 0; i < 800; i++) {
        let x = centerX + Math.cos(angle) * radius;
        let y = centerY + Math.sin(angle) * radius;
        path.push({ x, y });
        angle += 0.1;
        radius += 0.4;
    }
    path.reverse();
}

function spawnBalls() {
    balls = [];
    spawnTimer = 0;
}

function drawPath() {
    ctx.strokeStyle = "#444";
    ctx.beginPath();
    for (let i = 0; i < path.length; i++) {
        let p = path[i];
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(path[0].x, path[0].y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "purple";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(path[path.length - 1].x, path[path.length - 1].y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();
}

function drawBalls() {
    balls.forEach(ball => {
        let index = Math.floor(ball.pathIndex);
        let nextIndex = Math.ceil(ball.pathIndex);
        let t = ball.pathIndex % 1;

        let pos1 = path[index];
        let pos2 = path[nextIndex] || pos1;

        let x = pos1.x + (pos2.x - pos1.x) * t;
        let y = pos1.y + (pos2.y - pos1.y) * t;

        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
    });
}

function drawShooter() {
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = "#888";
    ctx.fill();

    if (currentBallColor) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
        ctx.fillStyle = currentBallColor;
        ctx.fill();
    }

    if (shotBall) {
        ctx.beginPath();
        ctx.arc(shotBall.x, shotBall.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = shotBall.color;
        ctx.fill();
    }
}

function shootBall(targetX, targetY) {
    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;

    let dx = targetX - centerX;
    let dy = targetY - centerY;
    let length = Math.sqrt(dx * dx + dy * dy);

    dx /= length;
    dy /= length;

    shotBall = {
        x: centerX,
        y: centerY,
        dx: dx * 10,
        dy: dy * 10,
        color: currentBallColor
    };

    currentBallColor = colors[Math.floor(Math.random() * colors.length)];
}

function updateBalls() {
    if (gameStatus !== "playing") return;

    spawnTimer++;
    if (spawnTimer >= spawnInterval && remainingBalls > 0) {
        let canSpawn = true;

        if (balls.length > 0) {
            let lastBall = balls[balls.length - 1];
            if (lastBall.pathIndex < ballSpacing) {
                canSpawn = false;
            }
        }

        if (canSpawn) {
            spawnTimer = 0;
            let spawnIndex = balls.length > 0
                ? balls[balls.length - 1].pathIndex - ballSpacing
                : 0;

            balls.push({
                pathIndex: Math.max(spawnIndex, 0),
                color: colors[Math.floor(Math.random() * colors.length)]
            });

            remainingBalls--;
        }
    }

    for (let i = 0; i < balls.length; i++) {
        if (i === 0) {
            balls[0].pathIndex += moveSpeed;

            if (balls[0].pathIndex >= path.length - 1) {
                started = false;
                gameStatus = "lose";
                sendGameResult("lose");
            }
        } else {
            let prev = balls[i - 1];
            let desired = prev.pathIndex - ballSpacing;
            if (balls[i].pathIndex < desired) {
                balls[i].pathIndex += Math.min(moveSpeed, desired - balls[i].pathIndex);
            }
        }
    }

    if (shotBall) {
        shotBall.x += shotBall.dx;
        shotBall.y += shotBall.dy;

        for (let i = 0; i < balls.length; i++) {
            let pos = path[Math.floor(balls[i].pathIndex)];
            let dx = shotBall.x - pos.x;
            let dy = shotBall.y - pos.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) {
                if (shotBall.color === balls[i].color) {
                    balls.splice(i, 1);
                } else {
                    chances--;
                    if (chances <= 0) {
                        started = false;
                        gameStatus = "lose";
                        sendGameResult("lose");
                    }
                    balls.splice(i, 1);
                }

                shotBall = null;
                break;
            }
        }

        if (shotBall && (
            shotBall.x < 0 || shotBall.x > canvas.width ||
            shotBall.y < 0 || shotBall.y > canvas.height)) {
            shotBall = null;
        }
    }

    if (balls.length === 0 && remainingBalls === 0) {
        started = false;
        gameStatus = "win";
        sendGameResult("win");
    }
}

function sendGameResult(result) {
  fetch(`https://${GetParentResourceName()}/notify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result: result })
  }).then(() => {
      // Setelah hasil dikirim, keluar dari UI
      started = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      gameWrapper.classList.remove("active");

      fetch(`https://${GetParentResourceName()}/close`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
      });
  });
}


function gameLoop() {
    if (!started) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPath();
    updateBalls();
    drawBalls();
    drawShooter();
    requestAnimationFrame(gameLoop);
}

canvas.addEventListener("click", (e) => {
    if (!shotBall) {
        shootBall(e.clientX, e.clientY);
    }
});

window.addEventListener("message", function (event) {
    if (event.data.action === "open") {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        difficulty = event.data.difficulty;
        totalBallsToSpawn = event.data.spawnCount;
        moveSpeed = event.data.speed;
        remainingBalls = totalBallsToSpawn;

        gameWrapper.classList.add("active");
        generatePath();
        spawnBalls();
        currentBallColor = colors[Math.floor(Math.random() * colors.length)];
        started = true;
        gameStatus = "playing";
        gameLoop();
    }
});

exitBtn.addEventListener("click", () => {
    started = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    gameWrapper.classList.remove("active");

    fetch(`https://${GetParentResourceName()}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
});