import { Injectable } from '@angular/core';

import { AddressSuggestion } from '../models/address-suggestion.model';
import { GeocodingApiService } from '../../infrastructure/api/geocoding-api.service';

@Injectable({
  providedIn: 'root',
})
export class WorkplaceGeocodingService {
  constructor(private readonly geocodingApi: GeocodingApiService) {}

  searchAddressSuggestions(query: string, language: string): Promise<AddressSuggestion[]> {
    return this.geocodingApi.searchAddressSuggestions(query, language);
  }

  resolveAddressFromCoordinates(
    latitude: number,
    longitude: number,
    language: string
  ): Promise<string | null> {
    return this.geocodingApi.resolveAddressFromCoordinates(latitude, longitude, language);
  }
}
