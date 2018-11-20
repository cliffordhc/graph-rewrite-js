const _ = require('lodash');
const { Graph } = require('./graph');
const { OSet } = require('./collections');
const { NULL_NODE } = require('./constants');

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
    throw Error(`missing mapping in: ${JSON.stringify(map)}`);
  };
}

function computeTable(t, label) {
  const map = computeMapping(m => m, label);
  if (t instanceof Graph) {
    return { graph: _.cloneDeep(t), map };
  }
  return { graph: new Graph(t[0], t[1]), map };
}

function identity(a, b) {
  return new Map(a.map(n => (
    [n, b[n] ? n : NULL_NODE]
  )));
}

/*
Union
Union (a ∪ b): create a set that contains the elements of both set a and set b.

let a = new Set([1,2,3]);
let b = new Set([4,3,2]);
let union = new Set([...a, ...b]);
    // {1,2,3,4}
The pattern is always the same:

Convert one or both sets to arrays.
Perform the operation.
Convert the result back to a set.
As explained in [1], the spread operator (...) inserts the elements of something iterable
(like a set) into an array. Therefore, [...a, ...b] means that a and b are converted to arrays
and concatenated. It is equivalent to [...a].concat([...b]).

Intersection
Intersection (a ∩ b): create a set that contains those elements of set a that are also in set b.

let a = new Set([1,2,3]);
let b = new Set([4,3,2]);
let intersection = new Set(
    [...a].filter(x => b.has(x)));
    // {2,3}
Steps: Convert a to an array, filter the elements, convert the result to a set.

Difference
Difference (a \ b): create a set that contains those elements of set a that are not in set b.
This operation is also sometimes called minus (-).

let a = new Set([1,2,3]);
let b = new Set([4,3,2]);
let difference = new Set(
    [...a].filter(x => !b.has(x)));
    // {1}
*/

function apply(el, map) {
  if (map) {
    return _.isArray(el)
      ? el.map(v => apply(v, map))
      : map(el);
  }
  return el;
}

function mapArrow(mapping) {
  return s => s.map(el => apply(el, mapping));
}

function EQ(a, b) {
  return _.isEqual(a, b);
}

function V(g) {
  return new OSet(g.graph.nodes().map(v => (apply(['<>', v], g.map))));
}

function E(g) {
  return g.graph.edges().map(e => (apply(e.map(e1 => ['<>', e1]), g.map)));
}

class SePO {
  constructor(l, k, r, k2l, k2r) {
    this.l = computeTable(l, 'l');
    this.k = computeTable(k || l, 'k');
    this.r = computeTable(r || l, 'r');
    const tk2l = k2l || identity(k, l);
    this.k2l = computeMapping(tk2l, 'l', 'k');
    const tk2r = k2r || identity(k, r);
    this.k2r = computeMapping(tk2r, 'r', 'k');
  }

  apply(graph, mapping) {
    debugger;
    const A = computeTable(graph, 'A');
    const l2A = computeMapping(mapping, 'A', 'l');
    const {
      l, k, k2l, r, k2r,
    } = this;
    const {
      ins, df, un, el, ev,
    } = OSet;
    const a = mapArrow(k2l);
    const m = mapArrow(l2A);
    const p = mapArrow(k2r);

    const src = e => e[0];
    const tgt = e => e[1];

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
        el([yV(u), yV(v)], t1)
          ? [u, v]
          : false
      )), E(k));
      // const yE = e => (EQ(e.label, 'A') ? e : m(a(e)));
      // const srcD = e => (EQ(e.label, 'A') ? e : m(a(e)));
      // const tgtD = e => (EQ(e.label, 'A') ? e : m(a(src(e))));
    }
    // pushout
    const VH = un(VD, df(V(r), p(V(k))));
    const EH = un(ED, df(E(r), p(E(k))));
    return new Graph([...VH].map(([s, n]) => `${s}-${n}`), [...EH].map(e => e.map(([s, n]) => `${s}-${n}`)));
  }
}

module.exports = {
  SePO,
};
