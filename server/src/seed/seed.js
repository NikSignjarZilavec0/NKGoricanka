import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Player from '../models/Player.js';
import Match from '../models/Match.js';
import ClubInfo from '../models/ClubInfo.js';

/* -------------------------------------------------------------------------- */
/* All seed content below is REALISTIC PLACEHOLDER data, clearly marked.      */
/* Replace via the admin panel with official club data before going public.   */
/* -------------------------------------------------------------------------- */

const CLUB = {
  key: 'singleton',
  name: 'NK Goričanka',
  shortName: 'Goričanka',
  foundedYear: 1975, // PLACEHOLDER — preveri uradno leto ustanovitve
  history: `NK Goričanka je nogometni klub iz Goričkega v Prekmurju (območje občine Rogašovci).
Klub združuje ljubitelje nogometa iz okoliških vasi in že desetletja skrbi za razvoj
nogometa med mladimi in člani. Domače tekme igra na klubskem igrišču, tekmuje pa v
ligi 1. MNL Murska Sobota pod okriljem Medobčinske nogometne zveze Murska Sobota.

Skozi leta je klub vzgojil številne generacije igralcev in postal pomemben del
športnega in družabnega življenja kraja. Klubske barve so rdeča in rumena, ki ju
nosijo tudi navijači na vsaki tekmi.

(To besedilo je okviren placeholder — uredite ga v administraciji z uradno zgodovino kluba.)`,
  address: 'Sveti Jurij 7b, 9262 Rogašovci', // PLACEHOLDER — preveri točen naslov igrišča
  email: 'info@nkgoricanka.si', // PLACEHOLDER
  phone: '+386 (0)2 000 00 00', // PLACEHOLDER
  colors: { primary: '#c8102e', accent: '#ffcc00' },
  socialLinks: {
    facebook: 'https://www.facebook.com/',
    instagram: '',
    youtube: '',
    twitter: '',
  },
  logo: '', // frontend uses a bundled SVG when empty
  // OpenStreetMap embed around Rogašovci / Goričko (PLACEHOLDER lokacija)
  latitude: 46.801,
  longitude: 16.034,
  mapEmbedUrl:
    'https://www.openstreetmap.org/export/embed.html?bbox=16.024%2C46.796%2C16.044%2C46.806&layer=mapnik&marker=46.801%2C16.034',
};

const PLAYERS = [
  // Goalkeepers
  { name: 'Žan Horvat', position: 'goalkeeper', shirtNumber: 1, birthdate: '1995-03-12', heightCm: 188, nationality: 'Slovenija', stats: { appearances: 22, goals: 0, assists: 0, yellowCards: 2, redCards: 0 } },
  { name: 'Matej Kovač', position: 'goalkeeper', shirtNumber: 12, birthdate: '2001-09-04', heightCm: 185, nationality: 'Slovenija', stats: { appearances: 6, goals: 0, assists: 0, yellowCards: 0, redCards: 0 } },
  // Defenders
  { name: 'Luka Novak', position: 'defender', shirtNumber: 2, birthdate: '1997-07-21', heightCm: 182, nationality: 'Slovenija', stats: { appearances: 24, goals: 1, assists: 2, yellowCards: 5, redCards: 0 } },
  { name: 'Nejc Zver', position: 'defender', shirtNumber: 4, birthdate: '1994-01-30', heightCm: 186, nationality: 'Slovenija', stats: { appearances: 23, goals: 2, assists: 1, yellowCards: 6, redCards: 1 } },
  { name: 'Aljaž Berden', position: 'defender', shirtNumber: 5, birthdate: '1999-11-15', heightCm: 180, nationality: 'Slovenija', stats: { appearances: 20, goals: 0, assists: 3, yellowCards: 3, redCards: 0 } },
  { name: 'Tim Šebjanič', position: 'defender', shirtNumber: 3, birthdate: '2000-05-08', heightCm: 178, nationality: 'Slovenija', stats: { appearances: 18, goals: 0, assists: 1, yellowCards: 4, redCards: 0 } },
  { name: 'David Fartek', position: 'defender', shirtNumber: 15, birthdate: '1996-02-19', heightCm: 184, nationality: 'Slovenija', stats: { appearances: 15, goals: 1, assists: 0, yellowCards: 2, redCards: 0 } },
  // Midfielders
  { name: 'Jure Vogrinčič', position: 'midfielder', shirtNumber: 8, birthdate: '1998-06-25', heightCm: 176, nationality: 'Slovenija', stats: { appearances: 25, goals: 4, assists: 7, yellowCards: 4, redCards: 0 } },
  { name: 'Rok Maučec', position: 'midfielder', shirtNumber: 6, birthdate: '1995-12-02', heightCm: 179, nationality: 'Slovenija', stats: { appearances: 24, goals: 2, assists: 5, yellowCards: 5, redCards: 0 } },
  { name: 'Anže Cigut', position: 'midfielder', shirtNumber: 10, birthdate: '1997-04-17', heightCm: 174, nationality: 'Slovenija', stats: { appearances: 26, goals: 8, assists: 9, yellowCards: 3, redCards: 0 } },
  { name: 'Gašper Šijanec', position: 'midfielder', shirtNumber: 14, birthdate: '2002-08-29', heightCm: 177, nationality: 'Slovenija', stats: { appearances: 17, goals: 1, assists: 2, yellowCards: 1, redCards: 0 } },
  { name: 'Miha Rituper', position: 'midfielder', shirtNumber: 7, birthdate: '1999-03-03', heightCm: 175, nationality: 'Slovenija', stats: { appearances: 21, goals: 3, assists: 4, yellowCards: 2, redCards: 0 } },
  // Forwards
  { name: 'Marko Kuzma', position: 'forward', shirtNumber: 9, birthdate: '1996-10-11', heightCm: 183, nationality: 'Slovenija', stats: { appearances: 25, goals: 14, assists: 3, yellowCards: 3, redCards: 0 } },
  { name: 'Domen Sukič', position: 'forward', shirtNumber: 11, birthdate: '2000-01-22', heightCm: 181, nationality: 'Slovenija', stats: { appearances: 23, goals: 9, assists: 5, yellowCards: 2, redCards: 0 } },
  { name: 'Žiga Bedernjak', position: 'forward', shirtNumber: 17, birthdate: '2003-07-14', heightCm: 179, nationality: 'Slovenija', stats: { appearances: 14, goals: 5, assists: 2, yellowCards: 1, redCards: 0 } },
].map((p) => ({
  ...p,
  bio: 'Placeholder opis igralca — uredite ga v administraciji.',
  active: true,
}));

