import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    title: String,
    content: [
      {
        date: { type: Date, require: true },
        index: { type: Number, require: true },
        itinerary: [
          {
            gpPlaceId: { type: String, require: true },
            order: Number,
            arrivalTime: String,
            note: String,
          },
        ],
      },
    ],

    user_id: { type: String, require: true }, // foregin key to user, I don't should I need to add or not
  },
  {
    timestamps: true,
    collection: "tripPlan",
  }
);

export default mongoose.model("TripPlan", planSchema);
