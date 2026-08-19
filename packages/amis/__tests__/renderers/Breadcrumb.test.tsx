import React = require('react');
import {fireEvent, render, screen} from '@testing-library/react';
import '../../src';
import {render as amisRender} from '../../src';
import {makeEnv} from '../helper';

test('Renderer:breadcrumb', () => {
  const {container} = render(
    amisRender(
      {
        type: 'breadcrumb',
        items: [
          {
            label: '首页',
            href: 'https://baidu.gitee.com/',
            icon: 'fa fa-home'
          },
          {
            label: '上级页面'
          },
          {
            label: '<b>当前页面</b>'
          }
        ]
      },
      {},
      makeEnv({})
    )
  );

  expect(container).toMatchSnapshot();
});

test('Renderer:breadcrumb var', () => {
  const {container} = render(
    amisRender(
      {
        type: 'page',
        data: {
          breadcrumb: [
            {
              label: '首页',
              href: 'https://baidu.gitee.com/'
            },
            {
              label: '上级页面'
            },
            {
              label: '<b>当前页面</b>'
            }
          ]
        },
        body: {
          type: 'breadcrumb',
          source: '${breadcrumb}'
        }
      },
      {},
      makeEnv({})
    )
  );

  expect(container).toMatchSnapshot();
});

test('Renderer:breadcrumb separator', () => {
  const {container} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'breadcrumb',
          separator: '>',
          separatorClassName: 'text-black',
          items: [
            {
              label: '首页',
              href: 'https://baidu.gitee.com/',
              icon: 'fa fa-home'
            },
            {
              label: '上级页面'
            },
            {
              label: '<b>当前页面</b>'
            }
          ]
        }
      },
      {},
      makeEnv({})
    )
  );

  expect(container).toMatchSnapshot();
});

test('Renderer:breadcrumb dropdown', () => {
  const {container} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'breadcrumb',
          items: [
            {
              label: '首页',
              href: 'https://baidu.gitee.com/',
              icon: 'fa fa-home'
            },
            {
              label: '上级页面',
              dropdown: [
                {
                  label: '选项一',
                  href: 'https://baidu.gitee.com/'
                },
                {
                  label: '选项二'
                }
              ]
            },
            {
              label: '<b>当前页面</b>'
            }
          ]
        }
      },
      {},
      makeEnv({})
    )
  );

  expect(container).toMatchSnapshot();
});

test('Renderer:breadcrumb tooltip labelMaxLength', () => {
  const schema = {
    type: 'page',
    body: {
      type: 'breadcrumb',
      separator: '>',
      separatorClassName: 'text-black',
      labelMaxLength: 16,
      tooltipPosition: 'bottom',
      items: [
        {
          href: 'https://baidu.gitee.com/',
          icon: 'fa fa-home'
        },
        {
          label: '上级页面上级页面上级页面上级页面上级页面'
        },
        {
          label: '当前页面'
        }
      ]
    }
  };
  const {container, rerender} = render(amisRender(schema, {}, makeEnv({})));
  expect(container).toMatchSnapshot();

  schema.body.tooltipPosition = 'top';
  rerender(amisRender(schema, {}, makeEnv({})));
  expect(container).toMatchSnapshot();

  schema.body.tooltipPosition = 'left';
  rerender(amisRender(schema, {}, makeEnv({})));
  expect(container).toMatchSnapshot();

  schema.body.tooltipPosition = 'right';
  rerender(amisRender(schema, {}, makeEnv({})));
  expect(container).toMatchSnapshot();
});

test('Renderer:breadcrumb className', () => {
  const {container} = render(
    amisRender(
      {
        type: 'breadcrumb',
        dropdownClassName: 'dropdownClassName',
        dropdownItemClassName: 'dropdownItemClassName',
        itemClassName: 'itemClassName',
        className: 'className',
        items: [
          {
            label: '首页',
            href: 'https://baidu.gitee.com/',
            icon: 'fa fa-home'
          },
          {
            label: '上级页面',
            dropdown: [
              {
                label: '选项一',
                href: 'https://baidu.gitee.com/'
              },
              {
                label: '选项二'
              }
            ]
          },
          {
            label: '<b>当前页面</b>'
          }
        ]
      },
      {},
      makeEnv({})
    )
  );
  fireEvent.click(container.querySelector('.prismui-Breadcrumb-item-caret')!);
  expect(!container.querySelector('.dropdownClassName')).toBeFalsy();
  expect(!container.querySelector('.dropdownItemClassName')).toBeFalsy();
  expect(container).toMatchSnapshot();
});
