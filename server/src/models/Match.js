import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

export const MATCH_STATUS = ['upcoming', 'live', 'finished', 'cancelled'];
export const CARD_TYPES = ['yellow', 'red'];

// A goal by one of our players (optionally with the assisting player).
const scorerSchema = new mongoose.Schema(
  {
    playerId: { type: ObjectId, ref: 'Player', default: null },
    playerName: { type: String, required: true, trim: true },
    minute: { type: Number, min: 1, max: 130 },
    assistPlayerId: { type: ObjectId, ref: 'Player', default: null },
    assistName: { type: String, default: '' },
  },
  { _id: false }
);

// A yellow/red card for one of our players.
const cardSchema = new mongoose.Schema(
  {
    playerId: { type: ObjectId, ref: 'Player', default: null },
    playerName: { type: String, required: true, trim: true },
    type: { type: String, enum: CARD_TYPES, required: true },
    minute: { type: Number, min: 1, max: 130 },
  },
  { _id: false }
);

// One of our players who appeared (played) in the match.
const appearanceSchema = new mongoose.Schema(
  {
    playerId: { type: ObjectId, ref: 'Player', default: null },
    playerName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const scoreSchema = new mongoose.Schema(
  {
    ours: { type: Number, min: 0, default: null },
    theirs: { type: Number, min: 0, default: null },
  },
  { _id: false }
);

// One placed player on the lineup pitch (our team). x/y are % of the pitch.
// Match events (goals/assists/cards) are derived from scorers/cards by playerId.
const lineupSpotSchema = new mongoose.Schema(
  {
    playerId: { type: ObjectId, ref: 'Player', default: null },
    name: { type: String, required: true, trim: true },
    number: { type: Number, min: 1, max: 99 },
    photo: { type: String, default: '' },
    x: { type: Number, min: 0, max: 100, default: 50 },
    y: { type: Number, min: 0, max: 100, default: 50 },
    isCaptain: { type: Boolean, default: false },
    isGoalkeeper: { type: Boolean, default: false },
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    opponent: { type: String, required: true, trim: true },
    opponentLogo: { type: String, default: '' },
    isHome: { type: Boolean, default: true },
    date: { type: Date, required: true },
    location: { type: String, default: '' },
    competition: { type: String, default: '1. MNL Murska Sobota' },
    season: { type: String, default: '' },
    status: { type: String, enum: MATCH_STATUS, default: 'upcoming' },
    score: { type: scoreSchema, default: () => ({}) },
    // Per-match player events — the single source of truth for player stats.
    scorers: { type: [scorerSchema], default: [] },
    cards: { type: [cardSchema], default: [] },
    appearances: { type: [appearanceSchema], default: [] },
    lineup: { type: [lineupSpotSchema], default: [] },
    // Live coverage
    minute: { type: Number, min: 0, max: 130, default: null }, // current match minute
    liveKey: { type: String, default: '', select: false }, // secret token for live contributors
    liveUpdatedAt: { type: Date },
  },
  { timestamps: true, versionKey: false }
);

// Never leak the live key in API responses.
function stripLiveKey(doc, ret) {
  delete ret.liveKey;
  return ret;
}
matchSchema.set('toJSON', { transform: stripLiveKey });
matchSchema.set('toObject', { transform: stripLiveKey });

export default mongoose.model('Match', matchSchema);
