
const { Graph } = require('../src/graph');
const { Vf2 } = require('../src/vf2');

describe('vf2 algorithm', () => {
  it('it finds graph isomorphisms', () => {
    // eslint-disable-next-line no-debugger
    let g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    let g2 = new Graph([1, 2], [[1, 2]]);
    let vf2 = new Vf2(g1, g2);
    expect(vf2.findMatch()).toEqual([
      [{ n1: 1, n2: 1 }, { n1: 2, n2: 2 }],
      [{ n1: 2, n2: 1 }, { n1: 3, n2: 2 }],
    ]);

    g1 = new Graph([1, 2, 3, 4], [[1, 2], [2, 3], [3, 4]]);
    g2 = new Graph([1, 2], [[1, 2]]);
    vf2 = new Vf2(g1, g2);
    expect(vf2.findMatch()).toEqual([
      [{ n1: 1, n2: 1 }, { n1: 2, n2: 2 }],
      [{ n1: 2, n2: 1 }, { n1: 3, n2: 2 }],
      [{ n1: 3, n2: 1 }, { n1: 4, n2: 2 }],
    ]);
  });
});
