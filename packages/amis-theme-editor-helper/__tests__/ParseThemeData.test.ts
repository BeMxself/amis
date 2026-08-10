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

    expect(generated.selectorCss).not.toContain('.cxd-');
    expect(generated.selectorCss).toContain(
      '[data-amis-theme="custom"] .amis-Button--accent'
    );
    expect(generated.selectorCss).toContain(
      '[data-amis-theme="custom"] .amis-Button--size-compact'
    );
    expect(generated.migrationWarnings).toContain(
      'migrated legacy selector .cxd-Button--accent to .amis-Button--accent'
    );
    expect(generated.migrationWarnings).toContain(
      'migrated legacy selector .cxd-Button--size-compact to .amis-Button--size-compact'
    );
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
      '[data-amis-theme="custom"] .brand-Button--accent'
    );
    expect(generated.selectorCss).not.toContain('.amis-Button--accent');
  });
});
