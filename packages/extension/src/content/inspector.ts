/**
 * Element inspector: hover overlay, tooltip, click-to-freeze.
 * Operates entirely in the content-script isolated world.
 */
import type { ElementInspection } from '../shared/messaging';
import { colorToFormats } from '../shared/color-utils';
import { stylesToTailwind } from '../shared/tailwind-map';

let active = false;
let frozen = false;
let overlay: HTMLDivElement | null = null;
let tooltip: HTMLDivElement | null = null;
let currentEl: Element | null = null;
let onSelect: ((data: ElementInspection) => void) | null = null;
let onHover: ((data: Partial<ElementInspection> | null) => void) | null = null;

const OVERLAY_ID = '__stylepeek_inspector_overlay';
const TOOLTIP_ID = '__stylepeek_inspector_tooltip';

/* ── Public API ────────────────────────────────────────── */

export function activateInspector(
  selectCb: (data: ElementInspection) => void,
  hoverCb: (data: Partial<ElementInspection> | null) => void,
) {
  if (active) return;
  active = true;
  frozen = false;
  onSelect = selectCb;
  onHover = hoverCb;
  ensureOverlay();
  document.addEventListener('mousemove', handleMouseMove, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);
  document.body.style.cursor = 'crosshair';
}

export function deactivateInspector() {
  active = false;
  frozen = false;
  onSelect = null;
  onHover = null;
  document.removeEventListener('mousemove', handleMouseMove, true);
  document.removeEventListener('click', handleClick, true);
  document.removeEventListener('keydown', handleKeyDown, true);
  document.body.style.cursor = '';
  removeOverlay();
}

export function isInspectorActive(): boolean {
  return active;
}

/* ── Overlay DOM ───────────────────────────────────────── */

function ensureOverlay() {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '2147483646',
      border: '2px solid #8B5CF6', background: 'rgba(139, 92, 246, 0.08)',
      borderRadius: '3px', transition: 'all 80ms ease',
    });
    document.documentElement.appendChild(overlay);
  }
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = TOOLTIP_ID;
    Object.assign(tooltip.style, {
      position: 'fixed', pointerEvents: 'none', zIndex: '2147483647',
      background: '#1A1A1A', color: '#F5F5F5', fontSize: '11px',
      fontFamily: 'Inter, system-ui, sans-serif', padding: '6px 10px',
      borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
      maxWidth: '340px', lineHeight: '1.4', whiteSpace: 'nowrap',
    });
    document.documentElement.appendChild(tooltip);
  }
}

function removeOverlay() {
  overlay?.remove();
  tooltip?.remove();
  overlay = null;
  tooltip = null;
}

function positionOverlay(rect: DOMRect) {
  if (!overlay) return;
  Object.assign(overlay.style, {
    top: rect.top + 'px', left: rect.left + 'px',
    width: rect.width + 'px', height: rect.height + 'px',
    display: 'block',
  });
}

function positionTooltip(rect: DOMRect, el: Element) {
  if (!tooltip) return;
  const tag = el.tagName.toLowerCase();
  const cls = el.classList.length > 0 ? '.' + Array.from(el.classList).slice(0, 3).join('.') : '';
  const id = el.id ? `#${el.id}` : '';
  const dims = `${Math.round(rect.width)}×${Math.round(rect.height)}`;
  tooltip.innerHTML = `<span style="color:#A78BFA;font-weight:600">${tag}</span><span style="color:#7DD3FC">${id}</span><span style="color:#86EFAC">${cls}</span> <span style="color:#94A3B8;margin-left:4px">${dims}</span>`;

  const top = rect.top - 32;
  tooltip.style.top = (top > 4 ? top : rect.bottom + 4) + 'px';
  tooltip.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - 350)) + 'px';
  tooltip.style.display = 'block';
}

/* ── Event handlers ────────────────────────────────────── */

function handleMouseMove(e: MouseEvent) {
  if (!active || frozen) return;
  const el = document.elementFromPoint(e.clientX, e.clientY);
  if (!el || el.id === OVERLAY_ID || el.id === TOOLTIP_ID || el === document.documentElement || el === document.body) {
    if (overlay) overlay.style.display = 'none';
    if (tooltip) tooltip.style.display = 'none';
    onHover?.(null);
    return;
  }
  currentEl = el;
  const rect = el.getBoundingClientRect();
  positionOverlay(rect);
  positionTooltip(rect, el);

  // Lightweight hover data
  const cs = getComputedStyle(el);
  onHover?.({
    tag: el.tagName.toLowerCase(),
    selector: buildSelector(el),
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
  });
}

function handleClick(e: MouseEvent) {
  if (!active) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();

  if (frozen) {
    // Unfreeze
    frozen = false;
    return;
  }

  if (!currentEl) return;
  frozen = true;

  const data = inspectElement(currentEl);
  onSelect?.(data);
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    deactivateInspector();
  }
}

/* ── Full element inspection ───────────────────────────── */

export function inspectElement(el: Element): ElementInspection {
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  // Gather key styles
  const styles: Record<string, string> = {};
  const important = [
    'color', 'background-color', 'font-family', 'font-size', 'font-weight',
    'line-height', 'letter-spacing', 'text-align', 'display', 'position',
    'padding', 'margin', 'border', 'border-radius', 'box-shadow',
    'opacity', 'overflow', 'width', 'height', 'gap',
  ];
  for (const prop of important) {
    const val = cs.getPropertyValue(prop);
    if (val) styles[prop] = val;
  }

  // Colors
  const colorProps = ['color', 'background-color', 'border-color'];
  const colors: { property: string; value: string; hex: string }[] = [];
  for (const p of colorProps) {
    const v = cs.getPropertyValue(p);
    if (v && v !== 'rgba(0, 0, 0, 0)' && v !== 'transparent') {
      const fmt = colorToFormats(v);
      if (fmt) colors.push({ property: p, value: v, hex: fmt.hex });
    }
  }

  // Typography
  const typography = {
    fontFamily: cs.fontFamily,
    fontSize: cs.fontSize,
    fontWeight: cs.fontWeight,
    lineHeight: cs.lineHeight,
    letterSpacing: cs.letterSpacing,
    textTransform: cs.textTransform,
  };

  // Spacing / Box model
  const spacing = {
    padding: { top: cs.paddingTop, right: cs.paddingRight, bottom: cs.paddingBottom, left: cs.paddingLeft },
    margin: { top: cs.marginTop, right: cs.marginRight, bottom: cs.marginBottom, left: cs.marginLeft },
    border: { top: cs.borderTopWidth, right: cs.borderRightWidth, bottom: cs.borderBottomWidth, left: cs.borderLeftWidth },
  };

  // Tailwind
  const tailwindClasses = stylesToTailwind(styles);

  return {
    tag: el.tagName.toLowerCase(),
    id: el.id || undefined,
    classNames: Array.from(el.classList),
    selector: buildSelector(el),
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
    styles,
    colors,
    typography,
    spacing,
    tailwindClasses,
  };
}

function buildSelector(el: Element): string {
  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== document.documentElement && parts.length < 4) {
    let seg = current.tagName.toLowerCase();
    if (current.id) { seg += `#${current.id}`; parts.unshift(seg); break; }
    if (current.classList.length > 0) seg += '.' + Array.from(current.classList).slice(0, 2).join('.');
    parts.unshift(seg);
    current = current.parentElement;
  }
  return parts.join(' > ');
}
