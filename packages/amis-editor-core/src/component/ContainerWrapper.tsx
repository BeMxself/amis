import {getAliveEditorNode, NodeWrapper, NodeWrapperProps} from './NodeWrapper';
import React from 'react';
import {observer} from 'mobx-react';
import {autobind} from '../util';
import type {Schema} from 'amis';
import find from 'lodash/find';
import {RegionWrapper} from './RegionWrapper';

export interface ContainerWrapperProps extends NodeWrapperProps {}

@observer
export class ContainerWrapper extends React.Component<ContainerWrapperProps> {
  ref: any;
  getWrappedInstance() {
    return this.ref;
  }

  @autobind
  refFn(ref: any) {
    this.ref = ref;
  }

  /*
    由于基本上容器渲染器都是通过 this.props.render('region', subScheme) 来渲染孩子节点的。
    所以 ContainerWrapper 只要修改下发的 render 即可完成包裹。
   */
  @autobind
  renderChild(
    region: string,
    node: Schema,
    props: any,
    wrapperProps: ContainerWrapperProps
  ) {
    const {render, $$editor, $schema} = wrapperProps;
    const editorNode = getAliveEditorNode(wrapperProps);

    if (
      $$editor.regions?.find(item => item.key === region)?.hiddenOn?.($schema)
    ) {
      return null;
    }

    const child = render(region, node, props);

    if (editorNode?.memberImmutable(region)) {
      return child;
    }

    const config = find(
      $$editor.regions,
      item => item.key === region && !item.matchRegion && !item.renderMethod
    );

    if (config) {
      const Region = config.wrapper || RegionWrapper;

      return (
        <Region
          key={props?.key}
          preferTag={config.preferTag}
          name={config.key}
          label={config.label}
          placeholder={config.placeholder}
          regionConfig={config}
          editorStore={$$editor.plugin.manager.store}
          wrapperResolve={config.wrapperResolve}
          manager={$$editor.plugin.manager}
          children={child}
          rendererName={$$editor.renderer.name}
          $$editor={$$editor}
        />
      );
    }

    return child;
  }

  render() {
    const wrapperProps = this.props;
    const {$$editor, ...rest} = wrapperProps;
    const props: any = {};
    const editorStore = $$editor.plugin.manager.store;
    const editorNode = getAliveEditorNode(wrapperProps);
    const renderChild = (region: string, node: Schema, props: any) =>
      this.renderChild(region, node, props, wrapperProps);

    if (
      $$editor.id &&
      (editorStore.isActive($$editor.id) ||
        editorStore.dropId === $$editor.id) &&
      Array.isArray($$editor.regions)
    ) {
      $$editor.regions.forEach(({key, optional}) => {
        if (optional) {
          return;
        } else if (editorNode?.memberImmutable(key)) {
          return;
        }

        let defaultRegion: any[] = [];
        // /**
        //  * form表单的按钮组特殊处理
        //  * 原因：确保编辑态也显示默认的提交按钮
        //  */
        // if (
        //   key === 'actions' &&
        //   (typeof rest.submitText === 'undefined' || rest.submitText)
        // ) {
        //   defaultRegion = [
        //     {
        //       type: 'submit',
        //       label: rest.submitText || '提交',
        //       primary: true
        //     }
        //   ];
        // }

        let region = Array.isArray(rest[key])
          ? rest[key]
          : rest[key]
          ? [rest[key]]
          : defaultRegion;

        if (!region.length) {
          region = region.concat();
          region.push({children: () => null});
        }

        props[key] = region;
      });
    }

    return (
      <NodeWrapper
        {...rest}
        {...props}
        $$editor={$$editor}
        render={renderChild}
        ref={this.refFn}
      />
    );
  }
}
