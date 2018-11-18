const _ = require('lodash');

const EMPTY_SET = new Set();

function edgeIndex(f, t) {
  return `${f}:${typeof f}-${t}:${typeof t}`;
}

class Graph {
  constructor(nodes, edges) {
    if (nodes instanceof Graph) {
      _.merge(this, _.cloneDeep(nodes));
    } else {
      this.pNodes = new Map();
      this.pSucc = new Map();
      this.pPred = new Map();
      nodes.map(n => this.addNode(n));
      this.pEdges = new Map();
      this.pEdgesMap = new Map();
      edges.forEach(([f, t]) => {
        this.addEdge(f, t);
      });
    }
  }

  addNode(n) {
    this.pNodes.set(n, new Map());
    this.pSucc.set(n, new Set());
    this.pPred.set(n, new Set());
  }

  delNode(n) {
    this.pNodes.delete(n);
    this.pNodes.forEach((n1) => {
      if (this.succ(n1).has(n)) {
        this.delEdge(n1, n);
      }
      if (this.pred(n1).has(n)) {
        this.delEdge(n, n1);
      }
    });
  }

  addEdge(f, t) {
    this.pEdges.set(edgeIndex(f, t), new Map());
    this.pEdgesMap.set(edgeIndex(f, t), { from: f, to: t });
    this.succ(f).add(t);
    this.pred(t).add(f);
  }

  delEdge(f, t) {
    this.pEdges.delete(edgeIndex(f, t));
    this.succ(f).delete(t);
    this.pred(t).delete(f);
  }

  edges() {
    return this.pEdges;
  }

  edgesMap() {
    return this.pEdgesMap;
  }

  succ(n) {
    return this.pSucc.get(n) || EMPTY_SET;
  }

  pred(n) {
    return this.pPred.get(n) || EMPTY_SET;
  }

  nodes() {
    return this.pNodes;
  }

  node(n) {
    return this.pNodes.get(n);
  }

  edge(f, t) {
    return this.pEdges.get(edgeIndex(f, t));
  }

  nodeCount() {
    return this.pNodes.size;
  }

  edgeCount() {
    return this.pEdges.size;
  }

  clone() {
    return _.cloneDeep(this);
  }

  remapZeroBased() {
    const nodes = [...this.nodes()];
    const fMap = new Map(nodes.map(([n], i) => [i, n]));
    const rMap = new Map(nodes.map(([n], i) => [n, i]));
    return { mapping: { fMap, rMap }, graph: this.remap(fMap, rMap) };
  }

  remap(fMap, rMap) {
    const ng = this.clone();
    const {
      pNodes, pSucc, pPred, pEdges, pEdgesMap,
    } = this;
    ng.pNodes = new Map();
    ng.pSucc = new Map();
    ng.pPred = new Map();
    ng.pEdges = new Map();
    ng.pEdgesMap = new Map();
    pNodes.forEach((v, k) => {
      ng.pNodes.set(rMap.get(k), v);
    });
    pSucc.forEach((v, k) => {
      ng.pSucc.set(rMap.get(k), new Set([...v].map(s => rMap.get(s))));
    });
    pPred.forEach((v, k) => {
      ng.pPred.set(rMap.get(k), new Set([...v].map(s => rMap.get(s))));
    });
    pEdgesMap.forEach((e, k) => {
      const f = rMap.get(e.from);
      const t = rMap.get(e.to);
      const newIdx = edgeIndex(f, t);
      ng.pEdges.set(newIdx, pEdges.get(k));
      ng.pEdgesMap.set(newIdx, { from: f, to: t });
    });

    return ng;
  }
}

module.exports = {
  Graph,
  edgeIndex,
};
