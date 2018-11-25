const _ = require('lodash');
const { Graph, Edge } = require('./graph');
const { ASet } = require('./collections');

function computeTable(t, label) {
  const map = ASet.computeMapping(m => [m], label);
  if (t instanceof Graph) {
    return { graph: _.cloneDeep(t), map };
  }
  return { graph: new Graph(t[0], t[1]), map };
}

function identity(a) {
  return [...a.nodes()].reduce((acc, n) => _.set(acc, n.id, n.id), {});
}

function V(g) {
  return ASet.ap(g.map, g.graph.nodes());
}

function E(g) {
  return ASet.ap(g.map, g.graph.edges());
}

class SePO {
  constructor(lhs, k, rhs, kToLhs, kToRhs) {
    this.lhs = lhs || {};
    this.k = k || _.cloneDeep(this.lhs);
    this.rhs = rhs || _.cloneDeep(this.lhs);
    const tkToLhs = kToLhs || identity(this.lhs);
    this.kToLhs = tkToLhs;
    const tkToRhs = kToRhs || identity(this.rhs);
    this.kToRhs = tkToRhs;
  }

  injectRemoveEdge(from, to) {
    const lhsFrom = this.kToRhs[from];
    const lhsTo = this.kToRhs[to];

    const rhsFrom = this.kToRhs[from];
    const rhsTo = this.kToRhs[to];

    const kEdge = this.k.edgeByIds(from, to);
    const lhsEdge = this.lhs.edgeByIds(lhsFrom, lhsTo);
    const rhsEdge = this.rhs.edgeByIds(rhsFrom, rhsTo);

    if (!kEdge) throw new Error('Edge does not exists');
    this.lhs.addEdge(kEdge);
    this.k.delEdge(lhsEdge);
    this.rhs.delEdge(rhsEdge);
  }

  injectRemoveNode(nodeId) {
    const node = this.k.nodeById(nodeId);
    if (!node) throw new Error('Node does not exists');
    this.k.delNode(node);
    this.rhs.delNode(this.rhs.nodeById(this.kToRhs[nodeId]));
    delete this.kToRhs[nodeId];
    delete this.kToLhs[nodeId];
  }

  injectAddNode(nodeId) {
    const rhsNode = this.rhs.nodeById(nodeId);
    if (rhsNode) throw new Error('Node already exists');
    this.rhs.addNodeId(nodeId);
  }

  injectCloneNode(nodeId) {
    const kNode = this.k.nodeById(nodeId);
    const rhsNode = this.rhs.nodeById(nodeId);
    if (!kNode || !rhsNode) throw new Error('Node does not exists');
    let newNodeId;
    for (let i = 1; ; i += 1) {
      newNodeId = `${nodeId}c${i}`;
      const nk = this.k.nodeById(newNodeId);
      const nRhs = this.rhs.nodeById(newNodeId);
      if (!nk && !nRhs) break;
    }

    const newKNode = this.k.addNodeId(newNodeId);
    const newRhsNode = this.rhs.addNodeId(newNodeId);

    kNode.pred.forEach(p => this.k.addEdge(p, newKNode));
    kNode.succ.forEach(s => this.k.addEdge(newKNode, s));
    rhsNode.pred.forEach(p => this.k.addEdge(p, newRhsNode));
    rhsNode.succ.forEach(s => this.k.addEdge(newRhsNode, s));

    this.kToLhs[newNodeId] = this.kToLhs[nodeId];
    this.kToRhs[newNodeId] = newNodeId;
  }

  injectMergeNodes(nodes) {
    const id = nodes.join('_');
    const vertices = nodes.map(n => this.rhs.nodeById(n));
    if (!_.isEmpty(vertices.filter(v => v === undefined))) throw new Error('Some nodes do not exists');
    const newVertex = this.rhs.addNodeId(id);
    vertices.forEach((n) => {
      this.rhs.delNode(n);
    });
    vertices.forEach((n) => {
      n.pred.forEach(p => this.rhs.addEdge(p, newVertex));
      n.succ.forEach(s => this.rhs.addEdge(newVertex, s));
    });
    nodes.forEach((n) => { this.kToRhs[n] = id; });
  }

