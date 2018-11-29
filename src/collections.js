const _ = require('lodash');

function cartesian(propList, handler) {
  const [first, ...rest] = propList;
  return {
    [Symbol.iterator]() {
      return this.values();
    },
    values() {
      return {
        childIterator: handler.valuesGenerator(first),
        next() {
          const b = this.restIterator && this.restIterator.next();
          if (b == null || b.done) {
            this.a = this.childIterator.next();
            if (this.a.done) { return this.a; }
            if (_.isEmpty(rest)) {
              return { value: handler.finalCartesian(first, this.a.value) };
            }
            this.restIterator = cartesian(rest, handler).values();
            return this.next();
          }
          return { value: handler.combine(first, this.a.value, b.value) };
        },
      };
    },
  };
}

class AExp {
  static eval() {
    return false;
  }
}

class AElement {
  constructor(attrs) {
    this.attrs = {};
    if (attrs) {
      this.merge(attrs);
    }
  }

  merge(attrs) {
    this.attrs = AElement.mergeAttrs(this.attrs, attrs);
  }

  remove(attrs) {
    this.attrs = AElement.removeAttrs(this.attrs, attrs);
  }

  static mapChild(mapping, child) {
    if (child instanceof AElement) {
      return child.mapTo(mapping);
    }
    return mapping(child);
  }

  static normalizeAttrs(attrsList) {
    const nomalizeArray = arr => arr.reduce(
      (acc, values) => _.entries(values).reduce(
        (acc2, [k, v]) => _.set(acc2, k, acc2[k] ? new Set([v, ...acc2[k]]) : new Set([v])),
        acc,
      ),
      {},
    );
    if (_.isArray(attrsList)) {
      if (attrsList.every(a => _.isPlainObject(a))) {
        return nomalizeArray(attrsList);
      }
    }
    if (_.isPlainObject(attrsList)) {
      if (_.values(attrsList).every(a => a instanceof Set)) {
        return _.cloneDeep(attrsList);
      }
      return nomalizeArray([attrsList]);
    }
    throw new Error('Wrong arguments');
  }

  static mergeAttrs(...attrsLists) {
    const normalizedAttrsLists = attrsLists.map(AElement.normalizeAttrs);
    const keys = new Set(_.flatMap(normalizedAttrsLists, _.keys));
    const result = {};
    [...keys].forEach((key) => {
      result[key] = new Set(
        _.flatMap(normalizedAttrsLists, al => (al[key] ? [...al[key]] : [])),
      );
    });
    return result;
  }

  static removeAttrs(attrsList1, attrsList2) {
    const normalizedAttrsList1 = attrsList1 ? AElement.normalizeAttrs(attrsList1) : {};
    const normalizedAttrsList2 = attrsList2 ? AElement.normalizeAttrs(attrsList2) : {};

    _.forOwn(normalizedAttrsList2, (value, key) => {
      if (normalizedAttrsList1[key]) {
        [...value].forEach((v) => {
          normalizedAttrsList1[key].delete(v);
          if (normalizedAttrsList1[key].size === 0) delete normalizedAttrsList1[key];
        });
      }
    });
    return normalizedAttrsList1;
  }

  compatible(node) {
    return _.entries(this.attrs).every(
      ([key, value]) => [...value].every(
        v => (v instanceof AExp
          ? AExp.eval(v, node.attrs[key])
          : node.attrs[key] && node.attrs[key].has(v)),
      ),
    );
  }

  mapTo(mapping) {
    const mapped = this.constructor.mapProps.map(p => [
      p,
      AElement.mapChild(mapping, this[p]),
    ]);
    const that = this;
    return cartesian(mapped, {
      valuesGenerator(first) {
        return first[1].values();
      },
      finalCartesian(first, value) {
        const n = value;
        const val = _.clone(that);
        val[first[0]] = n;
        return val;
      },
      combine(first, value, rest) {
        const r = rest;
        r[first[0]] = value;
        return r;
      },
    });
  }

  key() {
    const keyInternal = (i, that) => {
      const prop = that[i];
      if (_.hasIn(prop, 'key')) {
        return `{${prop.key()}},`;
      }
      return `${i}:${typeof that[i]}=${that[i]}`;
    };
    return `${this.constructor.keyProps.map(i => keyInternal(i, this)).join(',')}`;
  }
}

