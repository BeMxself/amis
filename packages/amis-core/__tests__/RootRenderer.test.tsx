import React from 'react';
import {cleanup, render, waitFor} from '@testing-library/react';
import {RootRenderer} from '../src/RootRenderer';
import {getTheme, theme} from '../src/theme';

function createRootStore() {
  const rendererStore = {
    ready: true,
    runtimeError: null,
    loading: false,
    error: null,
    dialogSchema: {},
    dialogData: {},
    dialogOpen: false,
    drawerSchema: {},
    drawerData: {},
    drawerOpen: false,
    downStream: {},
    context: {},
    updateContext: jest.fn(),
    initData: jest.fn(),
    updateLocation: jest.fn(),
    updateParams: jest.fn(),
    init: jest.fn(),
    setGlobalVars: jest.fn(),
    setCurrentAction: jest.fn(),
    openDialog: jest.fn(),
    openDrawer: jest.fn(),
    clearMessage: jest.fn()
  };

  return {
    addStore: jest.fn(() => rendererStore),
    removeStore: jest.fn()
  } as any;
}

afterEach(() => {
  cleanup();
  theme('cxd', {
    componentClassPrefix: 'prismui-'
  });
  theme('dark', {
    componentClassPrefix: 'prismui-'
  });
});

test('RootRenderer scopes its host root without adding a layout wrapper', async () => {
  const rootStore = createRootStore();
  const {container, rerender} = render(
    <RootRenderer
      schema={{type: 'page'} as any}
      rootStore={rootStore as any}
      statusStore={{} as any}
      env={{theme: getTheme('cxd')} as any}
      theme="cxd"
      render={path => (!path ? <div className="prismui-Page">content</div> : null)}
    />
  );

  await waitFor(() => {
    expect(container.firstElementChild).toHaveClass('prismui-Page');
  });

  expect(container.children).toHaveLength(1);
  expect(container.firstElementChild).toHaveAttribute('data-prismui-theme', 'cxd');

  theme('dark', {
    componentClassPrefix: 'prismui-'
  });
  rerender(
    <RootRenderer
      schema={{type: 'page'} as any}
      rootStore={rootStore as any}
      statusStore={{} as any}
      env={{theme: getTheme('dark')} as any}
      theme="dark"
      render={path => (!path ? <div className="prismui-Page">content</div> : null)}
    />
  );

  await waitFor(() => {
    expect(container.firstElementChild).toHaveAttribute(
      'data-prismui-theme',
      'dark'
    );
  });
});
