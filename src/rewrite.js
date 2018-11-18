const _ = require('lodash');
const { product } = require('cartesian-product-generator');
const { Graph } = require('./graph');
const { NULL_NODE } = require('./constants');

function computeMapping(map, to, from) {
  return { map, to, from };
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

function NM(a) {
  return new Map(a.map(v => [v.key, v]));
}

function IT(a) {
  return [...a.values()];
}
function HAS(a, b) {
  return a.has(b.key);
}

function UN(a, b) {
  return new Map([...a, ...b]);
}

function INS(a, b) {
  return new Map(IT(a).filter(x => HAS(b, x)));
}

function DF(a, b) {
  return NM(IT(a).filter(([x]) => !HAS(b, x)));
}

function FMAP(e, ...map) {
  // let elements = [...e].map(([, v]) => v);
  const ec = _.isArray(e) ? e : [e];
  const p = ec.map(a => IT(a));
  const values = product(...p);
  const result = [];
  values.forEach((v) => {
    map.forEach((f) => {
      const r = f(...v);
      if (r) {
        result.push(r);
        return true;
      }
      return false;
    });
  });
  return NM(result);
}

function mapElement(el, mapping) {
  if (mapping) {
    const { val } = el;
    const newVal = _.isArray(val)
      ? val.map(n => mapElement(n))
      : mapping.map(val);
    const newEl = { label: mapping.to, val: newVal };
    const key = JSON.stringify(newEl);
    return { key, ...newEl };
  }
  return el;
}

function mapArrow(mapping) {
  return s => NM(IT(s).map(el => mapElement(el, mapping)));
}

function EQ(a, b) {
  return _.isEqual(a, b);
}

function V(g) {
  return new Map([...g.graph.nodes()].map(([k]) => (mapElement(k, g.map))));
}

function E(g) {
  return new Map([...g.graph.edgesMap()].map(([, e]) => (mapElement(e, g.map))));
}

class Rewrite {
  constructor(l, k, r, k2l, k2r) {
    this.l = computeTable(l, 'l');
    this.k = computeTable(k || l, 'k');
    this.r = computeTable(r || l, 'r');
    const tk2l = k2l || identity(k, l);
    this.k2l = computeMapping(m => tk2l.get(m), 'l');
    const tk2r = k2r || identity(k, r);
    this.k2r = computeMapping(m => tk2r.get(m), 'r');
  }

  apply(A, l2A) {
    const { l, k, k2l } = this;
    const a = mapArrow(k2l);
    const m = mapArrow(computeMapping(l2A, 'A'));
    const src = e => e[0];
    const tgt = e => e[1];

    let VD;
    let ED;
    // check left linear and conflict if m(L \ a(K)) ∩ m(a(K)) = EmptySet.
    if (V(k).size === a(V(k)).size && INS(m(DF(V(l), a(V(k)))), m(a(V(k)))).size === 0) {
      // VD = VA \ m(VL \ VK)
      // ED = {e ∈ EA \ m(EL \ EK) | srcA(e) ∈ VD ∧ tgtA(e) ∈ VD}
      VD = DF(V(A), DF(V(l), a(V(k))));
      const ed2 = FMAP(E(A), e => (HAS(VD, src(e)) && HAS(VD, tgt(e)) ? e : false));
      ED = UN(DF(E(A), DF(m(E(l)), m(a(E(k))))), ed2);
    }
    // General rules monic match
    if (V(l).size === m(V(l)).size) {
      // VD = VA \ m(VL) ∪· VK
      // γV(u) = m(αV(u)) if u ∈ VK, u if u ∈ VA
      // ED = he, u, vi | e ∈ EA \ m(EL) ∧ u, v ∈ VD ∧ srcA(e) = γV(u) ∧ tgtA(e) = γV(v) ∪· EK
      // γE (e) = e′ if e = he′, u, vi, m(αE (e)) otherwise
      // srcD(e) = u if e = he′, u, vi | srcK(e) otherwise
      // tgtD(e) = v if e = he′, u, vi | tgtK(e) otherwise
      VD = UN(DF(V(A), m(V(l))), V(k));
      // eslint-disable-next-line no-nested-ternary
      const yV = u => (HAS(V(k), u) ? m(a(u)) : (HAS(V(A), u) ? u : false));
      const t1 = DF(E(A), m(E(l)));
      ED = UN(FMAP([V(A), VD, VD], (e, u, v) => (
        HAS(t1, e) && HAS(VD, src(e)) && HAS(VD, tgt(e)) && EQ(src(e), yV(u)) && EQ(tgt(e), yV(v))
          ? [e, u, v]
          : false
      )), E(k));
      const yE = FMAP(ED, e => (EQ(e.label, 'A') ? e : false), e => m(a(e)));
    }
  }
}

module.exports = {
  Rewrite,
};
