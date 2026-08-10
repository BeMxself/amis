import React from 'react';
import {cleanup, render, waitFor} from '@testing-library/react';
import {theme} from 'amis-core';
import Spinner from '../src/components/Spinner';

describe('Spinner ThemeScope portal', () => {
  beforeEach(() => {
    theme('dark', {
      componentClassPrefix: 'amis-',
      legacyDomClassAlias: false
    });
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  it('applies the current theme scope to loading root portal children', async () => {
    const loadingRoot = document.createElement('div');
    loadingRoot.id = 'loading-root';
    document.body.appendChild(loadingRoot);

    render(
      <Spinner show theme="dark" loadingConfig={{root: '#loading-root'}} />
    );

    await waitFor(() => {
      expect(
        loadingRoot.querySelector('[data-testid="spinner"]')
      ).toHaveAttribute('data-amis-theme', 'dark');
    });

    expect(loadingRoot).not.toHaveAttribute('data-amis-theme');
    expect(loadingRoot.querySelector('.amis-Spinner-overlay')).toHaveAttribute(
      'data-amis-theme',
      'dark'
    );
  });

  it('preserves an existing loading root theme scope', async () => {
    const loadingRoot = document.createElement('div');
    loadingRoot.id = 'dark-loading-root';
    loadingRoot.setAttribute('data-amis-theme', 'dark');
    document.body.appendChild(loadingRoot);

    render(
      <Spinner show theme="cxd" loadingConfig={{root: '#dark-loading-root'}} />
    );

    await waitFor(() => {
      expect(
        loadingRoot.querySelector('[data-testid="spinner"]')
      ).toHaveAttribute('data-amis-theme', 'dark');
    });

    expect(loadingRoot).toHaveAttribute('data-amis-theme', 'dark');
  });
});
