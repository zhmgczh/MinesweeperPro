class Graph {
  static #Node = class {
    constructor(to, weight) {
      this.to = to;
      this.weight = weight;
      this.next = null;
    }
  };
  #nodes;
  #map;
  #head;
  /**
   * @param {Set<T>} nodes
   */
  constructor(nodes) {
    if (nodes === null || nodes === undefined) {
      throw new Error("Nodes cannot be null.");
    }
    const n = nodes.size;
    this.#nodes = Array.from(nodes);
    this.#map = new Map();
    this.#head = new Array(n).fill(null);
    for (let i = 0; i < n; ++i) {
      this.#map.set(this.#nodes[i], i);
    }
  }
  #add_edge_internal(u, v, w) {
    const node = new Graph.#Node(v, w);
    node.next = this.#head[u];
    this.#head[u] = node;
  }
  add_edge(u, v, w) {
    if (!this.#map.has(u)) {
      throw new Error(`Node ${u} not found`);
    } else if (!this.#map.has(v)) {
      throw new Error(`Node ${v} not found`);
    }
    this.#add_edge_internal(this.#map.get(u), this.#map.get(v), w);
  }
  get_neighbors(u) {
    if (!this.#map.has(u)) {
      throw new Error(`Node ${u} not found`);
    }
    const index = this.#map.get(u);
    const nodesRef = this.#nodes;
    const headRef = this.#head;
    return {
      [Symbol.iterator]: function () {
        let current = headRef[index];
        return {
          next: function () {
            if (current === null) {
              return { done: true, value: undefined };
            }
            const edge = {
              to: nodesRef[current.to],
              weight: current.weight,
            };
            current = current.next;
            return { done: false, value: edge };
          },
        };
      },
    };
  }
  /**
   * @returns {Array<T>}
   */
  get_bfs_order(root) {
    if (!this.#map.has(root)) {
      throw new Error(`Node ${root} not found`);
    }
    const size = this.#nodes.length;
    const visited = new Uint8Array(size);
    const queue = new Int32Array(size);
    const bfs = [];
    let head = 0,
      tail = 0;
    const root_index = this.#map.get(root);
    queue[tail++] = root_index;
    visited[root_index] = 1;
    while (head < tail) {
      const nodeIndex = queue[head++];
      bfs.push(this.#nodes[nodeIndex]);
      let cursor = this.#head[nodeIndex];
      while (cursor !== null) {
        const to = cursor.to;
        if (!visited[to]) {
          visited[to] = 1;
          queue[tail++] = to;
        }
        cursor = cursor.next;
      }
    }
    return bfs;
  }
}
export { Graph };
