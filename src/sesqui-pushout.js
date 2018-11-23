const _ = require('lodash');
const { Graph, Edge } = require('./graph');
const { ASet } = require('./collections');

function computeMapping(pmap, to, from = '<>', allowMissing) {
  const am = allowMissing === undefined ? from === '<>' : allowMissing;
  let mapFunc;
  if (_.isFunction(pmap)) {
    mapFunc = (m) => {
      if (m === from) {
        return to;
      }
      return pmap(m);
    };
  } else {
    const map = { ...pmap, [from]: to };
    mapFunc = (m) => {
      if (_.has(map, m)) {
        return map[m];
      }
      if (am) {
        return m;
      }
      throw Error(`missing mapping in: ${JSON.stringify({ m, map })}`);
    };
  }
  const mapTo = (mappedObj) => {
    const mapToInternal = (mObj, doMap = false) => {
      const mObj2 = _.clone(mObj);
      if (_.hasIn(mObj2, 'mappedProps')) {
        mObj2.mappedProps.forEach((p) => {
          mObj2[p] = mapToInternal(mObj2[p], true);
        });
        return mObj2;
      }
      if (doMap) {
        return mapFunc(mObj2);
      }
      return mObj2;
    };
    return mapToInternal(mappedObj);
  };
  return s => (ASet.isIterable(s) ? s.map(v => mapTo(v, mapp)) : mapTo(s));
}

function computeCombined(...mappings) {
  if (mappings && mappings.reduce((a, m) => a && _.isObject(m), true)) {
    const values = _.keys(_.first(mappings));
    const combined = values.reduce(
      (o, initial) => _.set(o, initial, mappings.reduce((v, map) => map[v], initial)),
      {},
    );
    return combined;
  }
  return {};
}

function computeInverse(map, to, from) {
  const invertedMap = _.mapValues(_.invertBy(map), v => v.map(v2 => map[v2]));
  return computeMapping(invertedMap, to, from);
}

function computeTable(t, label) {
  const map = computeMapping(m => m, label);
  if (t instanceof Graph) {
    return { graph: _.cloneDeep(t), map };
  }
  return { graph: new Graph(t[0], t[1]), map };
}

function identity(a) {
  return [...a.nodes()].reduce((acc, n) => _.set(acc, n.id, n.id), {});
}

function V(g) {
  return g.map(g.graph.nodes());
}

function E(g) {
  return g.map(g.graph.edges());
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
    // this.k.delEdge(this.k.edgeByIds(from, to));
    // this.rhs.delEdge(this.rhs.edgeByIds(from, to));
  }

  injectRemoveNodeAttrs() {

  }

  injectMergeNodes(nodes) {
    const id = nodes.join('_');
    const vertices = nodes.map(n => this.rhs.nodeById(n));
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
    const l2A = computeMapping(mapping, 'A', 'l');
    const l = computeTable(this.lhs, 'l');
    const k2l = computeMapping(this.kToLhs, 'l', 'k');
    const k = computeTable(this.k, 'k');
    const k2r = computeMapping(this.kToRhs, 'r', 'k');
    const r = computeTable(this.rhs, 'r');

    const {
      ins, df, un, el, ev, eq,
    } = ASet;
    const a = k2l;
    const m = l2A;
    const p = k2r;

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
        el(new Edge(yV(u), yV(v)), t1)
          ? new Edge(u, v)
          : false
      )), E(k));
      // const yE = e => (EQ(e.label, 'A') ? e : m(a(e)));
      // const srcD = e => (EQ(e.label, 'A') ? e : m(a(e)));
      // const tgtD = e => (EQ(e.label, 'A') ? e : m(a(src(e))));
    }
    // Glue vertices and edges
    // eslint-disable-next-line no-nested-ternary
    const yA2k = computeInverse(computeCombined(this.kToLhs, mapping), 'k', 'A');
    const gV = u => (el(u, m(a(V(k)))) ? yA2k(u) : [u]);
    const GVD = un(df(VD, m(a(V(k)))), V(k));
    const GED = ev(ED, e => ev([gV(e.from), gV(e.to)], (u, v) => new Edge(u, v)));

    // pushout
    const pV = u => (el(u, V(k)) ? p(u) : u);
    const pE = e => new Edge(pV(src(e)), pV(tgt(e)));

    const VH = ev(un(GVD, df(V(r), p(V(k)))), pV);
    const EH = ev(un(GED, df(E(r), p(E(k)))), pE);
    debugger
    return new Graph(
      [...VH].map(n => `${n.label}-${n.id}`),
      [...EH].map(e => [`${e.from.label}-${e.from.id}`, `${e.to.label}-${e.to.id}`]),
    );
  }
}

module.exports = {
  SePO,
};
