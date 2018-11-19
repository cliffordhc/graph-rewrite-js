/* eslint-disable prefer-const */

const { Graph } = require('../src/graph');
const { SePO } = require('../src/sesqui-pushout');

describe('Sesqui-pushout rewriting', () => {
  it('it does graph rewrite', () => {
    let g1 = new Graph([1, 2, 3, 4], [[1, 2], [2, 3], [3, 4]]);
    let l = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    let k = new Graph([1, 2, 4], [[1, 2], [2, 4]]);
    let r = new Graph([1, 2, 4, 6], [[1, 2], [2, 6]]);
    let k2l = { 1: 1, 2: 2, 4: 1 };
    let k2r = { 1: 1, 2: 2, 4: 4 };

    let l2g = { 1: 1, 2: 2, 3: 3 };

    let sepo = new SePO(l, k, r, k2l, k2r);
    let result = sepo.apply(g1, l2g);
    expect(result).toEqual({});
  });
});
