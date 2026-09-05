import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DeviceControlFacade } from '../../../../device-control/application/services/device-control.facade';
import { ConfirmDialogService } from '../../../../shared/application/services/confirm-dialog.service';
import { ToastService } from '../../../../shared/application/services/toast.service';
import { AppButtonComponent } from '../../../../shared/presentation/components/app-button/app-button.component';
import { AppDropdownComponent } from '../../../../shared/presentation/components/app-dropdown/app-dropdown.component';
import { DropdownOption } from '../../../../shared/presentation/components/app-dropdown/dropdown-option.model';
import { EmptyStateComponent } from '../../../../shared/presentation/components/empty-state/empty-state.component';
import { LoadingSpinnerComponent } from '../../../../shared/presentation/components/loading-spinner/loading-spinner.component';
import { ModalFormShellComponent } from '../../../../shared/presentation/components/modal-form-shell/modal-form-shell.component';
import { SectionCardComponent } from '../../../../shared/presentation/components/section-card/section-card.component';
import { AddressSuggestion } from '../../../application/models/address-suggestion.model';
import { ActiveWorkplaceContextService } from '../../../application/services/active-workplace-context.service';
import { WorkplaceGeocodingService } from '../../../application/services/workplace-geocoding.service';
import { WorkplaceFacade } from '../../../application/services/workplace.facade';
import { LocationType } from '../../../domain/model/location.entity';
import { LocationCardComponent } from '../../components/location-card/location-card.component';

interface MapTile {
  key: string;
  left: number;
  top: number;
  url: string;
}

interface MapDragState {
  startX: number;
  startY: number;
  centerPixelX: number;
  centerPixelY: number;
  moved: boolean;
}

@Component({
  selector: 'app-locations-page',
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    AppButtonComponent,
    AppDropdownComponent,
    EmptyStateComponent,
    LoadingSpinnerComponent,
    LocationCardComponent,
    ModalFormShellComponent,
    SectionCardComponent,
  ],
  templateUrl: './locations-page.component.html',
  styleUrls: ['./locations-page.component.scss'],
})
export class LocationsPageComponent implements OnInit {
  @ViewChild('mapViewport') private readonly mapViewport?: ElementRef<HTMLElement>;

  name = '';
  address = '';
  type: LocationType = 'HOME';
  createModalOpen = false;
  selectedLatitude = -12.0464;
  selectedLongitude = -77.0428;
  addressSuggestions: AddressSuggestion[] = [];
  addressSearchLoading = false;
  locatingUser = false;
  draggingMap = false;

  readonly types: LocationType[] = ['HOME', 'BUSINESS', 'BRANCH'];
  readonly tileSize = 256;
  private mapCenterLatitude = -12.0464;
  private mapCenterLongitude = -77.0428;
  private mapZoomLevel = 13;
  private readonly minMapZoomLevel = 3;
  private readonly maxMapZoomLevel = 19;
  private addressSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private addressSearchRequestId = 0;
  private mapDragState: MapDragState | null = null;

  constructor(
    readonly workplaceFacade: WorkplaceFacade,
    readonly deviceControlFacade: DeviceControlFacade,
    private readonly activeWorkplaceContext: ActiveWorkplaceContextService,
    private readonly toastService: ToastService,
    private readonly confirmDialog: ConfirmDialogService,
    private readonly geocodingService: WorkplaceGeocodingService,
    private readonly translate: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.workplaceFacade.loadWorkplace();
  }

  get typeOptions(): DropdownOption[] {
    return this.types.map((type) => ({
      label: type,
      labelKey: this.locationTypeLabelKey(type),
      value: type,
    }));
  }

  get assignedDeviceCount(): number {
    return this.workplaceFacade.currentDeviceAssignments.length;
  }

  get unassignedDeviceCount(): number {
    return Math.max(this.visibleDeviceCount() - this.assignedDeviceCount, 0);
  }

