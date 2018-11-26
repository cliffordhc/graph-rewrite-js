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
  it('it deletes edges', () => {
    const g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    const l = new Graph([1, 2, 3], [[1, 2]]);
    const k = new Graph([1, 2, 3], []);
    const r = new Graph([1, 2, 3], []);
    const k2l = { 1: 1, 2: 2, 3: 3 };
    const k2r = { 1: 1, 2: 2, 3: 3 };

    const l2g = { 1: 1, 2: 2, 3: 3 };

    const sepo1 = new SePO(l, k, r, k2l, k2r);
    const result1 = sepo1.apply(g1, l2g);

    graphviz('delEdge1', g1, l, k, r, result1);

    const sepo2 = new SePO(l);
    sepo2.injectRemoveEdge(1, 2);
    const result2 = sepo2.apply(g1, l2g);
    graphviz('delEdge2', g1, l, k, r, result2);

    const expected = {
      edges: [
        {
          from: 'r-2',
          to: 'r-3',
          attrs: {},
        },
      ],
      nodes: [
        {
          id: 'r-1',
          attrs: {},
        },
        {
          id: 'r-2',
          attrs: {},
        },
        {
          id: 'r-3',
          attrs: {},
        },
      ],
    };
    expect(Graph.toJson(result1)).toEqual(expected);
    expect(Graph.toJson(result2)).toEqual(expected);
  });
  it('it deletes outer node', () => {
    const g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    const l = new Graph([1, 2, 3], []);
    const k = new Graph([1, 2], []);
    const r = new Graph([1, 2], []);
    const k2l = { 1: 1, 2: 2 };
    const k2r = { 1: 1, 2: 2 };

    const l2g = { 1: 1, 2: 2, 3: 3 };

    const sepo1 = new SePO(l, k, r, k2l, k2r);
    const result1 = sepo1.apply(g1, l2g);

    graphviz('del1', g1, l, k, r, result1);

    const sepo2 = new SePO(l);
    sepo2.injectRemoveNode(3);
    const result2 = sepo2.apply(g1, l2g);

    graphviz('del1', g1, l, k, r, result2);

    const expected = {
      edges: [
        {
          from: 'r-1',
          to: 'r-2',
          attrs: {},
        },
      ],
      nodes: [
        {
          id: 'r-1',
          attrs: {},
        },
        {
          id: 'r-2',
          attrs: {},
        },
      ],
    };
    expect(Graph.toJson(result1)).toEqual(expected);
    expect(Graph.toJson(result2)).toEqual(expected);
  });
  it('it deletes inner node', () => {
    const g1 = new Graph([1, 2, 3], [[1, 2], [2, 3]]);
    const l = new Graph([1, 2, 3], []);
    const k = new Graph([1, 3], []);
    const r = new Graph([1, 3], []);
    const k2l = { 1: 1, 3: 3 };
    const k2r = { 1: 1, 3: 3 };

    const l2g = { 1: 1, 2: 2, 3: 3 };

    const sepo1 = new SePO(l, k, r, k2l, k2r);
    const result1 = sepo1.apply(g1, l2g);

    graphviz('del2', g1, l, k, r, result1);

    const sepo2 = new SePO(l);
    sepo2.injectRemoveNode(2);
    const result2 = sepo2.apply(g1, l2g);

    graphviz('del2', g1, l, k, r, result2);

    const expected = {
      edges: [],
      nodes: [
        {
          id: 'r-1',
          attrs: {},
        },
        {
          id: 'r-3',
          attrs: {},
        },
      ],
    };
    expect(Graph.toJson(result1)).toEqual(expected);
    expect(Graph.toJson(result2)).toEqual(expected);
  });
  it('it clones nodes', () => {
    const g1 = new Graph(['a'], [['a', 'a']]);
    const l = new Graph([1], []);
    const k = new Graph([1, '1c1'], []);
    const r = new Graph([1, '1c1'], []);
    const k2l = { 1: 1, '1c1': 1 };
    const k2r = { 1: 1, '1c1': '1c1' };

    const l2g = { 1: 'a' };

    const sepo1 = new SePO(l, k, r, k2l, k2r);
    const result1 = sepo1.apply(g1, l2g);

    graphviz('clone', g1, l, k, r, result1);

    const sepo2 = new SePO(l);
    sepo2.injectCloneNode(1);
    const result2 = sepo2.apply(g1, l2g);
    graphviz('clone', g1, l, k, r, result2);

    const expected = {
      edges: [
        {
          from: 'r-1',
          to: 'r-1',
          attrs: {},
        },
        {
          from: 'r-1',
          to: 'r-1c1',
          attrs: {},
        },
        {
          from: 'r-1c1',
          to: 'r-1',
          attrs: {},
        },
        {
          from: 'r-1c1',
          to: 'r-1c1',
          attrs: {},
        },
      ],
      nodes: [
        {
          id: 'r-1',
          attrs: {},
        },
        {
          id: 'r-1c1',
          attrs: {},
        },
      ],
    };
    expect(Graph.toJson(result1)).toEqual(expected);
    expect(Graph.toJson(result2)).toEqual(expected);
  });
  it('it adds nodes', () => {
    const g1 = new Graph(['a'], [['a', 'a']]);
    const l = new Graph([1], []);
    const k = new Graph([1], []);
    const r = new Graph([1, 2], []);
    const k2l = { 1: 1 };
    const k2r = { 1: 1, 2: 2 };

    const l2g = { 1: 'a' };

    const sepo1 = new SePO(l, k, r, k2l, k2r);
    const result1 = sepo1.apply(g1, l2g);

    graphviz('add', g1, l, k, r, result1);

    const sepo2 = new SePO(l);
    sepo2.injectAddNode(2);
    const result2 = sepo2.apply(g1, l2g);

    graphviz('add', g1, l, k, r, result2);

    const expected = {
      edges: [
        {
          from: 'r-1',
          to: 'r-1',
          attrs: {},
        },
      ],
      nodes: [
        {
          id: 'r-1',
          attrs: {},
        },
        {
          id: 'r-2',
          attrs: {},
        },
      ],
    };
    expect(Graph.toJson(result1)).toEqual(expected);
    expect(Graph.toJson(result2)).toEqual(expected);
  });
  it('it combines nodes', () => {
    const g1 = new Graph(['a', 'b'], [['a', 'b']]);
    const l = new Graph([1, 2], []);
    const k = new Graph([1, 2], []);
    const r = new Graph(['1_2'], []);
    const k2l = { 1: 1, 2: 2 };
    const k2r = { 1: '1_2', 2: '1_2' };

    const l2g = { 1: 'a', 2: 'b' };

    const sepo1 = new SePO(l, k, r, k2l, k2r);
    const result1 = sepo1.apply(g1, l2g);

    graphviz('add', g1, l, k, r, result1);

    const sepo2 = new SePO(l);
    sepo2.injectMergeNodes([1, 2]);
    const result2 = sepo2.apply(g1, l2g);

    graphviz('add', g1, l, k, r, result2);

    const expected = {
      edges: [
        {
          from: 'r-1_2',
          to: 'r-1_2',
          attrs: {},
        },
      ],
      nodes: [
        {
          id: 'r-1_2',
          attrs: {},
        },
      ],
    };
    expect(Graph.toJson(result1)).toEqual(expected);
    expect(Graph.toJson(result2)).toEqual(expected);
  });
});
