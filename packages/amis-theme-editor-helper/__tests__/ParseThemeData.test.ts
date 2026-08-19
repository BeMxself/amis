import {ParseThemeData} from '../src/helper/ParseThemeData';

describe('ParseThemeData', () => {
  it('generates custom button CSS with stable theme scoped selectors', () => {
    const parser = new ParseThemeData(
      {
        config: {
          key: 'custom',
          name: 'custom',
          description: ''
        }
      } as any,
      [':root']
    );

    parser.parseButton({
      type: [
        {
          type: 'accent',
          custom: true,
          default: {token: '--button-accent-default-', body: {}},
          hover: {token: '--button-accent-hover-', body: {}},
          active: {token: '--button-accent-active-', body: {}},
          disabled: {token: '--button-accent-disabled-', body: {}}
        }
      ],
      size: [
        {
          type: 'compact',
          custom: true,
          token: '--button-size-compact-',
          body: {}
        }
      ]
    });

    const generated = parser.getGeneratedCss();

    expect(generated.selectorCss).toContain(
      '[data-prismui-theme="custom"] .prismui-Button--accent'
    );
    expect(generated.selectorCss).toContain(
      '[data-prismui-theme="custom"] .prismui-Button--size-compact'
    );
    expect(generated.migrationWarnings).toEqual([]);
  });

  it('uses the configured component prefix for generated selectors', () => {
    const parser = new ParseThemeData(
      {
        config: {
          key: 'custom',
          name: 'custom',
          description: ''
        }
      } as any,
      [':root'],
      {
        componentClassPrefix: 'brand-'
      }
    );

    parser.parseButton({
      type: [
        {
          type: 'accent',
          custom: true,
          default: {token: '--button-accent-default-', body: {}},
          hover: {token: '--button-accent-hover-', body: {}},
          active: {token: '--button-accent-active-', body: {}},
          disabled: {token: '--button-accent-disabled-', body: {}}
        }
      ],
      size: []
    });

    const generated = parser.getGeneratedCss();

    expect(generated.selectorCss).toContain(
      '[data-prismui-theme="custom"] .brand-Button--accent'
    );
    expect(generated.selectorCss).not.toContain('.prismui-Button--accent');
  });
});
