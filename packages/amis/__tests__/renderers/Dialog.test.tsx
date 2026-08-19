import React from 'react';
import ReactDOM from 'react-dom';
import {
  cleanup,
  fireEvent,
  render,
  waitFor,
  screen
} from '@testing-library/react';
import '../../src';
import {clearStoresCache, render as amisRender} from '../../src';
import {makeEnv as makeEnvRaw, replaceReactAriaIds, wait} from '../helper';
import {Drawer, Modal} from 'amis-ui';
import rows from '../mockData/rows';
import type {RenderOptions} from '../../src';

afterEach(() => {
  cleanup();
  clearStoresCache();
  jest.useRealTimers();
});

/** 避免updateLocation里的console.error */
const makeEnv = (env?: Partial<RenderOptions>) =>
  makeEnvRaw({updateLocation: () => {}, ...env});

/**
 * https://github.com/baidu/amis/issues/1405
 *
 * 验证弹窗的 CRUD 中再次弹出一个 crud，里面的 crud 确认关闭，不会关闭外面的 crud
 */
test('1. Renderer:dialog inner crud close outter crud component', async () => {
  const {container, getByText} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'button',
          label: '第一层弹框',
          actionType: 'dialog',
          dialog: {
            title: '第一层弹框标题',
            body: [
              {
                type: 'button',
                label: '第二次弹框',
                actionType: 'dialog',
                dialog: {
                  title: '第二层弹框标题',
                  body: [
                    {
                      type: 'tpl',
                      tpl: '对你点击了',
                      inline: false
                    },
                    {
                      type: 'crud',
                      api: '',
                      columns: [
                        {
                          name: 'id',
                          label: 'ID',
                          type: 'text'
                        },
                        {
                          name: 'engine',
                          label: '渲染引擎',
                          type: 'text'
                        }
                      ]
                    },
                    {
                      type: 'button',
                      label: '按钮',
                      actionType: 'dialog',
                      dialog: {
                        title: '系统提示',
                        body: '对你点击了'
                      }
                    }
                  ],
                  actions: [
                    {
                      type: 'button',
                      label: '第二层确认',
                      actionType: 'submit'
                    }
                  ],
                  type: 'dialog'
                },
                size: 'md',
                level: 'primary'
              },
              {
                type: 'crud',
                api: '',
                columns: [
                  {
                    name: 'id',
                    label: 'ID',
                    type: 'text'
                  },
                  {
                    name: 'engine',
                    label: '渲染引擎',
                    type: 'text'
                  }
                ]
              }
            ],
            type: 'dialog'
          },
          size: 'md',
          level: 'primary'
        }
      },
      {},
      makeEnv({})
    )
  );

  // events
  fireEvent.click(getByText('第一层弹框'));
  await wait(200);

  expect(getByText('第二次弹框')).toBeInTheDocument();
  fireEvent.click(getByText('第二次弹框'));

  await wait(200);
  expect(getByText('第二层弹框标题')).toBeInTheDocument();

  expect(getByText('第二层确认')).toBeInTheDocument();
  fireEvent.click(getByText('第二层确认'));
  await wait(400);

  expect(getByText('第一层弹框标题')).toBeInTheDocument();
  // 还有第二次弹窗的按钮，说明第一层弹窗没有关闭
  expect(getByText('第二次弹框')).toBeInTheDocument();
});

/**
 * https://github.com/baidu/amis/issues/9149
 *
 * 验证弹窗内部的 动作是通用动作时是否能正确响应。
 *
 * 比如弹窗里面有个按钮是页面跳转，看是否执行了页面跳转
 */
test('2. Renderer:dialog inner component with common action', async () => {
  const jumpTo = jest.fn();
  const {container, getByText} = render(
    amisRender(
      {
        type: 'page',
        title: '表单页面',
        body: [
          {
            label: 'OpenADialog',
            type: 'button',
            actionType: 'dialog',
            level: 'primary',
            dialog: {
              body: {
                type: 'form',
                api: 'post:/api/smart_lvct_boards/excel',
                body: [
                  {
                    label: '下载Excel模板',
                    type: 'action',
                    level: 'success',
                    actionType: 'url',
                    url: '/api/filedown/zhuban'
                  }
                ]
              }
            }
          }
        ]
      },
      {},
      makeEnv({
        jumpTo
      })
    )
  );

  // events
  fireEvent.click(getByText('OpenADialog'));
  await wait(200);

  expect(getByText('下载Excel模板')).toBeInTheDocument();
  fireEvent.click(getByText('下载Excel模板'));
  await wait(400);

  expect(jumpTo).toBeCalledTimes(1);
  expect(jumpTo.mock.calls[0][0]).toBe('/api/filedown/zhuban');
});

test('Renderer:dialog applies theme scope to body portal dialog', async () => {
  const {getByText} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'button',
          label: 'Open scoped dialog',
          actionType: 'dialog',
          dialog: {
            title: 'Scoped dialog',
            body: 'dialog body'
          }
        }
      },
      {},
      makeEnv({})
    )
  );

  fireEvent.click(getByText('Open scoped dialog'));

  await waitFor(() => {
    expect(document.body.querySelector('[role="dialog"]')).toHaveAttribute(
      'data-prismui-theme',
      'cxd'
    );
  });
});

