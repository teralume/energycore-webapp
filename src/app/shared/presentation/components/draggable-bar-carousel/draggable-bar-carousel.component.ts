import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';

export interface DraggableBarCarouselItem {
  key: string;
  value: string;
  caption: string;
  percentage: number;
  ariaLabel?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  detail?: string;
  meta?: string;
  tone?: 'default' | 'warning';
}

interface VisibleDraggableBarCarouselItem extends DraggableBarCarouselItem {
  index: number;
}

@Component({
  selector: 'app-draggable-bar-carousel',
  standalone: true,
  templateUrl: './draggable-bar-carousel.component.html',
  styleUrls: ['./draggable-bar-carousel.component.scss'],
})
export class DraggableBarCarouselComponent implements OnChanges {
  @Input() items: DraggableBarCarouselItem[] = [];
  @Input() visibleRadius = 5;
  @Input() selectable = false;
  @Input() followLatest = false;
  @Output() itemSelected = new EventEmitter<DraggableBarCarouselItem>();

  readonly dragging = signal(false);
  readonly momentum = signal(false);
  readonly autoAdvancing = signal(false);
  readonly motionTick = signal(0);

  private readonly stepPx = 168;
  private readonly dragSensitivity = 1.55;
  private readonly throwPower = 1.9;
  private offsetPx = 0;
  private velocity = 0;
  private selectedIndex = 0;
  private didDrag = false;
  private activePointerId: number | null = null;
  private lastPointerX = 0;
  private lastPointerTime = 0;
  private animationFrame: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['items']) {
      return;
    }

    const previousItems = (changes['items'].previousValue ??
      []) as DraggableBarCarouselItem[];
    const nextLatestIndex = Math.max(0, this.items.length - 1);
    const wasAtLatest =
      this.selectedIndex >= Math.max(0, previousItems.length - 1);

    if (
      this.followLatest &&
      wasAtLatest &&
      previousItems.length > 0 &&
      this.items.length > previousItems.length
    ) {
      this.advanceToLatest(Math.max(0, previousItems.length - 1), nextLatestIndex);
      return;
    }

    this.selectedIndex = this.followLatest && wasAtLatest
      ? nextLatestIndex
      : this.clampIndex(this.selectedIndex);
    this.offsetPx = 0;
    this.markMotionChanged();
  }

  visibleItems(): VisibleDraggableBarCarouselItem[] {
    const selectedIndex = this.activeIndex();
    const start = Math.max(0, selectedIndex - this.visibleRadius);
    const end = Math.min(this.items.length, selectedIndex + this.visibleRadius + 1);

    return this.items.slice(start, end).map((item, offset) => ({
      ...item,
      index: start + offset,
    }));
  }

  railTransform(): string {
    this.motionTick();

    if (this.items.length === 0) {
      return 'translateX(0)';
    }

    const start = this.visibleStartIndex();
    const selectedOffset = this.activeIndex() - start;
    const translateX = -selectedOffset * this.stepPx + this.offsetPx - 63;

    return `translateX(${translateX}px)`;
  }

  itemTransform(index: number): string {
    const position = this.itemPosition(index);
    const distance = Math.abs(position);
    const focus = Math.max(0, 1 - Math.min(distance, 1));
    const magneticX = -Math.sign(position) * Math.min(22, distance * 10);
    const translateY = Math.min(distance, 4.5) * 14 - focus * 34;
    const scale = Math.max(0.72, 1.08 - distance * 0.06);
    const rotateY = Math.max(-24, Math.min(24, position * -7));

    return `translateX(${magneticX}px) translateY(${translateY}px) scale(${scale}) rotateY(${rotateY}deg)`;
  }

  itemOpacity(index: number): number {
    const distance = Math.abs(this.itemPosition(index));
    return distance > 5.4 ? 0 : Math.max(0.18, 1 - distance * 0.13);
  }

  itemZIndex(index: number): number {
    const distance = Math.abs(this.itemPosition(index));
    return Math.round(120 - distance * 12);
  }

  isActive(index: number): boolean {
    this.motionTick();
    return index === this.activeIndex() && Math.abs(this.offsetPx) < 32;
  }

  onPointerDown(event: PointerEvent): void {
    if (this.items.length <= 1 || event.button !== 0) {
      return;
    }

    this.cancelAnimation();
    this.dragging.set(true);
    this.activePointerId = event.pointerId;
    this.lastPointerX = event.clientX;
    this.lastPointerTime = performance.now();
    this.velocity = 0;
    this.didDrag = false;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.activePointerId) {
      return;
    }

    const now = performance.now();
    const deltaX = event.clientX - this.lastPointerX;
    const deltaTime = Math.max(1, now - this.lastPointerTime);

    if (Math.abs(deltaX) > 2) {
      this.didDrag = true;
    }

    this.velocity = (deltaX / deltaTime) * this.throwPower;
    this.offsetPx += this.applyEdgeResistance(deltaX * this.dragSensitivity);
    this.lastPointerX = event.clientX;
    this.lastPointerTime = now;
    this.consumeOffset();
    this.markMotionChanged();
    event.preventDefault();
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.dragging() || event.pointerId !== this.activePointerId) {
      return;
    }

    this.dragging.set(false);
    this.activePointerId = null;

    const target = event.currentTarget as HTMLElement;

    if (target.hasPointerCapture(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    this.startInertia();
  }

  onPointerCancel(event: PointerEvent): void {
    if (event.pointerId !== this.activePointerId) {
      return;
    }

    this.dragging.set(false);
    this.activePointerId = null;
    this.startInertia();
  }

  onChipPointerDown(event: PointerEvent): void {
    this.didDrag = false;
    event.stopPropagation();
  }

  selectItem(item: DraggableBarCarouselItem, event?: MouseEvent): void {
    event?.stopPropagation();

    if (this.didDrag) {
      this.didDrag = false;
      return;
    }

    this.itemSelected.emit(item);
  }

  private activeIndex(): number {
    return this.clampIndex(this.selectedIndex);
  }

  private visibleStartIndex(): number {
    return Math.max(0, this.activeIndex() - this.visibleRadius);
  }

  private clampIndex(index: number): number {
    return Math.min(Math.max(index, 0), Math.max(0, this.items.length - 1));
  }

  private itemPosition(index: number): number {
    this.motionTick();
    return index - this.activeIndex() + this.offsetPx / this.stepPx;
  }

  private consumeOffset(): void {
    let nextIndex = this.clampIndex(this.selectedIndex);

    while (this.offsetPx >= this.stepPx / 2) {
      if (nextIndex <= 0) {
        this.offsetPx = this.stepPx / 2;
        this.velocity = 0;
        break;
      }

      nextIndex -= 1;
      this.offsetPx -= this.stepPx;
    }

    while (this.offsetPx <= -this.stepPx / 2) {
      if (nextIndex >= this.items.length - 1) {
        this.offsetPx = -this.stepPx / 2;
        this.velocity = 0;
        break;
      }

      nextIndex += 1;
      this.offsetPx += this.stepPx;
    }

    this.selectedIndex = nextIndex;
  }

  private applyEdgeResistance(deltaX: number): number {
    const index = this.activeIndex();
    const isPullingBeforeFirst = index === 0 && deltaX > 0;
    const isPullingAfterLast = index === this.items.length - 1 && deltaX < 0;

    return isPullingBeforeFirst || isPullingAfterLast ? deltaX * 0.22 : deltaX;
  }

  private startInertia(): void {
    const minVelocity = 0.014;
    const friction = 0.935;
    let lastTime = performance.now();

    this.momentum.set(true);

    const animate = () => {
      const now = performance.now();
      const deltaTime = Math.max(1, now - lastTime);
      lastTime = now;

      this.offsetPx += this.applyEdgeResistance(this.velocity * deltaTime);
      this.velocity *= friction;
      this.consumeOffset();
      this.markMotionChanged();

      if (Math.abs(this.velocity) > minVelocity) {
        this.animationFrame = requestAnimationFrame(animate);
        return;
      }

      this.snapToCenter();
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private snapToCenter(): void {
    const startOffset = this.offsetPx;
    const duration = 160;
    const startedAt = performance.now();

    const animate = () => {
      const progress = Math.min(1, (performance.now() - startedAt) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      this.offsetPx = startOffset * (1 - easedProgress);
      this.markMotionChanged();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
        return;
      }

      this.offsetPx = 0;
      this.velocity = 0;
      this.momentum.set(false);
      this.animationFrame = null;
      this.markMotionChanged();
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private cancelAnimation(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }

    this.momentum.set(false);
    this.autoAdvancing.set(false);
  }

  private advanceToLatest(previousLatestIndex: number, latestIndex: number): void {
    const startIndex = this.clampIndex(previousLatestIndex);
    const targetIndex = this.clampIndex(latestIndex);
    const steps = Math.max(0, targetIndex - startIndex);

    if (steps === 0) {
      this.selectedIndex = targetIndex;
      this.offsetPx = 0;
      this.markMotionChanged();
      return;
    }

    this.cancelAnimation();
    this.autoAdvancing.set(true);
    this.selectedIndex = startIndex;
    this.offsetPx = 0;
    this.velocity = 0;
    this.markMotionChanged();

    const travelDistance = -steps * this.stepPx;
    const duration = Math.min(1400, 720 + steps * 150);
    const startedAt = performance.now();

    const animate = () => {
      const progress = Math.min(1, (performance.now() - startedAt) / duration);
      const easedProgress = this.easeInOutCubic(progress);

      this.offsetPx = travelDistance * easedProgress;
      this.markMotionChanged();

      if (progress < 1) {
        this.animationFrame = requestAnimationFrame(animate);
        return;
      }

      this.selectedIndex = targetIndex;
      this.offsetPx = 0;
      this.velocity = 0;
      this.autoAdvancing.set(false);
      this.animationFrame = null;
      this.markMotionChanged();
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  private easeInOutCubic(progress: number): number {
    return progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  }

  private markMotionChanged(): void {
    this.motionTick.update((value) => (value + 1) % 100000);
  }
}
