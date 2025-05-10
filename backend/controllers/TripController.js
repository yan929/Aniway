import Trip from '../models/Trip.js';

const saveTripData = async (req, res) => {
    const { userId, tripId, tripData, title } = req.body;

    try {
        if (tripId) {
            // update existing trip
            const updated = await Trip.findByIdAndUpdate(
                tripId,
                { tripData, updatedAt: new Date(), title },
                { new: true }
            );
            return res.status(200).json(updated);
        } else {
            // create new trip
            const newTrip = await Trip.create({ userId, title, tripData });
            return res.status(201).json(newTrip);
        }
    } catch (error) {
        console.error("❌ Save trip error:", error.message);
        res.status(500).json({ error: "Failed to save trip." });
    }
};

const getTripsByUser = async (req, res) => {
    const { userId } = req.query;

    try {
        const trips = await Trip.find({ userId }).sort({ updatedAt: -1 });
        res.json(trips);
    } catch (err) {
        console.error("❌ Failed to fetch trips:", err);
        res.status(500).json({ error: "Failed to fetch trips." });
    }
};
// Delete trip by ID
// This function deletes a trip by its ID
// note: haven't tested yet
const deleteTripData = async (req, res) => {
    const { tripId } = req.params;

    try {
        if (!tripId) {
            return res.status(400).json({ error: "Missing tripId in request." });
        }

        const deleted = await Trip.findByIdAndDelete(tripId);

        if (!deleted) {
            return res.status(404).json({ error: "Trip not found." });
        }

        return res.status(200).json({ message: "Trip deleted successfully." });
    } catch (error) {
        console.error("❌ Delete trip error:", error.message);
        res.status(500).json({ error: "Failed to delete trip." });
    }
};

export { saveTripData, getTripsByUser };