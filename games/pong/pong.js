var rainbowColors = [
  0xff0000,
  0xffa500,
  0xffff00,
  0x008000,
  0x0000ff,
  0x4b0082,
  0xee82ee,
];

function randInt(min, max) {
  return Math.floor((Math.random() * (max - min)) + min);
}

function interpolate(start, end, multiplier = 0.5) {
  return (start + end) * multiplier;
}

var isPlaying = false;

function start2p() {
  isPlaying = true;
  var player1Victory = false;
  var player2Victory = false;
  var gameView = document.getElementById('game-view');

  let app = new PIXI.Application({
    width: 640,
    height: 360
  });
  app.view.style.position = 'relative';

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

  gameView.appendChild(app.view);

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
  var ballPosX = 0.5;
  var ballPosY = 0.5;
  var ballSpeed = 0;
  var gameReset = true;
  var gameTimer = 0;
  var colorSwitchTimer = 0;
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
      if (shakeTimer < -300) {
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
      app.stage.removeChild(ball);
      app.stage.removeChild(player1);
      app.stage.removeChild(player1HealthText);
      app.stage.removeChild(player2);
      app.stage.removeChild(player2HealthText);
    }
    
    ballPosY = 0.5;
    ballSpeed = 0;
    gameTimer = 0;
    gameTimerText.style.fill = 0xff1010;
    colorSwitchTimer = 0;
    gameReset = true;
    shakeTimer = dt;
    shakeDirection = -1;
    shakeTimerMax = 1000;
    console.log(player1Health);
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
        gameTimerText.style.fontSize = app.screen.width / 15;
        colorSwitchTimer += dt;
        if (colorSwitchTimer > 50) {
          gameTimerText.style.fill = rainbowColors[randInt(0, 6)];
          colorSwitchTimer = 0;
        }
        return;
      }
      gameTimerText.text = 3 - Math.floor(gameTimer / 1000);
      return;
    }
    if (gameReset) {
      if (Math.round(Math.random()) == 0) ballSpeed = 0.0003;
      else ballSpeed = -0.0003;
      gameReset = false;
      return;
    }
    gameTimerText.text = '';
    ballPosY += ballSpeed * app.screen.width * (dt / 1000);
    if (ballPosY < 0.05) {
      if (ballPosX > player2Pos - 0.06) {
        if (ballPosX < player2Pos + 0.06) {
          ballSpeed *= -1.10;
          shakeTimer = dt;
          shakeDirection = 1;
          return;
        }
      }
      player2Health -= 1;
      shakeDirection = -1;
      onGoalHit();
      return;
    }
    if (ballPosY > 0.95) {
      if (ballPosX > player1Pos - 0.065) {
        if (ballPosX < player1Pos + 0.065) {
          ballSpeed *= -1.10;
          shakeTimer = dt;
          shakeDirection = 1;
          return;
        }
      }
      player1Health -= 1;
      shakeDirection = 1;
      onGoalHit(dt);
      return;
    }
  }

  function movePlayer1() {
    player1.x = (player1Pos - 0.05) * app.screen.width;
  }
  
  var victoryTimer = 0;
  
  function showVictory() {
    function onVictory() {
      gameTimerText.style.fontSize = app.screen.width / 15;
    }
    
    if (player1Victory) {
      onVictory();
      gameTimerText.text = 'Player 1 Wins!';
      return true;
    }
    if (player2Victory) {
      onVictory();
      gameTimerText.text = 'Player 2 Wins!';
      return true;
    }
  }
  
  var lastDt = 0;
  window.main = (dt) => {
    if (!isPlaying) return;
    window.requestAnimationFrame(main);
    var temp = dt;
    dt = dt - lastDt;
    lastDt = temp;
    resizeGameView();
    gameTimerText.y = app.screen.height / 3;
    gameTimerText.x = (app.screen.width / 2) - (gameTimerText.width / 2);
    if (showVictory()) return;
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
    movePlayer1();
    player2.x = (player2Pos - 0.05) * app.screen.height;
    shake(dt);
  }
  onmousemove = (e) => {
    player1Pos = (e.clientX - ((document.body.clientWidth - app.screen.width) / 2)) / app.screen.width;
  }
  window.requestAnimationFrame(main);
  app.stage.addChild(player1);
  app.stage.addChild(player2);
  app.stage.addChild(ball);
  app.stage.addChild(gameTimerText);
  app.stage.addChild(player1HealthText);
  app.stage.addChild(player2HealthText);
}

WebFont.load({
  google: {
    families: ['Press Start 2P']
  },
  active: e => {
    start2p();
  }
});
