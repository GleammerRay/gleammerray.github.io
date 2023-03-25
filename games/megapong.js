import {getValueFromURL, GameRoom, Vector2} from './gameutils.js';

const gameRoom = new GameRoom();
const rainbowColors = [
  0xff0000,
  0xffa500,
  0xffff00,
  0x008000,
  0x0000ff,
  0x4b0082,
  0xee82ee,
];
const computerPlayerSpeed = 0.0004;

var playerList = {};

function randInt(min, max) {
  return Math.floor((Math.random() * (max - min)) + min);
}

function interpolate(start, end, multiplier = 0.5) {
  return (start + end) * multiplier;
}

var gameView = document.getElementById('game-view');

const app = new PIXI.Application({
  width: 640,
  height: 360
});
var stageChildren = [];
app.view.style.position = 'relative';
gameView.appendChild(app.view);

function stageAddChild(child) {
  app.stage.addChild(child);
  stageChildren.push(child);
}

function clearStage() {
  for (let i = 0; i != stageChildren.length; i++) {
    app.stage.removeChild(stageChildren[i]);
  }
  stageChildren = [];
}

function resizeGameView() {
  if (document.body.clientWidth > document.body.clientHeight) {
    gameView.style.width = document.body.clientHeight;
    gameView.style.height = document.body.clientHeight;
    app.screen.width = document.body.clientHeight;
    app.screen.height = document.body.clientHeight;
    app.renderer.view.width = document.body.clientHeight;
    app.renderer.view.height = document.body.clientHeight;
    return;
  }
  gameView.style.width = document.body.clientWidth;
  gameView.style.height = document.body.clientWidth;
  app.screen.width = document.body.clientWidth;
  app.screen.height = document.body.clientWidth;
  app.renderer.view.width = document.body.clientWidth;
  app.renderer.view.height = document.body.clientWidth;
}

function rotateUntil(vector, degree, shouldStop) {
  const checkAngle = Math.PI / 2;
  var changeDir = false;
  var newVector = new Vector2(vector.x, vector.y);
  newVector.x = (vector.x * Math.cos(checkAngle)) - (vector.y * Math.sin(checkAngle));
  newVector.y = (vector.y * Math.cos(checkAngle)) + (vector.x * Math.sin(checkAngle));
  if (!shouldStop(newVector)) degree = (2  * Math.PI) - degree;
  newVector = new Vector2(vector.x, vector.y);
  newVector.x = (vector.x * Math.cos(degree)) - (vector.y * Math.sin(degree));
  newVector.y = (vector.y * Math.cos(degree)) + (vector.x * Math.sin(degree));
  return newVector;
}

function randAngle() {
  return Math.sin((Math.PI / 2) * (1 + (Math.random() / 2)));
}

