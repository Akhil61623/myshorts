// server.js (minimal demo)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(bodyParser.json());

const redis = new Redis(); // default localhost:6379; set REDIS_URL in prod

// demo DB in-memory (replace with real DB)
let ALL_SHORTS = [
  // populate with many unique youtube ids / items
  { id: "vid1", url: "https://www.youtube.com/embed/PhVQWwjZn54", title: "A", thumbnail: "https://i.ytimg.com/vi/PhVQWwjZn54/hqdefault.jpg" },
  { id: "vid2", url: "https://www.youtube.com/embed/WXeFtVV78dg", title: "B", thumbnail: "https://i.ytimg.com/vi/WXeFtVV78dg/hqdefault.jpg" },
  // ... add 50-200 items for variety
];

// helper: get unseen items for user (limit)
async function getUnseenForUser(userId, limit = 6) {
  const seenSetKey = `seen:${userId}`;
  // fetch sample candidate ids (simplest: scan ALL_SHORTS and filter by Redis set membership)
  // For performance, store lists in DB and query NOT IN seen
  const res = [];
  for (const item of ALL_SHORTS) {
    const isMember = await redis.sismember(seenSetKey, item.id);
    if (!isMember) {
      res.push(item);
      if (res.length >= limit) break;
    }
  }
  return res;
}

// REST: get next shorts for user
app.get('/api/shorts/next', async (req, res) => {
  const userId = req.query.userId || 'anon';
  const count = parseInt(req.query.count || '6', 10);
  const items = await getUnseenForUser(userId, count);
  res.json({ items });
});

// REST: mark seen
app.post('/api/shorts/seen', async (req, res) => {
  const { userId = 'anon', id } = req.body;
  if (!id) return res.status(400).json({ error: 'id required' });
  await redis.sadd(`seen:${userId}`, id);
  // optional: set expiry on seen set (e.g., 60 days) to avoid infinite growth
  await redis.expire(`seen:${userId}`, 60 * 24 * 60 * 60);
  res.json({ ok: true });
});

// Socket: authenticate client with userId on connect
io.on('connection', socket => {
  console.log('socket connected', socket.id);
  // client should emit 'identify' with userId after connect
  socket.on('identify', async (data) => {
    const { userId = 'anon' } = data;
    socket.userId = userId;
    socket.join(`user:${userId}`);
    // send initial unseen items
    const items = await getUnseenForUser(userId, 6);
    socket.emit('shorts:batch', { items });
  });
});

// Admin route: push a batch to system (adds to ALL_SHORTS and notifies users)
app.post('/admin/push', async (req, res) => {
  const items = req.body.items || [];
  // add to DB (here in-memory)
  for (const it of items) {
    // avoid duplicate ids in ALL_SHORTS
    if (!ALL_SHORTS.find(x => x.id === it.id)) ALL_SHORTS.unshift(it);
  }
  // Notify all connected users: for each user, compute unseen and emit
  const sockets = await io.fetchSockets();
  for (const s of sockets) {
    const uid = s.userId || 'anon';
    const unseen = await getUnseenForUser(uid, 6); // server decides
    s.emit('shorts:batch', { items: unseen });
  }
  res.json({ ok: true, pushed: items.length });
});

server.listen(3001, ()=> console.log('listening 3001'));
