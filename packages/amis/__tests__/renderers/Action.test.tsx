/**
 * 组件名称：Action 行为按钮
 * 
 * 单测内容：
 1. 点击切换
 */

import React from 'react';
import Action from '../../src/renderers/Action';
import {
  render,
  fireEvent,
  cleanup,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import {render as amisRender} from '../../src';
import {makeEnv, wait} from '../helper';
import '../../src';
import hotkeys from 'hotkeys-js';

afterEach(cleanup);

// 1. levels 样式
test('Renderers:Action all levels', () => {
  const levels = [
    'link',
    'primary',
    'secondary',
    'info',
    'success',
    'warning',
    'danger',
    'light',
    'dark',
    'default'
  ];

  const {container} = render(
    amisRender(
      {
        type: 'page',
        body: [
          levels.map(item => ({
            type: 'button',
            level: item,
            label: `按钮 ${item}`
          })),

          {
            type: 'divider'
          },

          levels.map(item => ({
            type: 'button',
            level: item,
            disabled: true,
            label: `按钮${item}`
          }))
        ]
      },
      {},
      makeEnv({})
    )
  );

  expect(container).toMatchSnapshot();
});

// 2. Action 组件尺寸
test('Renderers:Action display size[xs, sm, md, lg]', () => {
  const {container, rerender} = render(<Action size="xs" />);

  expect(container.firstChild).toMatchSnapshot();

  rerender(<Action size="sm" />);

  expect(container.firstChild).toMatchSnapshot();

  rerender(<Action size="md" />);

  expect(container.firstChild).toMatchSnapshot();

  rerender(<Action size="lg" />);

  expect(container.firstChild).toMatchSnapshot();
});

// 3. MenuItem 下激活与禁用状态
test('Renderers:Action MenuItem changes class when actived & disabled', () => {
  const {container, rerender} = render(
    <Action isMenuItem className="a" label="123" />
  );

  expect(container.firstChild).toMatchSnapshot();

  rerender(<Action isMenuItem className="a" label="233" active />);

  expect(container.firstChild).toMatchSnapshot();

  rerender(
    <Action isMenuItem className="a" label="233" active disabled />
  );

  expect(container.firstChild).toMatchSnapshot();
});

// 4. MenuItem 下设置图标
test('Renderers:Action MenuItem display icon', () => {
  const {container, rerender} = render(
    <Action isMenuItem className="a" label="123" />
  );

  expect(container.firstChild).toMatchSnapshot();

  rerender(
    <Action isMenuItem className="a" label="123" icon="fa fa-cloud" />
  );

  expect(container.firstChild).toMatchSnapshot();
});

// 5. actionType 为 link 时的 类
test('Renderers:Action [actionType = "link"] show active class', () => {
  const isCurrentUrl = (link: string) => link === 'b';
  const {container, rerender} = render(
    <Action
      actionType="link"
      link="a"
      className="a"
      label="123"
      isCurrentUrl={isCurrentUrl}
    />
  );

  expect(container.firstChild).toMatchSnapshot();

  rerender(
    <Action
      actionType="link"
      link="b"
      className="a"
      label="123"
      isCurrentUrl={isCurrentUrl}
    />
  );

  expect(container.firstChild).toMatchSnapshot();
});

// 6. 自定义激活态下的类
test('Renderers:Action custom activeClass', () => {
  const {container, rerender} = render(
    <Action className="a" label="123" activeClassName="custom-active" />
  );

  expect(container.firstChild).toMatchSnapshot();

  rerender(
    <Action className="a" label="123" activeClassName="custom-active" active />
  );

  expect(container.firstChild).toMatchSnapshot();
});

// 7. onAction 方法调用
test('Renderers:Action onAction called?', () => {
  const onAction = jest.fn();
  const {getByText} = render(
    <Action className="a" label="123" onAction={onAction}></Action>
  );

  fireEvent.click(getByText(/123/));
  expect(onAction).toHaveBeenCalled();
});

// 8. disabled 下 onAction 调用情况
test('Renderers:Action disabled onAction called?', () => {
  const onAction = jest.fn();
  const {getByText} = render(
    <Action disabled className="a" label="123" onAction={onAction}></Action>
  );

  fireEvent.click(getByText(/123/));
  expect(onAction).not.toHaveBeenCalled();
});

// 9. onClick 与 onAction 共存时，仅调用 onClick
test('Renderers:Action onClick cancel onAction?', () => {
  const onAction = jest.fn();
  const onClick = jest.fn(e => e.preventDefault());
  const {getByText} = render(
    <Action
      isMenuItem
      className="a"
      label="123"
      onClick={onClick}
      onAction={onAction}
    ></Action>
  );

  fireEvent.click(getByText(/123/));

  expect(onClick).toHaveBeenCalled();
  expect(onAction).not.toHaveBeenCalled();
});

// 10. actionType 为 download
test('Renderers:Action download shortcut', () => {
  const {container} = render(
    <Action actionType="download" link="a" label="123" />
  );

  expect(container.firstChild).toMatchSnapshot();
});

// 11. countDown 倒计时
test('Renderers:Action countDown', async () => {
  const {container} = render(
    amisRender(
      {
        label: '发送验证码',
        type: 'button',
        className: 'countDown',
        countDown: 1
      },
      {},
      makeEnv({})
    )
  );

  let button = container.querySelector('button');
  fireEvent.click(button as HTMLButtonElement);
  await waitFor(() => {
    expect(container.querySelector('button')).not.toBeInTheDocument();
  });
});

// 12. tooltip
test('Renderers:Action tooltip', async () => {
  const {container, getByText, findByText} = render(
    amisRender(
      {
        type: 'page',
        body: [
          {
            label: 'top',
            type: 'action',
            tooltip: 'topTooltip',
            tooltipPlacement: 'top'
          },
          {
            label: 'bottom',
            type: 'action',
            tooltip: 'bottomTooltip',
            tooltipPlacement: 'bottom'
          },
          {
            label: 'left',
            type: 'action',
            tooltip: 'leftTooltip',
            tooltipPlacement: 'left'
          },
          {
            label: 'right',
            type: 'action',
            tooltip: 'rightTooltip',
            tooltipPlacement: 'right'
          }
        ]
      },
      {},
      makeEnv({})
    )
  );

  fireEvent.mouseOver(getByText(/top/));

  await findByText('topTooltip');

  expect(container).toMatchSnapshot();
});

// 13. feedback
// test('Renderers:Action click feedback', async () => {
//   const fetcher = jest.fn().mockImplementation(() =>
//     Promise.resolve({
//       data: {
//         status: 0,
//         msg: 'ok',
//         data: ''
//       }
//     })
//   );
//   const {getByText, container, baseElement}: any = render(
//     amisRender(
//       {
//         type: 'page',
//         body: {
//           type: 'button',
//           label: 'Feedback',
//           actionType: 'ajax',
//           api: '/api/mock2/form/initData?waitSeconds=0',
//           feedback: {
//             title: '操作成功',
//             body: '${id} 已操作成功'
//           }
//         }
//       },
//       {},
//       makeEnv({
//         session: 'test-case-action',
//         fetcher
//       })
//     )
//   );
//   fireEvent.click(container.querySelector('.prismui-Button'));
//   wait(2000);
//   expect(fetcher).toBeCalled();
//   expect(baseElement).toMatchSnapshot();
//   expect(
//     await within(baseElement.querySelector('.prismui-Modal-content')!).getByText(
//       'xxx 已操作成功'
//     )!
//   ).toBeInTheDocument();
// });

// 14. confirmText
test('Renderers:Action with confirmText & actionType ajax', async () => {
  const fetcher = jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        status: 0,
        msg: 'ok',
        data: ''
      }
    })
  );
  const {getByText, container, baseElement}: any = render(
    amisRender(
      {
        type: 'page',
        body: {
          label: 'ajax请求',
          type: 'button',
          actionType: 'ajax',
          confirmText: '确认要发出这个请求？',
          api: '/api/mock2/form/saveForm'
        }
      },
      {},
      makeEnv({
        session: 'test-case-action-no',
        fetcher
      })
    )
  );
  fireEvent.click(container.querySelector('.prismui-Button'));
  await wait(500);
  expect(baseElement).toMatchSnapshot();

  expect(baseElement.querySelector('.prismui-Modal-content')!).toHaveTextContent(
    '确认要发出这个请求？'
  );

  fireEvent.click(getByText('取消'));
  await wait(500);
  expect(fetcher).not.toBeCalled();

  fireEvent.click(container.querySelector('.prismui-Button'));
  await wait(500);
  fireEvent.click(getByText('确认'));

  await wait(200);
  // fetcher 该被执行了
  expect(fetcher).toBeCalled();
});

