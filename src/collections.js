const _ = require('lodash');

class AElement {
  static setMappedProps(subType, mapProps) {
    let mp;
    if (_.isArray(mapProps)) {
      mp = mapProps.reduce((o, p) => _.set(o, p, true), {});
    } else if (_.isObject(mapProps)) {
      mp = mapProps;
    } else {
      throw new Error('Wrong arguments');
    }
    // eslint-disable-next-line no-param-reassign
    subType.mapProps = mp;
  }

  keyProps() {
    return _.keys(this);
  }

  // eslint-disable-next-line class-methods-use-this

  static mapChild(mapping, that, p) {
    const child = that[p];
    if (that.constructor.mapProps[p]) {
      if (child instanceof AElement) {
        return child.mapTo(mapping);
      }
      return mapping[child].values();
    }
    return [child].values();
  }

  mapTo(mapping) {
    const mapped = _.keys(this).map(p => [p, () => AElement.mapChild(mapping, this, p)]);
    return AElement.cartesian(mapped, this);
  }

  static cartesian(propList, that) {
    const [first, ...rest] = propList;
    const [prop, valuesGenerator] = first;
    const values = valuesGenerator();
    if (_.isEmpty(rest)) {
      return {
        next() {
          const n = values.next();
          if (n.done) { return n; }
          const that2 = _.clone(that);
          that2[prop] = n.value;
          n.value = that2;
          return n;
        },
        [Symbol.iterator]() { return this; },
      };
    }
    let a = values.next();
    let restIterator = AElement.cartesian(rest, that);
    return {
      next() {
        if (a.done) { return { done: true }; }
        const b = restIterator.next();
        if (b.done) {
          a = values.next();
          restIterator = AElement.cartesian(rest, that);
          return this.next();
        }
        b.value[prop] = a.value;
        return b;
      },
      [Symbol.iterator]() { return this; },
    };
  }

  key() {
    const keyInternal = (i, that) => {
      const prop = that[i];
      if (_.hasIn(prop, 'key')) {
        return `{${prop.key()}},`;
      }
      return `${i}:${typeof that[i]}=${that[i]}`;
    };
    return `${this.keyProps().map(i => keyInternal(i, this)).join(',')}`;
  }
}


class ASet {
  constructor(args) {
    let items = args;
    if (items != null) {
      if (items instanceof AElement) {
        items = [args.key(), args];
      }
      if (typeof items[Symbol.iterator] === 'function') {
        items = [...items].map((v) => {
          if (v instanceof AElement) {
            return [v.key(), v];
          }
          // console.log(v);
          throw Error('Wrong args type');
        });
      } else {
        throw Error('Wrong args type');
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
    return this.pMap.delete(item.key());
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

  static eq(e, a) {
    return a.key() === e.key();
  }

  static ap(mapping, iterable) {
    const ts = iterable.values();
    let val = ts.next();
    let values;
    if (!val.done)values = val.value.mapTo(mapping);
    return {
      [Symbol.iterator]() { return this; },
      next() {
        if (val.done) { return val; }
        const nextVal = values.next();
        if (nextVal.done) {
          val = ts.next();
          if (val.done) { return val; }
          values = val.value.mapTo(mapping);
          return this.next();
        }
        return nextVal;
      },
    };
  }

  static ev(e, ...map) {
    // let elements = [...e].map(([, v]) => v);
    function* cartesian(head, ...tail) {
      const remainder = tail.length > 0 ? cartesian(...tail) : [[]];
      try {
        // eslint-disable-next-line no-restricted-syntax
        for (const r of remainder) for (const h of head) yield [h, ...r];
      } catch (err) {
        throw err;
      }
    }

    const input = [...(ASet.isIterable(e) ? e : [e])].map(
      s => (ASet.isIterable(s) ? s : [s]),
    );
    const result = new ASet();
    if (!_.isEmpty(input)) {
      // Generate cartesian product of given iterables:
      // Example:
      const values = cartesian(...input);
      // eslint-disable-next-line no-restricted-syntax
      for (const v of values) {
        // eslint-disable-next-line no-restricted-syntax
        for (const f of map) {
          const r = f(...v);
          if (r) {
            if (ASet.isIterable(r)) {
              r.forEach(item => result.add(item));
            } else {
              result.add(r);
            }
          }
        }
      }
    }
    return result;
  }

  static isIterable(obj) {
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
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