const SEASON = '2025/26';

function daysFromNow(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(17, 0, 0, 0);
  return d;
}

const MATCHES = [
  // Finished (past)
  { opponent: 'NK Bogojina', isHome: true, date: daysFromNow(-28), location: 'Igrišče NK Goričanka', status: 'finished', score: { ours: 3, theirs: 1 }, scorers: [{ playerName: 'Marko Kuzma', minute: 23 }, { playerName: 'Anže Cigut', minute: 51 }, { playerName: 'Domen Sukič', minute: 78 }] },
  { opponent: 'NK Tišina', isHome: false, date: daysFromNow(-21), location: 'Tišina', status: 'finished', score: { ours: 1, theirs: 1 }, scorers: [{ playerName: 'Marko Kuzma', minute: 64 }] },
  { opponent: 'NK Cven', isHome: true, date: daysFromNow(-14), location: 'Igrišče NK Goričanka', status: 'finished', score: { ours: 2, theirs: 0 }, scorers: [{ playerName: 'Domen Sukič', minute: 12 }, { playerName: 'Jure Vogrinčič', minute: 70 }] },
  { opponent: 'NK Puconci', isHome: false, date: daysFromNow(-7), location: 'Puconci', status: 'finished', score: { ours: 0, theirs: 2 }, scorers: [] },
  // Upcoming (future)
  { opponent: 'NK Gančani', isHome: true, date: daysFromNow(5), location: 'Igrišče NK Goričanka', status: 'upcoming', scorers: [] },
  { opponent: 'NK Hodoš', isHome: false, date: daysFromNow(12), location: 'Hodoš', status: 'upcoming', scorers: [] },
  { opponent: 'NK Bakovci', isHome: true, date: daysFromNow(19), location: 'Igrišče NK Goričanka', status: 'upcoming', scorers: [] },
  { opponent: 'NK Veržej', isHome: false, date: daysFromNow(26), location: 'Veržej', status: 'upcoming', scorers: [] },
].map((m) => ({
  ...m,
  competition: '1. MNL Murska Sobota',
  season: SEASON,
}));

/** Create the default admin from env if no user exists. Idempotent. */
export async function ensureAdmin() {
  const count = await User.countDocuments();
  if (count > 0) return false;
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await bcrypt.hash(password, 10);
  await User.create({ username, passwordHash, role: 'admin' });
  console.log(`[seed] Created default admin "${username}"`);
  return true;
}

/** Seed all content if the database is empty. Idempotent. */
export async function runSeed() {
  await ensureAdmin();

  if ((await ClubInfo.countDocuments()) === 0) {
    await ClubInfo.create(CLUB);
    console.log('[seed] Created club info');
  }

  if ((await Player.countDocuments()) === 0) {
    await Player.insertMany(PLAYERS);
    console.log(`[seed] Inserted ${PLAYERS.length} players`);
  }

  if ((await Match.countDocuments()) === 0) {
    await Match.insertMany(MATCHES);
    console.log(`[seed] Inserted ${MATCHES.length} matches`);
  }
}

// Allow running directly: `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  const mongoose = (await import('mongoose')).default;
  const dotenv = (await import('dotenv')).default;
  dotenv.config();
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nkgoricanka');
  await runSeed();
  await mongoose.disconnect();
  process.exit(0);
}
