const _ = require('lodash');

class AElement {
  constructor(idProps = ['id'], mappedProps = []) {
    this.idProps = idProps;
    this.mappedProps = mappedProps;
  }

  key() {
    const keyInternal = (i, that) => {
      const prop = that[i];
      if (_.hasIn(prop, 'key')) {
        return `{${prop.key()}},`;
      }
      return `${i}:${typeof that[i]}=${that[i]}`;
    };
    return `${this.idProps.map(i => keyInternal(i, this)).join(',')}`;
  }

  mapTo(mapping) {
    const mapToInternal = (p, mObj, map) => {
      const mObj2 = mObj;
      if (_.hasIn(mObj2[p], 'mapTo')) {
        mObj2[p] = mObj2[p].mapTo(map);
      }
      mObj2[p] = map(mObj2[p]);
    };
    const mappedObj = _.clone(this);
    this.mappedProps.forEach((p) => {
      mapToInternal(p, mappedObj, mapping);
    });
    return mappedObj;
  }
}

class ASet {
  constructor(args) {
    let items;
    if (args != null) {
      if (typeof args[Symbol.iterator] === 'function') {
        items = [...args].map(v => (v instanceof AElement ? [v.key(), v] : v));
      }
      if (args instanceof AElement) {
        items = [args.key(), args];
      }
    }
    this.pMap = items ? new Map(items) : new Map();
    this[Symbol.iterator] = this.values;
  }

  inspect() {
    return new Set(this.pMap.values());
  }

  values() {
    return this.pMap.values();
  }

  add(item) {
    this.pMap.set(item.key(), item);
  }

  get(item) {
    return this.pMap.get(item.key());
  }

  has(item) {
    return this.pMap.has(item.key());
  }

  filter(fn) {
    return new ASet([...this].filter(fn));
  }

  get size() {
    return this.pMap.size;
  }

  map(fn) {
    return new ASet([...this].map(fn));
  }

  delete(item) {
    this.pMap.delete(item.key());
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

  static un(a, b) {
    return new ASet([...a, ...b]);
  }

  static ins(a, b) {
    return a.filter(x => b.has(x));
  }

  static df(a, b) {
    return a.filter(x => !b.has(x));
  }

  static el(e, a) {
    return a.has(e);
  }

  static ev(e, ...map) {
    // let elements = [...e].map(([, v]) => v);
    const p = _.isArray(e) ? e : [e];

    // Generate cartesian product of given iterables:
    function* cartesian(head, ...tail) {
      const remainder = tail.length > 0 ? cartesian(...tail) : [[]];
      // eslint-disable-next-line no-restricted-syntax
      for (const r of remainder) for (const h of head) yield [h, ...r];
    }

    // Example:
    const values = cartesian(...p);
    const result = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const v of values) {
      // eslint-disable-next-line no-restricted-syntax
      for (const f of map) {
        const r = f(...v);
        if (r) {
          result.push(r);
        }
      }
    }
    return new ASet(result);
  }

  forEach(fn) {
    return [...this].forEach(fn);
  }

  reduce(fn, acc) {
    return new ASet([...this].reduce(fn, acc));
  }
}

module.exports = {
  ASet,
  AElement,
};
