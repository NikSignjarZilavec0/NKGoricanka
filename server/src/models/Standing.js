import mongoose from 'mongoose';

export const TREND = ['up', 'down', 'same', ''];

const standingSchema = new mongoose.Schema(
  {
    season: { type: String, required: true, index: true },
    group: { type: String, default: '' }, // e.g. "Prvenstveni del" / "Spodnji del"; '' = single table
    groupOrder: { type: Number, default: 0 }, // display order of groups (0 first)
    team: { type: String, required: true, trim: true },
    teamLogo: { type: String, default: '' },
    played: { type: Number, default: 0, min: 0 },
    won: { type: Number, default: 0, min: 0 },
    drawn: { type: Number, default: 0, min: 0 },
    lost: { type: Number, default: 0, min: 0 },
    goalsFor: { type: Number, default: 0, min: 0 },
    goalsAgainst: { type: Number, default: 0, min: 0 },
    points: { type: Number, default: 0 }, // auto = 3*won + drawn
    trend: { type: String, enum: TREND, default: '' },
  },
  { timestamps: true, versionKey: false }
);

// Points always derived from wins/draws.
standingSchema.pre('save', function setPoints(next) {
  this.points = 3 * (this.won || 0) + (this.drawn || 0);
  next();
});

export default mongoose.model('Standing', standingSchema);
