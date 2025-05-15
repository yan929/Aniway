import { fetchPlaceInfo, fetchPlacePhoto } from "./GmapController.js";

global.fetch = jest.fn(); // 👈 manually mock fetch

describe("fetchPlaceInfo", () => {
  afterEach(() => {
    fetch.mockReset();
  });

  it("returns detailed place info", async () => {
    const mockReq = { body: { lat: "10", lng: "20" } };
    const mockRes = { json: jest.fn(), status: jest.fn().mockReturnThis() };

    // First fetch (geocode)
    fetch
      .mockResolvedValueOnce({
        json: async () => ({
          results: [{ place_id: "abc123" }],
        }),
      })

      // Second fetch (place details)
      .mockResolvedValueOnce({
        json: async () => ({
          result: {
            name: "Place Name",
            formatted_address: "123 Main St",
            formatted_phone_number: "123-456-7890",
            rating: 4.8,
            user_ratings_total: 50,
            website: "https://example.com",
            opening_hours: {
              open_now: true,
              weekday_text: ["Monday: 9AM – 5PM"],
            },
            geometry: {
              location: { lat: 10, lng: 20 },
            },
            photos: [{ photo_reference: "photo123" }],
          },
        }),
      });

    await fetchPlaceInfo(mockReq, mockRes);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(mockRes.json).toHaveBeenCalledWith({
      name: "Place Name",
      address: "123 Main St",
      phone: "123-456-7890",
      rating: 4.8,
      total_ratings: 50,
      website: "https://example.com",
      open_now: true,
      opening_hours: ["Monday: 9AM – 5PM"],
      location: { lat: 10, lng: 20 },
      photo_reference: "photo123",
    });
  });

  it("returns 500 on error", async () => {
    fetch.mockRejectedValue(new Error("Fetch failed"));

    const mockReq = { body: { lat: "0", lng: "0" } };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await fetchPlaceInfo(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Failed to get detailed place info",
    });
  });
});

describe("fetchPlacePhoto", () => {
  afterEach(() => {
    fetch.mockReset();
  });

  it("returns image buffer", async () => {
    const mockBuffer = Buffer.from("image-bytes");
    fetch.mockResolvedValue({
      arrayBuffer: async () => mockBuffer,
    });

    const mockReq = { body: { photo_reference: "photo123" } };
    const mockRes = {
      set: jest.fn(),
      send: jest.fn(),
    };

    await fetchPlacePhoto(mockReq, mockRes);

    expect(mockRes.set).toHaveBeenCalledWith("Content-Type", "image/jpeg");
    expect(mockRes.send).toHaveBeenCalledWith(mockBuffer);
  });

  it("returns 400 if no photo_reference", async () => {
    const mockReq = { body: {} };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await fetchPlacePhoto(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "photo_reference is required",
    });
  });

  it("returns 500 on fetch error", async () => {
    fetch.mockRejectedValue(new Error("Fail"));

    const mockReq = { body: { photo_reference: "bad" } };
    const mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await fetchPlacePhoto(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });
});
