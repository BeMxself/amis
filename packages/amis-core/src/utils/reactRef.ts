import type React from 'react';

export function setReactRef<T>(
  ref: React.Ref<T> | null | undefined,
  value: T | null
) {
  if (!ref) {
    return;
  }

  if (typeof ref === 'function') {
    ref(value);
    return;
  }

  (ref as React.MutableRefObject<T | null>).current = value;
}

export function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | null | undefined>
): React.Ref<T> | undefined {
  const activeRefs = refs.filter(Boolean) as Array<React.Ref<T>>;

  if (activeRefs.length < 2) {
    return activeRefs[0];
  }

  return (value: T | null) => {
    activeRefs.forEach(ref => setReactRef(ref, value));
  };
}

export function getReactElementRef<T>(
  element: React.ReactElement
): React.Ref<T> | null | undefined {
  const propsRef = (element.props as {ref?: React.Ref<T> | null})?.ref;
  if (propsRef !== undefined) {
    return propsRef;
  }

  const descriptor = Object.getOwnPropertyDescriptor(element, 'ref');
  return descriptor && 'value' in descriptor
    ? (descriptor.value as React.Ref<T> | null | undefined)
    : undefined;
}
