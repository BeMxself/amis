import * as React from 'react';
import {resizeSensor} from 'amis-core';

export type Size = {
  height: number;
  width: number;
};

export type AutoSizerProps = {
  WrapperComponent?: React.ElementType;
  minHeight?: number;
  children: (props: Size) => React.ReactNode;
  onResize?: (props: Size) => void;
};

export default class AutoSizer extends React.PureComponent<
  AutoSizerProps,
  Size
> {
  unSensor: Function;
  rootRef = React.createRef<HTMLElement>();

  constructor(props: AutoSizerProps) {
    super(props);

    this.state = {width: 0, height: 0};
  }

  componentDidMount() {
    const dom = this.rootRef.current;

    if (!dom) {
      return;
    }

    this.unSensor = resizeSensor(dom, () => this.sizer(dom));
    this.sizer(dom);
  }

  componentWillUnmount() {
    this.unSensor && this.unSensor();
  }

  sizer(dom: HTMLElement) {
    const width = dom.offsetWidth;
    const height = dom.offsetHeight;

    this.props?.onResize?.({width, height});

    this.setState({
      width,
      height
    });
  }

  render() {
    const {children, WrapperComponent, minHeight} = this.props;
    const {width, height} = this.state;

    const WrapperCmpt = WrapperComponent ?? 'div';

    return (
      <WrapperCmpt
        ref={this.rootRef as any}
        style={{
          display: 'block',
          position: 'relative',
          width: '100%',
          height: '100%',
          ...(minHeight ? {minHeight} : {})
        }}
      >
        {children({
          width,
          height
        })}
      </WrapperCmpt>
    );
  }
}
