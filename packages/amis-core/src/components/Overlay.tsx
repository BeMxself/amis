/**
 * @file Overlay
 * @description
 * @author fex
 */

import Portal from 'react-overlays/Portal';
import classNames from 'classnames';
import React, {cloneElement} from 'react';
import {getReactElementRef, mergeRefs, setReactRef} from '../utils/reactRef';
import {
  autobind,
  calculatePosition,
  getComputedStyle,
  getContainer,
  getScrollParent,
  noop,
  ownerDocument,
  resolveDOMElement,
  resizeSensor,
  RootClose,
  uuid
} from '../utils';
import {EnvContext} from '../env';
import {
  getNearestThemeScope,
  getThemeScope,
  resolveOverlayContainer,
  ThemeContext,
  type ThemeScope
} from '../theme';

export const SubPopoverDisplayedID = 'data-sub-popover-displayed';

function onScroll(elem: HTMLElement, callback: () => void) {
  const handler = () => {
    requestAnimationFrame(callback);
  };
  elem.addEventListener('scroll', handler);
  return function () {
    elem.removeEventListener('scroll', handler);
  };
}

const forwardRefSymbol = Symbol.for('react.forward_ref');

function canAttachRef(child: React.ReactElement) {
  const childType = child.type as any;

  return (
    typeof childType === 'string' ||
    !!childType?.prototype?.isReactComponent ||
    childType?.$$typeof === forwardRefSymbol
  );
}

function shouldUseForwardedRef(child: React.ReactElement) {
  const childType = child.type as any;
  const composed = childType?.ComposedComponent;

  return !!(childType?.supportForwardedRef || composed?.supportForwardedRef);
}

class Position extends React.Component<any, any> {
  props: any;
  _lastTarget: any;
  resizeDispose: Array<() => void>;
  watchedTarget: any;
  parentPopover: any;
  // setState: (state: any) => void;
  componentId: string;
  overlay: HTMLDivElement | null = null;
  mounted = false;
  positionRetryFrame: number | null = null;
  positionRetryCount = 0;
  lastChildForwardedRef?: React.Ref<any> | null;
  lastMergedForwardedRef?: React.Ref<any>;
  lastChildRef?: React.Ref<any> | null;
  lastMergedRef?: React.Ref<any>;

  static defaultProps = {
    containerPadding: 0,
    placement: 'right',
    shouldUpdatePosition: false
  };

  constructor(props: any) {
    super(props);

    this.state = {
      ready: false,
      positionLeft: 0,
      positionTop: 0,
      arrowOffsetLeft: null,
      arrowOffsetTop: null
    };

    this._lastTarget = null;
    this.componentId = uuid();
  }

  schedulePositionRetry() {
    if (
      !this.mounted ||
      this.positionRetryFrame !== null ||
      this.positionRetryCount >= 10
    ) {
      return;
    }

    this.positionRetryCount += 1;
    this.positionRetryFrame = requestAnimationFrame(() => {
      this.positionRetryFrame = null;
      this.updatePosition(this.getTarget());
    });
  }

  updatePosition(target: any) {
    /** 标记宿主元素的PopOver祖先，用于后续判断PopOver 是否可以 root close */
    if (target) {
      const parentPopover = target?.closest?.('[role=popover]');

      if (!this.parentPopover && parentPopover) {
        this.parentPopover = parentPopover;
        this.parentPopover.setAttribute(
          SubPopoverDisplayedID + '-' + this.componentId,
          true
        );
      }
    }

    const overlay = this.overlay;
    if (!target || !target.offsetWidth) {
      // 靠这个 re-render 来重置 position
      this.schedulePositionRetry();
      if (this.state.ready) {
        this.setState({ready: false});
      }
      return;
    }

    if (!overlay) {
      this.schedulePositionRetry();
      if (this.state.ready) {
        this.setState({ready: false});
      }
      return;
    }

    this.positionRetryCount = 0;
    this._lastTarget = target;

    const watchTargetSizeChange = this.props.watchTargetSizeChange;
    const container = getContainer(
      this.props.container,
      ownerDocument(target || overlay).body
    );

    if (!this.watchedTarget || this.watchedTarget !== target) {
      this.resizeDispose?.forEach(fn => fn());
      this.watchedTarget = target;
      this.resizeDispose = [
        watchTargetSizeChange !== false
          ? resizeSensor(target, () => this.updatePosition(target))
          : noop,
        resizeSensor(overlay, () => this.updatePosition(target))
      ];

      const scrollParent = getScrollParent(target);
      if (scrollParent && container.contains(scrollParent)) {
        this.resizeDispose.push(
          onScroll(scrollParent, () => {
            this.updatePosition(target);
          })
        );
      }
    }

    this.setState({
      ...calculatePosition(
        this.props.placement,
        overlay,
        target,
        container,
        this.props.containerPadding,
        this.props.offset
      ),
      ready: true
    });
  }

  componentDidMount() {
    this.mounted = true;
    this.updatePosition(this.getTarget());
  }

  getTarget = () => {
    const {target} = this.props;
    const targetElement = typeof target === 'function' ? target() : target;
    return resolveDOMElement(targetElement);
  };

