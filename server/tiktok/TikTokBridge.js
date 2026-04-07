const { WebcastPushConnection } = require('tiktok-live-connector');
const GiftMapper = require('./GiftMapper');

class TikTokBridge {
  constructor(username, eventQueue) {
    this.username = username;
    this.eventQueue = eventQueue;
    this.connection = null;
    this.connected = false;
  }

  async connect() {
    this.connection = new WebcastPushConnection(this.username);

    try {
      const state = await this.connection.connect();
      this.connected = true;
      console.log(`Connected to TikTok Live: ${this.username} (${state.roomId})`);
    } catch (err) {
      console.error('TikTok connection failed:', err.message);
      console.log('Running in offline mode (no TikTok events)');
      return;
    }

    this.connection.on('chat', (data) => {
      this.eventQueue.push({
        type: 'chat',
        username: data.uniqueId,
        nickname: data.nickname,
        avatarUrl: data.profilePictureUrl,
        comment: data.comment,
      });
    });

    this.connection.on('like', (data) => {
      this.eventQueue.push({
        type: 'like',
        username: data.uniqueId,
        nickname: data.nickname,
        avatarUrl: data.profilePictureUrl,
        likeCount: data.likeCount,
      });
    });

    this.connection.on('gift', (data) => {
      if (data.giftType === 1 && !data.repeatEnd) return;

      const giftType = GiftMapper.mapGift(data.giftName);
      if (!giftType) {
        console.log(`Unknown gift: ${data.giftName}`);
        return;
      }

      this.eventQueue.push({
        type: 'gift',
        username: data.uniqueId,
        nickname: data.nickname,
        avatarUrl: data.profilePictureUrl,
        giftType,
        giftName: data.giftName,
        diamondCount: data.diamondCount,
      });
    });

    this.connection.on('member', (data) => {
      this.eventQueue.push({
        type: 'join',
        username: data.uniqueId,
        nickname: data.nickname,
        avatarUrl: data.profilePictureUrl,
      });
    });

    this.connection.on('disconnected', () => {
      this.connected = false;
      console.log('TikTok disconnected. Attempting reconnect in 5s...');
      setTimeout(() => this.connect(), 5000);
    });
  }

  disconnect() {
    if (this.connection) {
      this.connection.disconnect();
      this.connected = false;
    }
  }
}

module.exports = TikTokBridge;