// 15.Action 作为容器组件
test('Renderers:Action as container', async () => {
  const notify = jest.fn();
  const {getByText, container, baseElement}: any = render(
    amisRender(
      {
        type: 'action',
        body: [
          {
            type: 'color',
            value: '#108cee'
          }
        ],
        actionType: 'toast',
        toast: {
          items: [
            {
              body: '点击了颜色'
            }
          ]
        }
      },
      {},
      makeEnv({
        notify,
        session: 'test-action-3'
      })
    )
  );

  const color = container.querySelector('.prismui-ColorField');
  expect(color).toBeInTheDocument();

  fireEvent.click(color);

  await wait(200);

  expect(notify).toBeCalled();
  expect(container).toMatchSnapshot();
});

// 16. disabledTip
test('Renderers:Action with disabledTip', async () => {
  const {container, getByText, findByText} = render(
    amisRender(
      {
        type: 'page',
        body: [
          {
            label: '弹框',
            type: 'button',
            actionType: 'link',
            disabled: true,
            link: '../index',
            disabledTip: '禁用了'
          }
        ]
      },
      {},
      makeEnv({})
    )
  );

  fireEvent.mouseEnter(getByText('弹框')!);

  await wait(200);
  expect(container).toMatchSnapshot();
  expect(getByText('禁用了')).toBeInTheDocument();
});
