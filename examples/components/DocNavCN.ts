import React from 'react';
import makeMarkdownRenderer from './MdRenderer';
function wrapDoc(doc: any) {
  return {
    default: makeMarkdownRenderer(doc)
  };
}

export default [
  {
    // prefix: ({classnames: cx}) => <li className={cx('AsideNav-divider')} />,
    label: '📌  开始',
    children: [
      {
        label: '介绍',
        path: '/zh-CN/docs/index',
        component: React.lazy(() =>
          import('../../docs/zh-CN/index.md').then(wrapDoc)
        )
      },

      {
        label: '快速开始',
        path: '/zh-CN/docs/start/getting-started',
        component: React.lazy(() =>
          import('../../docs/zh-CN/start/getting-started.md').then(wrapDoc)
        )
      },

      {
        label: '更新记录',
        path: '/zh-CN/docs/start/changelog',
        component: React.lazy(() =>
          import('../../docs/zh-CN/start/changelog.md').then(wrapDoc)
        )
      },

      {
        label: '常见问题',
        path: '/zh-CN/docs/start/faq',
        component: React.lazy(() =>
          import('../../docs/zh-CN/start/faq.md').then(wrapDoc)
        )
      }
    ]
  },

  {
    label: '💡  概念',
    children: [
      {
        label: '配置与组件',
        path: '/zh-CN/docs/concepts/schema',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/schema.md').then(wrapDoc)
        )
      },
      {
        label: '渲染器架构',
        path: '/zh-CN/docs/concepts/renderer-architecture',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/renderer-architecture.md').then(
            wrapDoc
          )
        )
      },
      {
        label: '数据域与数据链',
        path: '/zh-CN/docs/concepts/datascope-and-datachain',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/datascope-and-datachain.md').then(
            wrapDoc
          )
        )
      },
      {
        label: '模板',
        path: '/zh-CN/docs/concepts/template',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/template.md').then(wrapDoc)
        )
      },
      {
        label: '数据映射',
        path: '/zh-CN/docs/concepts/data-mapping',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/data-mapping.md').then(wrapDoc)
        )
      },
      {
        label: '表达式',
        path: '/zh-CN/docs/concepts/expression',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/expression.md').then(wrapDoc)
        )
      },
      {
        label: '联动',
        path: '/zh-CN/docs/concepts/linkage',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/linkage.md').then(wrapDoc)
        )
      },
      {
        label: '事件动作',
        path: '/zh-CN/docs/concepts/event-action',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/event-action.md').then(wrapDoc)
        )
      },
      {
        label: '行为',
        path: '/zh-CN/docs/concepts/action',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/action.md').then(wrapDoc)
        )
      },
      {
        label: '样式',
        path: '/zh-CN/docs/concepts/style',
        component: React.lazy(() =>
          import('../../docs/zh-CN/concepts/style.md').then(wrapDoc)
        )
      }
    ]
  },

  {
    label: '类型',
    children: [
      {
        label: 'SchemaNode',
        path: '/zh-CN/docs/types/schemanode',
        component: React.lazy(() =>
          import('../../docs/zh-CN/types/schemanode.md').then(wrapDoc)
        )
      },
      {
        label: 'ClassName',
        path: '/zh-CN/docs/types/classname',
        component: React.lazy(() =>
          import('../../docs/zh-CN/types/classname.md').then(wrapDoc)
        )
      },
      {
        label: 'API',
        path: '/zh-CN/docs/types/api',
        component: React.lazy(() =>
          import('../../docs/zh-CN/types/api.md').then(wrapDoc)
        )
      },
      {
        label: 'Definitions',
        path: '/zh-CN/docs/types/definitions',
        component: React.lazy(() =>
          import('../../docs/zh-CN/types/definitions.md').then(wrapDoc)
        )
      }
    ]
  },

  {
    label: '💎  高级',
    children: [
      {
        label: '工作原理',
        path: '/zh-CN/docs/extend/internal',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/internal.md').then(wrapDoc)
        )
      },
      {
        label: '自定义组件 - SDK',
        path: '/zh-CN/docs/extend/custom-sdk',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/custom-sdk.md').then(wrapDoc)
        )
      },
      {
        label: '自定义组件 - React',
        path: '/zh-CN/docs/extend/custom-react',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/custom-react.md').then(wrapDoc)
        )
      },
      {
        label: '将 amis 当成 UI 库用',
        path: '/zh-CN/docs/extend/ui-library',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/ui-library.md').then(wrapDoc)
        )
      },
      {
        label: '扩展现有组件',
        path: '/zh-CN/docs/extend/addon',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/addon.md').then(wrapDoc)
        )
      },
      {
        label: '页面交互行为跟踪',
        path: '/zh-CN/docs/extend/tracker',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/tracker.md').then(wrapDoc)
        )
      },
      {
        label: '调试工具',
        path: '/zh-CN/docs/extend/debug',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/debug.md').then(wrapDoc)
        )
      },
      {
        label: '移动端定制',
        path: '/zh-CN/docs/extend/mobile',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/mobile.md').then(wrapDoc)
        )
      },
      {
        label: '多语言',
        path: '/zh-CN/docs/extend/i18n',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/i18n.md').then(wrapDoc)
        )
      },
      {
        label: '如何贡献代码',
        path: '/zh-CN/docs/extend/contribute',
        component: React.lazy(() =>
          import('../../docs/zh-CN/extend/contribute.md').then(wrapDoc)
        )
      }
    ]
  }
];
