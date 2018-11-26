const _ = require('lodash');
const { ASet, AElement } = require('../src/collections');

describe('Collections', () => {
  describe('it has an AElement that', () => {
    it('has a unique key', () => {
      class Test extends AElement {
      }
      ASet.setKeyProps(Test, ['test']);
      const a = new Test();
      a.test = 'value';
      expect(a.key()).toBe('test:string=value');
    });
    it('maps to multiple values using a dictionary', () => {
      class Test extends AElement {
      }
      ASet.setMappedProps(Test, ['child1', 'child2']);
      ASet.setKeyProps(Test, ['child1', 'child2']);

      class Child extends AElement {
      }

      ASet.setMappedProps(Child, ['value1', 'value2']);
      ASet.setKeyProps(Child, ['value1', 'value2']);

      const a = new Test();
      const c1 = new Child();
      const c2 = new Child();
      const c3 = new Child();
      a.child1 = c1;
      a.child2 = c2;
      a.child3 = c3;

      c1.value1 = 1;
      c1.value2 = 1;
      c1.value3 = 1;

      c2.value1 = 1;
      c2.value2 = 1;
      c2.value3 = 1;

      c3.value1 = 1;
      c3.value2 = 1;
      c3.value3 = 1;

      const mapping = ASet.computeMapping({ 1: [2, 3] });
      const result = [...a.mapTo(mapping)];
      expect(result.reduce((acc, r) => acc && r instanceof AElement, true)).toBeTruthy();

      const expected = [];

      [2, 3].forEach((b1) => {
        [2, 3].forEach((b2) => {
          [2, 3].forEach((b3) => {
            [2, 3].forEach((b4) => {
              const t = new Test();
              t.child1 = new Child();
              t.child2 = new Child();
              t.child3 = new Child();
              t.child1.value3 = 1;
              t.child2.value3 = 1;
              t.child3.value1 = 1;
              t.child3.value2 = 1;
              t.child3.value3 = 1;
              t.child1.value1 = b1;
              t.child1.value2 = b2;
              t.child2.value1 = b3;
              t.child2.value2 = b4;
              expected.push(t);
            });
          });
        });
      });
      expect(result).toEqual(expected);
    });
    it('merges attributes', () => {
      const a = new AElement();
      a.mergeAttrs({ name: 'n1' });
      a.mergeAttrs([{ name: 'n2' }, { name: 'n3' }]);
      a.mergeAttrs({ cell: 'c1' });
      a.mergeAttrs([{ cell: 'c2' }, { cell: 'c3' }]);
      a.mergeAttrs([{ cell: 'c4' }, { name: 'n4' }]);
      a.mergeAttrs([{ cell: 'c5', name: 'n5' }]);
      expect(a.attrs).toEqual({
        cell: new Set([
          'c1',
          'c2',
          'c3',
          'c4',
          'c5',
        ]),
        name: new Set([
          'n1',
          'n2',
          'n3',
          'n4',
          'n5',
        ]),
      });
    });
    it('removes attributes', () => {
      const attrs = {
        cell: new Set([
          'c1',
          'c2',
          'c3',
          'c4',
        ]),
        name: new Set([
          'n1',
          'n2',
          'n3',
          'n4',
        ]),
      };
      const a = new AElement();
      a.mergeAttrs(attrs);
      a.removeAttrs({ name: 'n3' });
      a.removeAttrs([{ cell: 'c3' }, { name: 'n2' }]);

      expect(a.attrs).toEqual({
        cell: new Set([
          'c1',
          'c2',
          'c4',
        ]),
        name: new Set([
          'n1',
          'n4',
        ]),
      });

      const b = new AElement();
      b.mergeAttrs(attrs);
      b.removeAttrs({ name: 'n3', cell: 'c3' });
      expect(b.attrs).toEqual({
        cell: new Set([
          'c1',
          'c2',
          'c4',
        ]),
        name: new Set([
          'n1',
          'n2',
          'n4',
        ]),
      });
    });
    it('checks for compatibility of attributes', () => {
      const a = new AElement();
      a.mergeAttrs({
        cell: new Set([
          'c1',
          'c2',
          'c3',
          'c4',
        ]),
        phone: new Set([
          'p1',
          'p2',
          'p3',
          'p4',
        ]),
        name: new Set([
          'n1',
          'n2',
          'n3',
          'n4',
        ]),
      });

      const b = new AElement();
      b.mergeAttrs({
        cell: new Set([
          'c1',
          'c2',
        ]),
        name: new Set([
          'n1',
        ]),
      });
      const c = new AElement();
      c.mergeAttrs({
        cell: new Set([
          'c1',
          'c2',
          'c6',
        ]),
        name: new Set([
          'n1',
        ]),
      });

      expect(b.compatible(a)).toBeTruthy();
      expect(c.compatible(a)).toBeFalsy();
      expect(a.compatible(b)).toBeFalsy();
    });
  });
  describe('it has an ASet that', () => {
    it('applies a mapping to its contents', () => {
      class Child extends AElement {
      }

      ASet.setMappedProps(Child, ['value1', 'value2']);
      ASet.setKeyProps(Child, ['value1', 'value2']);
      const c1 = new Child();
      const c2 = new Child();
      const c3 = new Child();

      c1.value1 = 1;
      c1.value2 = 2;
      c1.value3 = 3;

      c2.value1 = 1;
      c2.value2 = 1;
      c2.value3 = 1;

      c3.value1 = 2;
      c3.value2 = 2;
      c3.value3 = 1;

      const aset = new ASet([c1, c2, c3]);
      const mapping = ASet.computeMapping({ 1: [3, 4], 2: [5, 6] });
      const result = [...ASet.ap(mapping, aset)];
      const expected = _.flatten([c1, c2, c3].map(c => [...c.mapTo(mapping)]));

      expect(result).toEqual(expected);
      expect(result.length).toBe(12);
    });
    it('evaluates a function using its contents for input', () => {
      class Group extends AElement {
        constructor(child1, child2) {
          super();
          this.child1 = child1;
          this.child2 = child2;
        }
      }

      ASet.setMappedProps(Group, ['child1', 'child1']);
      ASet.setKeyProps(Group, ['child1', 'child1']);

      class Child extends AElement {
      }

      ASet.setMappedProps(Child, ['name']);
      ASet.setKeyProps(Child, ['name']);
      const c1 = new Child();
      const c2 = new Child();

      c1.name = 'c1';
      c2.name = 'c2';

      const aset = new ASet([c1, c2]);
      const result = [...ASet.ev([aset, aset], (u, v) => new Group(u, v))];
      const expected = [new Group(c1, c1), new Group(c1, c2), new Group(c2, c1), new Group(c2, c2)];

      expect(result).toEqual(expected);
      expect(result.length).toBe(4);
    });
  });
});
