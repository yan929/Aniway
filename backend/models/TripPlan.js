import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    title: { type: String },
    image: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    destination: { type: String },
    content: [
      {
        date: { type: Date, require: true },
        index: { type: Number, require: true },
        itinerary: [
          {
            lat: { type: Number, require: true },
            lng: { type: Number, require: true },
            gpPlaceId: { type: String, require: true },
            order: Number,
            arrivalTime: String,
            note: String,
          },
        ],
      },
    ],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: "tripPlan",
  }
);

planSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model("TripPlan", planSchema);
