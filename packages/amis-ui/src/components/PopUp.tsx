/**
 * @file PopUp
 * @description
 * @author fex
 */

import React from 'react';
import {
  applyThemeScope,
  getThemeScope,
  resolveOverlayContainer,
  setReactRef,
  themeable,
  ThemeProps
} from 'amis-core';
import {localeable, LocaleProps} from 'amis-core';
import Transition, {
  ENTERED,
  EXITING,
  EXITED,
  ENTERING
} from 'react-transition-group/Transition';
import Portal from 'react-overlays/Portal';
import {Icon} from './icons';
import Button from './Button';

export interface PopUpPorps extends ThemeProps, LocaleProps {
  title?: string;
  className?: string;
  style?: {
    [styleName: string]: string;
  };
  overlay?: boolean;
  onHide?: () => void;
  isShow?: boolean;
  container?: any;
  showConfirm?: boolean;
  onConfirm?: (value: any) => void;
  showClose?: boolean;
  placement?: 'left' | 'center' | 'right';
  header?: JSX.Element;
  children?: React.ReactNode | Array<React.ReactNode>;
  onExited?: () => void;
  onEntered?: () => void;
  forwardedRef?: React.Ref<HTMLDivElement>;
}

const fadeStyles: {
  [propName: string]: string;
} = {
  [ENTERED]: '',
  [EXITING]: 'out',
  [EXITED]: '',
  [ENTERING]: 'in'
};
export class PopUp extends React.PureComponent<PopUpPorps> {
  scrollTop: number = 0;
  portalThemeScope = getThemeScope();
  static defaultProps = {
    className: '',
    overlay: true,
    isShow: false,
    container: document.body,
    showClose: true,
    onConfirm: () => {}
  };
  componentDidUpdate(prevProps: PopUpPorps) {
    if (prevProps.forwardedRef !== this.props.forwardedRef) {
      setReactRef(prevProps.forwardedRef, null);
      setReactRef(this.props.forwardedRef, this.popupRef.current);
    }

    if (this.props.isShow) {
      this.scrollTop =
        document.body.scrollTop || document.documentElement.scrollTop;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
      document.body.scrollTop = this.scrollTop;
    }
  }
  componentWillUnmount() {
    setReactRef(this.props.forwardedRef, null);
    document.body.style.overflow = 'auto';
    document.body.scrollTop = this.scrollTop;
  }
  handleClick(e: React.MouseEvent) {
    e.stopPropagation();
  }

  getScopedContainer = () => {
    const {container, theme} = this.props;
    const resolvedContainer =
      typeof container === 'function' ? container() : container;
    const triggerScope = getThemeScope(theme);

    if (!resolvedContainer) {
      this.portalThemeScope = triggerScope;
      return resolvedContainer;
    }

    const resolution = resolveOverlayContainer(
      resolvedContainer,
      document.body,
      triggerScope
    );

    this.portalThemeScope = resolution.scope;
    return resolution.container;
  };

  popupRef: React.MutableRefObject<HTMLDivElement | null> = {current: null};

  setPopupRef = (ref: HTMLDivElement | null) => {
    this.popupRef.current = ref;
    setReactRef(this.props.forwardedRef, ref);
    if (ref) {
      applyThemeScope(ref, this.portalThemeScope);
    }
  };

  render() {
    const {
      style,
      title,
      children,
      overlay,
      onHide,
      onConfirm,
      classPrefix: ns,
      classnames: cx,
      className,
      isShow,
      container: _container,
      showConfirm,
      translate: __,
      showClose,
      header,
      placement = 'center',
      onEntered,
      onExited,
      ...rest
    } = this.props;

    const outerStyle: any = {
      ...style
    };
    delete outerStyle.top;
    return (
      <Portal container={this.getScopedContainer}>
        <Transition
          nodeRef={this.popupRef}
          onEntered={onEntered}
          onExit={onExited}
          mountOnEnter
          unmountOnExit
          in={isShow}
          timeout={500}
          appear
        >
          {(status: string) => {
            return (
              <div
                ref={this.setPopupRef}
                className={cx(`${ns}PopUp`, className, fadeStyles[status])}
                style={outerStyle}
                {...rest}
                onClick={this.handleClick}
              >
                {overlay && (
                  <div className={`${ns}PopUp-overlay`} onClick={onHide} />
                )}
                <div className={cx(`${ns}PopUp-inner`)}>
                  {!showConfirm && showClose ? (
                    <div className={cx(`${ns}PopUp-closeWrap`)}>
                      {header}
                      <span className={cx(`PopUp-closeBox`)} onClick={onHide}>
                        <Icon
                          icon="close"
                          className={cx('icon', `${ns}PopUp-close`)}
                        />
                      </span>
                    </div>
                  ) : null}
                  {showConfirm && (
                    <div className={cx(`${ns}PopUp-toolbar`)}>
                      <Button
                        className={cx(`${ns}PopUp-cancel`)}
                        level="link"
                        onClick={onHide}
                      >
                        {__('cancel')}
                      </Button>
                      {title && (
                        <span className={cx(`${ns}PopUp-title`)}>{title}</span>
                      )}
                      <Button
                        className={cx(`${ns}PopUp-confirm`)}
                        level="link"
                        onClick={onConfirm}
                      >
                        {__('confirm')}
                      </Button>
                    </div>
                  )}
                  <div
                    className={cx(`${ns}PopUp-content`, `justify-${placement}`)}
                  >
                    {isShow ? children : null}
                  </div>
                  <div className={cx(`PopUp-safearea`)}></div>
                </div>
              </div>
            );
          }}
        </Transition>
      </Portal>
    );
  }
}

export default themeable(localeable(PopUp));
