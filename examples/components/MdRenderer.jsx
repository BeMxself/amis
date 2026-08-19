/* eslint-disable no-unused-vars */
import React from 'react';
import {createRoot} from 'react-dom/client';
import {getTheme, render} from 'amis';
import {LazyComponent} from 'amis-core';
import {Overlay} from 'amis-core';
import {PopOver} from 'amis-core';
import {__uri, loadScript} from 'amis-core';
import classnames from 'classnames';
import {Link} from 'react-router-dom';
import Play from './Play';

let mermaidLoader = null;

const mermaidScriptUrls = [
  __uri('../../node_modules/mermaid/dist/mermaid.min.js'),
  __uri('/docs/vendor/mermaid/mermaid.min.js')
];

function loadMermaidScript(urls) {
  const [url, ...rest] = urls;

  if (!url) {
    return Promise.reject(new Error('Mermaid failed to load.'));
  }

  return loadScript(url).catch(error => {
    if (!rest.length) {
      throw error;
    }

    return loadMermaidScript(rest);
  });
}

function loadMermaid() {
  if (window.mermaid) {
    return Promise.resolve(window.mermaid);
  }

  if (!mermaidLoader) {
    mermaidLoader = loadMermaidScript(mermaidScriptUrls).then(() => {
      if (!window.mermaid) {
        throw new Error('Mermaid failed to load.');
      }

      return window.mermaid;
    });
  }

  return mermaidLoader;
}

class CodePreview extends React.Component {
  state = {
    PlayGround: null
  };

  render() {
    const {container, setAsideFolded, setHeaderVisible, ...rest} = this.props;

    return <Play {...rest} mini />;
  }
}

function eachDom(dom, iterator) {
  if (!dom) {
    return;
  }

  iterator(dom);

  if (dom.children && dom.children.length) {
    [].slice.call(dom.children).forEach(dom => eachDom(dom, iterator));
  }
}

function getComponentClassPrefix(theme) {
  return getTheme(theme)?.componentClassPrefix || 'prismui-';
}

class Preview extends React.Component {
  static displayName = 'MarkdownRenderer';
  rootRef = React.createRef();
  ref = null;
  roots = [];
  mermaidRenderId = 0;
  mermaidRenderRequest = 0;
  constructor(props) {
    super(props);
    this.divRef = this.divRef.bind(this);
  }

  componentDidMount() {
    this.renderSchema();
    this.fixHtmlPreview();
    this.renderMermaid();

    if (location.hash && location.hash.length > 1) {
      // 禁用自动跳转
      if (window.history && 'scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'manual';
      }

      const dom = document.querySelector(
        `[name="${location.hash.substring(1)}"]`
      );
      dom && dom.scrollIntoView();
    }
  }

  componentDidUpdate() {
    this.renderSchema();
    this.fixHtmlPreview();
    this.renderMermaid();
  }

  componentWillUnmount() {
    this.mermaidRenderRequest += 1;

    // 立即 unmout 会报错
    window.requestAnimationFrame(() => {
      this.roots.forEach(root => root.unmount());
    });
  }

  divRef(ref) {
    this.ref = ref;

    if (ref) {
      ref.innerHTML = this.props.doc.html;
    }
  }

  renderSchema() {
    const scripts = document.querySelectorAll('script[type="text/schema"]');
    if (!scripts && !scripts.length) {
      return;
    }

    for (let i = 0, len = scripts.length; i < len; i++) {
      let script = scripts[i];
      let props = {};
      [].slice.apply(script.attributes).forEach(item => {
        props[item.name] = item.value;
      });

      let dom = document.createElement('div');
      let height = props.height ? parseInt(props.height, 10) : 200;

      if (this.props.viewMode === 'mobile') {
        // 移动端下高度不能太低
        if (height < 500) {
          height = 500;
        }
      }

      dom.setAttribute('class', 'doc-play-ground');
      // dom.setAttribute('style', `min-height: ${height}px;`);
      const origin = script.parentNode;
      origin.parentNode.replaceChild(dom, origin);

      const root = createRoot(dom);
      this.roots.push(root);
      root.render(
        <LazyComponent
          {...this.props}
          container={() => this.rootRef.current}
          component={CodePreview}
          code={script.innerText}
          scope={props.scope}
          // unMountOnHidden
          height={height}
          placeholder="加载中，请稍后。。。"
        />
      );
    }
  }

