const _ = require('lodash');
const { Graph } = require('../src/graph');
const { SePO } = require('../src/sesqui-pushout');

function graphviz(name, ...r) {
  let gviz = '';
  function drawGraph(result, i) {
    gviz += `[graphviz, images/sepo-${name}-${i}]\n`;
    gviz += '----\n';
    gviz += 'digraph a {\n';
    _.forEach(result.nodes, (item) => {
      gviz += `"${item.id}" [label = "${item.id}"]\n`;
    });
    _.forEach(result.edges, (item) => {
      gviz += `"${item.from}" -> "${item.to}"\n`;
    });
    gviz += '}\n';
    gviz += '----\n\n';
  }

  r.forEach((g, i) => {
    drawGraph(Graph.toJson(g), i);
  });
  console.log(gviz);
}

describe('Sesqui-pushout rewriting', () => {
  it('it deletes outer node', () => {
    const g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    const l = new Graph([1, 2, 3], []);
    const k = new Graph([1, 2], []);
    const r = new Graph([1, 2], []);
    const k2l = { 1: 1, 2: 2 };
    const k2r = { 1: 1, 2: 2 };

    const l2g = { 1: 1, 2: 2, 3: 3 };

    const sepo = new SePO(l, k, r, k2l, k2r);
    const result = sepo.apply(g1, l2g);

    graphviz('del1', g1, l, k, r, result);

    expect(Graph.toJson(result)).toEqual(
      {
        edges: [
          {
            from: 'r-1',
            to: 'r-2',
            attributes: {},
          },
        ],
        nodes: [
          {
            id: 'r-1',
            attributes: {},
          },
          {
            id: 'r-2',
            attributes: {},
          },
        ],
      },
    );
  });
  it('it deletes inner node', () => {
    const g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    const l = new Graph([1, 2, 3], []);
    const k = new Graph([1, 3], []);
    const r = new Graph([1, 3], []);
    const k2l = { 1: 1, 3: 3 };
    const k2r = { 1: 1, 3: 3 };

    const l2g = { 1: 1, 2: 2, 3: 3 };

    const sepo = new SePO(l, k, r, k2l, k2r);

    const result = sepo.apply(g1, l2g);

    graphviz('del2', g1, l, k, r, result);

    expect(Graph.toJson(result)).toEqual(
      {
        edges: [],
        nodes: [
          {
            id: 'r-1',
            attributes: {},
          },
          {
            id: 'r-3',
            attributes: {},
          },
        ],
      },
    );
  });
  it('it clones nodes', () => {
    const g1 = new Graph(['a'], [['a', 'a']]);
    const l = new Graph([1], []);
    const k = new Graph([1, 2], []);
    const r = new Graph([1, 2], []);
    const k2l = { 1: 1, 2: 1 };
    const k2r = { 1: 1, 2: 2 };

    const l2g = { 1: 'a' };

    const sepo = new SePO(l, k, r, k2l, k2r);
    const result = sepo.apply(g1, l2g);

    graphviz('clone', g1, l, k, r, result);

    expect(Graph.toJson(result)).toEqual({
      edges: [
        {
          from: 'r-1',
          to: 'r-1',
          attributes: {},
        },
        {
          from: 'r-2',
          to: 'r-1',
          attributes: {},
        },
        {
          from: 'r-1',
          to: 'r-2',
          attributes: {},
        },
        {
          from: 'r-2',
          to: 'r-2',
          attributes: {},
        },
      ],
      nodes: [
        {
          id: 'r-1',
          attributes: {},
        },
        {
          id: 'r-2',
          attributes: {},
        },
      ],
    });
  });
  it('it adds nodes', () => {
    const g1 = new Graph(['a'], [['a', 'a']]);
    const l = new Graph([1], []);
    const k = new Graph([1], []);
    const r = new Graph([1, 2], []);
    const k2l = { 1: 1 };
    const k2r = { 1: 1, 2: 2 };

    const l2g = { 1: 'a' };

    const sepo = new SePO(l, k, r, k2l, k2r);
    const result = sepo.apply(g1, l2g);

    graphviz('add', g1, l, k, r, result);

    expect(Graph.toJson(result)).toEqual({
      edges: [
        {
          from: 'r-1',
          to: 'r-1',
          attributes: {},
        },
      ],
      nodes: [
        {
          id: 'r-1',
          attributes: {},
        },
        {
          id: 'r-2',
          attributes: {},
        },
      ],
    });
  });
  it('it combines nodes', () => {
    const g1 = new Graph(['a', 'b'], [['a', 'b']]);
    const l = new Graph([1, 2], []);
    const k = new Graph([1, 2], []);
    const r = new Graph(['1_2'], []);
    const k2l = { 1: 1, 2: 2 };
    const k2r = { 1: '1_2', 2: '1_2' };

    const l2g = { 1: 'a', 2: 'b' };

    const sepo = new SePO(l, k, r, k2l, k2r);
    const result = sepo.apply(g1, l2g);

    graphviz('add', g1, l, k, r, result);

    expect(Graph.toJson(result)).toEqual({
      edges: [
        {
          from: 'r-1_2',
          to: 'r-1_2',
          attributes: {},
        },
      ],
      nodes: [
        {
          id: 'r-1_2',
          attributes: {},
        },
      ],
    });
  });
});
