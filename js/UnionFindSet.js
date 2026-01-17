class UnionFindSet {
  #count;
  #parent;
  #rank;
  #elements;
  #map;
  /**
   * @param {Set<T>} elements
   */
  constructor(elements) {
    if (elements === null || elements === undefined) {
      throw new Error("Elements cannot be null.");
    }
    this.#count = elements.size;
    this.#parent = new Int32Array(this.#count);
    this.#rank = new Int32Array(this.#count);
    this.#elements = Array.from(elements);
    this.#map = new Map();
    for (let i = 0; i < this.#count; ++i) {
      this.#map.set(this.#elements[i], i);
      this.#parent[i] = i;
    }
  }
  get_count() {
    return this.#count;
  }
  /**
   * @param {number} x
   * @returns {number}
   */
  #findInternal(x) {
    let root = x;
    while (this.#parent[root] !== root) {
      root = this.#parent[root];
    }
    while (this.#parent[x] !== root) {
      let next = this.#parent[x];
      this.#parent[x] = root;
      x = next;
    }
    return root;
  }
  /**
   * @param {T} x
   * @returns {T}
   */
  find(x) {
    if (!this.#map.has(x)) {
      throw new Error(`Element ${x} not found`);
    }
    const rootIndex = this.#findInternal(this.#map.get(x));
    return this.#elements[rootIndex];
  }
  /**
   * @param {number} x
   * @param {number} y
   */
  #unionInternal(x, y) {
    let rootX = this.#findInternal(x);
    let rootY = this.#findInternal(y);
    if (rootX !== rootY) {
      if (this.#rank[rootX] < this.#rank[rootY]) {
        this.#parent[rootX] = rootY;
      } else if (this.#rank[rootX] > this.#rank[rootY]) {
        this.#parent[rootY] = rootX;
      } else {
        this.#parent[rootY] = rootX;
        ++this.#rank[rootX];
      }
      --this.#count;
    }
  }
  /**
   * @param {T} x
   * @param {T} y
   */
  union(x, y) {
    if (!this.#map.has(x)) {
      throw new Error(`Element ${x} not found`);
    } else if (!this.#map.has(y)) {
      throw new Error(`Element ${y} not found`);
    }
    this.#unionInternal(this.#map.get(x), this.#map.get(y));
  }
  /**
   * @param {T} x
   * @param {T} y
   * @returns {boolean}
   */
  connected(x, y) {
    if (!this.#map.has(x)) {
      throw new Error(`Element ${x} not found`);
    } else if (!this.#map.has(y)) {
      throw new Error(`Element ${y} not found`);
    }
    return (
      this.#findInternal(this.#map.get(x)) ===
      this.#findInternal(this.#map.get(y))
    );
  }
}
export { UnionFindSet };
