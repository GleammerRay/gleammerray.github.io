import {getValueFromURL, GameRoom} from './gameutils.js';
import {Vector2, Transform2D, BoxCollider2D, Rect2D} from './simplephys.js';

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
const PlayerControl = {
  pointer: 0,
  bot: 1,
}
const computerPlayerSpeed = 0.0004;
const playerRect = new Rect2D(-0.05, 0, 0.1, 1000);
const playerGoalRect = new Rect2D(-1000, 0, 2000, 1000);
const maxFixedUpdateRate = 0.1;
const gameAreaCenter = new Vector2(0.5, 0.5);

class PlayerInfo {
  id;
  name;
  control;
  
  constructor(id, name, control) {
    this.id = id;
    this.name = name;
    this.control = control;
  }
}

class GamePlayer {
  id;
  position;
  transform;
  health;
  collider;
  goalPosition;
  goalTransform;
  goalCollider;
  
  constructor(id, transform, health = 3) {
    this.id = id;
    this.position = transform.position;
    this.transform = transform;
    this.health = health;
    this.collider = new BoxCollider2D(transform, playerRect);
    this.goalPosition = new Vector2(transform.position.x, transform.position.y);
    this.goalTransform = new Transform2D(this.goalPosition, transform.rotation);
    this.goalCollider = new BoxCollider2D(this.goalTransform, playerGoalRect);
  }
  
  checkCollision(boxCollider) {
    return boxCollider.checkBoxCollision(this.collider);
  }
  
  checkGoalCollision(boxCollider) {
    return boxCollider.checkBoxCollision(this.goalCollider);
  }
  
  resetRotation(center = gameAreaCenter) {
    this.position.x -= center.x;
    this.position.y -= center.y;
    this.position.rotateSelf(Math.PI - this.transform.rotation);
    this.position.x += center.x;
    this.position.y += center.y;
    this.transform.rotation = 0;
    this.goalPosition.x -= center.x;
    this.goalPosition.y -= center.y;
    this.goalPosition.rotateSelf(Math.PI - this.goalTransform.rotation);
    this.goalPosition.x += center.x;
    this.goalPosition.y += center.y;
    this.goalTransform.rotation = 0;
  }
  
  rotate(radians, center = gameAreaCenter) {
    this.position.x -= center.x;
    this.position.y -= center.y;
    var rot = radians - this.transform.rotation;
    if (rot < 0) rot = (2 * Math.PI) + rot;
    this.position.rotateSelf(rot);
    this.position.x += center.x;
    this.position.y += center.y;
    this.transform.rotation = radians;
    this.goalPosition.x -= center.x;
    this.goalPosition.y -= center.y;
    var rot = radians - this.goalTransform.rotation;
    if (rot < 0) rot = (2 * Math.PI) + rot;
    this.goalPosition.rotateSelf(rot);
    this.goalPosition.x += center.x;
    this.goalPosition.y += center.y;
    this.goalTransform.rotation = radians;
  }
  
  moveToRelative(x, y = null) {
    this.position.rotateSelf((2 * Math.PI) - this.transform.rotation);
    this.position.x = x;
    if (y != null) this.position.y = y;
    this.position.rotateSelf(this.transform.rotation);
  }
}

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
var nextChildIndex = 0;
var stageChildren = {};
app.view.style.position = 'relative';
gameView.appendChild(app.view);

function stageAddChild(child) {
  app.stage.addChild(child);
  stageChildren[nextChildIndex] = child;
  nextChildIndex++;
  return nextChildIndex - 1;
}

function stageRemoveChild(index) {
  app.stage.removeChild(stageChildren[index]);
  return delete stageChildren[index];
}

function clearStage() {
  var children = Object.values(stageChildren);
  for (let i = 0; i != children.length; i++) {
    app.stage.removeChild(children[i]);
  }
  nextChildIndex = 0;
  stageChildren = {};
}

class VisualPlayer {
  id;
  position;
  player;
  transform;
  collider;
  sprite;
  goalSprite;
  //healthSprite;
  spriteIndexes = [];
  
  constructor(player) {
    this.id = player.id;
    this.player = player;
    this.transform = player.transform;
    this.collider = player.collider;
    this.position = this.transform.position;
    this.goalSprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    this.goalSprite.anchor.set(0.5);
    this.goalSprite.tint = 0x444444;
    this.spriteIndexes.push(stageAddChild(this.goalSprite));
    this.sprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    this.sprite.anchor.set(0.5, 0.005);
    this.spriteIndexes.push(stageAddChild(this.sprite));
    /*
    this.healthSprite = PIXI.Sprite.from(PIXI.Texture.WHITE);
    this.healthSprite.anchor.set(0.5);
    this.healthSprite.tint = 0xdddddd;
    this.spriteIndexes.push(stageAddChild(this.healthSprite));
    */
  }
  
