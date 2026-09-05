---
name: EnergyCore
description: Technological energy-management interface for residential and business users.
framework: Angular 21
theme: adaptive-light-dark
primary_color: '#22C55E'
secondary_color: '#F59E0B'
icon_library: Lucide Angular
---

# EnergyCore Design System

## Visual direction

EnergyCore uses a precise, technological interface with restrained glow, thin technical grids and compact operational information. Green signals energy, action and healthy operation. Amber provides analytical contrast, while graphite and warm neutral surfaces keep the interface balanced. The interface must remain professional rather than game-like.

## Color roles

- Primary energy: `#22C55E`; strong state: `#16A34A`.
- Information and chart secondary: `#F59E0B`; strong light-theme alternative: `#B45309`.
- Dark canvas: graphite, charcoal and near-black green-neutral surfaces.
- Light canvas: warm white, stone and pale green-neutral surfaces.
- Warning and danger continue using the existing semantic status tokens.
- Components use `--ec-primary*`, `--ec-info*` and the shared focus tokens. Blue and cyan are excluded from the EnergyCore interface.

## Typography and numbers

- Keep Inter or the current system sans-serif stack.
- Use tight, high-weight headings and short line lengths.
- Use tabular or monospace-style numerals only for operational metrics and chart values.
- Keep body text calm, readable and sentence case.

## Shape, depth and spacing

- Cards: 18–28 px radius, thin border, subtle inner highlight.
- Controls: 12–18 px radius; use pills only for status or compact navigation.
- Maintain compact metrics but preserve 16–24 px space between functional groups.
- Glow communicates live energy or focus; it is not decoration on every surface.

## Components

### Header

- Floating glass top bar with a green Lucide Zap brand mark.
- Use Lucide icons for theme and user controls.
- Preserve existing routes, dropdown behavior and permissions.

### Authentication

- Split panel on desktop: abstract energy telemetry at left, form at right.
- Collapse to one column on narrow screens.
- Labels stay visible; focus uses the green pilot ring.

### Energy dashboard

- Temporal consumption uses a responsive emerald-to-amber line and area chart based on real readings.
- Device rankings stay sorted and include proportional horizontal bars.
- Metrics are compact, aligned and use tabular numerals.
- Keep loading, empty, success, warning and error states supplied by existing facades/components.

## Accessibility and motion

- Every icon-only control requires an accessible label.
- Keyboard focus must always remain visible.
- Charts expose an equivalent semantic data table.
- Respect `prefers-reduced-motion`; animation must never be required to understand state.
- First visit follows the operating-system theme. A manual theme choice remains persisted.

## Architecture boundaries

- Domain and application layers remain UI-framework independent.
- HTTP stays in infrastructure; presentation consumes facades/stores.
- Reuse shared components before adding new ones.
- Domain-specific chart presentation belongs to `energy-monitoring/presentation/components`.
- Do not change routes, API contracts, product data or backend behavior during visual migration.
