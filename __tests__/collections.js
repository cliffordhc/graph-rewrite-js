const _ = require('lodash');
const { ASet, AElement } = require('../src/collections');

describe('Collections', () => {
  describe('it has an AElement that', () => {
    it('has a unique key', () => {
      class Test extends AElement {
      }
      AElement.setKeyProps(Test, ['test']);
      const a = new Test();
      a.test = 'value';
      expect(a.key()).toBe('test:string=value');
    });
    it('maps to multiple values using a dictionary', () => {
      class Test extends AElement {
      }
      AElement.setMappedProps(Test, ['child1', 'child2']);
      AElement.setKeyProps(Test, ['child1', 'child2']);

      class Child extends AElement {
      }

      AElement.setMappedProps(Child, ['value1', 'value2']);
      AElement.setKeyProps(Child, ['value1', 'value2']);

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
  });
  describe('it has an ASet that', () => {
    it('applies a mapping to its contents', () => {
      class Child extends AElement {
      }

      AElement.setMappedProps(Child, ['value1', 'value2']);
      AElement.setKeyProps(Child, ['value1', 'value2']);
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

      AElement.setMappedProps(Group, ['child1', 'child1']);
      AElement.setKeyProps(Group, ['child1', 'child1']);

      class Child extends AElement {
      }

      AElement.setMappedProps(Child, ['name']);
      AElement.setKeyProps(Child, ['name']);
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
