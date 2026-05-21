// app/lib/geocode.ts

type ReverseGeocodeResponse = {
  features?: Array<{
    place_name?: string;
    text?: string;
  }>;
};

export async function reverseGeocode(
  lng: number,
  lat: number
): Promise<string> {
  try {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!token) {
      return "Local desconhecido";
    }

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}&language=pt`
    );

    if (!response.ok) {
      return "Local desconhecido";
    }

    const data: ReverseGeocodeResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return "Local desconhecido";
    }

    return (
      data.features[0].place_name ||
      data.features[0].text ||
      "Local desconhecido"
    );
  } catch (error) {
    console.error("Erro reverse geocode:", error);

    return "Local desconhecido";
  }
}
