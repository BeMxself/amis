import {
  applyEditorThemeScope,
  getEditorThemeClassName,
  getEditorThemeClassSelector,
  resolveEditorComponentClassPrefix,
  getEditorThemeScopeHtmlAttrs,
  getEditorThemeScopeProps,
  resolveEditorThemeName
} from '../src/themeScope';

describe('editor themeScope helpers', () => {
  it('resolves theme names from string, ThemeInstance-like objects, and fallback', () => {
    expect(resolveEditorThemeName('dark')).toBe('dark');
    expect(resolveEditorThemeName({scope: {value: 'antd'}})).toBe('antd');
    expect(resolveEditorThemeName({name: 'custom'})).toBe('custom');
    expect(resolveEditorThemeName(undefined, 'cxd')).toBe('cxd');
  });

  it('creates preview scope props and applies them to DOM nodes', () => {
    expect(getEditorThemeScopeProps('dark')).toEqual({
      'data-prismui-theme': 'dark'
    });

    const node = document.createElement('div');
    applyEditorThemeScope(node, 'antd');

    expect(node).toHaveAttribute('data-prismui-theme', 'antd');
    expect(getEditorThemeScopeHtmlAttrs('a"b')).toBe(
      'data-prismui-theme="a&quot;b"'
    );
  });

  it('resolves component prefix from core theme config for future brand switches', () => {
    expect(resolveEditorComponentClassPrefix('cxd')).toBe('prismui-');
    expect(
      resolveEditorComponentClassPrefix({componentClassPrefix: 'runtime-'})
    ).toBe('runtime-');
    expect(
      getEditorThemeClassName({componentClassPrefix: 'brand-'}, 'Button')
    ).toBe('brand-Button');
    expect(
      getEditorThemeClassSelector({componentClassPrefix: 'brand-'}, 'Button')
    ).toBe('.brand-Button');
  });
});
