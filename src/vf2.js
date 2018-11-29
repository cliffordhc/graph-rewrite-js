const _ = require('lodash');
const { Graph } = require('./graph');
const { NULL_NODE } = require('./constants');

class GraphHelper {
  constructor(graph) {
    const nodes = [...graph.nodes()];
    this.fMap = new Map(nodes.map((n, i) => [n, i]));
    this.rMap = new Map(nodes.map((n, i) => [i, n.id]));
    const remap = p => this.fMap.get(p);
    this.pPred = new Map(nodes.map((n, i) => [i, new Set([...n.pred].map(remap))]));
    this.pSucc = new Map(nodes.map((n, i) => [i, new Set([...n.succ].map(remap))]));
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

  nodeCount() {
    return this.fMap.size;
  }

  pred(n) {
    return this.pPred.get(n);
  }

  succ(n) {
    return this.pSucc.get(n);
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
        this.g1.rMap.get(n1),
        this.g2.rMap.get(n2),
      );
    }
    return true;
  }

  verifyEdge(fn1, tn1, fn2, tn2) {
    if (this.clientVerify) {
      return this.clientVerify.edge(
        this.g1.rMap.get(fn1),
        this.g1.rMap.get(tn1),
        this.g2.rMap.get(fn2),
        this.g2.rMap.get(tn2),
      );
    }
    return true;
  }

  feasibilityFunction(s, n1, n2) {
    let verified = true;
    // Check counts
    if (s.in1.length < s.in2.length
      || s.out1.length < s.out2.length
      || this.g1.nodeCount() - s.depth - s.in1.length - s.out1.length
      < this.g2.nodeCount() - s.depth - s.in2.length - s.out2.length
    ) {
      verified = false;
    } else {
      verified = verified && this.verifyNode(n1, n2);
      verified = verified && this.verifySucc(n1, n2);
      verified = verified && this.verifyPred(n1, n2);
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

  // eslint-disable-next-line class-methods-use-this
  computeP(s) {
    if (s.out1.length > 0 && s.out2.length > 0) {
      return s.out1.map(n1 => [n1, s.out2[0]]);
    }
    if (s.in1.length > 0 && s.in2.length > 0) {
      return s.in1.map(n1 => [n1, s.in2[0]]);
    }
    if (s.out1.length === 0 && s.out2.length === 0 && s.in1.length === 0 && s.in2.length === 0) {
      return s.alt1.map(n1 => [n1, s.alt1[0]]);
    }
    return [];
  }

  mCoversG2(s) {
    return s.depth === this.g2.nodeCount();
  }

  computeSPrime(s, n1, n2) {
    const sPrime = s ? _.cloneDeep(s) : { depth: -1 };

    sPrime.depth += 1;
    const { depth } = sPrime;

    const predN1 = this.g1.pred(n1) != null ? this.g1.pred(n1) : [];
    predN1.forEach((pred) => {
      if (!this.g1.inContains(pred)) this.g1.in[pred] = depth;
    });

    const succN1 = this.g1.succ(n1) != null ? this.g1.succ(n1) : [];
    succN1.forEach((succ) => {
      if (!this.g1.outContains(succ)) this.g1.out[succ] = depth;
    });

    const predN2 = this.g2.pred(n2) != null ? this.g2.pred(n2) : [];
    predN2.forEach((pred) => {
      if (!this.g2.inContains(pred)) this.g2.in[pred] = depth;
    });

    const succN2 = this.g2.succ(n2) != null ? this.g2.succ(n2) : [];
    succN2.forEach((succ) => {
      if (!this.g2.outContains(succ)) this.g2.out[succ] = depth;
    });

    if (n1 != null && n2 != null) {
      this.g1.core[n1] = n2;
      this.g2.core[n2] = n1;
    }

    sPrime.n1 = n1 == null ? -1 : n1;
    sPrime.n2 = n2 == null ? -1 : n2;

    const out1 = [];
    const in1 = [];
    const alt1 = [];
    const out2 = [];
    const in2 = [];
    const alt2 = [];

    for (let i = 0; i < this.g1.core.length; i += 1) {
      if (this.g1.outContains(i)) out1.push(i);
      if (this.g1.inContains(i)) in1.push(i);
      if (this.g1.mDoesNotContainsNode(i)) alt1.push(i);
    }
    for (let i = 0; i < this.g2.core.length; i += 1) {
      if (this.g2.outContains(i)) out2.push(i);
      if (this.g2.inContains(i)) in2.push(i);
      if (this.g2.mDoesNotContainsNode(i)) alt2.push(i);
    }

    sPrime.out1 = out1;
    sPrime.in1 = in1;
    sPrime.alt1 = alt1;
    sPrime.out2 = out2;
    sPrime.in2 = in2;
    sPrime.alt2 = alt2;

    return sPrime;
  }

  findMatch() {
    const initial = this.computeSPrime();
    this.match(initial);
    return this.result;
  }

  restoreDataStructures(s) {
    const { n1, n2, depth } = s;

    this.g1.core[n1] = NULL_NODE;
    this.g2.core[n2] = NULL_NODE;

    for (let i = 0; i < this.g1.nodeCount(); i += 1) {
      if (this.g1.out[i] >= depth) this.g1.out[i] = 0;
      if (this.g1.in[i] >= depth) this.g1.in[i] = 0;
    }

    for (let i = 0; i < this.g2.nodeCount(); i += 1) {
      if (this.g2.out[i] >= depth) this.g2.out[i] = 0;
      if (this.g2.in[i] >= depth) this.g2.in[i] = 0;
    }
  }

  formatM() {
    return this.g2.core
      .filter(v => v !== NULL_NODE)
      .map((v, k) => ([this.g1.rMap.get(v), this.g2.rMap.get(k)]))
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
