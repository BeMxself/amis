import React from 'react';
import {flushSync} from 'react-dom';
import {createRoot} from 'react-dom/client';
import type {Root} from 'react-dom/client';

const roots = new WeakMap<Element | DocumentFragment, Root>();

export function renderReactNode(
  element: React.ReactNode,
  container: Element | DocumentFragment,
  callback?: () => void
) {
  let root = roots.get(container);

  if (!root) {
    root = createRoot(container);
    roots.set(container, root);
  }

  flushSync(() => root!.render(element));
  callback?.();
}

export function unmountReactNode(container: Element | DocumentFragment) {
  const root = roots.get(container);

  if (!root) {
    return;
  }

  root.unmount();
  roots.delete(container);
}
