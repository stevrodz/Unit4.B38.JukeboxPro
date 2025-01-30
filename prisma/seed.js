const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

async function main() {
  console.log("🌱 Seeding database...");

  // Create users
  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await prisma.user.create({
    data: { username: "testuser", password: passwordHash }
  });

  // Create tracks
  const tracks = [];
  for (let i = 1; i <= 20; i++) {
    tracks.push({ name: `Track ${i}` });
  }
  await prisma.track.createMany({ data: tracks });

  // Create a playlist for the user
  const playlist = await prisma.playlist.create({
    data: {
      name: "Chill Playlist",
      description: "Relax and unwind",
      ownerId: user.id
    }
  });

  // Assign random tracks to the playlist
  const allTracks = await prisma.track.findMany();
  const selectedTracks = allTracks.slice(0, 5); // Take first 5 tracks

  for (const track of selectedTracks) {
    await prisma.playlistTrack.create({
      data: {
        playlistId: playlist.id,
        trackId: track.id
      }
    });
  }

  console.log("✅ Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
