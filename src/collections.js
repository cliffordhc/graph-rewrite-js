const _ = require('lodash');

class ESet extends Set {
  filter(fn) {
    return new ESet([...this].filter(fn));
  }

  map(fn) {
    return new ESet([...this].map(fn));
  }
}

class EMap extends Map {
  filter(fn) {
    return new EMap([...this].filter(fn));
  }

  map(fn) {
    return new EMap([...this].map(fn));
  }
}

class OSet {
  constructor(args) {
    let valueEntries;
    if (args != null && typeof args[Symbol.iterator] === 'function') {
      valueEntries = [...args].map(v => ([JSON.stringify(v), v]));
    }
    this.mapValues = valueEntries ? new Map(valueEntries) : new Map();
    this[Symbol.iterator] = this.values;
  }

  inspect() {
    return new Set(this.mapValues.values());
  }

  values() {
    return this.mapValues.values();
  }

  add(item) {
    const key = JSON.stringify(item);
    this.mapValues.set(key, item);
  }

  get(item) {
    const key = JSON.stringify(item);
    return this.mapValues.get(key);
  }

  has(item) {
    return this.mapValues.has(JSON.stringify(item));
  }

  filter(fn) {
    return new OSet([...this].filter(fn));
  }

  get size() {
    return this.mapValues.size;
  }

  map(fn) {
    return new OSet([...this].map(fn));
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
    return new OSet([...a, ...b]);
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
    return new OSet(result);
  }

  forEach(fn) {
    super.forEach((v, k, s) => {
      fn(v, v, s);
    });
  }
}

class OMap extends Map {
  constructor(args) {
    let keyEntries;
    let proArgs = args;
    if (proArgs != null && typeof proArgs[Symbol.iterator] === 'function') {
      proArgs = [...proArgs].map(([k, v]) => ([JSON.stringify(k), v]));
      keyEntries = [...proArgs].map(([k]) => ([JSON.stringify(k), k]));
    }
    super(proArgs);
    this[Symbol.iterator] = this.entries;
    this.mapKey = keyEntries ? new Map(keyEntries) : new Map();
  }

  set(key, value) {
    const skey = JSON.stringify(key);
    super.set(skey, value);
    this.mapKey.set(skey, key);
  }

  get(key) {
    const skey = JSON.stringify(key);
    return this.get(skey);
  }

  has(key) {
    return super.has(JSON.stringify(key));
  }

  forEach(fn) {
    super.forEach((v, k, s) => {
      fn(v, this.mapKey.get(k), s);
    });
  }

  entries() {
    const iter = super.entries();
    return {
      next() {
        const val = iter.next();
        if (!val.done) {
          val.value[0] = this.mapKey.get(val.value[0]);
        }
        return val;
      },
    };
  }
}

module.exports = {
  ESet,
  EMap,
  OMap,
  OSet,
};
