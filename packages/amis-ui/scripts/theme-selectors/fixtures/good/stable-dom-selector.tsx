import {getStableClassName, getStableClassSelector} from 'amis-core';

declare const Sortable: new (
  node: Element,
  options: Record<string, unknown>
) => unknown;

const cx = (value: string) => `prismui-${value}`;
const root = document.body;

document.querySelector(getStableClassSelector(cx, 'GuardFixture'));
document.body.closest(getStableClassSelector(cx, 'GuardFixture'));
document.body.matches(
  `${getStableClassSelector(cx, 'GuardFixture')}.is-active`
);

new Sortable(root, {
  handle: getStableClassSelector(cx, 'GuardFixture-handle'),
  filter: `${getStableClassSelector(cx, 'GuardFixture')}.is-disabled`,
  ghostClass: getStableClassName(cx, 'GuardFixture--dragging')
});
