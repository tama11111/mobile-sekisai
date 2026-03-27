const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface DirectionsResult {
  distanceMeters: number;
  distanceKm: number;
  durationSeconds: number;
  polyline: string;
  steps: Array<{
    instruction: string;
    distanceMeters: number;
  }>;
}

export async function getDirections(
  origin: string,
  destination: string
): Promise<DirectionsResult> {
  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
    origin
  )}&destination=${encodeURIComponent(destination)}&key=${API_KEY}&language=ja&region=JP`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Directions API error: ${response.status}`);
  }

  const json = await response.json();

  if (json.status !== 'OK') {
    throw new Error(`Directions API status: ${json.status}`);
  }

  const route = json.routes[0];
  const leg = route.legs[0];

  const distanceMeters: number = leg.distance.value;
  const distanceKm = distanceMeters / 1000;

  const steps = leg.steps.map((step: {
    html_instructions: string;
    distance: { value: number };
  }) => ({
    instruction: step.html_instructions.replace(/<[^>]+>/g, ''),
    distanceMeters: step.distance.value,
  }));

  return {
    distanceMeters,
    distanceKm,
    durationSeconds: leg.duration.value,
    polyline: route.overview_polyline.points,
    steps,
  };
}

export function decodePolyline(encoded: string): Array<{ latitude: number; longitude: number }> {
  const points: Array<{ latitude: number; longitude: number }> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}