  removeFromStage() {
    for (let i = 0; i != this.spriteIndexes.length; i++) {
      stageRemoveChild(this.spriteIndexes[i]);
    }
  }
  
  addToStage() {
    this.removeFromStage();
    this.spriteIndexes.push(stageAddChild(this.goalSprite));
    this.spriteIndexes.push(stageAddChild(this.sprite));
    //this.spriteIndexes.push(stageAddChild(this.healthSprite));
  }
  
  update() {
    this.goalSprite.height = app.screen.height / 200;
    this.goalSprite.width = app.screen.width * 1000;
    this.goalSprite.x = (this.position.x) * app.screen.width;
    this.goalSprite.y = (this.position.y) * app.screen.height;
    this.goalSprite.rotation = this.transform.rotation;
    this.sprite.height = app.screen.height;
    this.sprite.width = app.screen.width * this.collider.bounds.width;    
    this.sprite.x = (this.position.x) * app.screen.width;
    this.sprite.y = (this.position.y) * app.screen.height;
    this.sprite.rotation = this.transform.rotation;
    /*
    const relPos = this.position.rotate((Math.PI * 2) - this.transform.rotation);
    const healthSpritePos = new Vector2(relPos.x, relPos.y + 0.03).rotate(this.transform.rotation);
    this.healthSprite.x = (healthSpritePos.x) * app.screen.height;
    this.healthSprite.y = (healthSpritePos.y) * app.screen.height;
    this.healthSprite.height = 0.05 * app.screen.height;
    this.healthSprite.width = (this.sprite.width / 3) * this.player.health;
    this.healthSprite.rotation = this.transform.rotation;
    */
  }
}

var playersInfo = {
  'host': new PlayerInfo('host', '(G)!HOST', PlayerControl.pointer),
};
var localPlayers = ['host'];
var alivePlayers = {
  'host': new GamePlayer('host', new Transform2D(new Vector2(0.5, 0.95))),
};
var visualPlayers = {
  'host': new VisualPlayer(alivePlayers['host']),
};

function rotatePlayers() {
  var players = Object.values(alivePlayers);
  var curRot = 0;
  var rot = (2 * Math.PI) / players.length;
  var widthDelta = ((playerRect.width / players.length) - 0.05) / 2;
  var bounds = new Rect2D(playerRect.x - widthDelta, playerRect.y, playerRect.width + widthDelta, playerRect.height);
  for (let i = 0; i != players.length; i++) {
    const player = players[i];
    player.resetRotation();
    player.position.x = 0.5;
    player.collider.bounds = bounds;
    player.goalPosition.x = 0.5;
    switch (players.length) {
      case 3:
        player.position.y = 0.74;
        player.goalPosition.y = 0.74;
        break;
      case 5:
        player.position.y = 0.9;
        player.goalPosition.y = 0.9;
        break;
      case 6:
        player.position.y = 0.93;
        player.goalPosition.y = 0.93;
        break;
      default:
        player.position.y = 0.94;
        player.goalPosition.y = 0.95;
        break;
    }
    player.rotate(curRot);
    curRot -= rot;
    if (curRot < 0) curRot = (2 * Math.PI) + curRot;
  }
}

function addPlayer(id) {
  var player = new GamePlayer(id, new Transform2D(new Vector2(0.5, 0.95)));
  alivePlayers[id] = player;
  visualPlayers[id] = new VisualPlayer(player);
  rotatePlayers();
}

var botIndex = 0;
function createBotPlayer() {
  const id = localPlayers[0].id + `_${botIndex}`;
  botIndex++;
  playersInfo[id] = new PlayerInfo(id, 'Botty', PlayerControl.bot);
  localPlayers.push(id);
  addPlayer(id);
}
function removeBotPlayer() {
  if (localPlayers.length == 2) return;
  const id = localPlayers.pop();
  delete playersInfo[id];
  delete alivePlayers[id];
  var visualPlayer = visualPlayers[id];
  delete visualPlayers[id];
  visualPlayer.removeFromStage();
  rotatePlayers();
}

createBotPlayer();
createBotPlayer();
createBotPlayer();
createBotPlayer();

