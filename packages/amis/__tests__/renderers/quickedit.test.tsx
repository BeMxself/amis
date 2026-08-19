/**
 * @file QuickEdit.test.tsx
 * @author xxx
 * @description QuickEdit组件单元测试，主要测试getQuickEditApi函数
 */

import React from 'react';
import {cleanup, render} from '@testing-library/react';
import {HocQuickEdit, getQuickEditApi} from '../../src/renderers/QuickEdit';

afterEach(() => {
  cleanup();
});

describe('getQuickEditApi函数测试', () => {
  test('saveImmediately为true时返回quickSaveItemApi', () => {
    const quickSaveItemApi = '/api/save-item';
    const result = getQuickEditApi(true, quickSaveItemApi);
    expect(result).toBe(quickSaveItemApi);
  });

  test('saveImmediately为对象且包含api属性时返回saveImmediately.api', () => {
    const saveImmediately = {api: '/api/custom-save'};
    const quickSaveItemApi = '/api/save-item';
    const result = getQuickEditApi(saveImmediately, quickSaveItemApi);
    expect(result).toBe(saveImmediately.api);
  });

  test('saveImmediately不存在时,返回undefined', () => {
    expect(getQuickEditApi()).toBeUndefined();
  });
});

test('HocQuickEdit exposes the quick-edit root through wrapperRef', () => {
  const wrapperRef = React.createRef<HTMLElement>();
  const cx = (...args: Array<any>) =>
    args
      .flatMap(arg => {
        if (!arg) {
          return [];
        }

        if (typeof arg === 'object') {
          return Object.keys(arg).filter(key => arg[key]);
        }

        return [arg];
      })
      .join(' ');
  const Host = ({wrapperRef, className, tabIndex, onKeyUp, children}: any) => (
    <div
      ref={wrapperRef}
      className={className}
      tabIndex={tabIndex}
      onKeyUp={onKeyUp}
    >
      value
      {children}
    </div>
  );
  const QuickEditHost = HocQuickEdit()(Host) as React.ComponentType<any>;

  render(
    <QuickEditHost
      wrapperRef={wrapperRef}
      quickEdit={{mode: 'popOver'}}
      onQuickChange={jest.fn()}
      classnames={cx}
      render={(_region: string, schema: any) =>
        schema.type === 'button' ? (
          <button className={schema.className} onClick={schema.onClick}>
            {schema.icon}
          </button>
        ) : null
      }
      translate={(str: string) => str}
    />
  );

  expect(wrapperRef.current).toBeInTheDocument();
  expect(wrapperRef.current).toHaveClass('Field--quickEditable');
  expect(wrapperRef.current).toHaveTextContent('value');
});

test('HocQuickEdit preserves wrapperRef when quick edit is inactive', () => {
  const wrapperRef = React.createRef<HTMLElement>();
  const Host = ({wrapperRef, children}: any) => (
    <div ref={wrapperRef} data-testid="host">
      value
      {children}
    </div>
  );
  const QuickEditHost = HocQuickEdit()(Host) as React.ComponentType<any>;

  const {getByTestId} = render(
    <QuickEditHost
      wrapperRef={wrapperRef}
      quickEdit={false}
      classnames={() => ''}
      render={jest.fn()}
      translate={(str: string) => str}
    />
  );

  expect(wrapperRef.current).toBe(getByTestId('host'));
  expect(wrapperRef.current).toHaveTextContent('value');
});
