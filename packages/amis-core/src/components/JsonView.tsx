import React from 'react';

export interface JsonViewInteractionProps {
  updated_src: any;
}

export interface JsonViewProps {
  src: any;
  name?: string | false | null;
  theme?: string | React.CSSProperties;
  collapsed?: boolean | number;
  enableClipboard?: boolean;
  displayDataTypes?: boolean;
  displayObjectSize?: boolean;
  collapseStringsAfterLength?: number | false;
  iconStyle?: 'square' | 'circle' | 'triangle';
  quotesOnKeys?: boolean;
  sortKeys?: boolean | ((a: string, b: string) => number);
  onEdit?: false | ((event: JsonViewInteractionProps) => boolean | void);
  onDelete?: false | ((event: JsonViewInteractionProps) => boolean | void);
  onAdd?: false | ((event: JsonViewInteractionProps) => boolean | void);
  className?: string;
  style?: React.CSSProperties;
}

interface JsonViewThemes {
  lightTheme: React.CSSProperties;
  darkTheme: React.CSSProperties;
  monokaiTheme: React.CSSProperties;
  vscodeTheme: React.CSSProperties;
}

interface JsonViewModules extends JsonViewThemes {
  BaseJsonView: React.ComponentType<any>;
  JsonViewEditor: React.ComponentType<any>;
}

const legacyEightiesTheme = createLegacyBase16Theme({
  base00: '#2d2d2d',
  base01: '#393939',
  base02: '#515151',
  base04: '#a09f93',
  base07: '#f2f0ec',
  base08: '#f2777a',
  base09: '#f99157',
  base0A: '#ffcc66',
  base0B: '#99cc99',
  base0C: '#66cccc',
  base0D: '#6699cc',
  base0E: '#cc99cc',
  base0F: '#d27b53'
});

const legacyTwilightTheme = createLegacyBase16Theme({
  base00: '#1e1e1e',
  base01: '#323537',
  base02: '#464b50',
  base04: '#838184',
  base07: '#ffffff',
  base08: '#cf6a4c',
  base09: '#cda869',
  base0A: '#f9ee98',
  base0B: '#8f9d6a',
  base0C: '#afc4db',
  base0D: '#7587a6',
  base0E: '#9b859d',
  base0F: '#9b703f'
});

function createLegacyBase16Theme(theme: Record<string, string>) {
  return {
    '--w-rjv-font-family': 'monospace',
    '--w-rjv-color': theme.base07,
    '--w-rjv-background-color': theme.base00,
    '--w-rjv-line-color': theme.base02,
    '--w-rjv-arrow-color': theme.base0E,
    '--w-rjv-expanded-icon-color': theme.base0D,
    '--w-rjv-collapsed-icon-color': theme.base0E,
    '--w-rjv-edit-color': theme.base0D,
    '--w-rjv-info-color': theme.base04,
    '--w-rjv-update-color': theme.base01,
    '--w-rjv-copied-color': theme.base0D,
    '--w-rjv-copied-success-color': theme.base0B,
    '--w-rjv-curlybraces-color': theme.base07,
    '--w-rjv-colon-color': theme.base07,
    '--w-rjv-brackets-color': theme.base07,
    '--w-rjv-type-string-color': theme.base0B,
    '--w-rjv-type-int-color': theme.base09,
    '--w-rjv-type-float-color': theme.base09,
    '--w-rjv-type-bigint-color': theme.base09,
    '--w-rjv-type-boolean-color': theme.base09,
    '--w-rjv-type-date-color': theme.base0D,
    '--w-rjv-type-url-color': theme.base0C,
    '--w-rjv-type-null-color': theme.base08,
    '--w-rjv-type-nan-color': theme.base0A,
    '--w-rjv-type-undefined-color': theme.base0F
  } as React.CSSProperties;
}

type JsonViewEditOption = {
  value: unknown;
  oldValue: unknown;
  keyName?: string | number;
  parentName?: string | number;
  namespace?: Array<string | number>;
  type?: 'value' | 'key';
};

type JsonViewDeleteOption = {
  namespace?: Array<string | number>;
};

type LegacyJsonArrowProps = React.SVGProps<SVGSVGElement> & {
  'data-expand'?: boolean;
  'iconStyle'?: Exclude<JsonViewProps['iconStyle'], 'triangle'>;
};

