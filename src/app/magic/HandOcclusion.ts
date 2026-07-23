import * as THREE from 'three';
import type { NormalizedLandmark } from '../hand-tracking/types';

// MediaPipe finger bones setup
const BONES = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // Index
  [0, 9], [9, 10], [10, 11], [11, 12],   // Middle
  [0, 13], [13, 14], [14, 15], [15, 16], // Ring
  [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
];

/**
 * HandOcclusion renders invisible depth-only capsule geometry for hand finger joints.
 * This ensures that when the user's hand/fingers pass in front of the floating 3D hologram,
 * the parts of the hologram behind the fingers are occluded naturally!
 */
export class HandOcclusion {
  public group = new THREE.Group();
  private capsuleMeshes: THREE.Mesh[] = [];
  private occludeMat: THREE.MeshBasicMaterial;

  constructor() {
    // Material that writes ONLY to the depth buffer (invisible color, depth write ON)
    this.occludeMat = new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: true,
      depthTest: true,
    });

    const cylinderGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 8);
    cylinderGeo.rotateX(Math.PI / 2); // align along Z axis for scaling

    // Create a cylinder mesh for each finger bone
    for (let i = 0; i < BONES.length * 2; i++) {
      const mesh = new THREE.Mesh(cylinderGeo, this.occludeMat);
      mesh.visible = false;
      this.capsuleMeshes.push(mesh);
      this.group.add(mesh);
    }
  }

  public update(
    landmarksLeft: NormalizedLandmark[],
    landmarksRight: NormalizedLandmark[],
    camera: THREE.PerspectiveCamera
  ) {
    let meshIdx = 0;

    const processHand = (lms: NormalizedLandmark[]) => {
      if (!lms || lms.length < 21) return;

      // Project normalized camera landmarks to 3D world space
      const pts3D: THREE.Vector3[] = lms.map((lm) => {
        // Map (0..1, 0..1, z) to screen aspect camera space
        const x = (lm.x - 0.5) * 6.0;
        const y = (0.5 - lm.y) * 4.5;
        const z = -lm.z * 3.0; // depth offset
        return new THREE.Vector3(x, y, z);
      });

      for (const [i1, i2] of BONES) {
        if (meshIdx >= this.capsuleMeshes.length) break;
        const mesh = this.capsuleMeshes[meshIdx++];
        const p1 = pts3D[i1];
        const p2 = pts3D[i2];

        const dist = p1.distanceTo(p2);
        if (dist < 0.001) {
          mesh.visible = false;
          continue;
        }

        mesh.visible = true;
        mesh.position.copy(p1).add(p2).multiplyScalar(0.5);
        mesh.lookAt(p2);
        mesh.scale.set(0.16, 0.16, dist);
      }
    };

    processHand(landmarksLeft);
    processHand(landmarksRight);

    // Hide unused capsule meshes
    for (let i = meshIdx; i < this.capsuleMeshes.length; i++) {
      this.capsuleMeshes[i].visible = false;
    }
  }

  public dispose() {
    this.capsuleMeshes.forEach((m) => {
      m.geometry.dispose();
    });
    this.occludeMat.dispose();
  }
}
