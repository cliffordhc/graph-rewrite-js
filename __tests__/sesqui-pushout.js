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
            from: 'A-1',
            to: 'A-2',
            attributes: {},
          },
        ],
        nodes: [
          {
            id: 'A-1',
            attributes: {},
          },
          {
            id: 'A-2',
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
            id: 'A-1',
            attributes: {},
          },
          {
            id: 'A-3',
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
          from: 'k-1',
          to: 'k-1',
          attributes: {},
        },
        {
          from: 'k-2',
          to: 'k-1',
          attributes: {},
        },
        {
          from: 'k-1',
          to: 'k-2',
          attributes: {},
        },
        {
          from: 'k-2',
          to: 'k-2',
          attributes: {},
        },
      ],
      nodes: [
        {
          id: 'k-1',
          attributes: {},
        },
        {
          id: 'k-2',
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
          from: 'A-a',
          to: 'A-a',
          attributes: {},
        },
      ],
      nodes: [
        {
          id: 'A-a',
          attributes: {},
        },
        {
          id: 'r-2',
          attributes: {},
        },
      ],
    });
  });
});
