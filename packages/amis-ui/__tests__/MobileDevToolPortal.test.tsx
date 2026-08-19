import React from 'react';
import {cleanup, render} from '@testing-library/react';
import MobileDevTool from '../src/components/MobileDevTool';

class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

describe('MobileDevTool portal exception', () => {
  const originalResizeObserver = global.ResizeObserver;

  beforeEach(() => {
    global.ResizeObserver = MockResizeObserver as any;
    localStorage.setItem(
      'amis-mobile-dev-tool-dimension',
      JSON.stringify({name: 'custom', width: 375, height: 667})
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.body.innerHTML = '';
    global.ResizeObserver = originalResizeObserver;
  });

  it('renders only editor-owned handles into preview body', () => {
    const container = document.createElement('div');
    const previewBody = document.createElement('div');
    previewBody.setAttribute('data-prismui-theme', 'dark');
    document.body.appendChild(container);
    document.body.appendChild(previewBody);

    render(<MobileDevTool container={container} previewBody={previewBody} />);

    const rightHandle = previewBody.querySelector(
      '.ae-MobileDevTool-rightHandle'
    );
    const bottomHandle = previewBody.querySelector(
      '.ae-MobileDevTool-bottomHandle'
    );

    expect(rightHandle).toBeInTheDocument();
    expect(bottomHandle).toBeInTheDocument();
    expect(rightHandle).not.toHaveAttribute('data-prismui-theme');
    expect(bottomHandle).not.toHaveAttribute('data-prismui-theme');
    expect(previewBody.querySelector('[class^="prismui-"]')).toBeNull();
  });
});
