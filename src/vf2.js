const _ = require('lodash');

const NULL_NODE = -1;

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

class Vf2 {
  constructor(g1, g2, clientVerify) {
    this.g1 = g1;
    this.g2 = g2;
    this.c1 = this.g1.numOfNodes();
    this.c2 = this.g2.numOfNodes();
    const g1Nodes = Array.from(this.g1.nodes());
    this.g1NodeMap = g1Nodes.map(([n]) => n);
    const g2Nodes = Array.from(this.g2.nodes());
    this.g2NodeMap = g2Nodes.map(([n]) => n);
    this.g1NodeReverseMap = new Map(g1Nodes.map(([n], i) => [n, i]));
    this.g2NodeReverseMap = new Map(g2Nodes.map(([n], i) => [n, i]));
    this.g1Pred = Array(this.c1);
    this.g1Succ = Array(this.c1);
    for (let i = 0; i < this.c1; i += 1) {
      this.g1Succ[i] = new Set(
        Array.from(this.g1.succ(this.g1NodeMap[i])).map(n => this.g1NodeReverseMap.get(n)),
      );
      this.g1Pred[i] = new Set(
        Array.from(this.g1.pred(this.g1NodeMap[i])).map(n => this.g1NodeReverseMap.get(n)),
      );
    }

    this.g2Pred = Array(this.c2);
    this.g2Succ = Array(this.c2);
    for (let i = 0; i < this.c2; i += 1) {
      this.g2Succ[i] = new Set(
        Array.from(this.g2.succ(this.g2NodeMap[i])).map(n => this.g2NodeReverseMap.get(n)),
      );
      this.g2Pred[i] = new Set(
        Array.from(this.g2.pred(this.g2NodeMap[i])).map(n => this.g2NodeReverseMap.get(n)),
      );
    }
    this.clientVerify = clientVerify;
    this.core1 = Array(this.c1).fill(NULL_NODE);
    this.core2 = Array(this.c2).fill(NULL_NODE);
    this.in1 = Array(this.c1).fill(0);
    this.out1 = Array(this.c1).fill(0);
    this.in2 = Array(this.c2).fill(0);
    this.out2 = Array(this.c2).fill(0);
    this.mContainsNodeFromG1 = this.mContainsNodeFromG1.bind(this);
    this.mContainsNodeFromG2 = this.mContainsNodeFromG2.bind(this);
    this.mDoesNotContainsNodeFromG1 = this.mDoesNotContainsNodeFromG1.bind(this);
    this.mDoesNotContainsNodeFromG2 = this.mDoesNotContainsNodeFromG2.bind(this);
    this.in1Contains = this.in1Contains.bind(this);
    this.out1Contains = this.out1Contains.bind(this);
    this.in2Contains = this.in2Contains.bind(this);
    this.out2Contains = this.out2Contains.bind(this);
    this.result = [];
  }

  mDoesNotContainsNodeFromG1(n) {
    return this.core1[n] === NULL_NODE;
  }

  mDoesNotContainsNodeFromG2(n) {
    return this.core2[n] === NULL_NODE;
  }

  mContainsNodeFromG1(n) {
    return !this.mDoesNotContainsNodeFromG1(n);
  }

  mContainsNodeFromG2(n) {
    return !this.mDoesNotContainsNodeFromG2(n);
  }

  in1Contains(n) {
    return this.in1[n] > 0 && this.core1[n] === NULL_NODE;
  }

  out1Contains(n) {
    return this.out1[n] > 0 && this.core1[n] === NULL_NODE;
  }

  in2Contains(n) {
    return this.in2[n] > 0 && this.core2[n] === NULL_NODE;
  }

  out2Contains(n) {
    return this.out2[n] > 0 && this.core2[n] === NULL_NODE;
  }

  verifyNode(n1, n2) {
    if (this.clientVerify) {
      return this.clientVerify.node(
        this.g1.node(this.g1NodeMap[n1]),
        this.g2.node(this.g2NodeMap[n2]),
      );
    }
    return true;
  }

