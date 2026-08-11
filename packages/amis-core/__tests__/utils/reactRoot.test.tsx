import React from 'react';
import {renderReactNode, unmountReactNode} from '../../src/utils/reactRoot';

describe('reactRoot', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    unmountReactNode(container);
    container.remove();
  });

  it('renders and unmounts a node through a managed root', () => {
    renderReactNode(<span>first</span>, container);

    expect(container.textContent).toBe('first');

    renderReactNode(<span>second</span>, container);
    expect(container.textContent).toBe('second');

    unmountReactNode(container);
    expect(container.textContent).toBe('');
  });

  it('runs the callback after rendering', () => {
    const callback = jest.fn();

    renderReactNode(<span>done</span>, container, callback);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(container.textContent).toBe('done');
  });
});