var isAdmin = true;

function updateVisualPlayers() {
  var vplays = Object.values(visualPlayers);
  for (let i = 0; i != vplays.length; i++) {
    vplays[i].update();
  }
}

function addVisualPlayers() {
  var vplays = Object.values(visualPlayers);
  for (let i = 0; i != vplays.length; i++) {
    vplays[i].addToStage();
  }
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
  var newVector = vector.rotate(checkAngle);
  if (!shouldStop(newVector)) degree = (2  * Math.PI) - degree;
  newVector = vector.rotate(degree);
  while (!shouldStop(newVector)) newVector = newVector.rotate(degree);
  return newVector;
}

function randAngle() {
  return Math.sin((Math.PI / 2) * (1 + (Math.random() / 2)));
}

var players = [
  {
    id: 'test',
    type: 'local',
    control: 'pointer',
  },
  {
    id: 'test',
    type: 'local',
    control: 'bot',
  },
];

var pointerX = 0;
var ballPos = new Vector2(
  0.5,
  0.5,
);

function moveBotPlayer(dt, id) {
  const player = alivePlayers[id];
  const playerPosRel = player.position.rotate((2 * Math.PI) - player.transform.rotation);
  const ballPosRel = ballPos.rotate((2 * Math.PI) - player.transform.rotation);
  if (playerPosRel.x < ballPosRel.x - 0.005) {
    player.moveToRelative(playerPosRel.x + dt * computerPlayerSpeed);
    return;
  }
  if (playerPosRel.x > ballPosRel.x + 0.005) {
    player.moveToRelative(playerPosRel.x - dt * computerPlayerSpeed);
    return;
  }
  player.moveToRelative(ballPosRel.x);
}

function movePlayers(dt) {
  for (let i = 0; i != localPlayers.length; i++) {
    const index = localPlayers[i];
    if (alivePlayers[index] == null) continue;
    const player = playersInfo[index];
    if (player.control == PlayerControl.bot) {
      moveBotPlayer(dt, index);
      continue;
    }
    if (player.control == PlayerControl.pointer) {
      alivePlayers[index].moveToRelative(pointerX);
      continue;
    }
  }
}

function victoryScreen(text) {
  var isPlaying = true;
  
  const victoryText = new PIXI.Text(text, {
    fontFamily: 'Press Start 2P',
    fill: rainbowColors[randInt(0, 6)],
    align: 'center',
  });
  
  var colorSwitchTimer = 0;
  var victoryTimer = 0;
  function showVictory(dt) {
    victoryText.style.fontSize = app.screen.width / 22;
    victoryText.x = (app.screen.width / 2) - (victoryText.width / 2);
    victoryText.y = (app.screen.height / 2) - (victoryText.height / 2);
    colorSwitchTimer += dt;
    if (colorSwitchTimer > 100) {
      victoryText.style.fill = rainbowColors[randInt(0, 6)];
      colorSwitchTimer = 0;
    }
  }
  
  var dt = 0;
  var updating = false;
  function update() {
    if (!isPlaying) {
      app.ticker.remove(update);
      return;
    }
    dt += app.ticker.deltaMS;
    if (updating) return;
    updating = true;
    resizeGameView();
    showVictory(dt);
    dt = 0;
    updating = false;
  }
  app.ticker.add(update);
  
  stageAddChild(victoryText);
}

