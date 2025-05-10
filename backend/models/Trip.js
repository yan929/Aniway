// models/Trip.js
import mongoose from "mongoose";

const TripSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String }, // optional: trip name
  tripData: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

TripSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("Trip", TripSchema);
