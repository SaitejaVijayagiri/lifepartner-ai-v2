import axios from 'axios';

export class LocationService {
    // Basic in-memory cache to prevent hitting rate limits for common cities
    private static cache: Map<string, { lat: number, lng: number }> = new Map();

    static async geocodeCity(cityStr: string): Promise<{ lat: number, lng: number } | null> {
        if (!cityStr || cityStr.trim() === '') return null;

        const cleanCity = cityStr.trim().toLowerCase();

        if (this.cache.has(cleanCity)) {
            return this.cache.get(cleanCity)!;
        }

        try {
            // Use OpenStreetMap's free Nominatim API.
            // Requires a User-Agent string per their terms of use for free access.
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanCity)}&format=json&limit=1`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'LifePartnerAI-MatchingService/1.0',
                    'Accept': 'application/json'
                },
                timeout: 3000 // Ensure we don't hang requests
            });

            if (response.data && response.data.length > 0) {
                const result = {
                    lat: parseFloat(response.data[0].lat),
                    lng: parseFloat(response.data[0].lon) // Note: Nominatim uses 'lon', we standardize to 'lng'
                };

                // Cache the successful result
                this.cache.set(cleanCity, result);
                return result;
            }
        } catch (error) {
            console.error(`Geocoding failed for city: ${cleanCity}`, error);
        }

        return null; // Return null if not found or errored
    }
}