  componentDidUpdate(prevProps: any) {
    if (prevProps.rootCloseRef !== this.props.rootCloseRef) {
      setReactRef(prevProps.rootCloseRef, null);
      setReactRef(this.props.rootCloseRef, this.overlay);
    }

    this.maybeUpdatePosition(this.props.placement !== prevProps.placement);
  }

  maybeUpdatePosition = (placementChanged: any) => {
    const target = this.getTarget();

    if (
      !this.props.shouldUpdatePosition &&
      target === this._lastTarget &&
      !placementChanged
    ) {
      return;
    }

    this.updatePosition(target);
  };

  overlayRef = (overlay: any) => {
    const nextOverlay = resolveDOMElement(overlay) as HTMLDivElement | null;
    const overlayChanged = nextOverlay !== this.overlay;

    this.overlay = nextOverlay;
    setReactRef(this.props.rootCloseRef, this.overlay);

    if (overlayChanged && this.overlay && this.mounted) {
      this.updatePosition(this.getTarget());
    }
  };

  getMergedForwardedRef(childRef: React.Ref<any> | null | undefined) {
    if (!childRef) {
      return this.overlayRef;
    }

    if (
      childRef !== this.lastChildForwardedRef ||
      !this.lastMergedForwardedRef
    ) {
      this.lastChildForwardedRef = childRef;
      this.lastMergedForwardedRef = mergeRefs(childRef, this.overlayRef);
    }

    return this.lastMergedForwardedRef;
  }

  getMergedRef(childRef: React.Ref<any> | null | undefined) {
    if (!childRef) {
      return this.overlayRef;
    }

    if (childRef !== this.lastChildRef || !this.lastMergedRef) {
      this.lastChildRef = childRef;
      this.lastMergedRef = mergeRefs(childRef, this.overlayRef);
    }

    return this.lastMergedRef;
  }

  getOverlayRefProps(child: React.ReactElement) {
    if (shouldUseForwardedRef(child)) {
      return {
        forwardedRef: this.getMergedForwardedRef(
          (child.props as any).forwardedRef
        )
      };
    }

    if (canAttachRef(child)) {
      return {
        ref: this.getMergedRef(getReactElementRef(child))
      };
    }

    return {};
  }

  componentWillUnmount() {
    this.mounted = false;
    if (this.positionRetryFrame !== null) {
      cancelAnimationFrame(this.positionRetryFrame);
      this.positionRetryFrame = null;
    }
    // 一个 PopOver 关闭时，需把挂载父 PopOver 的标记去掉
    // 这里可能会存在多个子 PopOver 的情况，所以需要加上 componentId
    if (
      this.parentPopover &&
      this.parentPopover.getAttribute(
        SubPopoverDisplayedID + '-' + this.componentId
      )
    ) {
      this.parentPopover.removeAttribute(
        SubPopoverDisplayedID + '-' + this.componentId
      );
      this.parentPopover = null;
    }

    this.resizeDispose?.forEach(fn => fn());
    setReactRef(this.props.rootCloseRef, null);
  }

  render() {
    const {children, className, ...props} = this.props;
    const {ready, positionLeft, positionTop, ...arrowPosition} = this.state;

    // These should not be forwarded to the child.
    delete props.target;
    delete props.container;
    delete props.containerPadding;
    delete props.shouldUpdatePosition;
    delete props.rootCloseRef;

    const child = React.Children.only(children);
    const overlayRefProps = this.getOverlayRefProps(child);
    return cloneElement(child, {
      ...props,
      ...overlayRefProps,
      ...arrowPosition,
      // 防止 child offset 被 Overlay offset 覆盖
      ...(child.props.offset ? {offset: child.props.offset} : {}),
      // FIXME: Don't forward `positionLeft` and `positionTop` via both props
      // and `props.style`.
      positionLeft,
      positionTop,
      className: classNames(className, child.props.className),
      style: {
        ...child.props.style,
        left: positionLeft,
        top: positionTop,
        visibility: ready ? undefined : 'hidden'
      },
      componentId: this.componentId
    });
  }
}

interface OverlayProps {
  placement?: string;
  show?: boolean;
  transition?: React.ElementType;
  containerPadding?: number;
  children?: any;
  shouldUpdatePosition?: boolean;
  rootClose?: boolean;
  onHide?(props: any, ...args: any[]): any;
  container?:
    | HTMLElement
    | React.ReactNode
    | (() => HTMLElement | React.ReactNode | null | undefined);
  containerSelector?: string;
  target?: React.ReactNode | HTMLElement | Function;
  watchTargetSizeChange?: boolean;
  offset?: [number, number];
  onEnter?(node: HTMLElement): any;
  onEntering?(node: HTMLElement): any;
  onEntered?(node: HTMLElement): any;
  onExit?(node: HTMLElement): any;
  onExiting?(node: HTMLElement): any;
  onExited?(node: HTMLElement): any;
}
interface OverlayState {
  exited: boolean;
}
export default class Overlay extends React.Component<
  OverlayProps,
  OverlayState