  get unroomedDeviceCount(): number {
    const devicesWithRoom = new Set(
      this.workplaceFacade
        .currentDeviceAssignments
        .filter((assignment) => Boolean(assignment.roomId))
        .map((assignment) => assignment.deviceId)
    );

    return Math.max(this.visibleDeviceCount() - devicesWithRoom.size, 0);
  }

  get energyCoverage(): number {
    const totalDevices = this.visibleDeviceCount();

    if (totalDevices === 0) {
      return 0;
    }

    return Math.round((this.assignedDeviceCount / totalDevices) * 100);
  }

  get selectedCoordinateLabel(): string {
    return `${this.selectedLatitude.toFixed(5)}, ${this.selectedLongitude.toFixed(5)}`;
  }

  get mapTiles(): MapTile[] {
    const viewport = this.mapViewportSize();
    const worldTileCount = this.worldTileCount();
    const center = this.coordinatesToWorldPixels(
      this.mapCenterLatitude,
      this.mapCenterLongitude,
      this.mapZoomLevel
    );
    const topLeftX = center.x - viewport.width / 2;
    const topLeftY = center.y - viewport.height / 2;
    const startX = Math.floor(topLeftX / this.tileSize) - 1;
    const endX = Math.floor((topLeftX + viewport.width) / this.tileSize) + 1;
    const startY = Math.floor(topLeftY / this.tileSize) - 1;
    const endY = Math.floor((topLeftY + viewport.height) / this.tileSize) + 1;
    const tiles: MapTile[] = [];

    for (let x = startX; x <= endX; x += 1) {
      const wrappedX = this.wrapTileX(x, worldTileCount);

      for (let y = startY; y <= endY; y += 1) {
        if (y < 0 || y >= worldTileCount) {
          continue;
        }

        tiles.push({
          key: `${this.mapZoomLevel}-${wrappedX}-${y}-${x}`,
          left: x * this.tileSize - topLeftX,
          top: y * this.tileSize - topLeftY,
          url: `https://tile.openstreetmap.org/${this.mapZoomLevel}/${wrappedX}/${y}.png`,
        });
      }
    }

    return tiles;
  }

  openCreateModal(): void {
    this.createModalOpen = true;
  }

  closeCreateModal(): void {
    this.createModalOpen = false;
    this.clearAddressSuggestions();
  }

  async createLocation(): Promise<void> {
    const success = await this.workplaceFacade.createLocation({
      name: this.name,
      address: this.address,
      type: this.type,
    });

    if (success) {
      this.name = '';
      this.address = '';
      this.type = 'HOME';
      this.closeCreateModal();
      this.toastService.success(this.t('workplace.locationCreateSuccess'));
      return;
    }

    this.toastService.error(this.t('workplace.locationCreateError'));
  }

  async deleteLocation(locationId: number): Promise<void> {
    const locationName = this.workplaceFacade.getLocationName(locationId);
    const confirmed = await this.confirmDialog.confirm({
      title: this.t('workplace.locations.deleteTitle'),
      message: this.t('workplace.locations.deleteMessage', { name: locationName }),
      confirmLabel: this.t('common.delete'),
      cancelLabel: this.t('common.cancel'),
      tone: 'danger',
    });

    if (!confirmed) {
      return;
    }

    const success = await this.workplaceFacade.deleteLocation(locationId);

    if (success) {
      this.toastService.info(this.t('workplace.locations.deleteSuccess'));
    }
  }

  setActiveLocation(locationId: number): void {
    this.activeWorkplaceContext.setActiveLocation(locationId);
  }

  locationTypeLabel(type: LocationType): string {
    return this.t(this.locationTypeLabelKey(type));
  }

  locationTypeLabelKey(type: LocationType): string {
    const labels: Record<LocationType, string> = {
      HOME: 'workplace.locationTypes.home',
      BUSINESS: 'workplace.locationTypes.business',
      BRANCH: 'workplace.locationTypes.branch',
    };

    return labels[type] ?? type;
  }

