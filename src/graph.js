const _ = require('lodash');
const {
  EMap, ESet, OMap, OSet,
} = require('./collections');

const EMPTY_SET = new Set();

function edgeIndex(f, t) {
  return `${f}:${typeof f}->${t}:${typeof t}`;
}

class Graph {
  constructor(nodes, edges) {
    if (nodes instanceof Graph) {
      _.merge(this, _.cloneDeep(nodes));
    } else {
      this.pNodes = new ESet();
      this.pNodeValues = new EMap();
      this.pSucc = new EMap();
      this.pPred = new EMap();
      nodes.map(n => this.addNode(n));
      this.pEdges = new OSet();
      this.pEdgeValues = new OMap();
      edges.forEach(([f, t]) => {
        this.addEdge(f, t);
      });
    }
  }

  static fromJson(json) {
    const jsonObj = JSON.parse(json);
    return new Graph(jsonObj.nodes, jsonObj.edges);
  }

  static toJson(graph) {
    const nodes = [...graph.nodes()].map(n => ({ id: n }));
    const edges = [...graph.edges()].map(e => ({ from: e[0], to: e[1] }));
    const jsonObj = { nodes, edges };
    return jsonObj;
  }

  addNode(n) {
    this.pNodes.add(n);
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
    this.pEdges.add([f, t]);
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
    return this.pEdges.get([f, t]);
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
    const fMap = new Map(nodes.map((n, i) => [i, n]));
    const rMap = new Map(nodes.map((n, i) => [n, i]));
    return { fMap, rMap, graph: this.remap(fMap, rMap) };
  }

  remap(fMap, rMap) {
    const ng = this.clone();
    const {
      pNodes, pSucc, pPred, pEdges,
    } = this;
    ng.pNodes = new ESet();
    ng.pSucc = new EMap();
    ng.pPred = new EMap();
    ng.pEdges = new OSet();
    pNodes.forEach((v) => {
      ng.pNodes.add(rMap.get(v));
    });
    pSucc.forEach((v, k) => {
      ng.pSucc.set(rMap.get(k), new Set([...v].map(s => rMap.get(s))));
    });
    pPred.forEach((v, k) => {
      ng.pPred.set(rMap.get(k), new Set([...v].map(s => rMap.get(s))));
    });
    pEdges.forEach((e, k) => {
      const f = rMap.get(k[0]);
      const t = rMap.get(k[1]);
      ng.pEdges.add([f, t]);
    });

    return ng;
  }
}

module.exports = {
  Graph,
  OSet,
};