function start2p() {
  addVisualPlayers();
  ballPos.x = 0.3 + (Math.random() * 0.4);
  ballPos.y = 0.5;
  var isPlaying = true;
  const ball = PIXI.Sprite.from(PIXI.Texture.WHITE);
  ball.anchor.set(0.5);
  var ballTransform = new Transform2D(ballPos);
  var ballCol = new BoxCollider2D(
    ballTransform,
    new Rect2D(-0.0125, -0.0125, 0.025, 0.025),
  );
  var ballSpeed = new Vector2();
  var gameReset = true;
  var gameTimer = 0;
  var colorSwitchTimer = 0;
  var colorIndex = 0;
  var lastHurtPlayerVisual;
  var shakeTimer = 0;
  var shakeProgress = 0;
  var shakeDirection = new Vector2();
  var shakeTimerMax = 300;

  const gameTimerText = new PIXI.Text('5', {
    fontFamily: 'Press Start 2P',
    fontSize: 24,
    fill: 0xff1010,
    align: 'center',
  });

  function shake(dt) {
    app.view.style.bottom = `${shakeProgress * 2 * -shakeDirection.y}%`;
    app.view.style.left = `${shakeProgress * 2 * shakeDirection.x}%`;
    if (shakeTimer == 0) {
      //if (lastHurtPlayerVisual != null) lastHurtPlayerVisual.healthSprite.tint = 0xdddddd;
      app.view.style.bottom = 0;
      app.view.style.left = 0;
      return;
    }
    if (shakeTimerMax > 300) {
      //if (lastHurtPlayerVisual != null) lastHurtPlayerVisual.healthSprite.tint = 0xff0000;
      app.view.style.bottom = `${randInt(-1, 1)}%`;
      app.view.style.left = `${randInt(-1, 1)}%`;
    }
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

  function onGoalHit(dt, playerID) {
    ballPos.x = 0.5;
    ballPos.y = 0.5;
    ballSpeed.x = 0;
    ballSpeed.y = 0;
    gameTimer = 0;
    gameTimerText.style.fill = 0xff1010;
    colorSwitchTimer = 0;
    colorIndex = 0;
    gameReset = true;
    shakeProgress = 0;
    shakeTimer = dt;
    shakeTimerMax = 1000;
    lastHurtPlayerVisual = visualPlayers[playerID];
    delete alivePlayers[playerID];
    visualPlayers[playerID].removeFromStage();
    delete visualPlayers[playerID];
    rotatePlayers();
    if (Object.keys(alivePlayers).length == 1) {
      clearStage();
      stageAddChild(gameTimerText);
      isPlaying = false;
      victoryScreen(`${playersInfo[Object.values(alivePlayers)[0].id].name} wins!`);
      return;
    }
    if (playerID == localPlayers[0]) {
      clearStage();
      stageAddChild(gameTimerText);
      isPlaying = false;
      victoryScreen(`Bots win!`);
      return;
    }
  }

  function checkPlayerCollision(dt) {
    for (let i = 0; i != localPlayers.length; i++) {
      const index = localPlayers[i];
      var player = alivePlayers[index];
      if (player == null) continue;
      if (player.checkGoalCollision(ballCol)) {
        if (player.checkCollision(ballCol)) {
          const playerPosRel = player.position.rotate((2 * Math.PI) - player.transform.rotation);
          ballPos.rotateSelf((2 * Math.PI) - player.transform.rotation);
          ballPos.y = playerPosRel.y - 0.01751;
          ballPos.rotateSelf(player.transform.rotation);
          var newSpeed = rotateUntil(new Vector2(ballSpeed.x, ballSpeed.y), randAngle(), (vec) => {
            var ballPosBak = new Vector2(ballPos.x, ballPos.y);
            ballPos.x += vec.x;
            ballPos.y += vec.y;
            var colTest = player.checkGoalCollision(ballCol);
            ballPos.x = ballPosBak.x;
            ballPos.y = ballPosBak.y;
            return !colTest;
          });
          shakeDirection = ballSpeed.normalize();
          ballSpeed.x = newSpeed.x * 1.15;
          ballSpeed.y = newSpeed.y * 1.15;
          while (player.checkGoalCollision(ballCol)) {
            ballPos.x += ballSpeed.x * (dt / 1000);
            ballPos.y += ballSpeed.y * (dt / 1000);
          }
          shakeTimer = dt;
          continue;
        }
        player.health -= 1;
        onGoalHit(dt, index);
      }
    }
  }

  function moveBall(dt) {
    gameTimer += dt;
    if (gameTimer < 4000) {
      var time = Math.floor(gameTimer / 1000);
      if (time == 3) {
        gameTimerText.text = 'GO!';
        gameTimerText.style.fontSize = app.screen.width / 10;
        gameTimerText.x = (app.screen.width / 2) - (gameTimerText.width / 2) + (app.screen.width * ((Math.random() - 0.5) / 100));
        gameTimerText.y = (app.screen.height / 2) - (gameTimerText.height / 2) + (app.screen.height * ((Math.random() - 0.5) / 100));
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
      gameTimerText.x = (app.screen.width / 2) - (gameTimerText.width / 2);
      gameTimerText.y = (app.screen.height / 2) - (gameTimerText.height / 2);
      return;
    }
    if (gameReset) {
      if (Math.round(Math.random()) == 0) ballSpeed.x = 0.15;
      else ballSpeed.x = -0.15;
      if (Math.round(Math.random()) == 0) ballSpeed.y = 0.15;
      else ballSpeed.y = -0.15;
      gameReset = false;
      return;
    }
    gameTimerText.text = '';
    ballPos.x += ballSpeed.x * (dt / 1000);
    ballPos.y += ballSpeed.y * (dt / 1000);
    // Collision stuff \/\/\/ (move to a separate function later)
    checkPlayerCollision(dt);

    if (ballPos.y < 0.0125) {
      ballPos.y = 0.0125;
      var newSpeed = rotateUntil(new Vector2(ballSpeed.x, ballSpeed.y), randAngle(), (vector) => vector.y > 0.0125);
      ballSpeed.x = newSpeed.x;
      ballSpeed.y = newSpeed.y;
      return;
    }

    if (ballPos.y > 0.9875) {
      ballPos.y = 0.9875;
      var newSpeed = rotateUntil(new Vector2(ballSpeed.x, ballSpeed.y), randAngle(), (vector) => vector.y < 0.9875);
      ballSpeed.x = newSpeed.x;
      ballSpeed.y = newSpeed.y;
      return;
    }

    if (ballPos.x < 0.0125) {
      ballPos.x = 0.0125;
      var newSpeed = rotateUntil(new Vector2(ballSpeed.x, ballSpeed.y), randAngle(), (vector) => vector.x > 0.0125);
      ballSpeed.x = newSpeed.x;
      ballSpeed.y = newSpeed.y;
      return;
    }
    
    if (ballPos.x > 0.9875) {
      ballPos.x = 0.9875;
      var newSpeed = rotateUntil(new Vector2(ballSpeed.x, ballSpeed.y), randAngle(), (vector) => vector.x < 0.9875);
      ballSpeed.x = newSpeed.x;
      ballSpeed.y = newSpeed.y;
      return;
    }
  }

  var dt = 0;
  var updating = false;
  function update() {
    if (!isPlaying) {
      app.ticker.remove(update);
      return;
    }
    dt += app.ticker.deltaMS;
    if (updating) return;
    updating = true;
    resizeGameView();
    updateVisualPlayers();
    updateVisualPlayers();
    ball.width = app.screen.width / 40;
    ball.height = app.screen.height / 40;
    ball.x = (ballPos.x) * app.screen.width;
    ball.y = (ballPos.y) * app.screen.height;
    shake(dt);
    updating = false;
    dt = 0;
  }
  app.ticker.add(update);
  onmousemove = (e) => {
    pointerX = (e.clientX - ((document.body.clientWidth - app.screen.width) / 2)) / app.screen.width;
  }
  onpointermove = onmousemove;
  stageAddChild(ball);
  stageAddChild(gameTimerText);
  var lastUpdateMs = new Date().getTime();
  function fixedUpdate() {
    if (!isPlaying) return;
    var curMs = new Date().getTime();
    var dt = curMs - lastUpdateMs;
    lastUpdateMs = curMs;
    gameTimerText.style.fontSize = app.screen.width / 22;
    moveBall(dt);
    movePlayers(dt);
    setTimeout(fixedUpdate, maxFixedUpdateRate);
  }
  fixedUpdate();
}

var playerCount;

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
  var pointedAt;
  
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
  const modeArrowBG = PIXI.Sprite.from(PIXI.Texture.WHITE);
  modeArrowBG.tint = 0xFF0000;
  const modeArrowLeft = new PIXI.Text('-', {
    fontFamily: 'Press Start 2P',
    fill: 0xffffff,
    align: 'left',
  });
  const modeArrowRight = new PIXI.Text('+', {
    fontFamily: 'Press Start 2P',
    fill: 0xffffff,
    align: 'left',
  });
  const modeTextBG = PIXI.Sprite.from(PIXI.Texture.WHITE);
  const modeText = new PIXI.Text('1 player(s), 4 bot(s)', {
    fontFamily: 'Press Start 2P',
    fill: 0x000000,
    align: 'center',
  });
  const startButton = PIXI.Sprite.from(PIXI.Texture.WHITE);
  startButton.tint = 0xFF0000;
  
  function update() {
    if (!isPlaying) {
      app.ticker.remove(update);
      return;
    }
    resizeGameView();
    updateVisualPlayers();
    playersTitleText.style.fontSize = app.screen.width / 15;
    playersTitleText.x = app.screen.width / 7;
    playersTitleText.y = app.screen.height / 20;
    playerListText.style.fontSize = app.screen.width / 30;
    playerListText.x = app.screen.width / 4;
    playerListText.y = app.screen.height / 6;
    modeArrowBG.width = app.screen.width / 1.04;
    modeArrowBG.height = app.screen.width / 11;
    modeArrowBG.x = app.screen.width / 70;
    modeArrowBG.y = app.screen.height / 1.45;
    modeArrowLeft.style.fontSize = app.screen.width / 20;
    modeArrowLeft.x = app.screen.width / 27;
    modeArrowLeft.y = app.screen.height / 1.4;
    modeArrowRight.style.fontSize = app.screen.width / 20;
    modeArrowRight.x = app.screen.width / 1.11;
    modeArrowRight.y = app.screen.height / 1.4;
    modeTextBG.width = app.screen.width / 1.31;
    modeTextBG.height = app.screen.width / 11;
    modeTextBG.x = app.screen.width / 9;
    modeTextBG.y = app.screen.height / 1.45;
    var realPlayerCount = 0;
    var botPlayerCount = 0;
    const playerInfoValues = Object.values(playersInfo);
    for (let i = 0; i != playerInfoValues.length; i++) {
      if (playerInfoValues[i].control == PlayerControl.pointer) {
        realPlayerCount++;
        continue;
      }
      botPlayerCount++;
    }
    modeText.text = `${realPlayerCount} player(s), ${botPlayerCount} bot(s)`;
    modeText.style.fontSize = app.screen.width / 32;
    modeText.x = app.screen.width / 8;
    modeText.y = app.screen.height / 1.39;
    startButtonText.style.fontSize = app.screen.width / 20;
    startButtonText.x = app.screen.width / 5.9;
    startButtonText.y = app.screen.height / 1.2;
    startButton.width = app.screen.width / 3.5;
    startButton.height = app.screen.height / 9;
    startButton.x = app.screen.width / 2.85;
    startButton.y = app.screen.height / 1.25;
  }
  app.ticker.add(update);
  var lastUpdateMs = new Date().getTime();
  function fixedUpdate() {
    if (!isPlaying) return;
    var curMs = new Date().getTime();
    var dt = curMs - lastUpdateMs;
    lastUpdateMs = curMs;
    movePlayers(dt);
    setTimeout(fixedUpdate, maxFixedUpdateRate);
  }
  fixedUpdate();
  onmousemove = (e) => {
    mouseX = (e.clientX - ((document.body.clientWidth - app.screen.width) / 2));
    pointerX = mouseX / app.screen.width;
    mouseY = e.clientY;
    document.body.style.cursor = "auto";
    pointedAt = null;
    // Start button
    if (mouseX > (app.screen.width / 2.90)) {
      if (mouseX < (app.screen.width / 1.58)) {
        if (mouseY > (app.screen.height / 1.25)) {
          if (mouseY < (app.screen.height / 1.09)) {
            document.body.style.cursor = "pointer";
            pointedAt = 'startButton';
          }
        }
      }
    }
    // Mode arrow left
    if (mouseX > (app.screen.width / 90)) {
      if (mouseX < (app.screen.width / 7)) {
        if (mouseY > (app.screen.height / 1.45)) {
          if (mouseY < (app.screen.height / 1.27)) {
            document.body.style.cursor = "pointer";
            pointedAt = 'modeArrowLeft';
          }
        }
      }
    }
    // Mode arrow right
    if (mouseX > (app.screen.width / 1.2)) {
      if (mouseX < (app.screen.width / 1.025)) {
        if (mouseY > (app.screen.height / 1.45)) {
          if (mouseY < (app.screen.height / 1.27)) {
            document.body.style.cursor = "pointer";
            pointedAt = 'modeArrowRight';
          }
        }
      }
    }
  }
  
  onclick = (e) => {
    document.body.style.cursor = "auto";
    switch (pointedAt) {
      case 'startButton':
        onStart();
        break;
      case 'modeArrowLeft':
        removeBotPlayer();
        break;
      case 'modeArrowRight':
        createBotPlayer();
        break;
    }
  }
  if (typeof ontouchend != 'undefined') {
    ontouchend = (e) => {
      var touch = e.changedTouches[0];
      onmousemove(touch);
      onclick(e);
    }
  }
  
  stageAddChild(playersTitleText);
  stageAddChild(playerListText);
  stageAddChild(startButton);
  stageAddChild(startButtonText);
  stageAddChild(modeArrowBG);
  stageAddChild(modeArrowLeft);
  stageAddChild(modeArrowRight);
  stageAddChild(modeTextBG);
  stageAddChild(modeText);
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
