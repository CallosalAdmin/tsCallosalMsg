  export class Zet2 extends Set {
    static union(...sets: any[]) {
      return new Zet2(sets.reduce((a, i) => [...a, ...i]));
    }

    static intersection(...sets: any[]) {
      sets = sets.map(s => [...s]);
      return new Zet2(sets.reduce((prev, curr) => prev.filter((x: any) => curr.includes(x))));
    }

    static difference(...sets: any[]) {
      if (sets.length === 1) return new Zet2();
      sets = sets.map(s => [...s]);
      return new Zet2(sets.reduce((prev, curr) => prev.filter((x: any) => !curr.includes(x))));
    }

    static symmetricDifference(setA=new Zet2(), setB=new Zet2()) {
      return new Zet2([...[...setA].filter(x => !setB.has(x)), ...[...setB].filter(x => !setA.has(x))]);
    }

    static subset(setA: any, setB: any) {
      return [...setA].every(x => setB.has(x));
    }

    static superset(setA: any, setB: any) {
      return [...setB].every(x => setA.has(x));
    }

    static map(set: any, func: any) {
      return new Zet2([...set].map(func));
    }

    static filter(set: any, func: any) {
      return new Zet2([...set].filter(func));
    }

    static reduce(set: any, func: any, initializer: any) {
      if (initializer === undefined) return [...set].reduce(func);
      return [...set].reduce(func, initializer);
    }

    union(...sets: any[]) {
      return Zet2.union(this, ...sets);
    }

    intersection(...sets: any[]) {
      return Zet2.intersection(this, ...sets);
    }

    difference(...sets: any[]) {
      return Zet2.difference(this, ...sets);
    }

    symmetricDifference(other: any) {
      return Zet2.symmetricDifference(this, other);
    }

    subset(other: any) {
      return Zet2.subset(this, other);
    }

    superset(other: any) {
      return Zet2.superset(this, other);
    }

    map(func: any) {
      return Zet2.map(this, func);
    }

    filter(func: any) {
      return Zet2.filter(this, func);
    }

    reduce(func: any, initializer: any) {
      return Zet2.reduce(this, func, initializer);
    }
  // return Zet2;
}


