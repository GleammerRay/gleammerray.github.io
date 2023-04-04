import {selfId, joinRoom} from 'https://cdn.skypack.dev/trystero';
const config = {appId: 'https://gleammerray.github.io/games'};

export function getValueFromURL(name) {
  var queryString = window.location.search.split('?');
  if (queryString.length == 1) return;
  queryString = queryString[1];
  if (!queryString.includes(`${name}=`)) return;
  queryString = queryString.split('&');
  for (let i = 0; i != queryString.length; i++) {
    var variable = queryString[i];
    if (variable.includes(`${name}=`)) return variable.split('=')[1];
  }
}

export const gameRoomId = getValueFromURL('gameRoomId');
export const hostSelfId = getValueFromURL('hostSelfId');

export class GameRoom {
  gameRoom;
  playerNames;
  playerInfo = {};
  connectedPlayerInfo = {};
  #knownPlayerInfo = {};
  adminId;
  #isConnected;
  #onConnected;
  #onDisconnected;
  #onPeerJoin;
  #onPeerLeave;
  
  get isAdmin() {
    return this.adminId == selfId;
  }
  
  get isConnected() {
    return this.#isConnected;
  }
  
  #checkIsConnected() {
    const connectedPeerIds = Object.keys(this.connectedPlayerInfo);
    if (connectedPeerIds.includes(this.adminId)) {
      this.#isConnected = true;
      if (this.#onConnected != null) this.#onConnected();
    }
  }
  
  #onGetPlayerInfo(playerInfo, peerId) {
    if (peerId != hostSelfId) return;
    this.#knownPlayerInfo = playerInfo;
    const playerInfoKeys = Object.keys(playerInfo);
    for (let i = 0; i != playerInfoKeys.length; i++) {
      const key = playerInfoKeys[i];
      this.playerInfo[key] = playerInfo[key];
    }
    if (this.#isConnected) return;
    this.#checkIsConnected();
  }
  
  #onGetWelcome(welcome, peerId) {
    if (peerId != hostSelfId) return;
    console.log(welcome);
    if (this.connectedPlayerInfo[selfId] == null) this.connectedPlayerInfo[selfId] = welcome.playerInfo[selfId];
    if (this.#isConnected) {
      this.#isConnected = false;
      if (this.#onDisconnected != null) this.#onDisconnected();
    }
    this.adminId = welcome.adminId;
    this.#onGetPlayerInfo(welcome.playerInfo, peerId);
  }
  
  onConnected(callback) {
    this.#onConnected = callback;
  }
  
  onDisconnected(callback) {
    this.#onDisconnected = callback;
  }
  
  onPeerJoin(callback) {
    this.#onPeerJoin = callback;
  }

  onPeerLeave(callback) {
    this.#onPeerLeave = callback;
  }

  constructor(gameRoomId = null, hostSelfId = null) {
    if (gameRoomId == null) gameRoomId = getValueFromURL('gameRoomId');
    if (hostSelfId == null) hostSelfId = getValueFromURL('hostSelfId');
    this.playerNames = {};
    this.#isConnected = false;
    this.gameRoom = joinRoom(config, gameRoomId);
    const getWelcome = this.gameRoom.makeAction('welcome')[1];
    getWelcome((a, b) => this.#onGetWelcome(a, b));
    this.gameRoom.onPeerJoin((peerId) => {
      var playerInfo = this.playerInfo[peerId];
      if (playerInfo == null) return;
      this.connectedPlayerInfo[peerId] = playerInfo;
      if (!this.#isConnected) this.#checkIsConnected();
      if (this.#onPeerJoin != null) this.#onPeerJoin(peerId);
    });
    this.gameRoom.onPeerLeave((peerId) => {
      if (peerId == adminId) {
        this.#isConnected = false;
        if (this.#onDisconnected != null) this.#onDisconnected();
      }
      delete this.connectedPlayerInfo[peerId];
      if (this.#onPeerLeave != null) this.#onPeerLeave(peerId);
    });
  }

  makeAction(name) {
    var adminId = this.adminId;
    const [send, get] = this.gameRoom.makeAction(name);
    var safeSend;
    var safeGet;
    if (adminId == selfId) {
      safeSend = send;
      safeGet = get;
      console.log('cool B)');
    } else {
      safeSend = (data) => send(data, this.adminId);
      safeGet = (callback) => {
        get((data, peerId) => {
          if (peerId != adminId) return;
          callback(data);
        });
      };
      console.log('less cool B(');
    }
    return [
      safeSend,
      safeGet,
    ];
  }
}

