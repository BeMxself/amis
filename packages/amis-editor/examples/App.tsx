import * as React from 'react';
import {AlertComponent, ToastComponent, ContextMenu} from 'amis';
// @ts-ignore
import AMisSchemaEditor from './Editor';
import {Link} from 'react-router-dom';

function getDemoTheme() {
  if (typeof window === 'undefined') {
    return 'cxd';
  }

  const theme =
    new URLSearchParams(window.location.search).get('theme') ||
    window.localStorage.getItem('amis-theme') ||
    document.documentElement.getAttribute('data-prismui-theme') ||
    'cxd';

  return theme === 'dark' ? 'dark' : 'cxd';
}

export default class App extends React.PureComponent {
  render() {
    // 备注: 如果需要改用antd主题，还需要将index.html换成index-antd.html
    const curTheme = getDemoTheme(); // 默认使用cxd主题
    return (
      <div className="Editor-Demo">
        <div id="headerBar" className="Editor-header">
          <div className="Editor-title">
            amis 可视化编辑器&nbsp;
            <Link to="/basic">面板模版</Link>
          </div>
        </div>
        <AMisSchemaEditor theme={curTheme} />
        <ToastComponent theme={curTheme} />
        <AlertComponent theme={curTheme} />
        <ContextMenu theme={curTheme} />
      </div>
    );
  }
}
