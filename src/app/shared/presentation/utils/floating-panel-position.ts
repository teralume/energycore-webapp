export interface FloatingPanelPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  opensAbove: boolean;
}

export interface FloatingPanelPositionOptions {
  gap?: number;
  maxHeight?: number;
  minHeight?: number;
  minWidth?: number;
  panelHeight?: number;
  preferredWidth?: number;
  viewportPadding?: number;
}

type PopoverElement = HTMLElement & {
  hidePopover?: () => void;
  showPopover?: () => void;
};

export function positionFloatingPanel(
  trigger: HTMLElement,
  panel: HTMLElement,
  options: FloatingPanelPositionOptions = {}
): FloatingPanelPosition {
  const position = computeFloatingPanelPosition(trigger, options);

  panel.style.top = `${Math.round(position.top)}px`;
  panel.style.left = `${Math.round(position.left)}px`;
  panel.style.width = `${Math.round(position.width)}px`;
  panel.style.maxHeight = `${Math.round(position.maxHeight)}px`;

  return position;
}

export function showFloatingPopover(panel: HTMLElement): void {
  const popover = panel as PopoverElement;

  if (typeof popover.showPopover !== 'function' || isPopoverOpen(panel)) {
    return;
  }

  try {
    popover.showPopover();
  } catch {
    return;
  }
}

export function hideFloatingPopover(panel: HTMLElement | null | undefined): void {
  if (!panel) {
    return;
  }

  const popover = panel as PopoverElement;

  if (typeof popover.hidePopover !== 'function' || !isPopoverOpen(panel)) {
    return;
  }

  try {
    popover.hidePopover();
  } catch {
    return;
  }
}

function computeFloatingPanelPosition(
  trigger: HTMLElement,
  options: FloatingPanelPositionOptions
): FloatingPanelPosition {
  const viewportPadding = options.viewportPadding ?? 12;
  const gap = options.gap ?? 10;
  const rect = trigger.getBoundingClientRect();
  const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
  const viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
  const availableWidth = Math.max(0, viewportWidth - viewportPadding * 2);
  const minWidth = Math.min(options.minWidth ?? 180, availableWidth);
  const requestedWidth = options.preferredWidth ?? Math.max(rect.width, minWidth);
  const width = clamp(requestedWidth, minWidth, availableWidth);
  const left = clamp(
    rect.left,
    viewportPadding,
    Math.max(viewportPadding, viewportWidth - viewportPadding - width)
  );

  const preferredPanelHeight = options.panelHeight ?? options.maxHeight ?? 360;
  const maxPanelHeight = options.maxHeight ?? preferredPanelHeight;
  const minHeight = options.minHeight ?? 140;
  const belowSpace = viewportHeight - rect.bottom - viewportPadding - gap;
  const aboveSpace = rect.top - viewportPadding - gap;
  const opensAbove = belowSpace < Math.min(preferredPanelHeight, minHeight) && aboveSpace > belowSpace;
  const availableHeight = Math.max(0, opensAbove ? aboveSpace : belowSpace);
  const maxHeight = clamp(
    Math.min(preferredPanelHeight, maxPanelHeight),
    Math.min(minHeight, Math.max(minHeight, availableHeight)),
    Math.max(minHeight, availableHeight)
  );
  const panelHeight = Math.min(preferredPanelHeight, maxHeight);
  const top = opensAbove
    ? clamp(
        rect.top - gap - panelHeight,
        viewportPadding,
        Math.max(viewportPadding, viewportHeight - viewportPadding - panelHeight)
      )
    : clamp(
        rect.bottom + gap,
        viewportPadding,
        Math.max(viewportPadding, viewportHeight - viewportPadding - panelHeight)
      );

  return {
    top,
    left,
    width,
    maxHeight,
    opensAbove,
  };
}

function isPopoverOpen(panel: HTMLElement): boolean {
  try {
    return panel.matches(':popover-open');
  } catch {
    return false;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
