import {
  getCssVarById,
  JSONPipeIn,
  migrateLegacyThemeSelector,
  THEME_CSS_MIGRATION_WARNINGS_KEY
} from '../src/util';

describe('theme CSS schema migration', () => {
  it('moves legacy style into themeCss and warns when dropping cxd selector keys', () => {
    const migrated = JSONPipeIn({
      'type': 'page',
      'style': {
        background: '#fff',
        color: '#333'
      },
      '.cxd-Page-title': {
        color: 'red'
      }
    });

    expect(migrated.style.background).toBeUndefined();
    expect(migrated.style.color).toBeUndefined();
    expect(migrated.themeCss.baseControlClassName).toMatchObject({
      'background:default': '#fff',
      'font:default': {
        color: '#333'
      }
    });
    expect(migrated['.cxd-Page-title']).toBeUndefined();
    expect(migrated[THEME_CSS_MIGRATION_WARNINGS_KEY]).toContain(
      'removed legacy selector .cxd-Page-title; stable candidate .prismui-Page-title'
    );
  });

  it('uses the configured component prefix for legacy selector candidates', () => {
    expect(
      migrateLegacyThemeSelector('.cxd-Page-title .cxd-Button', {
        componentClassPrefix: 'brand-'
      })
    ).toBe('.brand-Page-title .brand-Button');
  });

  it('keeps migrating historical amis selectors', () => {
    const migrated = JSONPipeIn({
      'type': 'page',
      '.amis-Page-title': {
        color: 'red'
      }
    });

    expect(migrated['.amis-Page-title']).toBeUndefined();
    expect(migrated[THEME_CSS_MIGRATION_WARNINGS_KEY]).toContain(
      'removed legacy selector .amis-Page-title; stable candidate .prismui-Page-title'
    );
  });

  it('warns before dropping non-legacy selector keys', () => {
    const migrated = JSONPipeIn({
      'type': 'page',
      '.custom-Page-title': {
        color: 'red'
      }
    });

    expect(migrated[THEME_CSS_MIGRATION_WARNINGS_KEY]).toContain(
      'removed selector key .custom-Page-title; move styles into themeCss before saving'
    );
  });

  it('reads only CSS custom properties from theme scoped rules', () => {
    const style = document.createElement('style');
    style.id = 'themeCss';
    style.appendChild(
      document.createTextNode(`
        [data-prismui-theme="custom"] {
          --prismui-color-brand: #2468f2;
        }

        [data-prismui-theme="custom"] .prismui-Button--accent {
          color: var(--button-accent-default-font-color);
          background: red;
        }
      `)
    );
    document.head.appendChild(style);

    expect(getCssVarById('themeCss', '[data-prismui-theme')).toEqual({
      '--prismui-color-brand': '#2468f2'
    });

    document.head.removeChild(style);
  });
});
