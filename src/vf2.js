const _ = require('lodash');
const { Graph } = require('./graph');
const { NULL_NODE } = require('./constants');

function findMin(arry, predicate) {
  for (let i = 0; i < arry.length; i += 1) {
    if (predicate(i)) return i;
  }
  return NULL_NODE;
}

function findAll(arry, predicate) {
  const all = [];
  for (let i = 0; i < arry.length; i += 1) {
    if (predicate(i)) all.push(i);
  }
  return all;
}

function resetArray(arry, depth) {
  for (let i = 0; i < arry.length; i += 1) {
    if (arry[i] >= depth) {
      // eslint-disable-next-line no-param-reassign
      arry[i] = 0;
    }
  }
}

class GraphHelper extends Graph {
  constructor(g) {
    const remapped = g.remapZeroBased();
    super(remapped.graph);
    this.mapping = remapped.mapping;
    const nCount = this.nodeCount();
    this.core = Array(nCount).fill(NULL_NODE);
    this.in = Array(nCount).fill(0);
    this.out = Array(nCount).fill(0);
    this.mContainsNode = this.mContainsNode.bind(this);
    this.mDoesNotContainsNode = this.mDoesNotContainsNode.bind(this);
    this.inContains = this.inContains.bind(this);
    this.outContains = this.outContains.bind(this);
  }

  mDoesNotContainsNode(n) {
    return this.core[n] === NULL_NODE;
  }

  mContainsNode(n) {
    return !this.mDoesNotContainsNode(n);
  }

  inContains(n) {
    return this.in[n] > 0 && this.core[n] === NULL_NODE;
  }

  outContains(n) {
    return this.out[n] > 0 && this.core[n] === NULL_NODE;
  }
}

class Vf2 {
  constructor(g1, g2, clientVerify) {
    this.g1 = new GraphHelper(g1);
    this.g2 = new GraphHelper(g2);
    this.clientVerify = clientVerify;
    this.result = [];
  }

  verifyNode(n1, n2) {
    if (this.clientVerify) {
      return this.clientVerify.node(
        this.g1.mapNode(n1),
        this.g2.mapNode(n2),
      );
    }
    return true;
  }

  verifyEdge(fn1, tn1, fn2, tn2) {
    if (this.clientVerify) {
      return this.clientVerify.edge(
        this.g1.mapEdge(fn1, tn1),
        this.g2.mapEdge(fn2, tn2),
      );
    }
    return true;
  }

  feasibilityFunction(s, n1, n2) {
    let verified = true;
    verified = verified && this.verifyNode(n1, n2);
    verified = verified && this.verifySucc(n1, n2);
    verified = verified && this.verifyPred(n1, n2);

    // Check counts
    if (
      !verified
      && s.cIn1 >= s.cIn2
      && s.cOut1 >= s.cOut2
      && this.g1.nodeCount() - s.depth - s.cIn1 - s.cOut1
      >= this.g2.nodeCount() - s.depth - s.cIn2 - s.cOut2
    ) {
      verified = true;
    }
    return verified;
  }

  verifySucc(n1, n2) {
    const succ1 = this.g1.succ(n1);
    const succ2 = this.g2.succ(n2);
    const succ = new Set();
    let cs1 = 0;
    let cs2 = 0;

    succ1.forEach((i1) => {
      if (this.g1.mContainsNode(i1)) {
        cs1 += 1;
        succ.add(i1);
      }
    });
    succ2.forEach((i2) => {
      if (this.g2.mContainsNode(i2)) {
        cs2 += 1;
        succ.add(this.g2.core[i2]);
      }
    });
    let verified = cs1 === cs2 && succ.size === cs1;
    if (verified) {
      succ.forEach((i1) => {
        const i2 = this.g1.core[i1];
        verified = verified && this.verifyEdge(n1, i1, n2, i2);
      });
    }
    return verified;
  }

  verifyPred(n1, n2) {
    const pred1 = this.g1.pred(n1);
    const pred2 = this.g2.pred(n2);
    const pred = new Set();
    let cp1 = 0;
    let cp2 = 0;
    pred1.forEach((i1) => {
      if (this.g1.mContainsNode(i1)) {
        cp1 += 1;
        pred.add(i1);
      }
    });
    pred2.forEach((i2) => {
      if (this.g2.mContainsNode(i2)) {
        cp2 += 1;
        pred.add(this.g2.core[i2]);
      }
    });
    let verified = cp1 === cp2 && pred.size === cp1;
    if (verified) {
      pred.forEach((i1) => {
        const i2 = this.g1.core[i1];
        verified = verified && this.verifyEdge(i1, n1, i2, n2);
      });
    }
    return verified;
  }

