require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const morgan = require('morgan');

const prisma = new PrismaClient();
const app = express();
app.use(express.json());
app.use(morgan('dev'));

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// Middleware to verify JWT token
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!req.user) return res.status(401).json({ error: "Invalid token" });
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// 🎵 Authentication Routes
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { username, password: hashedPassword },
    });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    res.status(400).json({ error: "Username already exists" });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// 🎵 Protected Playlist Routes
app.get('/playlists', authenticate, async (req, res) => {
  const playlists = await prisma.playlist.findMany({
    where: { ownerId: req.user.id },
  });
  res.json(playlists);
});

app.post('/playlists', authenticate, async (req, res) => {
  const { name, description, trackIds } = req.body;

  const playlist = await prisma.playlist.create({
    data: { name, description, ownerId: req.user.id },
  });

  await prisma.playlistTrack.createMany({
    data: trackIds.map(trackId => ({
      playlistId: playlist.id,
      trackId,
    })),
  });

  res.json(playlist);
});

app.get('/playlists/:id', authenticate, async (req, res) => {
  const playlist = await prisma.playlist.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { tracks: { include: { track: true } } },
  });

  if (!playlist || playlist.ownerId !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }

  res.json(playlist);
});

// 🎵 Track Routes
app.get('/tracks', async (req, res) => {
  const tracks = await prisma.track.findMany();
  res.json(tracks);
});

app.get('/tracks/:id', async (req, res) => {
  const track = await prisma.track.findUnique({
    where: { id: parseInt(req.params.id) },
    include: req.user
      ? { playlists: { where: { playlist: { ownerId: req.user.id } } } }
      : undefined,
  });

  res.json(track);
});

// 🎵 Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎧 Jukebox Pro API is running on http://localhost:${PORT}`);
});
