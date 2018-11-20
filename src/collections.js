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
