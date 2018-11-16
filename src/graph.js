class Graph {
  constructor(nodes, edges) {
    this.pNodes = new Map(nodes.map(n => [n, new Map()]));
    this.pPred = new Map(nodes.map(n => [n, new Set()]));
    this.pSucc = new Map(nodes.map(n => [n, new Set()]));
    this.pEdges = new Map(edges.map(([f]) => [f, new Map()]));
    edges.forEach(([f, t]) => {
      this.pEdges.get(f).set(t, new Map());
      this.pSucc.get(f).add(t);
      this.pPred.get(t).add(f);
    });
  }

  succ(n) {
    return this.pSucc.get(n);
  }

  pred(n) {
    return this.pPred.get(n);
  }

  nodes() {
    return this.pNodes;
  }

  node(n) {
    return this.pNodes.get(n);
  }

  edge(f, t) {
    return this.pEdges.get(f).get(t);
  }

  numOfNodes() {
    return this.pNodes.size;
  }

  numOfEdges() {
    return this.pEdges.size;
  }
}

module.exports = {
  Graph,
};
