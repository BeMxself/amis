import React from 'react';
import {mergeRefs, setReactRef} from '../../src/utils/reactRef';

describe('reactRef', () => {
  it('sets object refs and function refs', () => {
    const objectRef = React.createRef<HTMLDivElement>();
    const functionRef = jest.fn();
    const node = document.createElement('div');

    setReactRef(objectRef, node);
    setReactRef(functionRef, node);

    expect(objectRef.current).toBe(node);
    expect(functionRef).toHaveBeenCalledWith(node);
  });

  it('merges refs without wrapping a single ref', () => {
    const objectRef = React.createRef<HTMLDivElement>();
    const functionRef = jest.fn();
    const node = document.createElement('div');

    expect(mergeRefs(objectRef)).toBe(objectRef);

    const mergedRef = mergeRefs(objectRef, functionRef);
    expect(typeof mergedRef).toBe('function');

    (mergedRef as React.RefCallback<HTMLDivElement>)(node);
    expect(objectRef.current).toBe(node);
    expect(functionRef).toHaveBeenCalledWith(node);
  });
});
