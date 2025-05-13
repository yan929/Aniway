export class GMapMiddleware {
  static async getFirstLocationByLatLng(latlng) {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latlng}&key=${process.env.GOOGLE_API_KEY}`
    );
    const responseBody = await response.json();
    switch (responseBody.status) {
      case "OK":
        const firstResult = responseBody.result[0];
        return new Response(firstResult, { status: 200 });
      case "ZERO_RESULTS":
        return new Response(null, { status: 200 });
      default:
        return new Response(
          `Something has gone horribly wrong. Status Code: ${responseBody.status}`,
          { status: 500 }
        );
    }
  }
}
