import {
  applyThemeScope,
  getClassPrefix,
  getNearestThemeScope,
  getTheme,
  getThemeScope,
  getThemeScopeProps,
  getStableClassName,
  getStableClassSelector,
  makeStableClassnames,
  resolveOverlayContainer,
  theme
} from '../src/theme';

afterEach(() => {
  theme('cxd', {
    componentClassPrefix: 'amis-',
    legacyDomClassAlias: false
  });
});

test('theme runtime uses stable component classnames by default', () => {
  const cx = getTheme('cxd').classnames;

  expect(cx('Button', 'Button--primary', 'is-disabled')).toBe(
    'amis-Button amis-Button--primary is-disabled'
  );
  expect(cx('Button')).not.toContain('cxd-Button');
});

test('theme runtime exposes stable component classPrefix to components', () => {
  theme('cxd', {
    classPrefix: 'cxd-',
    componentClassPrefix: 'amis-',
    legacyDomClassAlias: false
  });

  expect(getClassPrefix()).toBe('amis-');
  expect(getTheme('cxd').componentClassPrefix).toBe('amis-');
});

test('theme runtime exposes a data attribute scope', () => {
  expect(getThemeScope('cxd')).toMatchObject({
    theme: 'cxd',
    attribute: 'data-amis-theme',
    value: 'cxd',
    selector: '[data-amis-theme="cxd"]',
    tokenScopeSelector: '[data-amis-theme="cxd"]'
  });

  expect(getThemeScopeProps('cxd')).toEqual({
    'data-amis-theme': 'cxd'
  });
  expect(getTheme('default').scope.value).toBe('cxd');
});

test('makeStableClassnames prefixes only component tokens', () => {
  const cx = makeStableClassnames();

  expect(cx('Button', ':Button--quiet', 'is-active', 'custom-class')).toBe(
    'amis-Button Button--quiet is-active custom-class'
  );
});

test('stable class selector helpers prefer the primary component class', () => {
  theme('cxd', {
    legacyDomClassAlias: 'cxd'
  });
  const cx = getTheme('cxd').classnames;

  expect(getStableClassName(cx, 'Modal-content')).toBe('amis-Modal-content');
  expect(getStableClassSelector(cx, 'Modal-content')).toBe(
    '.amis-Modal-content'
  );
});

test('explicit legacy DOM alias updates cached theme classnames', () => {
  expect(getTheme('cxd').classnames('Button')).toBe('amis-Button');

  theme('cxd', {
    legacyDomClassAlias: 'cxd'
  });

  expect(getTheme('cxd').classnames('Button', 'Button--primary')).toBe(
    'amis-Button cxd-Button amis-Button--primary cxd-Button--primary'
  );
});

test('legacy DOM alias does not auto-generate non-cxd theme prefixes', () => {
  theme('cxd', {
    legacyDomClassAlias: 'antd' as any
  });

  expect(getTheme('cxd').classnames('Button', 'Button--primary')).toBe(
    'amis-Button amis-Button--primary'
  );
});

test('overlay theme helpers resolve nearest DOM scope', () => {
  const root = document.createElement('div');
  const child = document.createElement('div');
  root.setAttribute('data-amis-theme', 'dark');
  root.appendChild(child);

  expect(getNearestThemeScope(child)).toMatchObject({
    theme: 'dark',
    value: 'dark',
    selector: '[data-amis-theme="dark"]'
  });
  expect(getNearestThemeScope(document.createElement('div'))).toBeNull();
});

test('overlay theme helpers apply scope idempotently', () => {
  const node = document.createElement('div');
  const cxdScope = getThemeScope('cxd');
  const darkScope = getThemeScope('dark');

  expect(applyThemeScope(node, cxdScope)).toBe(cxdScope);
  expect(node).toHaveAttribute('data-amis-theme', 'cxd');
  expect(applyThemeScope(node, darkScope)).toMatchObject({
    value: 'cxd'
  });
  expect(node).toHaveAttribute('data-amis-theme', 'cxd');
});

test('overlay container resolver preserves custom container scope', () => {
  const fallback = document.createElement('div');
  const custom = document.createElement('div');
  custom.setAttribute('data-amis-theme', 'dark');
  const customResolution = resolveOverlayContainer(
    custom,
    fallback,
    getThemeScope('cxd')
  );

  expect(customResolution.container).toBe(custom);
  expect(customResolution.scope).toMatchObject({
    theme: 'dark',
    value: 'dark',
    selector: '[data-amis-theme="dark"]'
  });
  expect(resolveOverlayContainer(null, fallback, getThemeScope('cxd'))).toEqual(
    {
      container: fallback,
      scope: getThemeScope('cxd')
    }
  );
});
