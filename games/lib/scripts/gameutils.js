import {selfId as sselfId, joinRoom} from '/trystero-torrent.min.js';
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

export const selfId = sselfId;
export const gameRoomId = getValueFromURL('gameRoomId');
export const hostSelfId = getValueFromURL('hostSelfId');
export const chatSelfId = getValueFromURL('chatSelfId');

export class GameRoom {
  gameRoomId;
  hostSelfId;
  chatSelfId;
  gameRoom;
  playerNames;
  playerInfo = {};
  connectedPlayerInfo = {};
  infolessPlayers = {};
  #knownPlayerInfo = {};
  adminId;
  #isConnected;
  #onConnected;
  #onDisconnected;
  #onPeerJoin;
  #onPeerLeave;
  #sendGameJoin;
  
  get isAdmin() {
    return this.adminId == selfId;
  }
  
  get isConnected() {
    return this.#isConnected;
  }
  
  #checkIsConnected() {
    const connectedPeerIds = Object.keys(this.connectedPlayerInfo);
    if (!connectedPeerIds.includes(this.adminId)) return;
    if (!Object.keys(this.#knownPlayerInfo).includes(selfId)) {
      this.#sendGameJoin({ chatSelfId: this.chatSelfId }, this.hostSelfId);
      return;
    }
    this.#isConnected = true;
    if (this.#onConnected != null) this.#onConnected();
  }
  
  #onGetPlayerInfo(playerInfo, peerId) {
    if (peerId != this.hostSelfId) return;
    this.#knownPlayerInfo = playerInfo;
    const playerInfoKeys = Object.keys(playerInfo);
    for (let i = 0; i != playerInfoKeys.length; i++) {
      const key = playerInfoKeys[i];
      const val = playerInfo[key];
      this.playerInfo[key] = val;
      if (this.connectedPlayerInfo[key] != null) this.connectedPlayerInfo[key] = val;
      if (this.infolessPlayers[key] != null) {
        delete this.infolessPlayers[key];
        this.connectedPlayerInfo[key] = val;
        if (this.#onPeerJoin != null) this.#onPeerJoin(key);
      }
    }
    if (this.#isConnected) return;
    this.#checkIsConnected();
  }
  
  #onGetWelcome(welcome, peerId) {
    if (peerId != this.hostSelfId) return;
    if (this.connectedPlayerInfo[selfId] == null) this.infolessPlayers[selfId] = '';
    else this.connectedPlayerInfo[selfId] = welcome.playerInfo[selfId];
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

  constructor(gameRoomId = null, hostSelfId = null, chatSelfId = null) {
    if (gameRoomId == null) gameRoomId = getValueFromURL('gameRoomId');
    if (hostSelfId == null) hostSelfId = getValueFromURL('hostSelfId');
    if (chatSelfId == null) chatSelfId = getValueFromURL('chatSelfId');
    if (gameRoomId == null) return;
    this.gameRoomId = gameRoomId;
    this.hostSelfId = hostSelfId;
    this.chatSelfId = chatSelfId;
    this.playerNames = {};
    this.#isConnected = false;
    this.gameRoom = joinRoom(config, gameRoomId);
    const getWelcome = this.gameRoom.makeAction('welcome')[1];
    const getPlayerInfo = this.gameRoom.makeAction('playerInfo')[1];
    this.#sendGameJoin = this.gameRoom.makeAction('gameJoin')[0];
    getWelcome((a, b) => this.#onGetWelcome(a, b));
    getPlayerInfo((a, b) => this.#onGetPlayerInfo(a, b));
    this.gameRoom.onPeerJoin((peerId) => {
      var playerInfo = this.playerInfo[peerId];
      if (playerInfo == null) {
        this.infolessPlayers[peerId] = '';
        return;
      }
      this.connectedPlayerInfo[peerId] = playerInfo;
      if (!this.#isConnected) this.#checkIsConnected();
      if (this.#onPeerJoin != null) this.#onPeerJoin(peerId);
    });
    this.gameRoom.onPeerLeave((peerId) => {
      if (peerId == this.adminId) {
        this.#isConnected = false;
        if (this.#onDisconnected != null) this.#onDisconnected();
      }
      if (peerId == this.hostSelfId) {
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
    } else {
      safeSend = (data) => send(data, this.adminId);
      safeGet = (callback) => {
        get((data, peerId) => {
          if (peerId != adminId) return;
          callback(data);
        });
      };
    }
    return [
      safeSend,
      safeGet,
    ];
  }
}