function start2p(computerPlayer2 = false) {
  var isPlaying = true;
  var player1Victory = false;
  var player2Victory = false;

  const player1 = PIXI.Sprite.from(PIXI.Texture.WHITE);
  var player1Pos = 0.5;
  const player2 = PIXI.Sprite.from(PIXI.Texture.WHITE);
  var player2Pos = 0.5;
  const ball = PIXI.Sprite.from(PIXI.Texture.WHITE);
  var player1Health = 10;
  var player2Health = 10;
  const player1HealthText = new PIXI.Text('10HP', {
    fontFamily: 'Press Start 2P',
    fill: 0xffffff,
    align: 'center',
  });
  const player2HealthText = new PIXI.Text('10HP', {
    fontFamily: 'Press Start 2P',
    fill: 0xffffff,
    align: 'center',
  });
  var ballPosX = 0.05 + (Math.random() * 0.9);
  var ballPosY = 0.5;
  var ballSpeedX = 0;
  var ballSpeedY = 0;
  var gameReset = true;
  var gameTimer = 0;
  var colorSwitchTimer = 0;
  var colorIndex = 0;
  var shakeTimer = 0;
  var shakeProgress = 0;
  var shakeDirection = 1;
  var shakeTimerMax = 300;

  const gameTimerText = new PIXI.Text('5', {
    fontFamily: 'Press Start 2P',
    fontSize: 24,
    fill: 0xff1010,
    align: 'center',
  });

  function shake(dt) {
    app.view.style.bottom = `${shakeProgress * 2 * shakeDirection}%`;
    if (shakeTimerMax > 300) {
      app.view.style.left = `${randInt(-2, 2)}%`;
    } else {
      app.view.style.left = 0;
    }
    if (shakeTimer == 0) return;
    if (shakeTimer < 0) {
      shakeTimer -= dt;
      shakeProgress -= -shakeTimer / shakeTimerMax;
      if (shakeTimer < -shakeTimerMax) {
        shakeProgress = 0;
        shakeTimer = 0;
        shakeTimerMax = 300;
        return;
      }
      if (shakeProgress <= 0) {
        shakeProgress = 0;
        shakeTimer = 0;
        shakeTimerMax = 300;
      }
      return;
    }
    shakeTimer += dt;
    shakeProgress += shakeTimer / shakeTimerMax;
    if (shakeProgress >= 1) {
      shakeProgress = 1;
      shakeTimer = -dt;
      return;
    }
  }

  function onGoalHit(dt) {
    function onVictory() {
      clearStage();
      stageAddChild(gameTimerText);
    }

    ballPosX = 0.05 + (Math.random() * 0.9);    
    ballPosY = 0.5;
    ballSpeedX = 0;
    ballSpeedY = 0;
    gameTimer = 0;
    gameTimerText.style.fill = 0xff1010;
    colorSwitchTimer = 0;
    colorIndex = 0;
    gameReset = true;
    shakeProgress = 0;
    shakeTimer = dt;
    shakeTimerMax = 1000;
    if (player1Health == -1) {
      onVictory();
      player2Victory = true;
      return;
    }
    if (player2Health == -1) {
      onVictory();
      player1Victory = true;
      return;
    }
  }

  function moveBall(dt) {
    gameTimer += dt;
    if (gameTimer < 4000) {
      var time = Math.floor(gameTimer / 1000);
      if (time == 3) {
        gameTimerText.text = 'GO!';
        gameTimerText.x += app.screen.width * (Math.random() / 100);
        gameTimerText.y += app.screen.height * (Math.random() / 100);
        gameTimerText.style.fontSize = app.screen.width / 10;
        colorSwitchTimer += dt;
        if (colorSwitchTimer > 50) {
          gameTimerText.style.fill = rainbowColors[colorIndex];
          colorSwitchTimer = 0;
          colorIndex++;
          if (colorIndex == 7) colorIndex = 0;
        }
        return;
      }
      gameTimerText.text = 3 - Math.floor(gameTimer / 1000);
      return;
    }
    if (gameReset) {
      if (Math.round(Math.random()) == 0) ballSpeedX = 0.15;
      else ballSpeedX = -0.15;
      if (Math.round(Math.random()) == 0) ballSpeedY = 0.15;
      else ballSpeedY = -0.15;
      gameReset = false;
      return;
    }
    gameTimerText.text = '';
    ballPosX += ballSpeedX * (dt / 1000);
    ballPosY += ballSpeedY * (dt / 1000);
    if (ballPosY < 0.05) {
      // Player 2 goal
      if (ballPosX > player2Pos - 0.065) {
        if (ballPosX < player2Pos + 0.065) {
          ballPosY = 0.05;
          var newSpeed = rotateUntil(new Vector2(ballSpeedX, ballSpeedY), randAngle(), (vector) => ballPosY + vector.y > 0.05);
          ballSpeedX = newSpeed.x * 1.15;
          ballSpeedY = newSpeed.y * 1.15;
          shakeTimer = dt;
          shakeDirection = 1;
          return;
        }
      }
      player2Health -= 1;
      shakeDirection = 1;
      onGoalHit(dt);
      return;
    }
    if (ballPosY > 0.95) {
      // Player 1 goal
      if (ballPosX > player1Pos - 0.065) {
        if (ballPosX < player1Pos + 0.065) {
          ballPosY = 0.95;
          var newSpeed = rotateUntil(new Vector2(ballSpeedX, ballSpeedY), randAngle(), (vector) => ballPosY + vector.y < 0.95);
          ballSpeedX = newSpeed.x * 1.15;
          ballSpeedY = newSpeed.y * 1.15;
          shakeTimer = dt;
          shakeDirection = -1;
          return;
        }
      }
      player1Health -= 1;
      shakeDirection = -1;
      onGoalHit(dt);
      return;
    }
    
    if (ballPosX < 0.05) {
      ballPosX = 0.05;
      var newSpeed = rotateUntil(new Vector2(ballSpeedX, ballSpeedY), randAngle(), (vector) => (ballPosX + vector.x) > 0.05);
      ballSpeedX = newSpeed.x;
      ballSpeedY = newSpeed.y;
      return;
    }
    
    if (ballPosX > 0.95) {
      ballPosX = 0.95;
      var newSpeed = rotateUntil(new Vector2(ballSpeedX, ballSpeedY), randAngle(), (vector) => (ballPosX + vector.x) < 0.95);
      ballSpeedX = newSpeed.x;
      ballSpeedY = newSpeed.y;
    }
  }
  
  function movePlayer2(dt) {
    if (player2Pos < ballPosX - 0.005) {
      player2Pos += dt * computerPlayerSpeed;
      return;
    }
    if (player2Pos > ballPosX + 0.005) {
      player2Pos -= dt * computerPlayerSpeed;
      return;
    }
    player2Pos = ballPosX;
  }
  
  var victoryTimer = 0;
  
  function showVictory(dt) {
    function onVictory() {
      gameTimerText.style.fontSize = app.screen.width / 15;
    }
    
    if (player1Victory) {
      onVictory();
      colorSwitchTimer += dt;
      if (colorSwitchTimer > 100) {
        gameTimerText.style.fill = rainbowColors[randInt(0, 6)];
        colorSwitchTimer = 0;
      }
      gameTimerText.text = 'Player 1 Wins!';
      return true;
    }
    if (player2Victory) {
      onVictory();
      colorSwitchTimer += dt;
      if (colorSwitchTimer > 100) {
        gameTimerText.style.fill = rainbowColors[randInt(0, 6)];
        colorSwitchTimer = 0;
      }
      gameTimerText.text = 'Player 2 Wins!';
      return true;
    }
  }
  
  function update() {
    if (!isPlaying) return;
    var dt = app.ticker.deltaMS;
    resizeGameView();
    gameTimerText.y = app.screen.height / 3;
    gameTimerText.x = (app.screen.width / 2) - (gameTimerText.width / 2);
    if (showVictory(dt)) return;
    player1HealthText.text = `${player1Health}HP`;
    player1HealthText.style.fontSize = app.screen.width / 22;
    player1HealthText.x = app.screen.width - (app.screen.width / 45) - player1HealthText.width;
    player1HealthText.y = app.screen.height - app.screen.height / 15;
    player2HealthText.text = `${player2Health}HP`;
    player2HealthText.style.fontSize = app.screen.width / 22;
    player2HealthText.x = app.screen.width / 45;
    player2HealthText.y = app.screen.height / 45;
    gameTimerText.style.fontSize = app.screen.width / 22;
    player1.height = app.screen.width / 40;
    player1.width = app.screen.height / 10;
    player1.y = app.screen.height - (app.screen.width / 20);
    player2.height = app.screen.width / 40;
    player2.width = app.screen.height / 10;
    player2.y = app.screen.height / 40;
    ball.width = app.screen.width / 40;
    ball.height = app.screen.height / 40;
    moveBall(dt);
    ball.x = (ballPosX - 0.01) * app.screen.width;
    ball.y = (ballPosY - 0.01) * app.screen.height;
    player1.x = (player1Pos - 0.05) * app.screen.width;
    if (computerPlayer2) movePlayer2(dt);
    player2.x = (player2Pos - 0.05) * app.screen.width;
    shake(dt);
  }
  app.ticker.add(update);
  onmousemove = (e) => {
    player1Pos = (e.clientX - ((document.body.clientWidth - app.screen.width) / 2)) / app.screen.width;
  }
  onpointermove = onmousemove;
  stageAddChild(player1);
  stageAddChild(player2);
  stageAddChild(ball);
  stageAddChild(gameTimerText);
  stageAddChild(player1HealthText);
  stageAddChild(player2HealthText);
}

