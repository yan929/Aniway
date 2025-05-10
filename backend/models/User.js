import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    google_id: { type: String, unique: true, index: true },
    name: String,
    avatar: String, // user avatar URL
    email: { type: String, unique: true }, // user email
  },
  {
    timestamps: true,
    collection: "user",
  }
);

module.exports = mongoose.model("User", userSchema);
