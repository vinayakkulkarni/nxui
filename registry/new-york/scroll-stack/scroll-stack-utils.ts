import { Comment, Fragment, Text, isVNode } from 'vue';
import type { VNode } from 'vue';

export function resolveOffset(value: number | string, size: number): number {
  if (typeof value === 'number') return value;
  const text = value.trim();
  if (text.endsWith('%')) return (Number.parseFloat(text) / 100) * size;
  return Number.parseFloat(text) || 0;
}

export function toLength(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

/** True when a nested scroller under `node` can still scroll in the wheel direction. */
export function scrollsInside(
  node: EventTarget | null,
  stop: Element,
  delta: number,
): boolean {
  let element = node instanceof Element ? node : null;
  for (; element && element !== stop; element = element.parentElement) {
    if (element.scrollHeight <= element.clientHeight + 1) continue;
    const overflow = getComputedStyle(element).overflowY;
    if (overflow !== 'auto' && overflow !== 'scroll') continue;
    if (
      delta > 0
        ? element.scrollTop + element.clientHeight < element.scrollHeight - 1
        : element.scrollTop > 0
    ) {
      return true;
    }
  }
  return false;
}

/** Flattens slot fragments (v-for) and drops comments / whitespace text. */
export function flattenSlot(nodes: VNode[]): VNode[] {
  const out: VNode[] = [];
  for (const node of nodes) {
    if (node.type === Comment) continue;
    if (node.type === Text && String(node.children ?? '').trim() === '')
      continue;
    if (node.type === Fragment && Array.isArray(node.children)) {
      out.push(
        ...flattenSlot(
          node.children.filter((child): child is VNode => isVNode(child)),
        ),
      );
      continue;
    }
    out.push(node);
  }
  return out;
}
