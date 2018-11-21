const _ = require('lodash');
const { Graph, Edge } = require('./graph');
const { ASet } = require('./collections');

function computeMapping(pmap, to, from = '<>', allowMissing) {
  const am = allowMissing === undefined ? from === '<>' : allowMissing;
  const map = { ...pmap, [from]: to };
  return (m) => {
    if (_.has(map, m)) {
      return map[m];
    }
    if (am) {
      return m;
    }
    throw Error(`missing mapping in: ${JSON.stringify({ m, map })}`);
  };
}

function computeTable(t, label) {
  const map = computeMapping(m => m, label);
  if (t instanceof Graph) {
    return { graph: _.cloneDeep(t), map };
  }
  return { graph: new Graph(t[0], t[1]), map };
}

function identity(a) {
  return a.nodes().reduce((acc, n) => _.set(acc, n, n), {});
}

function mapArrow(mapping) {
  return s => (_.hasIn(s, 'mapTo') ? s.mapTo(mapping) : s.map(el => el.mapTo(mapping)));
}

function V(g) {
  return g.graph.nodes().map(v => v.mapTo(g.map));
}

function E(g) {
  return g.graph.edges().map(e => e.mapTo(g.map));
}

class SePO {
  constructor(l, k, r, k2l, k2r) {
    this.l = computeTable(l, 'l');
    this.k = computeTable(k || l, 'k');
    this.r = computeTable(r || l, 'r');
    const tk2l = k2l || identity(l);
    this.k2l = computeMapping(tk2l, 'l', 'k');
    const tk2r = k2r || identity(l);
    this.k2r = computeMapping(tk2r, 'r', 'k');
  }

  injectRemoveEdge(from, to) {
    this.k.graph.delNode(from, to);
  }

  injectRemoveNodeAttrs() {

  }

  injectMergeNodes(nodes) {

  }

  apply(graph, mapping) {
    const A = computeTable(graph, 'A');
    const l2A = computeMapping(mapping, 'A', 'l');
    const {
      l, k, k2l, r, k2r,
    } = this;
    const {
      ins, df, un, el, ev,
    } = ASet;
    const a = mapArrow(k2l);
    const m = mapArrow(l2A);
    const p = mapArrow(k2r);

    const src = e => e.from;
    const tgt = e => e.to;

    let VD;
    let ED;
    // check left linear and conflict if m(L \ a(K)) ∩ m(a(K)) = EmptySet.
    if (V(k).size === a(V(k)).size && ins(m(df(V(l), a(V(k)))), m(a(V(k)))).size === 0) {
      // VD = VA \ m(VL \ VK)
      // ED = {e ∈ EA \ m(EL \ EK) | srcA(e) ∈ VD ∧ tgtA(e) ∈ VD}
      VD = df(V(A), m(df(V(l), a(V(k)))));
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
      const yV = u => (el(u, V(k)) ? m(a(u)) : (el(u, V(A)) ? u : false));
      const t1 = df(E(A), m(E(l)));
      ED = un(ev([VD, VD], (u, v) => (
        el((new Edge(yV(u), yV(v))).mapTo(A.map), t1)
          ? new Edge(u, v)
          : false
      )), E(k));
      debugger
      // const yE = e => (EQ(e.label, 'A') ? e : m(a(e)));
      // const srcD = e => (EQ(e.label, 'A') ? e : m(a(e)));
      // const tgtD = e => (EQ(e.label, 'A') ? e : m(a(src(e))));
    }
    // pushout
    const VH = un(VD, df(V(r), p(V(k))));
    const EH = un(ED, df(E(r), p(E(k))));
    return new Graph(
      [...VH].map(n => `${n.label}-${n.id}`),
      [...EH].map(e => [`${e.from.label}-${e.from.id}`, `${e.to.label}-${e.to.id}`]),
    );
  }
}

module.exports = {
  SePO,
};
