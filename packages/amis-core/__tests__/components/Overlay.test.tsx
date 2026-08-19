import React from 'react';
import {cleanup, fireEvent, render, waitFor} from '@testing-library/react';
import Overlay from '../../src/components/Overlay';
import PopOver from '../../src/components/PopOver';
import {EnvContext} from '../../src/env';
import {getTheme, theme, ThemeContext} from '../../src/theme';
import {setReactRef} from '../../src/utils/reactRef';

function renderOverlay({
  container,
  themeName = 'cxd',
  label = 'scoped tooltip',
  show = true,
  targetScope
}: {
  container?: HTMLElement | (() => HTMLElement);
  themeName?: string;
  label?: string;
  show?: boolean;
  targetScope?: string;
} = {}) {
  const target = document.createElement('button');
  if (targetScope) {
    const root = document.createElement('div');
    root.setAttribute('data-prismui-theme', targetScope);
    root.appendChild(target);
    document.body.appendChild(root);
  } else {
    document.body.appendChild(target);
  }

  render(
    <EnvContext.Provider
      value={
        {
          getModalContainer: () => document.body,
          theme: getTheme(themeName)
        } as any
      }
    >
      <ThemeContext.Provider value={themeName}>
        <Overlay show={show} target={() => target} container={container}>
          <div role="tooltip">{label}</div>
        </Overlay>
      </ThemeContext.Provider>
    </EnvContext.Provider>
  );

  return target;
}

function expectTooltipInScope(
  root: ParentNode,
  themeName: string,
  label = 'scoped tooltip'
) {
  const tooltip = Array.from(root.querySelectorAll('[role="tooltip"]')).find(
    node => node.textContent === label
  ) as HTMLElement | undefined;

  expect(tooltip).toBeTruthy();
  expect(tooltip!.closest(`[data-prismui-theme="${themeName}"]`)).toBeTruthy();
  expect(
    root.querySelector(
      `[role="tooltip"][data-prismui-theme="${themeName}"], ` +
        `[data-prismui-theme="${themeName}"] [role="tooltip"]`
    )
  ).toBeTruthy();
}

function mockElementRect(
  element: HTMLElement,
  rect: Partial<DOMRect> = {}
) {
  const width = rect.width ?? 100;
  const height = rect.height ?? 20;
  const left = rect.left ?? 0;
  const top = rect.top ?? 0;

  Object.defineProperties(element, {
    offsetWidth: {configurable: true, value: width},
    offsetHeight: {configurable: true, value: height}
  });
  element.getBoundingClientRect = () =>
    ({
      x: left,
      y: top,
      top,
      left,
      width,
      height,
      right: left + width,
      bottom: top + height,
      toJSON: () => ({})
    } as DOMRect);
}

class DelayedForwardedRefOverlay extends React.Component<any> {
  static supportForwardedRef = true;
  rootRef = React.createRef<HTMLDivElement>();
  timer: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    this.timer = setTimeout(() => {
      setReactRef(this.props.forwardedRef, this.rootRef.current);
    }, 0);
  }

  componentWillUnmount() {
    this.timer && clearTimeout(this.timer);
    setReactRef(this.props.forwardedRef, null);
  }

  render() {
    const {forwardedRef, children, ...props} = this.props;

    return (
      <div {...props} ref={this.rootRef} role="tooltip">
        {children}
      </div>
    );
  }
}

afterEach(() => {
  cleanup();
  document.body.innerHTML = '';
  theme('dark', {
    componentClassPrefix: 'prismui-'
  });
});

test('Overlay applies triggering theme scope to body portal child', async () => {
  renderOverlay();

  await waitFor(() => {
    expectTooltipInScope(document.body, 'cxd');
  });
});

test('Overlay applies scope without inserting a layout wrapper', async () => {
  renderOverlay();

  await waitFor(() => {
    const tooltip = document.body.querySelector(
      '[role="tooltip"]'
    ) as HTMLElement;

    expect(tooltip).toBeTruthy();
    expect(tooltip.parentElement).toBe(document.body);
    expect(tooltip).toHaveAttribute('data-prismui-theme', 'cxd');
  });
});

test('Overlay does not scope or render portal child before mount', () => {
  const customContainer = document.createElement('div');
  document.body.appendChild(customContainer);

  renderOverlay({container: customContainer, show: false});

  expect(customContainer).not.toHaveAttribute('data-prismui-theme');
  expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
});

test('Overlay applies triggering theme scope to custom container child', async () => {
  const customContainer = document.createElement('div');
  document.body.appendChild(customContainer);

  renderOverlay({container: customContainer});

  await waitFor(() => {
    expectTooltipInScope(customContainer, 'cxd');
  });
});

test('Overlay preserves existing custom container theme scope', async () => {
  const customContainer = document.createElement('div');
  customContainer.setAttribute('data-prismui-theme', 'dark');
  document.body.appendChild(customContainer);

  renderOverlay({container: customContainer});

  await waitFor(() => {
    expectTooltipInScope(customContainer, 'dark');
  });
});

