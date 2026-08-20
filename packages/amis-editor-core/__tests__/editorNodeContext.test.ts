import {isAlive} from 'mobx-state-tree';
import {
  EditorNode,
  getEditorNodeFacade,
  resolveEditorNodeFacade
} from '../src/store/node';

describe('editor node facade', () => {
  it('keeps node props non-enumerable and resolves back to the live node', () => {
    const root = EditorNode.create({
      id: 'root',
      type: 'root',
      label: 'Root',
      path: 'root'
    });
    const node = root.addChild({
      id: 'child',
      type: 'button',
      label: 'Button',
      path: 'body/0'
    });

    const facadeNode = getEditorNodeFacade(node)!;

    expect(facadeNode).not.toBe(node);
    expect(facadeNode.id).toBe('child');
    expect(isAlive(facadeNode)).toBe(true);
    expect(resolveEditorNodeFacade(facadeNode)).toBe(node);
    expect(Object.keys(facadeNode as any)).toEqual([]);
    expect(Object.getOwnPropertyNames(facadeNode as any)).toEqual([]);

    root.removeChild(node);

    expect(() => (facadeNode as any).parentId).not.toThrow();
    expect((facadeNode as any).parentId).toBeUndefined();
    expect(isAlive(facadeNode)).toBe(false);
  });
});
