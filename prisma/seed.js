const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
require("dotenv").config(); // Load variables from .env

// Configure PostgreSQL connection pool for the script
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Configure the adapter for Prisma v7
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

const API_KEY = process.env.LASTFM_API_KEY;

// Helper to query the live Last.fm API and fetch official cover URLs during seed
async function getLiveCoverUrl(artist, album, fallbackUrl) {
  if (!API_KEY || API_KEY === "your_lastfm_api_key_here") {
    return fallbackUrl;
  }

  try {
    const url = `http://ws.audioscrobbler.com/2.0/?method=album.getinfo&artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}&api_key=${API_KEY}&format=json`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      const images = data?.album?.image || [];
      const largeImage = images.find((img) => img.size === "extralarge") || images.find((img) => img.size === "large") || {};
      if (largeImage["#text"]) {
        console.log(`Fetched official Last.fm cover art for "${album}" by "${artist}".`);
        return largeImage["#text"];
      }
    }
  } catch (error) {
    console.warn(`Failed to fetch official cover for "${album}". Using fallback.`, error);
  }

  return fallbackUrl;
}

async function main() {
  console.log("Seeding database with realistic mock data...");

  // Clean existing records to start with a fresh slate
  await db.review.deleteMany();
  await db.favorite.deleteMany();
  await db.listenList.deleteMany();
  await db.album.deleteMany();
  await db.user.deleteMany();

  // Hash standard password "password123" for all seeded users (facilitates easy presentation)
  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create ADMIN account
  const admin = await db.user.create({
    data: {
      email: "admin@spotiboxd.com",
      username: "admin",
      passwordHash: passwordHash,
      role: "ADMIN",
    },
  });

  // 2. Create 10 regular test users
  const users = [];
  for (let i = 1; i <= 10; i++) {
    const newUser = await db.user.create({
      data: {
        email: `test_user${i}@gmail.com`,
        username: `test_user${i}`,
        passwordHash: passwordHash,
        role: "USER",
      },
    });
    users.push(newUser);
  }

  // Fetch official cover arts live from Last.fm API
  const abbeyRoadCover = await getLiveCoverUrl(
    "The Beatles", 
    "Abbey Road", 
    "https://upload.wikimedia.org/wikipedia/en/4/42/Beatles_-_Abbey_Road.jpg"
  );
  const thrillerCover = await getLiveCoverUrl(
    "Michael Jackson", 
    "Thriller", 
    "https://upload.wikimedia.org/wikipedia/en/5/55/Michael_Jackson_-_Thriller.png"
  );
  const ramCover = await getLiveCoverUrl(
    "Daft Punk", 
    "Random Access Memories", 
    "https://upload.wikimedia.org/wikipedia/en/a/a7/Random_Access_Memories.jpg"
  );
  const darkSideCover = await getLiveCoverUrl(
    "Pink Floyd", 
    "The Dark Side of the Moon", 
    "https://upload.wikimedia.org/wikipedia/en/3/3b/Dark_Side_of_the_Moon.png"
  );
  const blondeCover = await getLiveCoverUrl(
    "Frank Ocean", 
    "Blonde", 
    "https://upload.wikimedia.org/wikipedia/en/a/a0/Blonde_-_Frank_Ocean.jpeg"
  );
  const igorCover = await getLiveCoverUrl(
    "Tyler, The Creator", 
    "IGOR", 
    "https://upload.wikimedia.org/wikipedia/en/5/51/Igor_-_Tyler%2C_the_Creator.jpg"
  );
  const rumoursCover = await getLiveCoverUrl(
    "Fleetwood Mac", 
    "Rumours", 
    "https://upload.wikimedia.org/wikipedia/en/f/fb/FMacRumours.png"
  );
  const nevermindCover = await getLiveCoverUrl(
    "Nirvana", 
    "Nevermind", 
    "https://upload.wikimedia.org/wikipedia/en/b/b7/NirvanaNevermindalbumcover.jpg"
  );
  const afterHoursCover = await getLiveCoverUrl(
    "The Weeknd", 
    "After Hours", 
    "https://upload.wikimedia.org/wikipedia/en/c/c1/The_Weeknd_-_After_Hours.png"
  );
  const backToBlackCover = await getLiveCoverUrl(
    "Amy Winehouse", 
    "Back to Black", 
    "https://upload.wikimedia.org/wikipedia/en/6/67/Amy_Winehouse_-_Back_to_Black.png"
  );

  // 3. Create default albums in catalog
  const albums = {
    abbeyRoad: await db.album.create({
      data: {
        lastFmId: "the beatles::abbey road",
        title: "Abbey Road",
        artist: "The Beatles",
        coverUrl: abbeyRoadCover,
      },
    }),
    thriller: await db.album.create({
      data: {
        lastFmId: "michael jackson::thriller",
        title: "Thriller",
        artist: "Michael Jackson",
        coverUrl: thrillerCover,
      },
    }),
    ram: await db.album.create({
      data: {
        lastFmId: "daft punk::random access memories",
        title: "Random Access Memories",
        artist: "Daft Punk",
        coverUrl: ramCover,
      },
    }),
    darkSide: await db.album.create({
      data: {
        lastFmId: "pink floyd::the dark side of the moon",
        title: "The Dark Side of the Moon",
        artist: "Pink Floyd",
        coverUrl: darkSideCover,
      },
    }),
    blonde: await db.album.create({
      data: {
        lastFmId: "frank ocean::blonde",
        title: "Blonde",
        artist: "Frank Ocean",
        coverUrl: blondeCover,
      },
    }),
    igor: await db.album.create({
      data: {
        lastFmId: "tyler, the creator::igor",
        title: "IGOR",
        artist: "Tyler, The Creator",
        coverUrl: igorCover,
      },
    }),
    rumours: await db.album.create({
      data: {
        lastFmId: "fleetwood mac::rumours",
        title: "Rumours",
        artist: "Fleetwood Mac",
        coverUrl: rumoursCover,
      },
    }),
    nevermind: await db.album.create({
      data: {
        lastFmId: "nirvana::nevermind",
        title: "Nevermind",
        artist: "Nirvana",
        coverUrl: nevermindCover,
      },
    }),
    afterHours: await db.album.create({
      data: {
        lastFmId: "the weeknd::after hours",
        title: "After Hours",
        artist: "The Weeknd",
        coverUrl: afterHoursCover,
      },
    }),
    backToBlack: await db.album.create({
      data: {
        lastFmId: "amy winehouse::back to black",
        title: "Back to Black",
        artist: "Amy Winehouse",
        coverUrl: backToBlackCover,
      },
    }),
  };

  // 4. Create natural-looking mock reviews from the test users
  const reviewsData = [
    {
      user: users[0], // test_user1
      album: albums.abbeyRoad,
      rating: 5,
      content: "An absolute classic. The B-side medley is legendary. There will never be another band like The Beatles. Golden Slumbers / Carry That Weight / The End is the perfect way to finish an album.",
    },
    {
      user: users[1], // test_user2
      album: albums.thriller,
      rating: 4,
      content: "Pop perfection. Billie Jean and Beat It are timeless, though a couple of tracks in the middle feel like filler. Still, Michael Jackson at his absolute peak.",
    },
    {
      user: users[2], // test_user3
      album: albums.ram,
      rating: 5,
      content: "Daft Punk's love letter to analog music. The instrumentation is incredibly lush and the guest features (Giorgio Moroder, Julian Casablancas, Pharrell) are top tier. A masterclass in sound engineering.",
    },
    {
      user: users[3], // test_user4
      album: albums.darkSide,
      rating: 5,
      content: "A masterpiece of progressive rock. The transition between tracks is seamless. Us and Them is my favorite. Highly recommend listening to this with headphones in the dark.",
    },
    {
      user: users[4], // test_user5
      album: albums.blonde,
      rating: 5,
      content: "Emotionally devastating and beautifully produced. Frank Ocean's songwriting here is on another level. Self Control and Nights are two of the greatest songs of this decade.",
    },
    {
      user: users[5], // test_user6
      album: albums.igor,
      rating: 4.5,
      content: "Tyler's production on this is crazy. The pitch-shifted vocals and synth pads create such a unique, raw atmosphere. A brilliant concept album about love and obsession.",
    },
    {
      user: users[6], // test_user7
      album: albums.rumours,
      rating: 5,
      content: "The ultimate breakup album. Every single track is a hit. The tension and drama between the band members during recording somehow created pure musical magic.",
    },
    {
      user: users[7], // test_user8
      album: albums.nevermind,
      rating: 4,
      content: "Defined an entire generation and shifted the landscape of alternative rock. Smells Like Teen Spirit is iconic, but In Bloom, Lithium, and Drain You are the real standouts.",
    },
    {
      user: users[8], // test_user9
      album: albums.afterHours,
      rating: 4.5,
      content: "The Weeknd at his absolute synth-pop peak. Blinding Lights is a massive record, but Faith and Save Your Tears are the emotional core of this dark, cinematic journey.",
    },
    {
      user: users[9], // test_user10
      album: albums.backToBlack,
      rating: 5,
      content: "Amy Winehouse's voice is unmatched. Raw, soul-baring lyrics combined with Mark Ronson's classic Motown production. An incredibly emotional and timeless record.",
    },
    // Adding secondary overlapping reviews to show multiple user feedback
    {
      user: users[0], // test_user1
      album: albums.ram,
      rating: 4,
      content: "Great record. A bit long in some sections, but 'Instant Crush' and 'Contact' make this an outstanding record.",
    },
    {
      user: users[1], // test_user2
      album: albums.rumours,
      rating: 3.5,
      content: "Good album but a bit overplayed for my taste. Fleetwood Mac has better deep cuts on other records, though you can't deny the quality of the songwriting here.",
    },
    {
      user: users[2], // test_user3
      album: albums.abbeyRoad,
      rating: 5,
      content: "You cannot rate this anything less than 5. It is the blueprint of modern pop/rock albums. The Beatles go out on a high note.",
    },
    {
      user: users[3], // test_user4
      album: albums.blonde,
      rating: 4,
      content: "Very ambient and spacey. It took me a few listens to really get into it, but it grows on you fast. White Ferrari is incredible.",
    },
    {
      user: users[9], // test_user10
      album: albums.thriller,
      rating: 5,
      content: "Absolute masterpiece. Every track could be a single. P.Y.T. and Human Nature are incredible, timeless grooves.",
    }
  ];

  // Insert reviews
  for (const rev of reviewsData) {
    await db.review.create({
      data: {
        userId: rev.user.id,
        albumId: rev.album.id,
        rating: rev.rating,
        content: rev.content,
      },
    });
  }

  // 5. Create some lists entries (Favorites and Watchlists) for dashboards
  // Give test_user1 some lists
  await db.favorite.create({
    data: { userId: users[0].id, albumId: albums.abbeyRoad.id }
  });
  await db.favorite.create({
    data: { userId: users[0].id, albumId: albums.ram.id }
  });
  await db.listenList.create({
    data: { userId: users[0].id, albumId: albums.igor.id }
  });
  await db.listenList.create({
    data: { userId: users[0].id, albumId: albums.afterHours.id }
  });

  // Give test_user2 some lists
  await db.favorite.create({
    data: { userId: users[1].id, albumId: albums.thriller.id }
  });
  await db.listenList.create({
    data: { userId: users[1].id, albumId: albums.rumours.id }
  });

  // Give test_user3 some lists
  await db.favorite.create({
    data: { userId: users[2].id, albumId: albums.abbeyRoad.id }
  });
  await db.favorite.create({
    data: { userId: users[2].id, albumId: albums.ram.id }
  });

  console.log("Seeding complete! Default accounts and realistic reviews generated.");
  console.log("---------------------------------------------------------");
  console.log("ADMIN Account:");
  console.log("  Username: admin");
  console.log("  Password: password123");
  console.log("TEST Users (1 to 10):");
  console.log("  Usernames: test_user1, test_user2, ..., test_user10");
  console.log("  Passwords: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end(); // close pg pool connection
  });
