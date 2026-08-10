import React from 'react';
import {cleanup, render, waitFor} from '@testing-library/react';
import '../../src';
import {clearStoresCache, theme} from '../../src';
import {PopUp} from 'amis-ui';

afterEach(() => {
  cleanup();
  clearStoresCache();
  document.body.innerHTML = '';
  theme('cxd', {
    componentClassPrefix: 'amis-',
    legacyDomClassAlias: false
  });
});

test('Renderer:popup applies current theme scope to body portal root', async () => {
  render(<PopUp isShow>popup body</PopUp>);

  await waitFor(() => {
    const popup = document.body.querySelector('.amis-PopUp') as HTMLElement;

    expect(popup).toBeTruthy();
    expect(popup).toHaveAttribute('data-amis-theme', 'cxd');
    expect(popup.parentElement).toBe(document.body);
  });
});

test('Renderer:popup preserves existing custom container theme scope', async () => {
  const container = document.createElement('div');
  container.setAttribute('data-amis-theme', 'dark');
  document.body.appendChild(container);

  render(
    <PopUp isShow container={container}>
      custom scoped popup
    </PopUp>
  );

  await waitFor(() => {
    const popup = container.querySelector('.amis-PopUp') as HTMLElement;

    expect(popup).toBeTruthy();
    expect(popup).toHaveAttribute('data-amis-theme', 'dark');
    expect(container).toHaveAttribute('data-amis-theme', 'dark');
  });
});

test('Renderer:popup does not scope or render portal child before mount', () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  render(
    <PopUp isShow={false} container={container}>
      hidden popup
    </PopUp>
  );

  expect(container).not.toHaveAttribute('data-amis-theme');
  expect(container.querySelector('.amis-PopUp')).toBeNull();
});
