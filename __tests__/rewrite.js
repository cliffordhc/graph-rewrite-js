
const { Graph } = require('../src/graph');
const { Rewrite } = require('../src/rewrite');

describe('Sesqui-pushout rewriting', () => {
  it('it does graph rewrite', () => {
    let g1 = new Graph([1, 2, 3, 4], [[1, 2], [2, 3], [3, 4]]);
    let g2 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    let vf2 = new Vf2(g1, g2);
    expect(vf2.findMatch()).toEqual([
      [{ 1: 1, 2: 2, 3: 3 }],
      [{ 2: 1, 3: 2, 4: 3 }],
    ]);
  });
});