  computeP(s) {
    if (s.cOut1 > 0 && s.cOut2 > 0) {
      const out1 = findAll(this.g1.out, this.g1.outContains);
      const n2 = findMin(this.g2.out, this.g2.outContains);
      return out1.map(n1 => [n1, n2]);
    }
    if (s.cIn1 > 0 && s.cIn2 > 0) {
      const in1 = findAll(this.g1.in, this.g1.inContains);
      const n2 = findMin(this.g2.in, this.g2.inContains);
      return in1.map(n1 => [n1, n2]);
    }
    if (s.cOut1 === 0 && s.cOut2 === 0 && s.cIn1 === 0 && s.cIn2 === 0) {
      const in1 = findAll(this.g1.core, this.g1.mDoesNotContainsNode);
      const n2 = findMin(this.g2.core, this.g2.mDoesNotContainsNode);
      return in1.map(n1 => [n1, n2]);
    }
    return [];
  }

  mCoversG2(s) {
    return s.depth === this.g2.nodeCount();
  }

  computeSPrime(s, n1, n2) {
    const sPrime = _.cloneDeep(s);

    sPrime.depth += 1;
    const { depth } = sPrime;

    const removeFromIn1 = this.g1.inContains(n1);
    const removeFromOut1 = this.g1.outContains(n1);
    const removeFromIn2 = this.g2.inContains(n2);
    const removeFromOut2 = this.g2.outContains(n2);

    const predN1 = this.g1.pred(n1);
    predN1.forEach((pred) => {
      if (!this.g1.inContains(pred)) this.g1.in[pred] = depth;
    });

    const succN1 = this.g1.succ(n1);
    succN1.forEach((succ) => {
      if (!this.g1.outContains(succ)) this.g1.out[succ] = depth;
    });

    const predN2 = this.g2.pred(n2);
    predN2.forEach((pred) => {
      if (!this.g2.inContains(pred)) this.g2.in[pred] = depth;
    });

    const succN2 = this.g2.succ(n2);
    succN2.forEach((succ) => {
      if (!this.g2.outContains(succ)) this.g2.out[succ] = depth;
    });

    this.g1.core[n1] = n2;
    this.g2.core[n2] = n1;

    sPrime.cIn1 += removeFromIn1 ? predN1.size - 1 : predN1.size;
    sPrime.cOut1 += removeFromOut1 ? succN1.size - 1 : succN1.size;
    sPrime.cIn2 += removeFromIn2 ? predN2.size - 1 : predN2.size;
    sPrime.cOut2 += removeFromOut2 ? succN2.size - 1 : succN2.size;

    sPrime.n1 = n1;
    sPrime.n2 = n2;
    return sPrime;
  }

  findMatch() {
    const initial = {
      depth: 0,
      cIn1: 0,
      cOut1: 0,
      cIn2: 0,
      cOut2: 0,
      n1: NULL_NODE,
      n2: NULL_NODE,
    };
    this.match(initial);
    return this.result;
  }

  restoreDataStructures(s) {
    const { n1, n2, depth } = s;

    this.g1.core[n1] = NULL_NODE;
    this.g2.core[n2] = NULL_NODE;

    resetArray(this.g1.in, depth);
    resetArray(this.g1.out, depth);
    resetArray(this.g2.in, depth);
    resetArray(this.g2.out, depth);
  }

  formatM() {
    return this.g2.core
      .filter(v => v !== NULL_NODE)
      .map((v, k) => ([this.g1.mapping.fMap.get(v), this.g2.mapping.fMap.get(k)]))
      .reduce((acc, [k, v]) => _.set(acc, k, v), {});
  }

  match(s) {
    // INPUT: an intermediate state s; the initial state s0 has M(s0)=Æ
    // OUTPUT: the mappings between the two graphs

    // IF M(s) covers all the nodes of G2 THEN
    if (this.mCoversG2(s)) {
      this.result.push(this.formatM());
    } else {
      // Compute the set P(s) of the pairs candidate for inclusion in M(s)
      const P = this.computeP(s);

      // FOREACH (n, m)IP(s)
      P.forEach(([n1, n2]) => {
        // IF F(s, n, m) THEN
        if (this.feasibilityFunction(s, n1, n2)) {
          // Compute the state s´ obtained by adding (n, m) to M(s)
          const sPrime = this.computeSPrime(s, n1, n2);
          this.match(sPrime);
        }
      });
    }
    this.restoreDataStructures(s);
  }
}

module.exports = {
  Vf2,
};