function LegacyJsonArrow({
  iconStyle = 'square',
  'data-expand': expand,
  style,
  ...props
}: LegacyJsonArrowProps) {
  const shapeProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8
  };

  return (
    <svg
      {...props}
      data-expand={expand}
      data-icon-style={iconStyle}
      style={{cursor: 'pointer', height: '1em', width: '1em', ...style}}
      viewBox="0 0 24 24"
      fill="none"
    >
      {iconStyle === 'circle' ? (
        <circle cx="12" cy="12" r="8" {...shapeProps} />
      ) : (
        <rect x="5" y="5" width="14" height="14" rx="1.5" {...shapeProps} />
      )}
      <path d="M8 12h8" {...shapeProps} />
      {!expand ? <path d="M12 8v8" {...shapeProps} /> : null}
    </svg>
  );
}

function LegacyCountInfo({count}: {count: number}) {
  return (
    <span
      className="w-rjv-object-size"
      style={{
        paddingLeft: 4,
        fontStyle: 'italic',
        color: 'var(--w-rjv-info-color, #0000004d)'
      }}
    >
      {count} {count === 1 ? 'item' : 'items'}
    </span>
  );
}

function LegacyEllipsis({
  count,
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {count: number}) {
  if (count === 0) {
    return null;
  }

  return (
    <span
      {...props}
      className={className}
      style={{cursor: 'pointer', ...style}}
    >
      ...
    </span>
  );
}

function createLegacyComponents(iconStyle: JsonViewProps['iconStyle']) {
  return {
    countInfo: LegacyCountInfo,
    ellipsis: LegacyEllipsis,
    ...(iconStyle && iconStyle !== 'triangle'
      ? {arrow: <LegacyJsonArrow iconStyle={iconStyle} />}
      : null)
  };
}

function cloneRoot(value: any) {
  if (Array.isArray(value)) {
    return value.slice();
  }

  if (value && typeof value === 'object') {
    return {...value};
  }

  return value;
}

function getAtPath(value: any, path: Array<string | number>) {
  return path.reduce((current, key) => current?.[key as any], value);
}

function setAtPath(value: any, path: Array<string | number>, nextValue: any) {
  if (!path.length) {
    return cloneRoot(nextValue);
  }

  const next = cloneRoot(value);
  let current = next;
  let source = value;

  for (let index = 0; index < path.length - 1; index++) {
    const key = path[index];
    const child = source?.[key as any];
    current[key as any] = cloneRoot(child);
    current = current[key as any];
    source = child;
  }

  current[path[path.length - 1] as any] = nextValue;
  return next;
}

function deleteAtPath(value: any, path: Array<string | number>) {
  if (!path.length) {
    return undefined;
  }

  const next = cloneRoot(value);
  const parentPath = path.slice(0, -1);
  const key = path[path.length - 1];
  const parent = parentPath.length ? getAtPath(next, parentPath) : next;

  if (Array.isArray(parent)) {
    parent.splice(Number(key), 1);
  } else if (parent && typeof parent === 'object') {
    delete parent[key as any];
  }

  return next;
}

function renameAtPath(
  value: any,
  path: Array<string | number>,
  oldKey: string | number | undefined,
  nextKey: unknown
) {
  if (typeof oldKey !== 'string' || typeof nextKey !== 'string') {
    return value;
  }

  const next = cloneRoot(value);
  const parentPath = path.slice(0, -1);
  const parent = parentPath.length ? getAtPath(next, parentPath) : next;

  if (parent && typeof parent === 'object' && oldKey in parent) {
    parent[nextKey] = parent[oldKey];
    delete parent[oldKey];
  }

  return next;
}

function findPathByReference(
  root: any,
  target: any,
  path: Array<string | number> = []
): Array<string | number> | null {
  if (root === target) {
    return path;
  }

  if (!root || typeof root !== 'object') {
    return null;
  }

  for (const key of Object.keys(root)) {
    const childPath = findPathByReference(root[key], target, path.concat(key));
    if (childPath) {
      return childPath;
    }
  }

  return null;
}

function resolveTheme(
  theme: JsonViewProps['theme'],
  themes: JsonViewThemes
): React.CSSProperties {
  const {lightTheme, darkTheme, monokaiTheme, vscodeTheme} = themes;

  if (!theme) {
    return lightTheme;
  }

  if (typeof theme === 'object') {
    return theme;
  }

  switch (theme) {
    case 'twilight':
      return legacyTwilightTheme;
    case 'eighties':
      return legacyEightiesTheme;
    case 'monokai':
      return monokaiTheme;
    case 'dark':
      return darkTheme;
    case 'vscode':
      return vscodeTheme;
    case 'rjv-default':
    default:
      return lightTheme;
  }
}

function normalizeCollapsed(collapsed: JsonViewProps['collapsed']) {
  return typeof collapsed === 'boolean' ? !collapsed : collapsed;
}

function createJsonViewComponent(modules: JsonViewModules) {
  const {BaseJsonView, JsonViewEditor, ...themes} = modules;

  return function JsonViewImpl({
    src,
    name,
    theme,
    collapsed,
    enableClipboard = true,
    displayDataTypes = true,
    displayObjectSize = true,
    collapseStringsAfterLength,
    iconStyle,
    quotesOnKeys = true,
    sortKeys = false,
    onEdit,
    onDelete,
    onAdd,
    style,
    className
  }: JsonViewProps) {
    const [data, setData] = React.useState(src);
    React.useEffect(() => setData(src), [src]);

    const commitChange = React.useCallback(
      (
        nextValue: any,
        handler?: false | ((event: JsonViewInteractionProps) => boolean | void)
      ) => {
        const event = {updated_src: nextValue};
        const result = handler ? handler(event) : undefined;

        if (result === false) {
          return false;
        }

        setData(nextValue);
        return true;
      },
      []
    );

    const editable = Boolean(onEdit || onDelete || onAdd);
    const quotes: '"' | '' = quotesOnKeys ? '"' : '';
    const components = React.useMemo(
      () => createLegacyComponents(iconStyle),
      [iconStyle]
    );
    const commonProps = {
      value: data,
      keyName: typeof name === 'string' ? name : undefined,
      collapsed: normalizeCollapsed(collapsed),
      enableClipboard: editable ? true : enableClipboard,
      displayDataTypes,
      displayObjectSize,
      shortenTextAfterLength:
        collapseStringsAfterLength === false ? 0 : collapseStringsAfterLength,
      objectSortKeys: sortKeys,
      quotes,
      components,
      className,
      style: {
        ...resolveTheme(theme, themes),
        ...style
      }
    };

    if (editable) {
      return (
        <JsonViewEditor
          {...commonProps}
          editable
          onEdit={(option: JsonViewEditOption) => {
            const path = option.namespace || [];
            const nextValue =
              option.type === 'key'
                ? renameAtPath(data, path, option.keyName, option.value)
                : setAtPath(data, path, option.value);

            return commitChange(nextValue, onEdit);
          }}
          onDelete={(
            keyName: string | number,
            _value: any,
            _parentValue: any,
            option: JsonViewDeleteOption
          ) => {
            const path = option.namespace || [];
            const targetPath =
              path[path.length - 1] === keyName ? path : path.concat(keyName);
            const nextValue = deleteAtPath(data, targetPath);

            return commitChange(nextValue, onDelete);
          }}
          onAdd={(_keyOrValue: string, nextNode: any, currentNode: any) => {
            const path = findPathByReference(data, currentNode) || [];
            const nextValue = setAtPath(data, path, nextNode);

            return commitChange(nextValue, onAdd);
          }}
        />
      );
    }

    return <BaseJsonView {...commonProps} />;
  };
}

const JsonView = React.lazy(async () => {
  const [base, editor, light, dark, monokai, vscode] = await Promise.all([
    import('@uiw/react-json-view'),
    import('@uiw/react-json-view/editor'),
    import('@uiw/react-json-view/light'),
    import('@uiw/react-json-view/dark'),
    import('@uiw/react-json-view/monokai'),
    import('@uiw/react-json-view/vscode')
  ]);

  return {
    default: createJsonViewComponent({
      BaseJsonView: base.default,
      JsonViewEditor: editor.default,
      lightTheme: light.lightTheme,
      darkTheme: dark.darkTheme,
      monokaiTheme: monokai.monokaiTheme,
      vscodeTheme: vscode.vscodeTheme
    })
  };
});

export default JsonView;
