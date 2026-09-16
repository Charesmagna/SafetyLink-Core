/**
 * FIX #5: Mesh Node Array Reconstruction
 * Implements smart diffing to avoid full array rebuild on each update.
 * Previously: [...localNodes, ...nodes] reconstructed entire array
 * Now: Uses JSON diffing to identify actual changes
 */

export interface MeshNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'SECURE' | 'ACTIVE' | 'DISPATCHED';
  type: string;
  battery: number;
}

/**
 * Shallow diff two mesh node arrays
 * Returns true if significant changes detected
 */
export function hasMeshNodeChanges(prev: MeshNode[], current: MeshNode[]): boolean {
  if (prev.length !== current.length) return true;

  // Quick stringify comparison (much faster than deep object comparison)
  const prevStr = JSON.stringify(prev);
  const currStr = JSON.stringify(current);

  return prevStr !== currStr;
}

/**
 * Merge local and remote nodes with deduplication
 */
export function mergeMeshNodes(local: MeshNode[], remote: MeshNode[]): MeshNode[] {
  const map = new Map<string, MeshNode>();

  // Add local nodes first
  local.forEach((node) => map.set(node.id, node));

  // Override/add remote nodes
  remote.forEach((node) => map.set(node.id, node));

  return Array.from(map.values());
}
