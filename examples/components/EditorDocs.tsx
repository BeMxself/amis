import React from 'react';
import {Switch} from 'react-router-dom';
import {flattenTree, mapTree} from 'amis-core';
import {navigations2route} from './App';
import makeMarkdownRenderer from './MdRenderer';
import EditorPlayground from './EditorPlayground';

function wrapDoc(doc: any) {
  return {
    default: makeMarkdownRenderer(doc)
  };
}

export const editorDocs = [
  {
    label: '编辑器',
    children: [
      {
        label: '在线编辑器',
        icon: 'fa fa-magic',
        path: '/zh-CN/editor/index',
        component: EditorPlayground
      },
      {
        label: '使用文档',
        icon: 'fa fa-book',
        path: '/zh-CN/editor/editor',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/editor.md').then(wrapDoc)
        )
      },
      {
        label: '编辑器架构',
        icon: 'fa fa-sitemap',
        hidden: true,
        path: '/zh-CN/editor/editor-architecture',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/editor-architecture.md').then(wrapDoc)
        )
      },
      {
        label: '定制指南',
        icon: 'fa fa-sliders',
        path: '/zh-CN/editor/editor-customization',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/editor-customization.md').then(
            wrapDoc
          )
        )
      }
    ]
  }
];

export default class EditorDocs extends React.PureComponent<any> {
  state = {
    prevDoc: null,
    nextDoc: null
  };

  componentDidMount() {
    this.props.setNavigations(editorDocs);
    this.setDocFooter();
  }

  componentDidUpdate(preProps: any) {
    if (this.props.location.pathname !== preProps.location.pathname) {
      this.props.setNavigations(editorDocs, false);
      this.setDocFooter();
    }
  }

  setDocFooter() {
    const newDocs = mapTree(editorDocs, (doc: any) => ({
      ...doc,
      children:
        Array.isArray(doc.children) && doc.children.length
          ? doc.children
              .filter((item: any) => !item.hidden)
              .map((item: any) => ({
                ...item,
                group: doc.group || doc.label
              }))
          : null
    }));
    const flattenDocs = flattenTree(newDocs).filter((i: any) => !!i.path);
    const docIndex = flattenDocs.findIndex(
      (d: any) => `${this.props.ContextPath}${d.path}` === location.pathname
    );

    this.setState({
      prevDoc: flattenDocs[docIndex - 1],
      nextDoc: flattenDocs[docIndex + 1]
    });
  }

  render() {
    return (
      <Switch>
        {navigations2route(editorDocs, {
          theme: this.props.theme,
          classPrefix: this.props.classPrefix,
          locale: this.props.locale,
          viewMode: this.props.viewMode,
          offScreen: this.props.offScreen,
          ContextPath: this.props.ContextPath,
          prevDoc: this.state.prevDoc,
          nextDoc: this.state.nextDoc
        })}
      </Switch>
    );
  }
}