  selectType(value: string): void {
    this.type = value as LocationType;
  }

  onAddressChange(value: string): void {
    this.address = value;
    this.scheduleAddressSearch(value);
  }

  selectAddressSuggestion(place: AddressSuggestion): void {
    this.address = place.displayName;
    this.clearAddressSuggestions();
    this.setSelectedCoordinates(place.latitude, place.longitude, true);
  }

  zoomInMap(): void {
    if (this.mapZoomLevel >= this.maxMapZoomLevel) {
      return;
    }

    this.mapZoomLevel += 1;
  }

  zoomOutMap(): void {
    if (this.mapZoomLevel <= this.minMapZoomLevel) {
      return;
    }

    this.mapZoomLevel -= 1;
  }

  onMapWheel(event: WheelEvent): void {
    event.preventDefault();

    if (event.deltaY < 0) {
      this.zoomInMap();
      return;
    }

    this.zoomOutMap();
  }

  locateUser(): void {
    if (!navigator.geolocation) {
      this.toastService.error(this.t('workplace.locations.map.locationUnavailable'));
      return;
    }

    this.locatingUser = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.setSelectedCoordinates(latitude, longitude, true);
        void this.updateAddressFromCoordinates(latitude, longitude);
        this.locatingUser = false;
      },
      () => {
        this.locatingUser = false;
        this.toastService.error(this.t('workplace.locations.map.locationDenied'));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }

  selectMapPoint(event: MouseEvent): void {
    const coordinates = this.pointEventToCoordinates(event);

    if (!coordinates) {
      return;
    }

    this.selectedLatitude = coordinates.latitude;
    this.selectedLongitude = coordinates.longitude;

    const selectedReference = this.t('workplace.locations.map.selectedAddress', {
      coordinates: this.selectedCoordinateLabel,
    });

    if (!this.address.trim() || this.isGeneratedMapReference(this.address)) {
      this.address = selectedReference;
    }

    void this.updateAddressFromCoordinates(this.selectedLatitude, this.selectedLongitude);
  }

  onMapPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    const center = this.coordinatesToWorldPixels(
      this.mapCenterLatitude,
      this.mapCenterLongitude,
      this.mapZoomLevel
    );

    this.draggingMap = true;
    this.mapDragState = {
      startX: event.clientX,
      startY: event.clientY,
      centerPixelX: center.x,
      centerPixelY: center.y,
      moved: false,
    };

    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onMapPointerMove(event: PointerEvent): void {
    if (!this.mapDragState) {
      return;
    }

    const deltaX = event.clientX - this.mapDragState.startX;
    const deltaY = event.clientY - this.mapDragState.startY;

    if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
      this.mapDragState.moved = true;
    }

    const nextCenterX = this.mapDragState.centerPixelX - deltaX;
    const nextCenterY = this.mapDragState.centerPixelY - deltaY;
    const center = this.worldPixelsToCoordinates(nextCenterX, nextCenterY, this.mapZoomLevel);

