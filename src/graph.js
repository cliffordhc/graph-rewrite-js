const _ = require('lodash');
const {
  ASet,
  AElement,
} = require('./collections');

function edgeIndex(f, t) {
  return `${f}:${typeof f}->${t}:${typeof t}`;
}

class Vertex extends AElement {
  constructor(id, attributes) {
    super(['id', 'label'], ['id', 'label']);
    this.id = id || -1;
    this.label = '<>';
    this.pred = new ASet();
    this.succ = new ASet();
    this.attributes = attributes || {};
  }
}

class Edge extends AElement {
  constructor(from, to, attributes) {
    super(['from', 'to', 'label'], ['from', 'to', 'label']);
    this.from = from || -1;
    this.to = to || -1;
    this.label = '<>';
    this.attributes = attributes || {};
  }
}

class Graph {
  constructor(nodes, edges) {
    if (nodes instanceof Graph) {
      _.merge(this, _.cloneDeep(nodes));
    } else {
      this.pNodes = new ASet();
      const nodes2 = nodes || [];
      nodes2.forEach(n => this.addNode(_.isArray(n) ? new Vertex(...n) : new Vertex(n)));
      this.pEdges = new ASet();
      const edges2 = edges || [];
      edges2.forEach((e) => {
        const f = this.node(new Vertex(e[0]));
        const t = this.node(new Vertex(e[1]));
        this.addEdge(new Edge(f, t, ...e.slice(2)));
      });
    }
  }

  static fromJson(json) {
    return new Graph(
      json.nodes.map(n => [n.id, n.attributes]),
      json.edges.map(e => ([e.from, e.to, e.attributes])),
    );
  }

  static toJson(graph) {
    const nodes = [...graph.nodes()].map(n => ({ id: n.id, attributes: n.attributes }));
    const edges = [...graph.edges()].map(e => ({ from: e.from.id, to: e.to.id, attributes: e.attributes }));
    const jsonObj = { nodes, edges };
    return jsonObj;
  }

  succ(n) {
    return this.node(n).succ;
  }

  pred(n) {
    return this.node(n).pred;
  }

  node(n) {
    return this.pNodes.get(n);
  }

  nodes() {
    return this.pNodes;
  }

  addNode(n) {
    this.pNodes.add(n);
  }

  delNode(n) {
    this.pNodes.delete(n);
    n.succ.forEach((n1) => {
      this.delEdge(new Edge(n, n1));
    });
    n.pred.forEach((n1) => {
      this.delEdge(new Edge(n1, n));
    });
  }

  addEdge(e) {
    this.pEdges.add(e);
    this.succ(e.from).add(e.to);
    this.pred(e.to).add(e.from);
  }

  delEdge(e) {
    this.pEdges.delete(e);
    this.succ(e.from).delete(e.to);
    this.pred(e.to).delete(e.from);
  }

  edge(e) {
    return this.pEdges.get(e);
  }

  edges() {
    return this.pEdges;
  }

  nodeCount() {
    return this.nodes().size;
  }

  edgeCount() {
    return this.pEdges.size;
  }
}

module.exports = {
  Graph,
  Edge,
  Vertex,
};
