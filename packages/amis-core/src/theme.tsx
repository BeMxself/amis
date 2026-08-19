// 主题管理
import cx from 'classnames';
import React from 'react';
import hoistNonReactStatic from 'hoist-non-react-statics';

export type ClassValue =
  | ClassValue[]
  | Record<string, any>
  | string
  | number
  | boolean
  | null
  | undefined;

export type ClassNamesFn = (...classes: ClassValue[]) => string;

export type ComponentClassPrefix = 'prismui-';
export type LegacyDomClassAlias = false | 'cxd';

export interface ThemeScope {
  theme: string;
  attribute: 'data-prismui-theme';
  value: string;
  selector: string;
  tokenScopeSelector: string;
}

export interface ThemeScopeProps {
  'data-prismui-theme': string;
}

export interface OverlayContainerResolution {
  container: HTMLElement;
  scope: ThemeScope;
}

export interface ThemeConfig {
  /**
   * @deprecated Legacy/internal namespace for old DOM queries and migration
   * boundaries. New public component classes are driven by componentClassPrefix.
   */
  classPrefix?: string;
  componentClassPrefix?: ComponentClassPrefix;
  legacyDomClassAlias?: LegacyDomClassAlias;
  renderers?: {
    [propName: string]: any;
  };
  components?: {
    [propName: string]: any;
  };

  [propName: string]: any;
}

const themes: Record<string, ThemeConfig> = {
  default: {
    componentClassPrefix: 'prismui-',
    legacyDomClassAlias: false
  },
  cxd: {
    classPrefix: 'prismui-',
    componentClassPrefix: 'prismui-',
    legacyDomClassAlias: false
  }
};

export function theme(name: string, config: Partial<ThemeConfig>) {
  themes[name] = {
    ...themes[name],
    ...config
  };
}

const fns: Record<string, (...classes: ClassValue[]) => string> = {};

export function makeClassnames(ns?: string) {
  if (ns && fns[ns]) {
    return fns[ns];
  }

  const fn = (...classes: ClassValue[]) => {
    const str = cx(...classes);
    return str && ns
      ? str
          .replace(/(^|\s)([A-Z])/g, '$1' + ns + '$2')
          .replace(/(^|\s)\:/g, '$1')
      : str || '';
  };

  ns && (fns[ns] = fn);
  return fn;
}

const stableFns: Record<string, ClassNamesFn> = {};
const themeFns: Record<string, ClassNamesFn> = {};

function makePrefixedClassnames(prefixes: Array<string>): ClassNamesFn {
  return (...classes: ClassValue[]) => {
    const str = cx(...classes);

    if (!str) {
      return '';
    }

    if (!prefixes.length) {
      return str;
    }

    return str
      .split(/\s+/)
      .reduce((tokens: Array<string>, token: string) => {
        if (!token) {
          return tokens;
        }

        if (token.charAt(0) === ':') {
          tokens.push(token.substring(1));
          return tokens;
        }

        if (/^[A-Z]/.test(token)) {
          prefixes.forEach(prefix => tokens.push(`${prefix}${token}`));
        } else {
          tokens.push(token);
        }

        return tokens;
      }, [])
      .join(' ');
  };
}

export function makeStableClassnames(
  prefix: ComponentClassPrefix = 'prismui-'
): ClassNamesFn {
  if (stableFns[prefix]) {
    return stableFns[prefix];
  }

  return (stableFns[prefix] = makePrefixedClassnames([prefix]));
}

export function getStableClassName(
  classnames: ClassNamesFn,
  className: string
): string {
  const value = classnames(className);
  return value ? value.split(/\s+/).filter(Boolean)[0] || className : className;
}

function escapeClassSelector(className: string): string {
  return className.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1');
}

export function getStableClassSelector(
  classnames: ClassNamesFn,
  className: string
): string {
  return `.${escapeClassSelector(getStableClassName(classnames, className))}`;
}

