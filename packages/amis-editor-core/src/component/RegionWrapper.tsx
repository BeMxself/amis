import {isAlive} from 'mobx-state-tree';
import React from 'react';
import {getReactElementRef, mergeRefs, setReactRef} from 'amis-core';
import {EditorManager} from '../manager';
import {RegionConfig, RendererInfo} from '../plugin';
import {needFillPlaceholder} from '../util';
import {EditorStoreType} from '../store/editor';
import {
  EditorNodeContext,
  EditorNodeType,
  getEditorNodeFacade,
  resolveEditorNodeFacade
} from '../store/node';
import {RendererProps} from 'amis-core';

export interface RegionWrapperProps {
  name: string;
  label: string;
  placeholder?: string | JSX.Element;
  preferTag?: string;
  wrapperResolve?: (dom: HTMLElement, props: RendererProps) => HTMLElement;
  editorStore: EditorStoreType;
  manager: EditorManager;
  rendererName?: string;
  regionConfig: RegionConfig;
  $$editor?: RendererInfo; // 当前节点信息（info）
  forwardedRef?: React.Ref<HTMLElement>;
  children?: React.ReactNode;
}

/**
 * 1.DOM标记 添加 data-region、data-region-host 和 data-renderer 属性
 * 2.构建 Node store 节点。
 */
export class RegionWrapper extends React.Component<RegionWrapperProps> {
  static contextType = EditorNodeContext;
  parentNode: EditorNodeType;
  editorNode: EditorNodeType;
  rootDom: HTMLElement | null = null;
  placeholderDom: HTMLSpanElement | null = null;

  setRootRef = (ref: HTMLElement | null) => {
    this.rootDom = ref;
    this.syncForwardedRef();
  };

  setPlaceholderRef = (ref: HTMLSpanElement | null) => {
    this.placeholderDom = ref;
    this.syncForwardedRef();
  };

  getMarkerDom() {
    return this.rootDom || this.placeholderDom;
  }

  syncForwardedRef() {
    setReactRef(this.props.forwardedRef, this.getMarkerDom());
  }

  UNSAFE_componentWillMount() {
    this.parentNode = resolveEditorNodeFacade(this.context as any)!;

    /**
     * 当前parent为空时尝试通过节点id获取当前上下文
     * 备注：非react容器类自定义组件需要
     */
    const {$$editor, manager} = this.props;
    if (!this.parentNode && $$editor && $$editor.id) {
      const curContext = manager.store.getNodeById($$editor.id);
      if (curContext) {
        this.parentNode = curContext;
      }
    }

    if (!this.parentNode) {
      return;
    }

    this.editorNode = this.parentNode.addChild({
      id: this.parentNode.id,
      type: this.parentNode.type,
      label: this.props.label,
      path: `${this.parentNode.path}/${this.props.name}`,
      region: this.props.name, // regions中的key值
      regionInfo: this.props.regionConfig,
      preferTag: this.props.preferTag
    });
  }

  componentDidMount() {
    if (this.editorNode && isAlive(this.editorNode)) {
      this.editorNode &&
        this.markDom(
          this.editorNode.id,
          this.props.name,
          this.props.rendererName
        );
    }
  }

  componentDidUpdate(prevProps: RegionWrapperProps) {
    if (prevProps.forwardedRef !== this.props.forwardedRef) {
      setReactRef(prevProps.forwardedRef, null);
      this.syncForwardedRef();
    }

    this.editorNode &&
      this.markDom(
        this.editorNode.id,
        this.props.name,
        this.props.rendererName
      );
  }

  componentWillUnmount() {
    setReactRef(this.props.forwardedRef, null);

    if (this.editorNode && isAlive(this.editorNode) && this.parentNode) {
      this.parentNode.removeChild(this.editorNode);
    }
  }

  /**
   * 弄点标记
   */
  markDom(id: string, region: string, rendererName?: string) {
    const dom = this.getMarkerDom();

    if (!dom) {
      return;
    }
    const wrapperResolve = this.props.wrapperResolve;
    const wrapper = wrapperResolve
      ? wrapperResolve(dom, this.props as any)
      : dom.parentElement!;

    wrapper.setAttribute('data-region', region);
    wrapper.setAttribute('data-region-host', id);
    rendererName && wrapper.setAttribute('data-renderer', rendererName);
  }

  renderChildren() {
    let attached = false;

    return React.Children.map(this.props.children, child => {
      if (attached || !React.isValidElement(child)) {
        return child;
      }

      attached = true;

      if (typeof child.type === 'string') {
        return React.cloneElement(child, {
          ref: mergeRefs(getReactElementRef(child), this.setRootRef)
        } as any);
      }

      return React.cloneElement(child, {
        forwardedRef: mergeRefs(
          (child.props as any).forwardedRef,
          this.setRootRef
        )
      } as any);
    });
  }

  render() {
    const isLayoutItem =
      this.props.rendererName === 'wrapper' ||
      this.props.rendererName === 'container';
    let isNeedFillPlaceholder = false;
    if (needFillPlaceholder(this.props)) {
      isNeedFillPlaceholder = true;
    }
    return (
      <EditorNodeContext.Provider value={getEditorNodeFacade(this.editorNode)}>
        {this.renderChildren()}
        <span
          ref={this.setPlaceholderRef}
          className={`ae-Region-placeholder ${
            isLayoutItem ? 'layout-content' : ''
          } ${isNeedFillPlaceholder ? 'fill-placeholder' : ''}`}
        >
          {this.props.placeholder || this.props.label}
        </span>
      </EditorNodeContext.Provider>
    );
  }
}