> {
  static defaultProps = {
    placement: 'auto'
  };
  static contextType = EnvContext;
  declare context: React.ContextType<typeof EnvContext>;
  constructor(props: OverlayProps) {
    super(props as any);

    this.state = {
      exited: !props.show
    };
  }

  position: any = null;
  positionRef = (position: any) => {
    this.position = position;
  };

  updatePosition() {
    this.position?.maybeUpdatePosition(true);
  }

  componentDidUpdate(prevProps: OverlayProps, prevState: OverlayState) {
    const props = this.props;
    if (prevProps.show !== props.show && props.show) {
      this.setState({exited: false});
    } else if (props.transition !== prevProps.transition && !props.transition) {
      // Otherwise let handleHidden take care of marking exited.
      this.setState({exited: true});
    }
  }

  @autobind
  onHiddenListener(node: HTMLElement) {
    this.setState({exited: true});

    if (this.props.onExited) {
      this.props.onExited(node);
    }
  }

  @autobind
  getContainerSelector() {
    const containerSelector = this.props.containerSelector;
    let container = null;

    if (typeof containerSelector === 'string') {
      container = document.querySelector(containerSelector);
    }

    return container;
  }

  getTargetDom() {
    const {target} = this.props;
    const targetElement = typeof target === 'function' ? target() : target;
    return resolveDOMElement(targetElement);
  }

  getTriggerThemeScope(themeName?: string) {
    return (
      getNearestThemeScope(this.getTargetDom() as HTMLElement) ||
      (themeName ? getThemeScope(themeName) : null) ||
      this.context?.theme?.scope ||
      getThemeScope(this.context?.theme?.name)
    );
  }

  getScopedContainerResolver(container: any, triggerScope: ThemeScope) {
    return () => {
      const triggerFallback = ownerDocument(this.getTargetDom()).body;
      const resolvedContainer = getContainer(container, triggerFallback);
      const fallback = ownerDocument(resolvedContainer).body;

      return resolveOverlayContainer(resolvedContainer, fallback, triggerScope)
        .container;
    };
  }

  getOverlayThemeScopeResolver(container: any, triggerScope: ThemeScope) {
    return () => {
      const triggerFallback = ownerDocument(this.getTargetDom()).body;
      const resolvedContainer = getContainer(container, triggerFallback);
      const fallback = ownerDocument(resolvedContainer).body;

      return resolveOverlayContainer(resolvedContainer, fallback, triggerScope)
        .scope;
    };
  }

  renderWithThemeContext(themeName?: string) {
    const {
      containerPadding,
      target,
      placement,
      shouldUpdatePosition,
      rootClose,
      children,
      watchTargetSizeChange,
      transition: Transition,
      offset,
      ...props
    } = this.props;
    const container =
      (this.getContainerSelector()
        ? this.getContainerSelector
        : this.props.container) || this.context?.getModalContainer;
    const triggerScope = this.getTriggerThemeScope(themeName);
    const scopedContainer = this.getScopedContainerResolver(
      container,
      triggerScope
    );
    const mountOverlay = props.show || (Transition && !this.state.exited);
    if (!mountOverlay) {
      // Don't bother showing anything if we don't have to.
      return null;
    }
    const themeScope = this.getOverlayThemeScopeResolver(
      container,
      triggerScope
    );
    const scope = themeScope();
    const scopeProps = {
      [scope.attribute]: scope.value
    };

    const renderChild = (rootCloseRef?: React.Ref<HTMLElement>) => {
      let child = children;

      // Position is be inner-most because it adds inline styles into the child,
      // which the other wrappers don't forward correctly.
      child = (
        // @ts-ignore
        <Position
          {...{
            container,
            containerPadding,
            target,
            placement,
            shouldUpdatePosition,
            offset,
            rootCloseRef
          }}
          {...scopeProps}
          ref={this.positionRef}
        >
          {child}
        </Position>
      );

      if (Transition) {
        let {onExit, onExiting, onEnter, onEntering, onEntered} = props;

        // This animates the child node by injecting props, so it must precede
        // anything that adds a wrapping div.
        child = (
          // `transition` is an arbitrary adapter prop and Overlay does not own
          // its animated DOM node. Keep this seam explicit until callers provide
          // a transition interface with a nodeRef contract.
          <Transition
            in={props.show}
            appear
            onExit={onExit}
            onExiting={onExiting}
            onExited={this.onHiddenListener}
            onEnter={onEnter}
            onEntering={onEntering}
            onEntered={onEntered}
          >
            {child}
          </Transition>
        );
      }

      return child;
    };

    // RootClose listens on the actual overlay DOM captured by Position.
    if (rootClose) {
      return (
        // @ts-ignore
        <Portal container={scopedContainer}>
          <RootClose onRootClose={props.onHide}>
            {(ref: React.Ref<HTMLElement>) => renderChild(ref)}
          </RootClose>
        </Portal>
      );
    }

    // @ts-ignore
    return <Portal container={scopedContainer}>{renderChild()}</Portal>;
  }

  render() {
    return (
      <ThemeContext.Consumer>
        {themeName => this.renderWithThemeContext(themeName)}
      </ThemeContext.Consumer>
    );
  }
}
