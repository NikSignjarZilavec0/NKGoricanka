import mongoose from 'mongoose';

export const MATCH_STATUS = ['upcoming', 'live', 'finished', 'cancelled'];

const scorerSchema = new mongoose.Schema(
  {
    playerName: { type: String, required: true, trim: true },
    minute: { type: Number, min: 1, max: 130 },
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
const lineupSpotSchema = new mongoose.Schema(
  {
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
    name: { type: String, required: true, trim: true },
    number: { type: Number, min: 1, max: 99 },
    photo: { type: String, default: '' },
    x: { type: Number, min: 0, max: 100, default: 50 },
    y: { type: Number, min: 0, max: 100, default: 50 },
    isCaptain: { type: Boolean, default: false },
    isGoalkeeper: { type: Boolean, default: false },
    // Per-match annotations shown on the pitch (goals are derived from `scorers`).
    assists: { type: Number, min: 0, default: 0 },
    yellowCards: { type: Number, min: 0, default: 0 },
    redCards: { type: Number, min: 0, default: 0 },
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
    scorers: { type: [scorerSchema], default: [] },
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
