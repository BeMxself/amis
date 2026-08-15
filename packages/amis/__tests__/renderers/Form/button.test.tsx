import React = require('react');
import {render, cleanup, fireEvent} from '@testing-library/react';
import '../../../src';
import {render as amisRender, theme} from '../../../src';
import {wait, makeEnv} from '../../helper';
import {clearStoresCache} from '../../../src';

afterEach(() => {
  theme('cxd', {
    componentClassPrefix: 'amis-',
    legacyDomClassAlias: false
  });
  cleanup();
  clearStoresCache();
});

test('Renderer:button', async () => {
  let container: HTMLElement;
  const renderResult: any = render(
    amisRender(
      {
        type: 'form',
        title: 'The form',
        controls: [
          {
            type: 'button',
            name: 'test',
            label: 'Text',
            icon: 'fa fa-plus'
          },
          {
            type: 'button',
            label: 'OpenDialog',
            actionType: 'dialog',
            dialog: {
              confirmMode: false,
              title: '提示',
              body: '对，你刚点击了！'
            }
          },
          {
            type: 'submit',
            level: 'primary',
            label: 'Submit'
          },
          {
            type: 'reset',
            label: 'Reset',
            level: 'danger',
            size: 'sm',
            className: 'r-2x'
          }
        ],
        submitText: null,
        actions: []
      },
      {},
      makeEnv({
        getModalContainer: () => container
      })
    )
  );
  const getByText = renderResult.getByText;
  container = renderResult.container;
  const textButton = getByText('Text').closest('button')!;
  const submitButton = getByText('Submit').closest('button')!;
  const resetButton = getByText('Reset').closest('button')!;

  expect(textButton).toHaveClass(componentClass('Button'));
  expect(textButton).toHaveClass(componentClass('Button--default'));
  expect(textButton).toHaveClass(componentClass('Button--size-default'));
  expect(textButton).not.toHaveClass('cxd-Button');
  expect(submitButton).toHaveClass(componentClass('Button--primary'));
  expect(resetButton).toHaveClass(componentClass('Button--size-sm'));
  expect(container).toMatchSnapshot();
  fireEvent.click(getByText(/OpenDialog/));
  await wait(300);
  expect(container).toMatchSnapshot();
});

test('Renderer:button legacy DOM alias', () => {
  theme('cxd', {
    legacyDomClassAlias: 'cxd'
  });

  const {getByText} = render(
    amisRender({
      type: 'button',
      label: 'Alias Button',
      level: 'primary'
    })
  );
  const aliasButton = getByText('Alias Button').closest('button')!;

  expect(aliasButton).toHaveClass(componentClass('Button'));
  expect(aliasButton).toHaveClass('cxd-Button');
  expect(aliasButton).toHaveClass(componentClass('Button--primary'));
  expect(aliasButton).toHaveClass('cxd-Button--primary');
});
