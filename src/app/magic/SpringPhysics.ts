import * as THREE from 'three';

/**
 * Critically Damped Spring for 3D Vector
 */
export class Vector3Spring {
  public current = new THREE.Vector3();
  public target  = new THREE.Vector3();
  public velocity= new THREE.Vector3();

  constructor(
    public stiffness = 160.0,
    public damping   = 22.0
  ) {}

  public set(v: THREE.Vector3) {
    this.current.copy(v);
    this.target.copy(v);
    this.velocity.set(0, 0, 0);
  }

  public update(dt: number): THREE.Vector3 {
    if (dt <= 0) return this.current;
    const dx = this.target.x - this.current.x;
    const dy = this.target.y - this.current.y;
    const dz = this.target.z - this.current.z;

    const ax = dx * this.stiffness - this.velocity.x * this.damping;
    const ay = dy * this.stiffness - this.velocity.y * this.damping;
    const az = dz * this.stiffness - this.velocity.z * this.damping;

    this.velocity.x += ax * dt;
    this.velocity.y += ay * dt;
    this.velocity.z += az * dt;

    this.current.x += this.velocity.x * dt;
    this.current.y += this.velocity.y * dt;
    this.current.z += this.velocity.z * dt;

    return this.current;
  }
}

/**
 * Critically Damped Spring for Scalar Values
 */
export class ScalarSpring {
  public current = 0;
  public target  = 0;
  public velocity= 0;

  constructor(
    public stiffness = 160.0,
    public damping   = 22.0,
    initialVal = 0
  ) {
    this.current = initialVal;
    this.target  = initialVal;
  }

  public set(val: number) {
    this.current = val;
    this.target  = val;
    this.velocity= 0;
  }

  public update(dt: number): number {
    if (dt <= 0) return this.current;
    const dx = this.target - this.current;
    const a  = dx * this.stiffness - this.velocity * this.damping;
    this.velocity += a * dt;
    this.current  += this.velocity * dt;
    return this.current;
  }
}

/**
 * Critically Damped Spring for 3D Quaternion Rotation
 */
export class QuaternionSpring {
  public current = new THREE.Quaternion();
  public target  = new THREE.Quaternion();

  constructor(public speed = 14.0) {}

  public set(q: THREE.Quaternion) {
    this.current.copy(q);
    this.target.copy(q);
  }

  public update(dt: number): THREE.Quaternion {
    if (dt <= 0) return this.current;
    const step = Math.min(1, this.speed * dt);
    this.current.slerp(this.target, step);
    return this.current;
  }
}
