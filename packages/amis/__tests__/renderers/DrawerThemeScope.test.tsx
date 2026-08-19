import {cleanup, fireEvent, render, waitFor} from '@testing-library/react';
import '../../src';
import {clearStoresCache, render as amisRender} from '../../src';
import {makeEnv as makeEnvRaw, wait} from '../helper';
import type {RenderOptions} from '../../src';

afterEach(() => {
  cleanup();
  clearStoresCache();
  document.body.innerHTML = '';
});

const makeEnv = (env?: Partial<RenderOptions>) =>
  makeEnvRaw({updateLocation: () => {}, ...env});

test('Renderer:drawer applies theme scope to portal dialog', async () => {
  const {getByText} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'button',
          label: 'Open scoped drawer',
          actionType: 'drawer',
          drawer: {
            title: 'Scoped drawer',
            body: 'drawer body'
          }
        }
      },
      {},
      makeEnv({})
    )
  );

  fireEvent.click(getByText('Open scoped drawer'));

  await waitFor(() => {
    expect(document.body.querySelector('[role="dialog"]')).toHaveAttribute(
      'data-prismui-theme',
      'cxd'
    );
  });
});

test('Renderer:drawer preserves custom container theme scope', async () => {
  const drawerContainer = document.createElement('div');
  drawerContainer.setAttribute('data-prismui-theme', 'dark');
  document.body.appendChild(drawerContainer);

  const {getByText} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'button',
          label: 'Open custom scoped drawer',
          actionType: 'drawer',
          drawer: {
            title: 'Custom scoped drawer',
            body: 'drawer body'
          }
        }
      },
      {},
      makeEnv({
        getModalContainer: () => drawerContainer
      })
    )
  );

  fireEvent.click(getByText('Open custom scoped drawer'));

  await waitFor(() => {
    expect(drawerContainer.querySelector('[role="dialog"]')).toHaveAttribute(
      'data-prismui-theme',
      'dark'
    );
  });
});


test('Renderer:drawer does not fallback to body when custom container is unavailable', async () => {
  const {getByText} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'button',
          label: 'Open unavailable container drawer',
          actionType: 'drawer',
          drawer: {
            title: 'Unavailable drawer',
            body: 'drawer body'
          }
        }
      },
      {},
      makeEnv({
        getModalContainer: () => null
      })
    )
  );

  fireEvent.click(getByText('Open unavailable container drawer'));
  await wait(100);

  expect(document.body.querySelector('[role="dialog"]')).toBeNull();
});
