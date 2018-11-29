const _ = require('lodash');
const {
  ASet,
  AElement,
} = require('./collections');

class Vertex extends AElement {
  constructor(id, attrs) {
    super(attrs);
    this.id = id != null ? id.toString() : -1;
    this.label = '<>';
    this.pred = new ASet();
    this.succ = new ASet();
  }
}

ASet.setKeyProps(Vertex, ['id', 'label']);
ASet.setMappedProps(Vertex, ['id', 'label']);

class Edge extends AElement {
  constructor(from, to, attrs) {
    super(attrs);
    this.from = from != null ? from : -1;
    this.to = to != null ? to : -1;
  }
}

ASet.setKeyProps(Edge, ['from', 'to']);
ASet.setMappedProps(Edge, ['from', 'to']);

class Graph {
  constructor(nodes, edges) {
    if (nodes instanceof Graph) {
      _.merge(this, _.cloneDeep(nodes));
    } else {
      this.pNodes = new ASet();
      const nodes2 = nodes != null ? nodes : [];
      nodes2.forEach(n => this.addNode(_.isArray(n) ? new Vertex(...n) : new Vertex(n)));
      this.pEdges = new ASet();
      const edges2 = edges != null ? edges : [];
      edges2.forEach((e) => {
        const f = this.node(new Vertex(e[0]));
        const t = this.node(new Vertex(e[1]));
        this.addEdge(new Edge(f, t, e[2]));
      });
    }
  }

  static defaultCompatibility(g1, g2) {
    return {
      node(node1, node2) {
        const n1 = g1.nodeById(node1);
        const n2 = g2.nodeById(node2);
        return n2.compatible(n1);
      },
      edge(from1, to1, from2, to2) {
        const e1 = g1.edgeByIds(from1, to1);
        const e2 = g2.edgeByIds(from2, to2);
        return e2.compatible(e1);
      },
    };
  }

  static fromJson(json) {
    return new Graph(
      json.nodes.map(n => [n.id, n.attrs]),
      json.edges.map(e => ([e.from, e.to, e.attrs])),
    );
  }

  static toJson(graph) {
    const nodes = [...graph.nodes()].map(n => ({ id: n.id, attrs: n.attrs }));
    const edges = [...graph.edges()].map(e => ({
      from: e.from.id, to: e.to.id, attrs: e.attrs,
    }));
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

  nodeById(id) {
    return this.node(new Vertex(id));
  }


  nodes() {
    return this.pNodes;
  }

  addNode(n) {
    this.pNodes.add(n);
  }

  addNodeId(id) {
    const newNode = new Vertex(id);
    this.addNode(newNode);
    return newNode;
  }

  delNode(n) {
    if (this.pNodes.delete(n)) {
      n.succ.forEach((n1) => {
        this.delEdge(new Edge(n, n1));
      });
      n.pred.forEach((n1) => {
        this.delEdge(new Edge(n1, n));
      });
    }
  }

  addEdge(edge, to) {
    let e;
    if (edge instanceof Edge) {
      e = edge;
    } else if (edge instanceof Vertex && to instanceof Vertex) {
      e = new Edge(edge, to);
    } else {
      throw Error('Wrong arguments');
    }
    this.pEdges.add(e);
    this.succ(e.from).add(e.to);
    this.pred(e.to).add(e.from);
  }

  delEdge(e) {
    if (this.pEdges.delete(e)) {
      e.from.succ.delete(e.to);
      e.to.pred.delete(e.from);
    }
  }

  edge(e) {
    return this.pEdges.get(e);
  }

  edgeByIds(f, t) {
    const newEdge = new Edge(this.nodeById(f), this.nodeById(t));
    return this.edge(newEdge);
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
