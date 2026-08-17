import React from 'react';
import {Button, Switch} from 'amis-ui';
import {Editor as VisualEditor} from 'amis-editor';

const storageKey = 'prismui_editor_schema';
const previewStorageKey = 'prismui_editor_preview';

const defaultSchema = {
  type: 'page',
  title: 'Simple Form Page',
  regions: ['body'],
  body: [
    {
      type: 'form',
      title: '客户信息',
      mode: 'horizontal',
      body: [
        {
          type: 'input-text',
          name: 'name',
          label: '客户名称',
          value: 'PrismUI'
        },
        {
          type: 'select',
          name: 'level',
          label: '客户等级',
          value: 'enterprise',
          options: [
            {
              label: '企业版',
              value: 'enterprise'
            },
            {
              label: '专业版',
              value: 'pro'
            }
          ]
        },
        {
          type: 'textarea',
          name: 'remark',
          label: '备注',
          value: '可以在右侧属性面板中继续调整这个表单。'
        }
      ],
      actions: [
        {
          type: 'button',
          label: '保存',
          level: 'primary'
        }
      ]
    }
  ]
};

function getInitialSchema() {
  try {
    const cachedSchema = getStorageItem(storageKey);
    return cachedSchema ? JSON.parse(cachedSchema) : cloneDefaultSchema();
  } catch (e) {
    return cloneDefaultSchema();
  }
}

function getStorageItem(key) {
  try {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(key)
      : null;
  } catch (e) {
    return null;
  }
}

function setStorageItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

function removeStorageItem(key) {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
}

function getInitialPreview() {
  return getStorageItem(previewStorageKey) === 'true';
}

function cloneDefaultSchema() {
  return JSON.parse(JSON.stringify(defaultSchema));
}

export default class EditorPlayground extends React.Component {
  state = {
    preview: getInitialPreview(),
    schema: getInitialSchema()
  };

  handleChange = value => {
    setStorageItem(storageKey, JSON.stringify(value));
    this.setState({schema: value});
  };

  handlePreviewChange = preview => {
    if (preview) {
      setStorageItem(previewStorageKey, 'true');
    } else {
      removeStorageItem(previewStorageKey);
    }

    this.setState({preview: Boolean(preview)});
  };

  resetSchema = () => {
    removeStorageItem(storageKey);
    this.setState({schema: cloneDefaultSchema()});
  };

  render() {
    const {ContextPath, theme} = this.props;
    const {preview, schema} = this.state;
    const schemaUrl = `${ContextPath || ''}/schema.json`;

    return (
      <div className="Doc-content EditorWorkbench">
        <div className="EditorWorkbench-toolbar">
          <div>
            <h1>可视化编辑器</h1>
            <p>直接在页面里体验拖拽搭建、组件选中和右侧属性配置。</p>
          </div>
          <div className="EditorWorkbench-actions">
            <label>
              <span>预览</span>
              <Switch
                value={preview}
                onChange={this.handlePreviewChange}
                className="v-middle"
                inline
              />
            </label>
            <Button size="sm" onClick={this.resetSchema}>
              重置示例
            </Button>
          </div>
        </div>

        <div className="EditorWorkbench-stage">
          <VisualEditor
            preview={preview}
            value={schema}
            onChange={this.handleChange}
            className="is-fixed"
            theme={theme || 'cxd'}
            showCustomRenderersPanel={true}
            $schemaUrl={schemaUrl}
          />
        </div>
      </div>
    );
  }
}