  normalizeMermaidBlocks() {
    if (!this.ref) {
      return [];
    }

    const blocks = this.ref.querySelectorAll(
      'pre > code.language-mermaid, pre > code.lang-mermaid'
    );
    [].slice.call(blocks).forEach(code => {
      const pre = code.parentNode;
      const source = code.textContent || '';
      const container = document.createElement('div');

      container.className = 'prismui-doc-mermaid';
      container.setAttribute('data-mermaid-source', source);
      container.textContent = source;

      pre.parentNode.replaceChild(container, pre);
    });

    return [].slice.call(this.ref.querySelectorAll('.prismui-doc-mermaid'));
  }

  getMermaidTheme() {
    return this.props.theme === 'dark' ||
      document.body.getAttribute('data-prismui-theme') === 'dark'
      ? 'dark'
      : 'default';
  }

  async renderMermaid() {
    const diagrams = this.normalizeMermaidBlocks();

    if (!diagrams.length) {
      return;
    }

    const requestId = ++this.mermaidRenderRequest;

    try {
      const mermaid = await loadMermaid();

      if (requestId !== this.mermaidRenderRequest || !this.ref) {
        return;
      }

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: this.getMermaidTheme()
      });

      for (const diagram of diagrams) {
        const source = diagram.getAttribute('data-mermaid-source') || '';
        const id = `prismui-doc-mermaid-${++this.mermaidRenderId}`;

        diagram.classList.remove('is-error');
        diagram.classList.add('is-rendering');
        diagram.textContent = source;

        try {
          const {svg, bindFunctions} = await mermaid.render(id, source);

          if (requestId !== this.mermaidRenderRequest || !diagram.isConnected) {
            return;
          }

          diagram.innerHTML = svg;
          bindFunctions && bindFunctions(diagram);
          diagram.classList.remove('is-rendering');
        } catch (error) {
          diagram.classList.remove('is-rendering');
          diagram.classList.add('is-error');
          diagram.textContent = source;
          console.error('Failed to render mermaid diagram.', error);
        }
      }
    } catch (error) {
      console.error('Failed to load mermaid.', error);
    }
  }

  fixHtmlPreview() {
    const htmlPreviews = document.querySelectorAll('.prismui-doc>.preview');
    if (!htmlPreviews && !htmlPreviews.length) {
      return;
    }
    const ns = getComponentClassPrefix(this.props.theme);
    [].slice.call(htmlPreviews).forEach(dom => {
      eachDom(dom, dom => {
        if (typeof dom.className !== 'string') {
          return;
        }

        dom.className = dom.className.replace(
          /(^|\s)([A-Z])/g,
          '$1' + ns + '$2'
        );
      });
    });
  }

  render() {
    return (
      <div className="MDPreview" ref={this.rootRef}>
        <div className="markdown" ref={this.divRef}>
          Doc
        </div>
      </div>
    );
  }
}

