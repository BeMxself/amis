import {
  applyEditorThemeScope,
  getEditorThemeClassName,
  getEditorThemeClassSelector,
  resolveEditorComponentClassPrefix,
  getEditorThemeScopeHtmlAttrs,
  getEditorThemeScopeProps,
  resolveEditorThemeName
} from '../src/themeScope';
import {theme} from 'amis-core';

describe('editor themeScope helpers', () => {
  it('resolves theme names from string, ThemeInstance-like objects, and fallback', () => {
    expect(resolveEditorThemeName('dark')).toBe('dark');
    expect(resolveEditorThemeName({scope: {value: 'antd'}})).toBe('antd');
    expect(resolveEditorThemeName({name: 'custom'})).toBe('custom');
    expect(resolveEditorThemeName(undefined, 'cxd')).toBe('cxd');
  });

  it('creates preview scope props and applies them to DOM nodes', () => {
    expect(getEditorThemeScopeProps('dark')).toEqual({
      'data-amis-theme': 'dark'
    });

    const node = document.createElement('div');
    applyEditorThemeScope(node, 'antd');

    expect(node).toHaveAttribute('data-amis-theme', 'antd');
    expect(getEditorThemeScopeHtmlAttrs('a"b')).toBe(
      'data-amis-theme="a&quot;b"'
    );
  });

  it('resolves component prefix from core theme config for future brand switches', () => {
    theme('branded-editor-prefix', {
      componentClassPrefix: 'brand-' as any
    });

    expect(resolveEditorComponentClassPrefix('cxd')).toBe('amis-');
    expect(resolveEditorComponentClassPrefix('branded-editor-prefix')).toBe(
      'brand-'
    );
    expect(
      resolveEditorComponentClassPrefix({componentClassPrefix: 'runtime-'})
    ).toBe('runtime-');
    expect(getEditorThemeClassName('branded-editor-prefix', 'Button')).toBe(
      'brand-Button'
    );
    expect(getEditorThemeClassSelector('branded-editor-prefix', 'Button')).toBe(
      '.brand-Button'
    );
  });
});
