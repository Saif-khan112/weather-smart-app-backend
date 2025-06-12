import axios from "axios";

export async function getLocationData(zip: string) {
  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) throw new Error("Missing OpenWeather API key");

  try {
    const geoRes = await axios.get(
      `http://api.openweathermap.org/geo/1.0/zip?zip=${zip}&appid=${apiKey}`
    );

    const { lat, lon } = geoRes.data || {};
    if (!lat || !lon) throw new Error("Invalid response for ZIP code location.");

    const weatherRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );
    const timezone = weatherRes.data?.timezone;
    const place = weatherRes.data?.name;
    if (timezone === undefined) throw new Error("Timezone data missing from response.");

    return {
      latitude: lat,
      longitude: lon,
      timezone,
      place
    };

  } catch (err: any) {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const message =
        status === 404
          ? "Invalid ZIP code. Location not found."
          : `OpenWeather API error (${status || "network error"}): ${err.message}`;
      throw new Error(message);
    }

    throw new Error(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
  }
}
