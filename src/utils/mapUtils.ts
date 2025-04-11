export interface Coordinates {
    latitude: number;
    longitude: number;
  }
  
  /**
   * Fetches coordinates from a given address string using OpenStreetMap's Nominatim API
   * @param address Full address string
   * @returns Coordinates object or throws an error if not found
   */
  export const getCoordinatesFromAddress = async (
    address: string
  ): Promise<Coordinates> => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        address
      )}`
    );
    const data = await response.json();
  
    if (data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    } else {
      throw new Error("Location not found");
    }
  };
  