  apply(graph, mapping) {
    const A = computeTable(graph, 'A');
    const l2A = ASet.computeMapping(mapping, 'A', 'l');
    const l = computeTable(this.lhs, 'l');
    const k2l = ASet.computeMapping(this.kToLhs, 'l', 'k');
    const k = computeTable(this.k, 'k');
    const k2r = ASet.computeMapping(this.kToRhs, 'r', 'k');
    const r = computeTable(this.rhs, 'r');

    const {
      ins, df, un, el, ev, im, ap,
    } = ASet;
    const a = s => ap(k2l, s);
    const m = s => ap(l2A, s);
    const p = s => ap(k2r, s);

    const src = e => e.from;
    const tgt = e => e.to;

    let VD;
    let ED;
    // check left linear and conflict if m(L \ a(K)) ∩ m(a(K)) = EmptySet.
    if (V(k).size === a(V(k)).size && ins(m(df(V(l), a(V(k)))), m(a(V(k)))).size === 0) {
      // VD = VA \ m(VL \ VK)
      // ED = {e ∈ EA \ m(EL \ EK) | srcA(e) ∈ VD ∧ tgtA(e) ∈ VD}
      VD = df(V(A), m(df(V(l), a(V(k)))));
      debugger;
      ED = ev(df(E(A), df(m(E(l)), m(a(E(k))))), e => (
        el(src(e), VD) && el(tgt(e), VD)
          ? e
          : false
      ));
    } else if (V(l).size === m(V(l)).size) {
      // General rules monic match
      // VD = VA \ m(VL) ∪· VK
      // γV(u) = m(αV(u)) if u ∈ VK, u if u ∈ VA
      // ED = he, u, vi | e ∈ EA \ m(EL) ∧ u, v ∈ VD ∧ srcA(e) = γV(u) ∧ tgtA(e) = γV(v) ∪· EK
      // γE (e) = e′ if e = he′, u, vi, m(αE (e)) otherwise
      // srcD(e) = u if e = he′, u, vi, srcK(e) otherwise
      // tgtD(e) = v if e = he′, u, vi, tgtK(e) otherwise
      VD = un(df(V(A), m(V(l))), V(k));
      // eslint-disable-next-line no-nested-ternary
      const yVd = u => (el(u, V(k)) ? m(a(u)) : (el(u, V(A)) ? u : false));
      const t1 = df(E(A), m(E(l)));
      ED = un(ev([VD, VD], (u, v) => (
        el(new Edge(im(yVd(u)), im(yVd(v))), t1)
          ? new Edge(u, v)
          : false
      )), E(k));
      // const yE = e => (EQ(e.label, 'A') ? e : m(a(e)));
      // const srcD = e => (EQ(e.label, 'A') ? e : m(a(e)));
      // const tgtD = e => (EQ(e.label, 'A') ? e : m(a(src(e))));
    }
    // Glue vertices and edges
    // eslint-disable-next-line no-nested-ternary
    const yA2k = ASet.computeInverse(ASet.computeCombined(this.kToLhs, mapping), 'k', 'A');
    const yVg = u => (el(u, m(a(V(k)))) ? ap(yA2k, u) : [u]);
    const GVD = un(df(VD, m(a(V(k)))), V(k));
    const GED = ev(ED, e => ev([yVg(e.from), yVg(e.to)], (u, v) => new Edge(u, v)));
    // pushout
    const pV = u => (el(u, V(k)) ? p(u) : u);
    const pE = e => new Edge(im(pV(src(e))), im(pV(tgt(e))));

    const VH = ev(un(GVD, df(V(r), p(V(k)))), pV);
    const EH = ev(un(GED, df(E(r), p(E(k)))), pE);
    return new Graph(
      [...VH].map(n => `${n.label}-${n.id}`),
      [...EH].map(e => [`${e.from.label}-${e.from.id}`, `${e.to.label}-${e.to.id}`]),
    );
  }
}

module.exports = {
  SePO,
};
