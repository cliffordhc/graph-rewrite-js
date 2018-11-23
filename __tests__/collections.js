const { ASet, AElement } = require('../src/collections');

describe('AElement', () => {
  it('it has a unique key', () => {
    const a = new AElement();
    a.test = 'value';
    expect(a.key()).toBe('test:string=value');
  });
  it('it maps to a new multiple values using a dictionary', () => {
    class Test extends AElement {
      // eslint-disable-next-line class-methods-use-this
      constructor() {
        super(['child1', 'child2']);
      }
    }

    class Child extends AElement {
      // eslint-disable-next-line class-methods-use-this
      constructor() {
        super(['value1', 'value2']);
      }
    }

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

    const result = [...a.mapTo({ 1: [2, 3] })];
    expect(result).toBe('');
  });
});