test('Overlay prefers target DOM scope over mutable env theme', async () => {
  theme('dark', {
    componentClassPrefix: 'prismui-'
  });

  renderOverlay({
    label: 'target scoped tooltip',
    themeName: 'dark',
    targetScope: 'cxd'
  });

  await waitFor(() => {
    expectTooltipInScope(document.body, 'cxd', 'target scoped tooltip');
  });
});

test('Overlay scopes body portal children per triggering root', async () => {
  theme('dark', {
    componentClassPrefix: 'prismui-'
  });

  renderOverlay({label: 'cxd scoped tooltip', themeName: 'cxd'});
  renderOverlay({label: 'dark scoped tooltip', themeName: 'dark'});

  await waitFor(() => {
    expect(document.body.querySelectorAll('[role="tooltip"]')).toHaveLength(2);
  });

  expectTooltipInScope(document.body, 'cxd', 'cxd scoped tooltip');
  expectTooltipInScope(document.body, 'dark', 'dark scoped tooltip');
});

test('Overlay applies scope inside iframe container document', async () => {
  const iframe = document.createElement('iframe');
  document.body.appendChild(iframe);
  const previewBody = iframe.contentDocument!.body;

  renderOverlay({
    container: () => previewBody,
    label: 'iframe scoped tooltip'
  });

  await waitFor(() => {
    expectTooltipInScope(previewBody, 'cxd', 'iframe scoped tooltip');
  });
  expect(document.body.querySelector('[role="tooltip"]')).toBeNull();
});

test('Overlay preserves PopOver forwarded root ref while positioning', async () => {
  const target = document.createElement('button');
  mockElementRect(target, {left: 8, top: 12, width: 80, height: 24});
  document.body.appendChild(target);

  const forwardedRef = jest.fn();

  render(
    <EnvContext.Provider
      value={
        {
          getModalContainer: () => document.body,
          theme: getTheme('cxd')
        } as any
      }
    >
      <ThemeContext.Provider value="cxd">
        <Overlay show target={() => target}>
          <PopOver forwardedRef={forwardedRef}>popover content</PopOver>
        </Overlay>
      </ThemeContext.Provider>
    </EnvContext.Provider>
  );

  await waitFor(() => {
    expect(forwardedRef).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  await waitFor(() => {
    const popover = document.body.querySelector(
      '[role="popover"]'
    ) as HTMLElement;

    expect(popover).toBeTruthy();
    expect(popover.style.visibility).not.toBe('hidden');
  });
});

test('Overlay repositions when forwarded overlay ref resolves after mount', async () => {
  const target = document.createElement('button');
  mockElementRect(target, {left: 8, top: 12, width: 80, height: 24});
  document.body.appendChild(target);

  render(
    <EnvContext.Provider
      value={
        {
          getModalContainer: () => document.body,
          theme: getTheme('cxd')
        } as any
      }
    >
      <ThemeContext.Provider value="cxd">
        <Overlay show target={() => target}>
          <DelayedForwardedRefOverlay>delayed tooltip</DelayedForwardedRefOverlay>
        </Overlay>
      </ThemeContext.Provider>
    </EnvContext.Provider>
  );

  await waitFor(() => {
    const tooltip = document.body.querySelector(
      '[role="tooltip"]'
    ) as HTMLElement;

    expect(tooltip).toBeTruthy();
    expect(tooltip.style.visibility).not.toBe('hidden');
  });
});

test('Overlay repositions when target resolves after initial mount', async () => {
  const target = document.createElement('button');
  mockElementRect(target, {left: 8, top: 12, width: 80, height: 24});
  document.body.appendChild(target);
  let targetReady = false;
  setTimeout(() => {
    targetReady = true;
  }, 0);

  render(
    <EnvContext.Provider
      value={
        {
          getModalContainer: () => document.body,
          theme: getTheme('cxd')
        } as any
      }
    >
      <ThemeContext.Provider value="cxd">
        <Overlay show target={() => (targetReady ? target : null)}>
          <div role="tooltip">late target tooltip</div>
        </Overlay>
      </ThemeContext.Provider>
    </EnvContext.Provider>
  );

  await waitFor(() => {
    const tooltip = document.body.querySelector(
      '[role="tooltip"]'
    ) as HTMLElement;

    expect(tooltip).toBeTruthy();
    expect(tooltip.style.visibility).not.toBe('hidden');
  });
});

test('Overlay rootClose listens on positioned overlay DOM', async () => {
  const target = document.createElement('button');
  mockElementRect(target, {left: 8, top: 12, width: 80, height: 24});
  document.body.appendChild(target);
  const onHide = jest.fn();

  render(
    <EnvContext.Provider
      value={
        {
          getModalContainer: () => document.body,
          theme: getTheme('cxd')
        } as any
      }
    >
      <ThemeContext.Provider value="cxd">
        <Overlay show target={() => target} rootClose onHide={onHide}>
          <div role="tooltip">root close tooltip</div>
        </Overlay>
      </ThemeContext.Provider>
    </EnvContext.Provider>
  );

  await waitFor(() => {
    expect(document.body.querySelector('[role="tooltip"]')).toBeTruthy();
  });

  fireEvent.mouseDown(document.body, {button: 0});
  fireEvent.mouseUp(document.body, {button: 0});
  fireEvent.click(document.body, {button: 0});

  await waitFor(() => {
    expect(onHide).toHaveBeenCalled();
  });
});
