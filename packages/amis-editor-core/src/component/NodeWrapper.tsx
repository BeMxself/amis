import {RendererProps, isObject, mergeRefs} from 'amis-core';
import {observer} from 'mobx-react';
import {isAlive} from 'mobx-state-tree';
import React from 'react';
import merge from 'lodash/merge';
import omit from 'lodash/omit';
import {RendererInfo} from '../plugin';
import {autobind, isEmpty} from '../util';
import {filter} from 'amis-core';

export interface NodeWrapperProps extends RendererProps {
  $$editor: RendererInfo; // 当前节点信息（info）
}

export function getAliveEditorNode(props: Pick<NodeWrapperProps, '$$editor'>) {
  const node = props.$$editor.plugin.manager.store.getNodeById(
    props.$$editor.id
  );

  return node && isAlive(node) ? node : undefined;
}

@observer
export class NodeWrapper extends React.Component<NodeWrapperProps> {
  /** 合并 Mock 配置时应该忽略的属性 */
  omitMockProps = ['id', '$$id', 'enable', 'maxDisplayRows'];
  rootRef: React.RefObject<HTMLElement | null> = React.createRef();

  componentDidMount() {
    this.markDom(this.props.$$editor.id);

    // 稍微等会，因为有可能别的 node 还没更新完成。
    const node = getAliveEditorNode(this.props);
    node &&
      requestAnimationFrame(() => {
        () => isAlive(node) && node.calculateHighlightBox();
      });
  }

  componentDidUpdate(prevProps: NodeWrapperProps) {
    this.markDom(this.props.$$editor.id);
  }

  ref: any;
  getWrappedInstance() {
    return this.ref;
  }

  @autobind
  refFn(ref: any) {
    this.ref = ref;
  }

  protected getRootDom() {
    return this.rootRef.current;
  }

  /**
   * 弄点标记
   */
  markDom(id: string) {
    const root = this.getRootDom();

    if (!root || !id) {
      return;
    }

    const info = this.props.$$editor;
    let visible =
      this.props.$$visible !== false && this.props.$$hidden !== true;

    if (visible) {
      const schema = this.props.$schema;
      const data = this.props.data;
      const id = filter(schema.id, data);
      const name = filter(schema.name, data);
      const states = (this.props.statusStore as any).raw.visibleState as any;

      if ((states[id] ?? states[name]) === false) {
        visible = false;
      }
    }

    let dom = info.wrapperResolve
      ? info.wrapperResolve(root, this.props)
      : root;
    (Array.isArray(dom) ? dom : dom ? [dom] : []).forEach(dom => {
      dom.setAttribute('data-editor-id', id);
      dom.setAttribute('name', this.props.id);
      dom.setAttribute('data-visible', visible ? '' : 'false');
      dom.setAttribute('data-hide-text', visible ? '' : '<隐藏状态>');

      if (info.regions) {
        dom.setAttribute('data-container', '');
      } else {
        dom.removeAttribute('data-container');
      }
    });
    info.plugin?.markDom?.(dom, this.props);
  }

  render() {
    // store 可能有循环引用，不能调用 JSONPipeOut
    let {$$editor, store, ...rest} = this.props;
    const renderer = $$editor.renderer;
    const editorNode = getAliveEditorNode(this.props);

    if ($$editor.filterProps) {
      rest = $$editor.filterProps.call($$editor.plugin, rest, editorNode);
    }

    const mockProps = omit(rest?.editorSetting?.mock, this.omitMockProps);

    // 自动合并假数据
    if (isObject(mockProps) && !isEmpty(mockProps)) {
      rest = merge(rest, mockProps);
    }

    if ($$editor.renderRenderer) {
      return $$editor.renderRenderer.call(
        $$editor.plugin,
        {
          ...rest,
          store,
          ...editorNode?.state,
          $$editor,
          ...$$editor.wrapperProps,
          forwardedRef: mergeRefs(
            (rest as any).forwardedRef,
            this.rootRef,
            this.refFn
          ),
          ref: this.refFn
        },
        $$editor
      );
    }
    const Component = renderer.component!;

    const supportRef =
      Component.prototype?.isReactComponent ||
      (Component as any).$$typeof === Symbol.for('react.forward_ref');

    return (
      <Component
        {...rest}
        store={store}
        {...editorNode?.state}
        $$editor={$$editor}
        {...$$editor.wrapperProps}
        forwardedRef={mergeRefs((rest as any).forwardedRef, this.rootRef)}
        ref={supportRef ? this.refFn : undefined}
      />
    );
  }
}
