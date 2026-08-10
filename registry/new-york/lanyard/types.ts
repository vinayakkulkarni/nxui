import type * as THREE from 'three';

export interface RopeNode {
  position: THREE.Vector3;
  prevPosition: THREE.Vector3;
  fixed: boolean;
}
