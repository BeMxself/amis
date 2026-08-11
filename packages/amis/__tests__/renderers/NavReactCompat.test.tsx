import ReactDOM from 'react-dom';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import '../../src';
import {clearStoresCache, render as amisRender} from '../../src';
import {makeEnv as makeEnvRaw} from '../helper';
import type {RenderOptions} from '../../src';

afterEach(() => {
  cleanup();
  clearStoresCache();
});

const makeEnv = (env?: Partial<RenderOptions>) =>
  makeEnvRaw({updateLocation: () => {}, ...env});

test('Renderer:Nav opens popup submenus without findDOMNode', async () => {
  const findDOMNodeSpy = (ReactDOM as any).findDOMNode
    ? jest.spyOn(ReactDOM as any, 'findDOMNode')
    : null;

  render(
    amisRender(
      {
        type: 'nav',
        stacked: false,
        links: [
          {
            __id: 1,
            label: 'Products',
            children: [
              {
                __id: 2,
                label: 'Builder',
                to: '/builder'
              }
            ]
          }
        ]
      },
      {},
      makeEnv({getModalContainer: () => document.body})
    )
  );

  fireEvent.mouseEnter(screen.getByText('Products'));

  await waitFor(() => {
    expect(screen.getByText('Builder')).toBeInTheDocument();
  });

  if (findDOMNodeSpy) {
    expect(findDOMNodeSpy).not.toHaveBeenCalled();
    findDOMNodeSpy.mockRestore();
  }
});