    this.mapCenterLatitude = center.latitude;
    this.mapCenterLongitude = center.longitude;
  }

  onMapPointerUp(event: PointerEvent): void {
    const dragState = this.mapDragState;
    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.draggingMap = false;
    this.mapDragState = null;

    if (!dragState?.moved) {
      this.selectMapPoint(event);
    }
  }

  onMapPointerCancel(event: PointerEvent): void {
    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.draggingMap = false;
    this.mapDragState = null;
  }

  markerLeft(): number {
    return this.markerScreenPosition().left;
  }

  markerTop(): number {
    return this.markerScreenPosition().top;
  }

  markerVisible(): boolean {
    const position = this.markerScreenPosition();
    const viewport = this.mapViewportSize();

    return (
      position.left >= -24 &&
      position.left <= viewport.width + 24 &&
      position.top >= -24 &&
      position.top <= viewport.height + 24
    );
  }

  deviceCountForLocation(locationId: number): number {
    return this.assignmentsForLocation(locationId).length;
  }

  roomCountForLocation(locationId: number): number {
    return this.workplaceFacade.rooms().filter((room) => room.locationId === locationId).length;
  }

  groupCountForLocation(locationId: number): number {
    const deviceIds = new Set(
      this.assignmentsForLocation(locationId).map((assignment) => assignment.deviceId)
    );

    return this.deviceControlFacade
      .deviceGroups()
      .filter((group) => group.deviceIds.some((deviceId) => deviceIds.has(deviceId)))
      .length;
  }

  unroomedDeviceCountForLocation(locationId: number): number {
    return this.assignmentsForLocation(locationId).filter((assignment) => !assignment.hasRoom).length;
  }

  activeWattsForLocation(locationId: number): number {
    const deviceIds = new Set(
      this.assignmentsForLocation(locationId).map((assignment) => assignment.deviceId)
    );

    return this.deviceControlFacade
      .devices()
      .filter((device) => deviceIds.has(device.id) && device.isOn)
      .reduce((total, device) => total + device.powerWatts, 0);
  }

  coverageForLocation(locationId: number): number {
    const assignments = this.assignmentsForLocation(locationId);

    if (assignments.length === 0) {
      return 0;
    }

    const roomedDevices = assignments.filter((assignment) => assignment.hasRoom).length;
    return Math.round((roomedDevices / assignments.length) * 100);
  }

  private assignmentsForLocation(locationId: number) {
    return this.workplaceFacade.getCurrentDeviceAssignmentsForLocation(locationId);
  }

  private visibleDeviceCount(): number {
    return this.deviceControlFacade.devices().filter((device) => !device.isRemoved).length;
  }

  private setSelectedCoordinates(latitude: number, longitude: number, centerMap: boolean): void {
    this.selectedLatitude = latitude;
    this.selectedLongitude = longitude;

    if (centerMap) {
      this.mapCenterLatitude = latitude;
      this.mapCenterLongitude = longitude;
    }
  }

  private scheduleAddressSearch(value: string): void {
    if (this.addressSearchTimer) {
      clearTimeout(this.addressSearchTimer);
      this.addressSearchTimer = null;
    }

    const query = value.trim();

    if (query.length < 3 || this.isGeneratedMapReference(query)) {
      this.clearAddressSuggestions();
      return;
    }

    this.addressSearchTimer = setTimeout(() => {
      this.addressSearchTimer = null;
      void this.searchAddressSuggestions(query);
    }, 350);
  }

  private async searchAddressSuggestions(query: string): Promise<void> {
    const requestId = ++this.addressSearchRequestId;
    this.addressSearchLoading = true;

    try {
      const places = await this.geocodingService.searchAddressSuggestions(
        query,
        this.translate.currentLang || 'es'
      );

      if (requestId === this.addressSearchRequestId) {
        this.addressSuggestions = places;
      }
    } catch {
      if (requestId === this.addressSearchRequestId) {
        this.addressSuggestions = [];
      }
    } finally {
      if (requestId === this.addressSearchRequestId) {
        this.addressSearchLoading = false;
      }
    }
  }

  private async updateAddressFromCoordinates(latitude: number, longitude: number): Promise<void> {
    try {
      const resolvedAddress = await this.geocodingService.resolveAddressFromCoordinates(
        latitude,
        longitude,
        this.translate.currentLang || 'es'
      );

      if (resolvedAddress) {
        this.address = resolvedAddress;
        this.clearAddressSuggestions();
      }
    } catch {
      // The selected coordinates remain valid even if the public lookup is unavailable.
    }
  }

  private clearAddressSuggestions(): void {
    this.addressSuggestions = [];
    this.addressSearchLoading = false;
  }

  private markerScreenPosition(): { left: number; top: number } {
    const viewport = this.mapViewportSize();
    const worldPixelSize = this.worldTileCount() * this.tileSize;
    const center = this.coordinatesToWorldPixels(
      this.mapCenterLatitude,
      this.mapCenterLongitude,
      this.mapZoomLevel
    );
    const marker = this.coordinatesToWorldPixels(
      this.selectedLatitude,
      this.selectedLongitude,
      this.mapZoomLevel
    );
    let deltaX = marker.x - center.x;

    if (Math.abs(deltaX) > worldPixelSize / 2) {
      deltaX += deltaX > 0 ? -worldPixelSize : worldPixelSize;
    }

    return {
      left: viewport.width / 2 + deltaX,
      top: viewport.height / 2 + marker.y - center.y,
    };
  }

  private pointEventToCoordinates(event: MouseEvent): { latitude: number; longitude: number } | null {
    const viewport = this.mapViewport?.nativeElement;

    if (!viewport) {
      return null;
    }

    const rect = viewport.getBoundingClientRect();
    const center = this.coordinatesToWorldPixels(
      this.mapCenterLatitude,
      this.mapCenterLongitude,
      this.mapZoomLevel
    );
    const x = center.x - rect.width / 2 + event.clientX - rect.left;
    const y = center.y - rect.height / 2 + event.clientY - rect.top;

    return this.worldPixelsToCoordinates(x, y, this.mapZoomLevel);
  }

  private mapViewportSize(): { width: number; height: number } {
    const rect = this.mapViewport?.nativeElement.getBoundingClientRect();

    return {
      width: rect?.width && rect.width > 0 ? rect.width : 620,
      height: rect?.height && rect.height > 0 ? rect.height : 230,
    };
  }

  private coordinatesToWorldPixels(latitude: number, longitude: number, zoom: number): { x: number; y: number } {
    const latRad = this.clampLatitude(latitude) * Math.PI / 180;
    const worldTileCount = Math.pow(2, zoom);
    const x = ((this.normalizeLongitude(longitude) + 180) / 360) * worldTileCount * this.tileSize;
    const y = (
      (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2
    ) * worldTileCount * this.tileSize;

    return { x, y };
  }

  private worldPixelsToCoordinates(x: number, y: number, zoom: number): { latitude: number; longitude: number } {
    const worldTileCount = Math.pow(2, zoom);
    const worldPixelSize = worldTileCount * this.tileSize;
    const normalizedX = ((x % worldPixelSize) + worldPixelSize) % worldPixelSize;
    const clampedY = Math.min(Math.max(y, 0), worldPixelSize);
    const longitude = normalizedX / worldPixelSize * 360 - 180;
    const mercatorY = Math.PI * (1 - 2 * clampedY / worldPixelSize);
    const latitude = Math.atan(Math.sinh(mercatorY)) * 180 / Math.PI;

    return {
      latitude: this.clampLatitude(latitude),
      longitude: this.normalizeLongitude(longitude),
    };
  }

  private worldTileCount(): number {
    return Math.pow(2, this.mapZoomLevel);
  }

  private wrapTileX(x: number, worldTileCount: number): number {
    return ((x % worldTileCount) + worldTileCount) % worldTileCount;
  }

  private clampLatitude(latitude: number): number {
    return Math.min(Math.max(latitude, -85.05112878), 85.05112878);
  }

  private normalizeLongitude(longitude: number): number {
    return ((longitude + 180) % 360 + 360) % 360 - 180;
  }

  private isGeneratedMapReference(value: string): boolean {
    const normalizedValue = value.trim().toLowerCase();
    return [
      'ubicacion seleccionada',
      'ubicación seleccionada',
      'selected location',
      'localizacao selecionada',
      'localização selecionada',
    ].some((prefix) => normalizedValue.startsWith(prefix));
  }

  private t(key: string, params?: Record<string, unknown>): string {
    return this.translate.instant(key, params);
  }
}
