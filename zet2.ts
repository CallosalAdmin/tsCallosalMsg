  export class Zet2 extends Set {
    static union(...sets) {
      return new Zet2(sets.reduce((a, i) => [...a, ...i]));
    }

    static intersection(...sets) {
      sets = sets.map(s => [...s]);
      return new Zet2(sets.reduce((prev, curr) => prev.filter(x => curr.includes(x))));
    }

    static difference(...sets) {
      if (sets.length === 1) return new Zet2();
      sets = sets.map(s => [...s]);
      return new Zet2(sets.reduce((prev, curr) => prev.filter(x => !curr.includes(x))));
    }

    static symmetricDifference(setA=new Zet2(), setB=new Zet2()) {
      return new Zet2([...[...setA].filter(x => !setB.has(x)), ...[...setB].filter(x => !setA.has(x))]);
    }

    static subset(setA, setB) {
      return [...setA].every(x => setB.has(x));
    }

    static superset(setA, setB) {
      return [...setB].every(x => setA.has(x));
    }

    static map(set, func) {
      return new Zet2([...set].map(func));
    }

    static filter(set, func) {
      return new Zet2([...set].filter(func));
    }

    static reduce(set, func, initializer) {
      if (initializer === undefined) return [...set].reduce(func);
      return [...set].reduce(func, initializer);
    }

    union(...sets) {
      return Zet2.union(this, ...sets);
    }

    intersection(...sets) {
      return Zet2.intersection(this, ...sets);
    }

    difference(...sets) {
      return Zet2.difference(this, ...sets);
    }

    symmetricDifference(other) {
      return Zet2.symmetricDifference(this, other);
    }

    subset(other) {
      return Zet2.subset(this, other);
    }

    superset(other) {
      return Zet2.superset(this, other);
    }

    map(func) {
      return Zet2.map(this, func);
    }

    filter(func) {
      return Zet2.filter(this, func);
    }

    reduce(func, initializer) {
      return Zet2.reduce(this, func, initializer);
    }
  // return Zet2;
}


