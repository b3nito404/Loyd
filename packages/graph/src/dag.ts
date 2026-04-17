import type { LoydSchema } from "@loydjs/core";

export interface FieldNode {
  path: string[];
  key: string;
  schema: LoydSchema<unknown>;
  dependsOn: string[];
  dependents: string[];
}

export interface FieldDag {
  nodes: Map<string, FieldNode>;
  affectedBy(fieldPath: string[]): FieldNode[];
  topologicalOrder(): FieldNode[];
}

export interface DagBuildOptions {
  dependencies?: Record<string, string[]>;
}

export function pathToKey(path: string[]): string {
  return path.join(".");
}

export function keyToPath(key: string): string[] {
  return key.split(".");
}

type SchemaWithInternals = LoydSchema<unknown> & {
  _type?: string;
  shape?: Record<string, LoydSchema<unknown>>;
  _inner?: LoydSchema<unknown>;
};

function extractFields(
  schema: LoydSchema<unknown>,
  prefix: string[] = [],
): Array<{ path: string[]; schema: LoydSchema<unknown> }> {
  const fields: Array<{ path: string[]; schema: LoydSchema<unknown> }> = [];
  const s = schema as SchemaWithInternals;
  if (s._type === "object" && s.shape) {
    for (const [key, fieldSchema] of Object.entries(s.shape)) {
      const fp = [...prefix, key];
      fields.push({ path: fp, schema: fieldSchema });
      const inner = (fieldSchema as SchemaWithInternals)._inner ?? fieldSchema;
      if ((inner as SchemaWithInternals)._type === "object") {
        fields.push(...extractFields(inner as LoydSchema<unknown>, fp));
      }
    }
  }
  return fields;
}

const dagCache = new WeakMap<LoydSchema<unknown>, FieldDag>();

export function buildDag(schema: LoydSchema<unknown>, options: DagBuildOptions = {}): FieldDag {
  if (!options.dependencies && dagCache.has(schema)) {
    const cached = dagCache.get(schema);
    if (cached) return cached;
  }
  const { dependencies = {} } = options;
  const fields = extractFields(schema);
  const nodes = new Map<string, FieldNode>();

  for (const { path, schema: fs } of fields) {
    const key = pathToKey(path);
    nodes.set(key, { path, key, schema: fs, dependsOn: [], dependents: [] });
  }

  for (const [fk, deps] of Object.entries(dependencies)) {
    const node = nodes.get(fk);
    if (!node) continue;
    for (const dk of deps) {
      const dn = nodes.get(dk);
      if (!dn) continue;
      if (!node.dependsOn.includes(dk)) node.dependsOn.push(dk);
      if (!dn.dependents.includes(fk)) dn.dependents.push(fk);
    }
  }

  function topologicalOrder(): FieldNode[] {
    const inDegree = new Map<string, number>();
    for (const [key, n] of nodes) inDegree.set(key, n.dependsOn.length);
    const queue: string[] = [];
    for (const [key, deg] of inDegree) if (deg === 0) queue.push(key);
    const ordered: FieldNode[] = [];
    while (queue.length > 0) {
      const key = queue.shift();
      if (!key) continue;
      const node = nodes.get(key);
      if (!node) continue;
      ordered.push(node);
      for (const dk of node.dependents) {
        const nd = (inDegree.get(dk) ?? 0) - 1;
        inDegree.set(dk, nd);
        if (nd === 0) queue.push(dk);
      }
    }
    for (const [, n] of nodes) if (!ordered.includes(n)) ordered.push(n);
    return ordered;
  }

  function affectedBy(fieldPath: string[]): FieldNode[] {
    const startKey = pathToKey(fieldPath);
    const startNode = nodes.get(startKey);
    if (!startNode) return [];
    const visited = new Set<string>();
    const queue = [startKey];
    const result: FieldNode[] = [];
    while (queue.length > 0) {
      const key = queue.shift();
      if (!key) continue;
      if (visited.has(key)) continue;
      visited.add(key);
      const node = nodes.get(key);
      if (node) {
        result.push(node);
        for (const dk of node.dependents) if (!visited.has(dk)) queue.push(dk);
      }
    }
    return result;
  }

  const dag: FieldDag = { nodes, affectedBy, topologicalOrder };
  if (!options.dependencies) dagCache.set(schema, dag);
  return dag;
}
