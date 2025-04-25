const GMapService = require('../services/GMapPlaceIdService');

// 处理Place Details请求
exports.getPlaceDetails = async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId || placeId.length < 5) {
      return res.status(400).json({ error: 'Invalid place_id parameter' });
    }

    const details = await GMapService.getPlaceDetails(placeId);
    res.json(details);

  } catch (error) {
    console.error(`[Place Error] ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};