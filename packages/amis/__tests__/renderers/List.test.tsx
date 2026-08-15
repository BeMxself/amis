/**
 * 组件名称：List 列表
 * 单测内容：
 * 1. 基础使用
 * 2. title & header & footer & headerClassName & footerClassName
 * 3. 行点击 itemAction
 * 4. listItem -> title & titleClassName & subTitle & desc
 * 5. listItem -> avatar & avatarClassName
 * 6. listItem -> actions & actionsPosition
 */

import 'react';
import {fireEvent, render} from '@testing-library/react';
import '../../src';
import {render as amisRender} from '../../src';
import {makeEnv} from '../helper';
import rows from '../mockData/rows';

const miniRows = rows.slice(0, 3);

test('Renderer:list', () => {
  const {container} = render(
    amisRender({
      type: 'page',
      body: {
        type: 'service',
        data: {
          rows
        },
        body: [
          {
            type: 'panel',
            title: '简单 List 示例',
            body: {
              type: 'list',
              source: '$rows',
              itemAction: {
                type: 'button',
                actionType: 'dialog',
                dialog: {
                  title: '详情',
                  body: '当前行的数据 browser: ${browser}, version: ${version}'
                }
              },
              listItem: {
                body: [
                  {
                    type: 'hbox',
                    columns: [
                      {
                        label: 'Engine',
                        name: 'engine'
                      },
                      {
                        name: 'version',
                        label: 'Version'
                      }
                    ]
                  }
                ],
                actions: [
                  {
                    type: 'button',
                    level: 'link',
                    label: '查看详情',
                    actionType: 'dialog',
                    dialog: {
                      title: '查看详情',
                      body: {
                        type: 'form',
                        body: [
                          {
                            label: 'Engine',
                            name: 'engine',
                            type: 'static'
                          },
                          {
                            name: 'version',
                            label: 'Version',
                            type: 'static'
                          }
                        ]
                      }
                    }
                  }
                ]
              }
            }
          }
        ]
      }
    })
  );

  expect(container).toMatchSnapshot();
});

test('Renderer:list with title & header & footer & headerClassName & footerClassName', () => {
  const {container} = render(
    amisRender({
      type: 'page',
      data: {
        miniRows
      },
      body: {
        type: 'list',
        source: '$rows',
        title: 'listTitleForTest',
        // itemAction: {
        //   type: 'button',
        //   actionType: 'dialog',
        //   dialog: {
        //     title: '详情',
        //     body: '当前行的数据 browser: ${browser}, version: ${version}'
        //   }
        // },
        listItem: {
          body: [
            {
              label: 'Engine',
              name: 'engine'
            },
            {
              name: 'version',
              label: 'Version'
            }
          ]
        },
        header: {
          type: 'tpl',
          tpl: '头部标题'
        },
        footer: {
          type: 'button',
          label: '底部按钮'
        },
        headerClassName: 'headerTplClassName',
        footerClassName: 'footerButtonClassName'
      }
    })
  );

  const header = container.querySelector('.amis-List-header');
  expect(header).toHaveClass('headerTplClassName');
  expect(header).toHaveTextContent('头部标题');

  const footer = container.querySelector('.amis-List-footer');
  expect(footer).toHaveClass('footerButtonClassName');
  expect(footer!.querySelector('.amis-Button')).toBeInTheDocument();

  expect(container.querySelector('.amis-List-heading')).toHaveTextContent(
    'listTitleForTest'
  );

  expect(container).toMatchSnapshot();
});

test('Renderer:list with itemAction', () => {
  const {container, getByText, baseElement} = render(
    amisRender({
      type: 'page',
      data: {
        rows: miniRows
      },
      body: {
        type: 'list',
        source: '$rows',
        title: 'listTitleForTest',
        itemAction: {
          actionType: 'dialog',
          dialog: {
            title: '详情',
            body: '当前行的数据 browser: ${browser}, version: ${version}'
          }
        },
        listItem: {
          body: [
            {
              label: 'Engine',
              name: 'engine'
            },
            {
              name: 'version',
              label: 'Version'
            }
          ]
        }
      }
    })
  );

  fireEvent.click(container.querySelector('.amis-ListItem')!);

  expect(baseElement).toMatchSnapshot();
  expect(baseElement.querySelector('.amis-Modal-content')).toBeInTheDocument();

  expect(baseElement.querySelector('.amis-Modal-content')).toHaveTextContent(
    `当前行的数据 browser: ${miniRows[0].browser}, version: ${miniRows[0].version}`
  );
});

describe('Renderer:list with listItem', () => {
  const renderListItems = (listItem: any = {}) =>
    amisRender({
      type: 'page',
      data: {
        rows: miniRows
      },
      body: {
        type: 'list',
        source: '$rows',
        listItem
      }
    });

  test('title & titleClassName & subTitle & desc', () => {
    const {container, getByText, baseElement} = render(
      renderListItems({
        title: '${platform}',
        titleClassName: 'classForItemTitle',
        subTitle: '等级为：${grade}',
        desc: 'this is list item desc',
        body: [
          {
            label: 'Engine',
            name: 'engine'
          },
          {
            name: 'version',
            label: 'Version'
          }
        ]
      })
    );
    expect(container).toMatchSnapshot();

    expect(
      container.querySelector('.amis-ListItem .amis-ListItem-title')!.innerHTML
    ).toBe(miniRows[0].platform);
    expect(
      container.querySelector('.amis-ListItem .amis-ListItem-title')
    ).toHaveClass('classForItemTitle');
    expect(
      container.querySelector('.amis-ListItem .amis-ListItem-subtitle')!
        .innerHTML
    ).toBe(`等级为：${miniRows[0].grade}`);
    expect(container.querySelector('.amis-ListItem')).toHaveTextContent(
      'this is list item desc'
    );
  });

  test('avatar & avatarClassName', () => {
    const {container, getByText, baseElement} = render(
      renderListItems({
        avatar: '/path/avatar/${index}',
        avatarClassName: 'avatarClassNameForTest',
        body: [
          {
            label: 'Engine',
            name: 'engine'
          },
          {
            name: 'version',
            label: 'Version'
          }
        ]
      })
    );

    expect(container).toMatchSnapshot();
    const avatar = container.querySelector('.amis-ListItem-avatar')!;
    expect(avatar).toHaveClass('avatarClassNameForTest');
    expect(avatar.querySelector('img')).toHaveAttribute(
      'src',
      '/path/avatar/0'
    );
  });

  test('actions & actionsPosition', () => {
    const {container, getByText, baseElement, rerender} = render(
      renderListItems({
        body: [
          {
            label: 'Engine',
            name: 'engine'
          },
          {
            name: 'version',
            label: 'Version'
          }
        ],
        actions: [
          {
            type: 'button',
            level: 'link',
            label: '查看详情'
          }
        ]
      })
    );

    expect(container).toMatchSnapshot();
    expect(container.querySelector('.amis-ListItem')!).toHaveClass(
      componentClass('ListItem--actions-at-right')
    );

    rerender(
      renderListItems({
        body: [
          {
            label: 'Engine',
            name: 'engine'
          },
          {
            name: 'version',
            label: 'Version'
          }
        ],
        actionsPosition: 'left',
        actions: [
          {
            type: 'button',
            level: 'link',
            label: '查看详情'
          }
        ]
      })
    );

    expect(container.querySelector('.amis-ListItem')!).toHaveClass(
      componentClass('ListItem--actions-at-left')
    );
  });
});