function mainMenu() {
  var isPlaying = true;
  
  function onStart() {
    onclick = null;
    isPlaying = false;
    app.ticker.remove(update);
    clearStage();
    start2p(true);
  }
  
  var mouseX = 0;
  var mouseY = 0;
  var pointedAtStartButton = false;
  
  const playersTitleText = new PIXI.Text('↓ PLAYERS ↓', {
    fontFamily: 'Press Start 2P',
    fill: 0xffffff,
    align: 'center',
  });
  const playerListText = new PIXI.Text('This game is\ncurrently in\nsingle-player\nmode (against\ncomputer).\n\nVisit us in a\nweek or two\nto play it\ntogether!', {
    fontFamily: 'Press Start 2P',
    fill: 0xffffff,
    align: 'left',
  });
  const startButtonText = new PIXI.Text('>>> START <<<', {
    fontFamily: 'Press Start 2P',
    fill: 0xffffff,
    align: 'left',
  });
  const startButton = PIXI.Sprite.from(PIXI.Texture.WHITE);
  startButton.tint = 0xFF0000;
  
  function update() {
    if (!isPlaying) return;
    resizeGameView();
    playersTitleText.style.fontSize = app.screen.width / 15;
    playersTitleText.x = app.screen.width / 7;
    playersTitleText.y = app.screen.height / 20;
    playerListText.style.fontSize = app.screen.width / 30;
    playerListText.x = app.screen.width / 4;
    playerListText.y = app.screen.height / 6;
    startButtonText.style.fontSize = app.screen.width / 20;
    startButtonText.x = app.screen.width / 5.9;
    startButtonText.y = app.screen.height / 1.2;
    startButton.width = app.screen.width / 3.5;
    startButton.height = app.screen.height / 9;
    startButton.x = app.screen.width / 2.85;
    startButton.y = app.screen.height / 1.25;
  }
  app.ticker.add(update);
  onmousemove = (e) => {
    mouseX = (e.clientX - ((document.body.clientWidth - app.screen.width) / 2));
    mouseY = e.clientY;
    document.body.style.cursor = "auto";
    pointedAtStartButton = false;
    if (mouseX > (app.screen.width / 2.90)) {
      if (mouseX < (app.screen.width / 1.58)) {
        if (mouseY > (app.screen.height / 1.25)) {
          if (mouseY < (app.screen.height / 1.09)) {
            document.body.style.cursor = "pointer";
            pointedAtStartButton = true;
          }
        }
      }
    }
  }
  
  onclick = (e) => {
    document.body.style.cursor = "auto";
    if (pointedAtStartButton) onStart();
  }
  ontouchend = (e) => {
    var touch = e.changedTouches[0];
    onmousemove(touch);
    onclick(e);
  }
  
  stageAddChild(playersTitleText);
  stageAddChild(playerListText);
  stageAddChild(startButton);
  stageAddChild(startButtonText);
}

function onConnected() {
  WebFont.load({
    google: {
      families: ['Press Start 2P']
    },
    active: e => {
      mainMenu();
    }
  });
}

//gameRoom.onConnected(onConnected);
onConnected();
