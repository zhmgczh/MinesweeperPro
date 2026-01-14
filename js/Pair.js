class Pair {
  #first;
  #second;
  constructor(first, second) {
    this.#first = first;
    this.#second = second;
  }
  getFirst() {
    return this.#first;
  }
  getSecond() {
    return this.#second;
  }
  equals(o) {
    if (this === o) return true;
    if (o === null || o === undefined || o.constructor !== this.constructor)
      return false;
    const pair = o;
    const f1 = this.#first;
    const f2 = pair.getFirst();
    let firstEqual =
      f1 !== null && f1 !== undefined
        ? typeof f1.equals === "function"
          ? f1.equals(f2)
          : f1 === f2
        : f2 === null || f2 === undefined;
    if (!firstEqual) return false;
    const s1 = this.#second;
    const s2 = pair.getSecond();
    return s1 !== null && s1 !== undefined
      ? typeof s1.equals === "function"
        ? s1.equals(s2)
        : s1 === s2
      : s2 === null || s2 === undefined;
  }
  hashCode() {
    const getHash = (obj) => {
      if (obj === null || obj === undefined) return 0;
      if (typeof obj.hashCode === "function") return obj.hashCode();
      const s = String(obj);
      let h = 0;
      for (let i = 0; i < s.length; i++) {
        h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
      }
      return h;
    };
    let result = 1;
    result = (31 * result + getHash(this.#first)) | 0;
    result = (31 * result + getHash(this.#second)) | 0;
    return result;
  }
  toString() {
    return "(" + this.#first + ", " + this.#second + ")";
  }
}
