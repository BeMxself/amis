import React from 'react';
import {cleanup, render, waitFor} from '@testing-library/react';
import Overlay from '../../src/components/Overlay';
import {EnvContext} from '../../src/env';
import {getTheme, theme, ThemeContext} from '../../src/theme';

function renderOverlay({
  container,
  themeName = 'cxd',
  label = 'scoped tooltip',
  show = true,
  targetScope
}: {
  container?: HTMLElement | (() => HTMLElement);
  themeName?: string;
  label?: string;
  show?: boolean;
  targetScope?: string;
} = {}) {
  const target = document.createElement('button');
  if (targetScope) {
    const root = document.createElement('div');
    root.setAttribute('data-amis-theme', targetScope);
    root.appendChild(target);
    document.body.appendChild(root);
  } else {
    document.body.appendChild(target);
  }

  render(
    <EnvContext.Provider
      value={
        {
          getModalContainer: () => document.body,
          theme: getTheme(themeName)
        } as any
      }
    >
      <ThemeContext.Provider value={themeName}>
        <Overlay show={show} target={() => target} container={container}>
          <div role="tooltip">{label}</div>
        </Overlay>
      </ThemeContext.Provider>
    </EnvContext.Provider>
  );

  return target;
}

function expectTooltipInScope(
  root: ParentNode,
  themeName: string,
  label = 'scoped tooltip'
) {
  const tooltip = Array.from(root.querySelectorAll('[role="tooltip"]')).find(
    node => node.textContent === label
  ) as HTMLElement | undefined;

  expect(tooltip).toBeTruthy();
  expect(tooltip!.closest(`[data-amis-theme="${themeName}"]`)).toBeTruthy();
  expect(
    root.querySelector(
      `[role="tooltip"][data-amis-theme="${themeName}"], ` +
        `[data-amis-theme="${themeName}"] [role="tooltip"]`
    )
  ).toBeTruthy();
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  theme('dark', {
    componentClassPrefix: 'amis-',
    legacyDomClassAlias: false
  });
});

test('Overlay applies triggering theme scope to body portal child', async () => {
  renderOverlay();

  await waitFor(() => {
    expectTooltipInScope(document.body, 'cxd');
  });
});

test('Overlay applies scope without inserting a layout wrapper', async () => {
  renderOverlay();

  await waitFor(() => {
    const tooltip = document.body.querySelector(
      '[role="tooltip"]'
    ) as HTMLElement;

    expect(tooltip).toBeTruthy();
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip).toHaveAttribute('data-amis-theme', 'cxd');
  });
});

test('Overlay does not scope or render portal child before mount', () => {
  const customContainer = document.createElement('div');
  document.body.appendChild(customContainer);

  renderOverlay({container: customContainer, show: false});

  expect(customContainer).not.toHaveAttribute('data-amis-theme');
  expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
});

test('Overlay applies triggering theme scope to custom container child', async () => {
  const customContainer = document.createElement('div');
  document.body.appendChild(customContainer);

  renderOverlay({container: customContainer});

  await waitFor(() => {
    expectTooltipInScope(customContainer, 'cxd');
  });
});

test('Overlay preserves existing custom container theme scope', async () => {
  const customContainer = document.createElement('div');
  customContainer.setAttribute('data-amis-theme', 'dark');
  document.body.appendChild(customContainer);

  renderOverlay({container: customContainer});

  await waitFor(() => {
    expectTooltipInScope(customContainer, 'dark');
  });
});

test('Overlay prefers target DOM scope over mutable env theme', async () => {
  theme('dark', {
    componentClassPrefix: 'amis-',
    legacyDomClassAlias: false
  });

  renderOverlay({
    label: 'target scoped tooltip',
    themeName: 'dark',
    targetScope: 'cxd'
  });

  await waitFor(() => {
    expectTooltipInScope(document.body, 'cxd', 'target scoped tooltip');
  });
});

test('Overlay scopes body portal children per triggering root', async () => {
  theme('dark', {
    componentClassPrefix: 'amis-',
    legacyDomClassAlias: false
  });

  renderOverlay({label: 'cxd scoped tooltip', themeName: 'cxd'});
  renderOverlay({label: 'dark scoped tooltip', themeName: 'dark'});

  await waitFor(() => {
    expect(document.body.querySelectorAll('[role="tooltip"]')).toHaveLength(2);
  });

  expectTooltipInScope(document.body, 'cxd', 'cxd scoped tooltip');
  expectTooltipInScope(document.body, 'dark', 'dark scoped tooltip');
});

test('Overlay applies scope inside iframe container document', async () => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const previewBody = iframe.contentDocument!.body;

  renderOverlay({
    container: () => previewBody,
    label: 'iframe scoped tooltip'
  });

  await waitFor(() => {
    expectTooltipInScope(previewBody, 'cxd', 'iframe scoped tooltip');
  });
  expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
});