test('Renderer:dialog preserves custom modal container theme scope', async () => {
  const modalContainer = document.createElement('div');
  modalContainer.setAttribute('data-prismui-theme', 'dark');
  document.body.appendChild(modalContainer);

  const {getByText} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'button',
          label: 'Open custom scoped dialog',
          actionType: 'dialog',
          dialog: {
            title: 'Custom scoped dialog',
            body: 'dialog body'
          }
        }
      },
      {},
      makeEnv({
        getModalContainer: () => modalContainer
      })
    )
  );

  fireEvent.click(getByText('Open custom scoped dialog'));

  await waitFor(() => {
    expect(modalContainer.querySelector('[role="dialog"]')).toHaveAttribute(
      'data-prismui-theme',
      'dark'
    );
  });
});

test('Renderer:dialog does not fallback to body when custom modal container is unavailable', async () => {
  const {getByText} = render(
    amisRender(
      {
        type: 'page',
        body: {
          type: 'button',
          label: 'Open unavailable container dialog',
          actionType: 'dialog',
          dialog: {
            title: 'Unavailable dialog',
            body: 'dialog body'
          }
        }
      },
      {},
      makeEnv({
        getModalContainer: () => null as any
      })
    )
  );

  fireEvent.click(getByText('Open unavailable container dialog'));
  await wait(100);

  expect(document.body.querySelector('[role="dialog"]')).toBeNull();
});

test('Components:Modal exposes content DOM through contentDomRef', () => {
  const contentDomRef = React.createRef<HTMLDivElement>();

  render(
    <Modal show onHide={jest.fn()} contentDomRef={contentDomRef}>
      <div data-testid="modal-body">Modal body</div>
    </Modal>
  );

  expect(contentDomRef.current).toBeInTheDocument();
  expect(contentDomRef.current).toHaveClass(componentClass('Modal-content'));
  expect(contentDomRef.current).toContainElement(
    screen.getByTestId('modal-body')
  );
});

test('Components:Modal draggable uses content nodeRef instead of findDOMNode', () => {
  const findDOMNodeSpy = (ReactDOM as any).findDOMNode
    ? jest.spyOn(ReactDOM as any, 'findDOMNode')
    : null;

  render(
    <Modal show draggable onHide={jest.fn()}>
      <Modal.Header>Modal title</Modal.Header>
      <div data-testid="modal-body">Modal body</div>
    </Modal>
  );

  fireEvent.mouseDown(document.body.querySelector('.prismui-Modal-header')!, {
    button: 0,
    clientX: 10,
    clientY: 10
  });

  if (findDOMNodeSpy) {
    expect(findDOMNodeSpy).not.toHaveBeenCalled();
    findDOMNodeSpy.mockRestore();
  }
});

test('Components:Drawer exposes content DOM through contentDomRef', () => {
  const contentDomRef = React.createRef<HTMLDivElement>();

  render(
    <Drawer
      show
      position="left"
      size="md"
      container={document.body}
      onHide={jest.fn()}
      contentDomRef={contentDomRef}
    >
      <div data-testid="drawer-body">Drawer body</div>
    </Drawer>
  );

  expect(contentDomRef.current).toBeInTheDocument();
  expect(contentDomRef.current).toHaveClass(componentClass('Drawer-content'));
  expect(contentDomRef.current).toContainElement(
    screen.getByTestId('drawer-body')
  );
});

test('Components:Modal closes from stable root class on outside click', () => {
  const onHide = jest.fn();

  render(
    <Modal show closeOnOutside onHide={onHide}>
      <div>Modal body</div>
    </Modal>
  );

  const modal = document.body.querySelector('.prismui-Modal') as HTMLElement;
  expect(modal).toBeInTheDocument();
  expect(modal).toHaveClass(componentClass('Modal--1th'));

  fireEvent.mouseDown(modal, {button: 0});
  fireEvent.mouseUp(modal, {button: 0});

  expect(onHide).toHaveBeenCalledTimes(1);
});

test('Components:Drawer closes from stable overlay class on outside click', () => {
  const onHide = jest.fn();

  render(
    <Drawer
      show
      closeOnOutside
      overlay
      position="left"
      size="md"
      container={document.body}
      onHide={onHide}
    >
      <div>Drawer body</div>
    </Drawer>
  );

  const drawer = document.body.querySelector('.prismui-Drawer') as HTMLElement;
  const overlay = document.body.querySelector(
    '.prismui-Drawer-overlay'
  ) as HTMLElement;

  expect(drawer).toBeInTheDocument();
  expect(drawer).toHaveClass(componentClass('Drawer--left'));
  expect(drawer).toHaveClass(componentClass('Drawer--md'));
  expect(drawer).toHaveClass(componentClass('Modal--1th'));
  expect(overlay).toBeInTheDocument();

  fireEvent.mouseDown(overlay, {button: 0});
  fireEvent.mouseUp(overlay, {button: 0});

  expect(onHide).toHaveBeenCalledTimes(1);
});