function makeThemeClassnames(
  componentClassPrefix: ComponentClassPrefix,
  legacyDomClassAlias: LegacyDomClassAlias = false
): ClassNamesFn {
  const aliasPrefix = legacyDomClassAlias === 'cxd' ? 'cxd-' : '';
  const cacheKey = `${componentClassPrefix}|${aliasPrefix}`;

  if (themeFns[cacheKey]) {
    return themeFns[cacheKey];
  }

  return (themeFns[cacheKey] = makePrefixedClassnames(
    aliasPrefix ? [componentClassPrefix, aliasPrefix] : [componentClassPrefix]
  ));
}

function normalizeLegacyDomClassAlias(
  legacyDomClassAlias: ThemeConfig['legacyDomClassAlias']
): LegacyDomClassAlias {
  return legacyDomClassAlias === 'cxd' ? 'cxd' : false;
}

export interface ThemeInstance extends ThemeConfig {
  name: string;
  scope: ThemeScope;
  getRendererConfig: (name?: string) => any;
  getComponentConfig: (name?: string) => any;
  stableClassnames: ClassNamesFn;
  classnames: ClassNamesFn;
}

export function hasTheme(theme: string): boolean {
  return !!themes[theme];
}

export function setDefaultTheme(theme: string) {
  if (hasTheme(theme)) {
    defaultTheme = theme;
  }
}

export function classnames(...classes: ClassValue[]) {
  return getTheme(defaultTheme).classnames.apply(null, classes);
}

export function getClassPrefix() {
  return getTheme(defaultTheme).componentClassPrefix || 'prismui-';
}

export function normalizeThemeName(theme?: string): string {
  let themeName =
    typeof theme === 'string' && theme ? theme : defaultTheme || 'cxd';

  if (themeName === 'default') {
    themeName =
      defaultTheme && defaultTheme !== 'default' ? defaultTheme : 'cxd';
  }

  if (!hasTheme(themeName)) {
    themeName =
      defaultTheme && defaultTheme !== 'default' && hasTheme(defaultTheme)
        ? defaultTheme
        : 'cxd';
  }

  return themeName;
}

function createThemeScope(value: string): ThemeScope {
  const selector = `[data-prismui-theme="${value.replace(/"/g, '\\"')}"]`;

  return {
    theme: value,
    attribute: 'data-prismui-theme',
    value,
    selector,
    tokenScopeSelector: selector
  };
}

export function getThemeScope(themeName?: string): ThemeScope {
  return createThemeScope(normalizeThemeName(themeName));
}

export function getThemeScopeProps(themeName?: string): ThemeScopeProps {
  return {
    'data-prismui-theme': getThemeScope(themeName).value
  };
}

export function getNearestThemeScope(
  node: HTMLElement | null | undefined
): ThemeScope | null {
  const scopeNode = node?.closest?.('[data-prismui-theme]');
  const themeValue = scopeNode?.getAttribute('data-prismui-theme');

  return themeValue ? createThemeScope(themeValue) : null;
}

export function applyThemeScope(
  node: HTMLElement | null | undefined,
  scope: ThemeScope | null | undefined
): ThemeScope | null {
  if (!node || !scope) {
    return null;
  }

  const existingValue = node.getAttribute(scope.attribute);

  if (existingValue) {
    return createThemeScope(existingValue);
  }

  node.setAttribute(scope.attribute, scope.value);
  return scope;
}

export function resolveOverlayContainer(
  container: HTMLElement | null | undefined,
  fallback: HTMLElement,
  scope: ThemeScope
): OverlayContainerResolution {
  const resolvedContainer = container || fallback;

  return {
    container: resolvedContainer,
    scope: getNearestThemeScope(resolvedContainer) || scope
  };
}