export default function (doc) {
  doc = doc.default || doc;
  return class extends React.Component {
    popoverDom = null;

    originTitle = document.title;

    state = {
      headingPopover: false
    };

    popoverRef = ref => {
      this.popoverDom = ref;
    };

    renderHeading(children) {
      return children.map((child, idx) => (
        <div
          key={`${child.fullPath}-${idx}`}
          className={classnames('Doc-headingList-item', {
            'is-active': this.props.location.hash === child.fullPath
          })}
        >
          <a href={`#${child.fragment}`}>{child.label}</a>

          {child.children && child.children.length
            ? this.renderHeading(child.children)
            : null}
        </div>
      ));
    }

    handlePopOverClick = e => {
      this.setState({headingPopover: false});
      e.stopPropagation();
      // e.preventDefault();
    };

    renderHeadingPopover() {
      const ns = getComponentClassPrefix(this.props.theme);

      return this.state.headingPopover ? (
        <Overlay
          target={this.popoverDom}
          container={this.popoverDom}
          rootClose={false}
          placement="right-bottom-right-top"
          show
        >
          <PopOver
            classPrefix={ns}
            className=":Doc-headingPopover"
            onHide={() => this.setState({headingPopover: false})}
            overlay
            onClick={this.handlePopOverClick}
          >
            {this.renderHeading(doc.toc.children)}
          </PopOver>
        </Overlay>
      ) : null;
    }

    componentDidMount() {
      if (doc.title) {
        document.title = doc.title;
      }
    }

    componentWillUnmount() {
      document.title = this.originTitle;
    }

    pathJoin(...parts) {
      const separator = '/';
      const normalizedParts = parts
        .filter(
          part =>
            part != null &&
            (typeof part === 'string' || typeof part === 'number')
        )
        .map((item, index, arr) => {
          let part = `${item}`;

          // 去除首个元素之外的"/"前缀
          if (index > 0) {
            part = part.replace(/^[\/]+/, '');
          }

          // 去除中间元素的"/"后缀，最后一个元素的多个"/"后缀改为1个
          return index < arr.length - 1
            ? part.replace(/[\/]+$/, '')
            : part.replace(/[\/]+$/, '/');
        });

      return normalizedParts.join(separator);
    }

    getDocEditLink() {
      const {ContextPath} = this.props;
      const basePath = 'https://github.com/Gengxin-Tech/prismui/edit/master';

      try {
        const [urlPath, locale, moduleName, relativePath] = location.pathname
          .replace(ContextPath, '')
          .match(/^\/(zh-CN)\/(docs|components|style|)(([\/]?[\w-]+)*)/);

        if (moduleName === 'docs') {
          return this.pathJoin(
            basePath,
            `/docs/${locale}/`,
            `${relativePath}.md`
          );
        } else if (
          moduleName === 'style' &&
          !/style\/(index|css-vars|responsive-design|state)$/.test(urlPath)
        ) {
          const fileName = location.pathname.split('/')?.slice(-1)?.[0];

          return this.pathJoin(
            basePath,
            `/packages/amis-ui/scss/helper`,
            relativePath.replace(fileName, `/_${fileName}.scss`)
          );
        } else {
          return this.pathJoin(
            basePath,
            `/docs/${locale}/${moduleName}`,
            `/${relativePath}.md`
          );
        }
      } catch (error) {
        return this.pathJoin(basePath, 'docs');
      }
    }

    render() {
      const {prevDoc, nextDoc, ContextPath} = this.props;

      return (
        <>
          <div className="Doc-content">
            {doc.title ? (
              <div className="Doc-title">
                <h1>{doc.title}</h1>

                {doc?.toc.children?.length ? (
                  <div
                    ref={this.popoverRef}
                    onClick={e =>
                      this.setState({
                        headingPopover: !this.state.headingPopover
                      })
                    }
                    className="Doc-headingPopBtn visible-xs"
                  >
                    <i className="fa fa-align-right"></i>
                    {this.renderHeadingPopover()}
                  </div>
                ) : null}
              </div>
            ) : null}

            <Preview {...this.props} doc={doc} />

            <div className="Doc-footer">
              <div className="Doc-navLinks">
                {prevDoc ? (
                  <Link
                    className="Doc-navLinks--prev"
                    to={`${ContextPath}${prevDoc.path}`}
                  >
                    <div className="Doc-navLinks-icon">
                      <i className="iconfont icon-arrow-left"></i>
                    </div>

                    <div className="Doc-navLinks-body text-right">
                      <div className="Doc-navLinks-subtitle">
                        上一篇 - {prevDoc.group || '其他'}
                      </div>
                      <div className="Doc-navLinks-title">{prevDoc.label} </div>
                    </div>
                  </Link>
                ) : null}

                {nextDoc ? (
                  <Link
                    className="Doc-navLinks--next"
                    to={`${ContextPath}${nextDoc.path}`}
                  >
                    <div className="Doc-navLinks-body">
                      <div className="Doc-navLinks-subtitle">
                        下一篇 - {nextDoc.group || '其他'}
                      </div>
                      <div className="Doc-navLinks-title">{nextDoc.label}</div>
                    </div>

                    <div className="Doc-navLinks-icon">
                      <i className="iconfont icon-arrow-right"></i>
                    </div>
                  </Link>
                ) : null}
              </div>
              <div className="Doc-footer-divider"></div>
              <div className="Doc-footer-fixme">
                文档有误？
                <a
                  href={this.getDocEditLink()}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  在 Github 上编辑此页！
                </a>
              </div>
            </div>
          </div>
          {doc.toc && doc.toc.children && doc.toc.children.length > 0 ? (
            <div className="Doc-toc hidden-xs hidden-sm">
              <div>
                <div className="Doc-headingList">
                  {this.renderHeading(doc.toc.children)}
                </div>
              </div>
            </div>
          ) : null}
        </>
      );
    }
  };
}
