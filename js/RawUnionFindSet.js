class RawUnionFindSet {
  constructor(n) {
    this.count = n;
    this.parent = new Int32Array(this.count);
    this.rank = new Int32Array(this.count);
    for (let i = 0; i < this.count; ++i) {
      this.parent[i] = i;
    }
  }
  get_count() {
    return this.count;
  }
  find(x) {
    let root = x;
    while (this.parent[root] !== root) {
      root = this.parent[root];
    }
    while (this.parent[x] !== root) {
      const next = this.parent[x];
      this.parent[x] = root;
      x = next;
    }
    return root;
  }
  union(x, y) {
    const rootX = this.find(x);
    const rootY = this.find(y);
    if (rootX !== rootY) {
      if (this.rank[rootX] < this.rank[rootY]) {
        this.parent[rootX] = rootY;
      } else if (this.rank[rootX] > this.rank[rootY]) {
        this.parent[rootY] = rootX;
      } else {
        this.parent[rootY] = rootX;
        ++this.rank[rootX];
      }
      --this.count;
    }
  }
  connected(x, y) {
    return this.find(x) === this.find(y);
  }
}
export { RawUnionFindSet };
