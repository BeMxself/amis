import React from 'react';
import {resolveDOMElement} from './utils/dom';
import {getReactElementRef, setReactRef} from './utils/reactRef';

interface TaggerWrapperProps {
  children: React.ReactElement;
  tagger: {
    [propName: string]: string | number;
  };
}

/**
 * 自动给组件对应 dom 打标记，开发态时才会进来
 * @param param0
 * @returns
 */
export const TaggerWrapper: React.FC<TaggerWrapperProps> = ({
  children,
  tagger
}) => {
  const [dom, setDom] = React.useState<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    if (!dom || !tagger) {
      return;
    }

    const attrs: any = {};
    Object.keys(tagger).forEach(key => {
      if (typeof tagger[key] === 'string' || typeof tagger[key] === 'number') {
        attrs[`data-amis-tagger-${key}`] = String(tagger[key]);
      }
    });

    Object.keys(attrs).forEach(key => {
      dom?.setAttribute(key, attrs[key]);
    });

    return () => {
      Object.keys(attrs).forEach(key => {
        dom?.removeAttribute(key);
      });
    };
  }, [dom, tagger]);

  // 合并 ref：保持原有 ref，同时添加我们的 ref
  const mergedRef = React.useCallback(
    (node: any) => {
      const nextDom = resolveDOMElement(node);

      setDom(prevDom => (prevDom === nextDom ? prevDom : nextDom));

      // 如果原有 children 有 ref，也调用它
      setReactRef(getReactElementRef(children), node);
    },
    [children]
  );

  return React.cloneElement(children, {
    ref: mergedRef
  } as any);
};

export default TaggerWrapper;
