
const { Graph } = require('../src/graph');
const { Vf2 } = require('../src/vf2');

describe('vf2 algorithm', () => {
  it('it finds graph isomorphisms', () => {
    let g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    let g2 = new Graph([1, 2], [[1, 2]]);
    let vf2 = new Vf2(g1, g2);
    expect(vf2.findMatch()).toEqual([
      { 1: 1, 2: 2 },
      { 2: 1, 3: 2 },
    ]);

    g1 = new Graph([1, 2, 3, 4], [[1, 2], [2, 3], [3, 4]]);
    g2 = new Graph([1, 2], [[1, 2]]);
    vf2 = new Vf2(g1, g2);
    expect(vf2.findMatch()).toEqual([
      { 1: 1, 2: 2 },
      { 2: 1, 3: 2 },
      { 3: 1, 4: 2 },
    ]);
  });
  it('it finds graph isomorphisms using attributes', () => {
    let g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    let g2 = new Graph([1, 2], [[1, 2]]);
    let vf2 = new Vf2(g1, g2);
    expect(vf2.findMatch()).toEqual([
      { 1: 1, 2: 2 },
      { 2: 1, 3: 2 },
    ]);

    g1 = new Graph([1, [2, [{ name: 'c2' }, { name: 'c3' }]], 3, [4, { name: 'c3' }]], [[1, 2], [2, 3], [3, 4]]);
    g2 = new Graph([1, [2, { name: 'c3' }]], [[1, 2]]);
    vf2 = new Vf2(g1, g2, Graph.defaultCompatibility(g1, g2));
    expect(vf2.findMatch()).toEqual([
      { 1: 1, 2: 2 },
      { 3: 1, 4: 2 },
    ]);
  });
});