class ASet {
  constructor(args) {
    let items = args;
    if (items != null) {
      if (items instanceof AElement) {
        items = [args.key(), args];
      }
      if (ASet.isIterable(items)) {
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

  static setMappedProps(subType, mapProps) {
    if (_.isArray(mapProps)) {
      // eslint-disable-next-line no-param-reassign
      subType.mapProps = mapProps;
    } else {
      throw new Error('Wrong arguments');
    }
  }

  static setKeyProps(subType, keyProps) {
    if (_.isArray(keyProps)) {
      // eslint-disable-next-line no-param-reassign
      subType.keyProps = keyProps;
    } else {
      throw new Error('Wrong arguments');
    }
  }

  static generateMapping(mapping, to, from, allowAll) {
    let frm = from;
    let all = allowAll;
    if (!frm) {
      frm = '<>';
      all = true;
    }
    if (allowAll === undefined && frm === '<>') {
      all = true;
    }
    if (_.isFunction(mapping)) {
      return val => (val === frm ? [to] : mapping(val));
    } if (_.isPlainObject(mapping)) {
      const map = _.cloneDeep(mapping);
      map[frm] = [to];
      if (all) {
        return val => (_.has(map, val) ? map[val] : val);
      }
      return (val) => {
        if (_.has(map, val)) {
          return map[val];
        }
        throw new Error('Missing mapping');
      };
    }
    throw new Error('Wrong arguments');
  }

  static normalizeMap(...mappings) {
    if (mappings && mappings.every(m => _.isPlainObject(m))) {
      const values = _.keys(_.first(mappings));
      const normalized = values.reduce(
        (o, initial) => _.set(o, initial, mappings.reduce(
          (v, map) => (_.isArray(v) ? _.flatMap(v, v2 => map[v2]).map(String) : _.flatten([map[v]]).map(String)),
          initial,
        )),
        {},
      );
      return normalized;
    }
    return {};
  }

  static computeInverse(map) {
    return _.keys(map).reduce(
      (acc, k) => map[k].reduce(
        (acc2, v) => _.set(acc2, v, acc2[v] ? acc2[v].concat(k) : [k]),
        acc,
      ),
      {},
    );
  }

  inspect() {
    return new Set(this.pMap.values());
  }

  values() {
    return {
      childIterator: this.pMap.values(),
      next() {
        return this.childIterator.next();
      },
    };
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

  static filter(values, fn) {
    return {
      [Symbol.iterator]() {
        return this.values();
      },
      values() {
        return {
          childIterator: ASet.getIterable(values),
          next() {
            for (; ;) {
              const val = this.childIterator.next();
              if (val.done) return val;
              if (fn(val.value)) return val;
            }
          },
        };
      },
    };
  }

  static getIterable(values) {
    let iterable;
    if (values instanceof AElement) {
      iterable = [values];
    } else {
      iterable = values;
    }
    if (ASet.isIterable(iterable)) {
      return iterable[Symbol.iterator]();
    }
    throw new Error('Wrong arguments');
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
    const s = new ASet([...b]);
    return ASet.filter(a, x => s.has(x));
  }

  static df(a, b) {
    const s = new ASet([...b]);
    return ASet.filter(a, x => !s.has(x));
  }

  static el(e, a) {
    const s = new ASet([...a]);
    return s.has(e);
  }

  static eq(e, a) {
    return a.key() === e.key();
  }

  static im(a) {
    if (a instanceof AElement) {
      return a;
    } if (ASet.isIterable(a)) {
      const values = [...a];
      return values.length === 1 ? values[0] : values;
    }
    throw new Error('Wrong arguments');
  }

  static ap(mapping, targetSet) {
    return {
      [Symbol.iterator]() {
        return this.values();
      },
      values() {
        return {
          childIterator: ASet.getIterable(targetSet),
          next() {
            const nextVal = this.valuesIterator && this.valuesIterator.next();
            if (nextVal == null || nextVal.done) {
              const val = this.childIterator.next();
              if (val.done) { return val; }
              this.valuesIterator = val.value.mapTo(mapping).values();
              return this.next();
            }
            return nextVal;
          },
        };
      },
    };
  }

  static ev(e, ...map) {
    // let elements = [...e].map(([, v]) => v);
    const input = [...(_.isArray(e) ? e : [e])].map(
      s => (ASet.isIterable(s) ? [...s] : [s]),
    );
    if (!_.isEmpty(input)) {
      const handler = {
        finalCartesian(first, lastIterator) {
          return [lastIterator];
        },
        valuesGenerator(first) {
          return ASet.getIterable(first);
        },
        combine(first, value, rest) {
          return [value, ...rest];
        },
      };
      // Generate cartesian product of given iterables:
      // Example:
      return {
        [Symbol.iterator]() {
          return this.values();
        },
        values() {
          return {
            childIterator: ASet.getIterable(cartesian(input, handler)),
            next() {
              const result = this.resultIterator && this.resultIterator.next();
              if (result == null || result.done) {
                for (; ;) {
                  const cartesianProduct = this.childIterator.next();
                  if (cartesianProduct.done) return cartesianProduct;
                  const rf = map.reduce((acc, f) => acc || f(...cartesianProduct.value), false);
                  if (rf !== false) {
                    this.resultIterator = ASet.getIterable(rf);
                    return this.next();
                  }
                }
              }
              return result;
            },
          };
        },
      };
    }
    return [];
  }

  static isIterable(obj) {
    if (obj == null || !_.isObject(obj)) {
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
