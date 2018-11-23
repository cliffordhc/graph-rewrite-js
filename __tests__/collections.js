const { ASet, AElement } = require('../src/collections');

describe('AElement', () => {
  it('it has a unique key', () => {
    const a = new AElement();
    a.test = 'value';
    expect(a.key()).toBe('test:string=value');
  });
  it('it maps to an element to multiple values using a dictionary', () => {
    class Test extends AElement {
    }
    AElement.setMappedProps(Test, ['child1', 'child2']);

    class Child extends AElement {
    }

    AElement.setMappedProps(Child, ['value1', 'value2']);

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
    expect(result).toEqual([
      {
        child1: {
          value1: 2,
          value2: 2,
          value3: 1,
        },
        child2: {
          value1: 2,
          value2: 2,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 2,
          value2: 2,
          value3: 1,
        },
        child2: {
          value1: 2,
          value2: 3,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 2,
          value2: 2,
          value3: 1,
        },
        child2: {
          value1: 3,
          value2: 2,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 2,
          value2: 2,
          value3: 1,
        },
        child2: {
          value1: 3,
          value2: 3,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 2,
          value2: 3,
          value3: 1,
        },
        child2: {
          value1: 2,
          value2: 2,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 2,
          value2: 3,
          value3: 1,
        },
        child2: {
          value1: 2,
          value2: 3,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 2,
          value2: 3,
          value3: 1,
        },
        child2: {
          value1: 3,
          value2: 2,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 2,
          value2: 3,
          value3: 1,
        },
        child2: {
          value1: 3,
          value2: 3,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 3,
          value2: 2,
          value3: 1,
        },
        child2: {
          value1: 2,
          value2: 2,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 3,
          value2: 2,
          value3: 1,
        },
        child2: {
          value1: 2,
          value2: 3,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 3,
          value2: 2,
          value3: 1,
        },
        child2: {
          value1: 3,
          value2: 2,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 3,
          value2: 2,
          value3: 1,
        },
        child2: {
          value1: 3,
          value2: 3,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 3,
          value2: 3,
          value3: 1,
        },
        child2: {
          value1: 2,
          value2: 2,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 3,
          value2: 3,
          value3: 1,
        },
        child2: {
          value1: 2,
          value2: 3,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 3,
          value2: 3,
          value3: 1,
        },
        child2: {
          value1: 3,
          value2: 2,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
      {
        child1: {
          value1: 3,
          value2: 3,
          value3: 1,
        },
        child2: {
          value1: 3,
          value2: 3,
          value3: 1,
        },
        child3: {
          value1: 1,
          value2: 1,
          value3: 1,
        },
      },
    ]);
  });
});
