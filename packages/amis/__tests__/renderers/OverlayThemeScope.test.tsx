import React from 'react';
import {cleanup, fireEvent, render, waitFor} from '@testing-library/react';
import '../../src';
import {clearStoresCache, render as amisRender, theme} from '../../src';
import {makeEnv as makeEnvRaw} from '../helper';
import type {RenderOptions} from '../../src';

afterEach(() => {
  cleanup();
  clearStoresCache();
  document.body.innerHTML = '';
});

const makeEnv = (env?: Partial<RenderOptions>) =>
  makeEnvRaw({updateLocation: () => {}, ...env});

const scopedPopoverSelector = (themeName: string, popoverClass: string) =>
  `[data-prismui-theme="${themeName}"].${popoverClass}, ` +
  `[data-prismui-theme="${themeName}"] .${popoverClass}`;

const dropdownSchema = (label: string) => ({
  type: 'page',
  body: {
    type: 'dropdown-button',
    label,
    popOverContainerSelector: 'body',
    buttons: [
      {
        type: 'button',
        label: `${label} action`
      }
    ]
  }
});

test('Renderer:overlay body portal uses triggering root theme scope with shared env', async () => {
  theme('dark', {
    classPrefix: 'prismui-',
    componentClassPrefix: 'prismui-'
  });

  const sharedEnv = makeEnv({session: 'overlay-theme-shared'});
  const cxdRoot = render(
    amisRender(dropdownSchema('Open cxd menu'), {theme: 'cxd'}, sharedEnv)
  );

  render(
    amisRender(dropdownSchema('Open dark menu'), {theme: 'dark'}, sharedEnv)
  );

  fireEvent.click(cxdRoot.getByText('Open cxd menu'));

  await waitFor(() => {
    expect(
      document.body.querySelector(
        scopedPopoverSelector('cxd', componentClass('DropDown-popover'))
      )
    ).toBeInTheDocument();
  });

  expect(
    document.body.querySelector(
      scopedPopoverSelector('dark', componentClass('DropDown-popover'))
    )
  ).not.toBeInTheDocument();
});
