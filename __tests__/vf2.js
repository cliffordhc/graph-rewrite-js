
const { Graph } = require('../src/graph');
const { Vf2 } = require('../src/vf2');

describe('vf2 algorithm', () => {
  it('it finds isomorphism', () => {
    // eslint-disable-next-line no-debugger
    const g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    const g2 = new Graph([1, 2], [[1, 2]]);
    const vf2 = new Vf2(g1, g2);
    console.log('vf2');
    console.log(vf2.findMatch());
  });
});
