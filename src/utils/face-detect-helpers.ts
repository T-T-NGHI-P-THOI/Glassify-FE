import * as THREE from "three";

/** Clamp value between lo and hi. */
export function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

/** Convert landmark pixel coords to negated Three.js Vector3. */
export function toV(pts: number[][], i: number): THREE.Vector3 {
    return new THREE.Vector3(-pts[i][0], -pts[i][1], -pts[i][2]);
}

/** Midpoint of two Vector3s. */
export function mid(a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 {
    return a.clone().add(b).multiplyScalar(0.5);
}

/** Midpoint between inner and outer eye landmarks. */
export function eyeMid(
    pts: number[][],
    inner: number,
    outer: number
): THREE.Vector3 {
    return mid(toV(pts, inner), toV(pts, outer));
}

/** Angular delta between two quaternions (radians). */
export function qDelta(
    a: THREE.Quaternion,
    b: THREE.Quaternion
): number {
    return 2 * Math.acos(clamp(Math.abs(a.dot(b)), 0, 1));
}

/** MediaPipe landmark type */
export interface Landmark {
    x: number;
    y: number;
    z: number;
}

/** Convert normalized MediaPipe landmarks to pixel coordinates. */
export function toPixels(
    landmarks: Landmark[],
    video: HTMLVideoElement
): number[][] {
    const w = video.videoWidth;
    const h = video.videoHeight;

    return landmarks.map((l) => [
        (1 - l.x) * w,
        l.y * h,
        l.z * w
    ]);
}

/** Create a rounded rectangle Shape (for extrusion). */
export function rrShape(
    w: number,
    h: number,
    r: number,
    oy: number = 0
): THREE.Shape {
    const s = new THREE.Shape();

    const x0 = -w / 2, x1 = w / 2;
    const y0 = -h / 2 + oy, y1 = h / 2 + oy;

    r = Math.min(r, w / 2, h / 2);

    s.moveTo(x0 + r, y0);
    s.lineTo(x1 - r, y0);
    s.quadraticCurveTo(x1, y0, x1, y0 + r);
    s.lineTo(x1, y1 - r);
    s.quadraticCurveTo(x1, y1, x1 - r, y1);
    s.lineTo(x0 + r, y1);
    s.quadraticCurveTo(x0, y1, x0, y1 - r);
    s.lineTo(x0, y0 + r);
    s.quadraticCurveTo(x0, y0, x0 + r, y0);

    return s;
}

/** Create a rounded rectangle Path (for hole cutouts). */
export function rrPath(
    w: number,
    h: number,
    r: number,
    oy: number = 0
): THREE.Path {
    const p = new THREE.Path();

    const x0 = -w / 2, x1 = w / 2;
    const y0 = -h / 2 + oy, y1 = h / 2 + oy;

    r = Math.min(r, w / 2, h / 2);

    p.moveTo(x0 + r, y0);
    p.lineTo(x1 - r, y0);
    p.quadraticCurveTo(x1, y0, x1, y0 + r);
    p.lineTo(x1, y1 - r);
    p.quadraticCurveTo(x1, y1, x1 - r, y1);
    p.lineTo(x0 + r, y1);
    p.quadraticCurveTo(x0, y1, x0, y1 - r);
    p.lineTo(x0, y0 + r);
    p.quadraticCurveTo(x0, y0, x0 + r, y0);

    return p;
}