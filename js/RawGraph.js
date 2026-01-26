class RawGraph {
  static #Node = class Node {
    constructor(to, weight) {
      this.to = to;
      this.weight = weight;
      this.next = null;
    }
  };
  #head;
  constructor(n) {
    this.#head = new Array(n).fill(null);
  }
  add_edge(u, v, w) {
    const node = new RawGraph.#Node(v, w);
    node.next = this.#head[u];
    this.#head[u] = node;
  }
  get_neighbors(u) {
    const headRef = this.#head;
    return {
      [Symbol.iterator]() {
        let current = headRef[u];
        return {
          next() {
            if (current == null) {
              return { done: true, value: undefined };
            }
            const edge = {
              to: current.to,
              weight: current.weight,
            };
            current = current.next;
            return { done: false, value: edge };
          },
        };
      },
    };
  }
  get_bfs_order(root) {
    const size = this.#head.length;
    const visited = new Uint8Array(size);
    const queue = new Int32Array(size);
    const bfs = [];
    let head = 0,
      tail = 0;
    queue[tail++] = root;
    visited[root] = 1;
    while (head < tail) {
      const node = queue[head++];
      bfs.push(node);
      let cursor = this.#head[node];
      while (cursor !== null) {
        const to = cursor.to;
        if (!visited[to]) {
          queue[tail++] = to;
          visited[to] = 1;
        }
        cursor = cursor.next;
      }
    }
    return bfs;
  }
}
export { RawGraph };
