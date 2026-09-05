import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';

import { VisibleWheelOption, WheelOption, WheelOptionValue } from './wheel-option.model';

@Component({
  selector: 'app-wheel-selector',
  standalone: true,
  templateUrl: './app-wheel-selector.component.html',
  styleUrls: ['./app-wheel-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppWheelSelectorComponent implements OnChanges, OnDestroy {
  @Input() options: WheelOption[] = [];
  @Input() value: WheelOptionValue | null = null;
  @Input() eyebrow = '';
  @Input() title = 'Selecciona una opcion';
  @Input() summary = '';
  @Input() hint = '';

  @Output() valueChange = new EventEmitter<WheelOptionValue>();
  @Output() optionChange = new EventEmitter<WheelOption>();

  selectedIndex = 0;
  isWheelDragging = false;
  visibleOptionsList: VisibleWheelOption[] = [];
  selectedOption: WheelOption | null = null;

  private readonly wheelStepPx = 200;
  private wheelOffsetPx = 0;
  private wheelVelocity = 0;
  private wheelAnimationFrame: number | null = null;

  private activePointerId: number | null = null;
  private lastPointerX = 0;
  private lastPointerTime = 0;
  private totalDragDistance = 0;
  private suppressNextClick = false;

  constructor(private readonly changeDetectorRef: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['value']) {
      this.syncSelectedIndexFromValue();
      this.resetWheelMotion(false);
    }
  }

  ngOnDestroy(): void {
    this.cancelWheelAnimation();
  }

  selectOption(index: number): void {
    this.selectedIndex = this.clampIndex(index);
    this.resetWheelMotion(true);
  }

  onOptionClick(index: number, event: MouseEvent): void {
    if (this.suppressNextClick) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.selectOption(index);
  }

  onWheelPointerDown(event: PointerEvent): void {
    if (event.button !== 0 || this.options.length <= 1) {
      return;
    }

    this.cancelWheelAnimation();

    this.isWheelDragging = true;
    this.activePointerId = event.pointerId;
    this.lastPointerX = event.clientX;
    this.lastPointerTime = performance.now();
    this.totalDragDistance = 0;
    this.wheelVelocity = 0;

    const target = event.currentTarget as HTMLElement;
    target.setPointerCapture(event.pointerId);

    this.changeDetectorRef.markForCheck();
  }

  onWheelPointerMove(event: PointerEvent): void {
    if (!this.isWheelDragging || event.pointerId !== this.activePointerId) {
      return;
    }

    const now = performance.now();
    const deltaX = event.clientX - this.lastPointerX;
    const deltaTime = Math.max(1, now - this.lastPointerTime);

    this.totalDragDistance += Math.abs(deltaX);
    this.wheelVelocity = deltaX / deltaTime;
    this.wheelOffsetPx += this.applyEdgeResistance(deltaX);

    this.lastPointerX = event.clientX;
    this.lastPointerTime = now;

    this.consumeWheelOffset();
    this.changeDetectorRef.markForCheck();
  }

  onWheelPointerUp(event: PointerEvent): void {
    if (!this.isWheelDragging || event.pointerId !== this.activePointerId) {
      return;
    }

    this.isWheelDragging = false;
    this.activePointerId = null;

    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    if (this.totalDragDistance > 8) {
      this.suppressNextClick = true;
      window.setTimeout(() => {
        this.suppressNextClick = false;
      }, 120);
    }

    this.startWheelInertia();
    this.changeDetectorRef.markForCheck();
  }

  onWheelPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    this.isWheelDragging = false;
    this.activePointerId = null;
    this.startWheelInertia();
    this.changeDetectorRef.markForCheck();
  }

  optionTransform(index: number): string {
    const position = this.optionPosition(index);
    const distance = Math.abs(position);
    const translateX = position * this.wheelStepPx;
    const translateY = distance * 11;
    const scale = Math.max(0.52, 1 - distance * 0.1);
    const rotateY = Math.max(-30, Math.min(30, position * -8));

    return `translateX(${translateX}px) translateY(${translateY}px) scale(${scale}) rotateY(${rotateY}deg)`;
  }

  optionOpacity(index: number): number {
    const distance = Math.abs(this.optionPosition(index));

    if (distance > 4.8) {
      return 0;
    }

    return Math.max(0.14, 1 - distance * 0.16);
  }

  optionZIndex(index: number): number {
    const distance = Math.abs(this.optionPosition(index));
    return Math.round(100 - distance * 10);
  }

  optionShade(index: number): number {
    const distance = Math.abs(this.optionPosition(index));
    return Math.min(0.78, distance * 0.17);
  }

  isOptionActive(index: number): boolean {
    return index === this.selectedIndex && Math.abs(this.wheelOffsetPx) < 32;
  }

  private syncSelectedIndexFromValue(): void {
    if (this.options.length === 0) {
      this.selectedIndex = 0;
      this.selectedOption = null;
      this.visibleOptionsList = [];
      return;
    }

    const selectedIndex = this.options.findIndex((option) => option.value === this.value);
    this.selectedIndex = selectedIndex >= 0 ? selectedIndex : this.clampIndex(this.selectedIndex);
  }

  private updateSelectedState(emitChange: boolean): void {
    if (this.options.length === 0) {
      this.selectedOption = null;
      this.visibleOptionsList = [];
      this.changeDetectorRef.markForCheck();
      return;
    }

    this.selectedIndex = this.clampIndex(this.selectedIndex);
    this.selectedOption = this.options[this.selectedIndex] ?? this.options[0];

    const radius = 4;
    const start = Math.max(0, this.selectedIndex - radius);
    const end = Math.min(this.options.length, this.selectedIndex + radius + 1);

    this.visibleOptionsList = this.options
      .slice(start, end)
      .map((option, offset) => ({
        ...option,
        index: start + offset,
      }));

    if (emitChange && this.selectedOption) {
      this.valueChange.emit(this.selectedOption.value);
      this.optionChange.emit(this.selectedOption);
    }

    this.changeDetectorRef.markForCheck();
  }

  private clampIndex(index: number): number {
    return Math.min(Math.max(index, 0), Math.max(0, this.options.length - 1));
  }

  private optionPosition(index: number): number {
    return index - this.selectedIndex + this.wheelOffsetPx / this.wheelStepPx;
  }

  private consumeWheelOffset(): void {
    let changed = false;

    while (this.wheelOffsetPx >= this.wheelStepPx / 2) {
      if (this.selectedIndex <= 0) {
        this.wheelOffsetPx = this.wheelStepPx / 2;
        this.wheelVelocity = 0;
        break;
      }

      this.selectedIndex -= 1;
      this.wheelOffsetPx -= this.wheelStepPx;
      changed = true;
    }

    while (this.wheelOffsetPx <= -this.wheelStepPx / 2) {
      if (this.selectedIndex >= this.options.length - 1) {
        this.wheelOffsetPx = -this.wheelStepPx / 2;
        this.wheelVelocity = 0;
        break;
      }

      this.selectedIndex += 1;
      this.wheelOffsetPx += this.wheelStepPx;
      changed = true;
    }

    if (changed) {
      this.updateSelectedState(true);
    }
  }

  private applyEdgeResistance(deltaX: number): number {
    const isPullingBeforeFirst = this.selectedIndex === 0 && deltaX > 0;
    const isPullingAfterLast =
      this.selectedIndex === this.options.length - 1 && deltaX < 0;

    if (isPullingBeforeFirst || isPullingAfterLast) {
      return deltaX * 0.2;
    }

    return deltaX;
  }

  private startWheelInertia(): void {
    const minVelocity = 0.02;
    const friction = 0.9;
    let lastTime = performance.now();

    const animate = () => {
      const now = performance.now();
      const deltaTime = Math.max(1, now - lastTime);
      lastTime = now;

      this.wheelOffsetPx += this.applyEdgeResistance(
        this.wheelVelocity * deltaTime
      );
      this.wheelVelocity *= friction;

      this.consumeWheelOffset();

      if (Math.abs(this.wheelVelocity) > minVelocity) {
        this.wheelAnimationFrame = requestAnimationFrame(animate);
        this.changeDetectorRef.markForCheck();
        return;
      }

      this.snapWheelToCenter();
    };

    this.wheelAnimationFrame = requestAnimationFrame(animate);
  }

  private snapWheelToCenter(): void {
    const startOffset = this.wheelOffsetPx;
    const duration = 160;
    const startedAt = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startedAt;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      this.wheelOffsetPx = startOffset * (1 - easedProgress);

      if (progress < 1) {
        this.wheelAnimationFrame = requestAnimationFrame(animate);
        this.changeDetectorRef.markForCheck();
        return;
      }

      this.wheelOffsetPx = 0;
      this.wheelVelocity = 0;
      this.wheelAnimationFrame = null;
      this.updateSelectedState(true);
    };

    this.wheelAnimationFrame = requestAnimationFrame(animate);
  }

  private resetWheelMotion(emitChange: boolean): void {
    this.cancelWheelAnimation();
    this.wheelOffsetPx = 0;
    this.wheelVelocity = 0;
    this.updateSelectedState(emitChange);
  }

  private cancelWheelAnimation(): void {
    if (this.wheelAnimationFrame !== null) {
      cancelAnimationFrame(this.wheelAnimationFrame);
      this.wheelAnimationFrame = null;
    }
  }
}