  verifyEdge(fn1, tn1, fn2, tn2) {
    if (this.clientVerify) {
      return this.clientVerify.edge(
        this.g1.edge(this.g1NodeMap[fn1], this.g1NodeMap[tn1]),
        this.g2.edge(this.g2NodeMap[fn2], this.g2NodeMap[tn2]),
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
      && this.c1 - s.depth - s.in1 - s.out1 >= this.c2 - s.depth - s.in2 - s.out2
    ) {
      verified = true;
    }
    return verified;
  }

  verifySucc(n1, n2) {
    const succ1 = this.g1Succ[n1];
    const succ2 = this.g2Succ[n2];
    const succ = new Set();
    let cs1 = 0;
    let cs2 = 0;

    succ1.forEach((i1) => {
      if (this.mContainsNodeFromG1(i1)) {
        cs1 += 1;
        succ.add(i1);
      }
    });
    succ2.forEach((i2) => {
      if (this.mContainsNodeFromG2(i2)) {
        cs2 += 1;
        succ.add(this.core2[i2]);
      }
    });
    let verified = cs1 === cs2 && succ.size === cs1;
    if (verified) {
      succ.forEach((i1) => {
        const i2 = this.core1[i1];
        verified = verified && this.verifyEdge(n1, i1, n2, i2);
      });
    }
    return verified;
  }

  verifyPred(n1, n2) {
    const pred1 = this.g1Pred[n1];
    const pred2 = this.g2Pred[n2];
    const pred = new Set();
    let cp1 = 0;
    let cp2 = 0;
    pred1.forEach((i1) => {
      if (this.mContainsNodeFromG1(i1)) {
        cp1 += 1;
        pred.add(i1);
      }
    });
    pred2.forEach((i2) => {
      if (this.mContainsNodeFromG2(i2)) {
        cp2 += 1;
        pred.add(this.core2[i2]);
      }
    });
    let verified = cp1 === cp2 && pred.size === cp1;
    if (verified) {
      pred.forEach((i1) => {
        const i2 = this.core1[i1];
        verified = verified && this.verifyEdge(i1, n1, i2, n2);
      });
    }
    return verified;
  }

  computeP(s) {
    if (s.cOut1 > 0 && s.cOut2 > 0) {
      const out1 = findAll(this.out1, this.out1Contains);
      const n2 = findMin(this.out2, this.out2Contains);
      return out1.map(n1 => [n1, n2]);
    }
    if (s.cIn1 > 0 && s.cIn2 > 0) {
      const in1 = findAll(this.in1, this.in1Contains);
      const n2 = findMin(this.in2, this.in2Contains);
      return in1.map(n1 => [n1, n2]);
    }
    if (s.cOut1 === 0 && s.cOut2 === 0 && s.cIn1 === 0 && s.cIn2 === 0) {
      const in1 = findAll(this.core1, this.mDoesNotContainsNodeFromG1);
      const n2 = findMin(this.core2, this.mDoesNotContainsNodeFromG2);
      return in1.map(n1 => [n1, n2]);
    }
    return [];
  }

  mCoversG2(s) {
    return s.depth === this.c2;
  }

  computeSPrime(s, n1, n2) {
    const sPrime = _.cloneDeep(s);

    sPrime.depth += 1;
    const { depth } = sPrime;

    const removeFromIn1 = this.in1Contains(n1);
    const removeFromOut1 = this.out1Contains(n1);
    const removeFromIn2 = this.in2Contains(n2);
    const removeFromOut2 = this.out2Contains(n2);

    const predN1 = this.g1Pred[n1];
    predN1.forEach((pred) => {
      if (!this.in1Contains(pred)) this.in1[pred] = depth;
    });

    const succN1 = this.g1Succ[n1];
    succN1.forEach((succ) => {
      if (!this.out1Contains(succ)) this.out1[succ] = depth;
    });

    const predN2 = this.g2Pred[n2];
    predN2.forEach((pred) => {
      if (!this.in2Contains(pred)) this.in2[pred] = depth;
    });

    const succN2 = this.g2Succ[n2];
    succN2.forEach((succ) => {
      if (!this.out2Contains(succ)) this.out2[succ] = depth;
    });

    this.core1[n1] = n2;
    this.core2[n2] = n1;

    sPrime.cIn1 += removeFromIn1 ? predN1.size - 1 : predN1.size;
    sPrime.cOut1 += removeFromOut1 ? succN1.size - 1 : succN1.size;
    sPrime.cIn2 += removeFromIn2 ? predN2.size - 1 : predN2.size;
    sPrime.cOut2 += removeFromOut2 ? succN2.size - 1 : succN2.size;

    sPrime.n1 = n1;
    sPrime.n2 = n2;
    return sPrime;
  }

  findMatch() {
    debugger;
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

    this.core1[n1] = NULL_NODE;
    this.core2[n2] = NULL_NODE;

    resetArray(this.in1, depth);
    resetArray(this.out1, depth);
    resetArray(this.in2, depth);
    resetArray(this.out2, depth);
  }

  formatM() {
    return this.core2
      .map((v, k) => ({
        n1: this.g1NodeMap[v],
        n2: this.g2NodeMap[k],
      }))
      .filter(n => n.v !== NULL_NODE);
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
