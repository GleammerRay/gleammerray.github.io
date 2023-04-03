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
  connectedPlayerNames;
  adminId;
  #isConnected;
  #sendPlayerName;
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
  
  #onGetPlayerName(name, peerId) {
    this.playerNames[peerId] = name;
    this.connectedPlayerNames[peerId] = name;
    if (this.#isConnected) return;
    if (peerId != this.adminId) return;
    this.#isConnected = true;
    if (this.#onConnected != null) this.#onConnected();
  }
  
  #onGetAdminId(adminId, peerId) {
    if (peerId != hostSelfId) return;
    if (this.adminId == null) {
      this.#isConnected = false;
      if (this.#onDisconnected != null) this.#onDisconnected();
    }
    this.adminId = adminId;
    var connectedPeerIds = Object.keys(this.connectedPlayerNames);
    for (let i = 0; i != connectedPeerIds.length; i++) {
      if (connectedPeerIds[i] != adminId) continue;
      this.#isConnected = true;
      if (this.#onConnected != null) this.#onConnected();
    }
  }
  
  onConnected(callback) {
    this.#onConnected = callback;
  }
  
  onDisconnected(callback) {
    this.#onDisconnected = callback;
  }
  
  onPeerJoin(callBack) {
    this.#onPeerJoin = callback;
  }

  onPeerLeave(callBack) {
    this.#onPeerLeave = callback;
  }

  constructor(gameRoomId, hostSelfId) {
    if (gameRoomId == null) gameRoomId = getValueFromURL('gameRoomId');
    if (hostSelfId == null) hostSelfId = getValueFromURL('hostSelfId');  
    this.connectedPlayerNames = {};
    this.connectedPlayerNames[selfId] = 'N00B';
    this.playerNames = {};
    this.#isConnected = false;
    this.gameRoom = joinRoom(config, gameRoomId);
    var getPlayerName;
    [this.#sendPlayerName, getPlayerName] = this.gameRoom.makeAction('playerName');
    const getAdminId = this.gameRoom.makeAction('adminId')[1];
    getPlayerName((a, b) => this.#onGetPlayerName(a, b));
    getAdminId((a, b) => this.#onGetAdminId(a, b));
    this.gameRoom.onPeerJoin((peerId) => {
      if (this.#onPeerJoin != null) this.#onPeerJoin();
      this.#sendPlayerName(this.connectedPlayerNames[selfId], peerId);
    });
    this.gameRoom.onPeerLeave((peerId) => {
      if (this.#onPeerLeave != null) this.#onPeerLeave();
      if (peerId == adminId) {
        this.#isConnected = false;
        if (this.#onDisconnected != null) this.#onDisconnected();
      }
      delete this.connectedPlayerNames[peerId];
    });
  }
  
  sendPlayerName(name) {
    if (this.#sendPlayerName == null) return;
    var playerIds = Object.keys(connectedPlayerNames);
    for (let i = 0; i != playerIds.length; i++) {
      this.#sendPlayerName(name, playerIds[i]);
    }
  }
}

