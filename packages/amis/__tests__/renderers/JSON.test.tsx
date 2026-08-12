import React = require('react');
import {render, waitFor} from '@testing-library/react';
import {JsonView} from 'amis-core';
import '../../src';
import {render as amisRender} from '../../src';
import {makeEnv} from '../helper';

test('Renderer:json', async () => {
  const {container} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'json',
          value: {
            a: 'a',
            b: 'b',
            c: {
              d: 'd'
            }
          }
        }
      },
      {},
      makeEnv({})
    )
  );

  await waitFor(() => {
    expect(container.querySelector('[class*="JsonField"]')).toBeTruthy();
    expect(container.textContent).toContain('"a"');
  });

  expect(container.textContent).toContain('"b"');
  expect(container.textContent).toContain('"c"');
  expect(container.textContent).not.toContain('"d"');
});

test('JsonView keeps legacy collapsed boolean semantics', async () => {
  const {container} = render(
    <React.Suspense fallback={<div>...</div>}>
      <JsonView name={false} src={{a: 'a'}} collapsed={true} />
    </React.Suspense>
  );

  await waitFor(() => {
    expect(container.querySelector('.w-rjv')).toBeTruthy();
  });

  expect(container.textContent).not.toContain('"a"');
});
