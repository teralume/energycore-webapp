import { Injectable } from '@angular/core';

import { AddressSuggestion } from '../../application/models/address-suggestion.model';
import { GeocodingPlaceResponse } from '../responses/geocoding-place.response';

@Injectable({
  providedIn: 'root',
})
export class GeocodingApiService {
  private readonly baseUrl = 'https://nominatim.openstreetmap.org';

  async searchAddressSuggestions(query: string, language: string): Promise<AddressSuggestion[]> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '5');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('accept-language', this.resolveLanguage(language));
    url.searchParams.set('q', query);

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Address search failed with status ${response.status}`);
    }

    const places = (await response.json()) as GeocodingPlaceResponse[];
    return places
      .map((place) => this.toSuggestion(place))
      .filter((place): place is AddressSuggestion => place !== null);
  }

  async resolveAddressFromCoordinates(
    latitude: number,
    longitude: number,
    language: string
  ): Promise<string | null> {
    const url = new URL(`${this.baseUrl}/reverse`);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('accept-language', this.resolveLanguage(language));

    const response = await fetch(url.toString());

    if (!response.ok) {
      return null;
    }

    const place = (await response.json()) as GeocodingPlaceResponse;
    return place.display_name?.trim() || null;
  }

  private toSuggestion(place: GeocodingPlaceResponse): AddressSuggestion | null {
    const latitude = Number(place.lat);
    const longitude = Number(place.lon);

    if (!place.display_name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return {
      displayName: place.display_name,
      latitude,
      longitude,
    };
  }

  private resolveLanguage(language: string): string {
    return language?.trim() || 'es';
  }
}
