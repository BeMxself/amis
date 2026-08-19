declare const Sortable: new (
  node: Element,
  options: Record<string, unknown>
) => unknown;

const classPrefix = 'prismui-';
const ns = classPrefix;
const themePrefix = classPrefix;
const props = {classPrefix};
const prefix = ns;
const propPrefix = props.classPrefix;
const {classPrefix: destructuredPrefix} = props;
const selector = `.${prefix}GuardFixture-prebuilt`;
const draggingClassName = `${prefix}GuardFixture--prebuilt-dragging`;
const target = document.body;
const root = document.body;
const cx = (value: string) => `prismui-${value} prismui-${value}`;

document.querySelector(`.${classPrefix}GuardFixture`);
document.querySelector(`.${ns}GuardFixture`);
document.querySelector(`.${propPrefix}GuardFixture-from-props`);
document.querySelector(`.${destructuredPrefix}GuardFixture-destructured`);
document.querySelector(selector);
target.closest(`.${themePrefix}GuardFixture`);
target.matches(`.${ns}GuardFixture.is-active`);
target.matches(`.${cx('GuardFixture-cx')}`);
target.classList.contains(cx('GuardFixture-cx'));

new Sortable(root, {
  handle: `.${ns}GuardFixture-handle`,
  filter: `.${themePrefix}GuardFixture-disabled`,
  ghostClass: `${ns}GuardFixture--dragging`
});

new Sortable(root, {
  handle: selector,
  ghostClass: draggingClassName
});