export function getTheme(theme: string): ThemeInstance {
  theme = normalizeThemeName(theme);

  const config = themes[theme];
  const componentClassPrefix = config.componentClassPrefix || 'prismui-';
  const legacyDomClassAlias = normalizeLegacyDomClassAlias(
    config.legacyDomClassAlias
  );
  const classnamesKey = `${componentClassPrefix}|${legacyDomClassAlias || ''}`;

  if (!config.getRendererConfig) {
    config.getRendererConfig = (name?: string) => {
      const config = themes[theme];
      return config.renderers && name ? config.renderers[name] : null;
    };
  }

  config.name = theme;
  config.scope = getThemeScope(theme);

  if (
    !config.stableClassnames ||
    config.__stableClassnamesKey !== componentClassPrefix
  ) {
    config.stableClassnames = makeStableClassnames(componentClassPrefix);
    config.__stableClassnamesKey = componentClassPrefix;
  }

  if (!config.classnames || config.__classnamesKey !== classnamesKey) {
    config.classnames = makeThemeClassnames(
      componentClassPrefix,
      legacyDomClassAlias
    );
    config.__classnamesKey = classnamesKey;
  }

  if (!config.getComponentConfig) {
    config.getComponentConfig = (name?: string) =>
      config.components && name ? config.components[name] : null;
  }

  return config as ThemeInstance;
}

export interface ThemeProps {
  classnames: ClassNamesFn;
  classPrefix: string;
  className?: string;
  theme?: string;
  mobileUI?: boolean;
  style?: {
    [propName: string]: any;
  };
}

export interface ThemeOuterProps extends Partial<ThemeProps> {}

export let defaultTheme: string = 'cxd';
export const ThemeContext = React.createContext('');

export function themeable<
  T extends React.ComponentType<React.ComponentProps<T> & ThemeProps> & {
    themeKey?: string;
  }
>(ComposedComponent: T, methods?: Array<string>) {
  type OuterProps = JSX.LibraryManagedAttributes<
    T,
    Omit<React.ComponentProps<T>, keyof ThemeProps>
  > &
    ThemeOuterProps;

  const result = hoistNonReactStatic(
    class extends React.Component<OuterProps> {
      static displayName: string = `Themeable(${
        ComposedComponent.displayName || ComposedComponent.name
      })`;
      static contextType = ThemeContext;
      static ComposedComponent = ComposedComponent as React.ComponentType<T>;

      constructor(props: OuterProps) {
        super(props);
      }

      ref: any;

      childRef = (ref: any) => {
        while (ref && ref.getWrappedInstance) {
          ref = ref.getWrappedInstance();
        }

        this.ref = ref;
      };

      getWrappedInstance = () => {
        return this.ref;
      };

      render() {
        const theme: string = normalizeThemeName(
          this.props.theme || (this.context as string) || defaultTheme
        );
        const config = getTheme(theme);
        const injectedProps: {
          classPrefix: string;
          classnames: ClassNamesFn;
          theme: string;
        } = {
          classPrefix: config.componentClassPrefix || 'prismui-',
          classnames: config.classnames,
          theme
        };
        const refConfig =
          ComposedComponent.prototype?.isReactComponent ||
          (ComposedComponent as any).$$typeof ===
            Symbol.for('react.forward_ref')
            ? {ref: this.childRef}
            : {forwardedRef: this.childRef};

        const body = (
          <ComposedComponent
            {...config.getComponentConfig(ComposedComponent.themeKey)}
            {...(this.props as JSX.LibraryManagedAttributes<
              T,
              React.ComponentProps<T>
            >)}
            {...injectedProps}
            {...refConfig}
          />
        );

        return this.context ? (
          body
        ) : (
          <ThemeContext.Provider value={theme}>{body}</ThemeContext.Provider>
        );
      }
    },
    ComposedComponent
  );

  if (Array.isArray(methods)) {
    methods.forEach(method => {
      if (ComposedComponent.prototype[method]) {
        (result as any).prototype[method] = function () {
          const fn = this.ref?.[method];
          return fn ? fn.apply(this.ref, arguments) : undefined;
        };
      }
    });
  }

  return result as typeof result & {
    ComposedComponent: T;
  };
}
