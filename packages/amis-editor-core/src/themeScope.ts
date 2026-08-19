import {
  applyThemeScope,
  getStableClassName,
  getStableClassSelector,
  getTheme,
  makeStableClassnames,
  ThemeScope,
  ThemeScopeProps
} from 'amis-core';

export function resolveEditorThemeName(
  theme?: any,
  fallbackTheme: string = 'cxd'
) {
  if (typeof theme === 'string' && theme) {
    return theme;
  }

  if (theme?.scope?.value) {
    return theme.scope.value;
  }

  if (theme?.name) {
    return theme.name;
  }

  return fallbackTheme;
}

export function resolveEditorComponentClassPrefix(
  theme?: any,
  fallbackTheme: string = 'cxd'
) {
  if (typeof theme?.componentClassPrefix === 'string') {
    return theme.componentClassPrefix;
  }

  const themeName = resolveEditorThemeName(theme, fallbackTheme);
  return getTheme(themeName).componentClassPrefix || 'prismui-';
}

export function getEditorThemeClassnames(
  theme?: any,
  fallbackTheme: string = 'cxd'
) {
  return makeStableClassnames(
    resolveEditorComponentClassPrefix(theme, fallbackTheme) as any
  );
}

export function getEditorThemeClassName(
  theme: any,
  className: string,
  fallbackTheme: string = 'cxd'
) {
  return getStableClassName(
    getEditorThemeClassnames(theme, fallbackTheme),
    className
  );
}

export function getEditorThemeClassSelector(
  theme: any,
  className: string,
  fallbackTheme: string = 'cxd'
) {
  return getStableClassSelector(
    getEditorThemeClassnames(theme, fallbackTheme),
    className
  );
}

export function getEditorThemeScope(
  theme?: any,
  fallbackTheme?: string
): ThemeScope {
  const value = resolveEditorThemeName(theme, fallbackTheme);
  const selector = `[data-prismui-theme="${value.replace(/"/g, '\\"')}"]`;

  return {
    theme: value,
    attribute: 'data-prismui-theme',
    value,
    selector,
    tokenScopeSelector: selector
  };
}

export function getEditorThemeScopeProps(
  theme?: any,
  fallbackTheme?: string
): ThemeScopeProps {
  return {
    'data-prismui-theme': getEditorThemeScope(theme, fallbackTheme).value
  };
}

export function applyEditorThemeScope(
  node: HTMLElement | null | undefined,
  theme?: any,
  fallbackTheme?: string
) {
  return applyThemeScope(node, getEditorThemeScope(theme, fallbackTheme));
}

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getEditorThemeScopeHtmlAttrs(
  theme?: any,
  fallbackTheme?: string
) {
  const props = getEditorThemeScopeProps(theme, fallbackTheme);

  return `data-prismui-theme="${escapeHtmlAttribute(
    props['data-prismui-theme']
  )}"`;
}
