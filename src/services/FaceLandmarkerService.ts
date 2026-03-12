import { clamp, eyeMid, mid, qDelta, toPixels, toV } from "@/utils/face-detect-helpers";
import * as vision from "@mediapipe/tasks-vision";
import * as THREE from 'three';

export const LM = {
    leftEyeOuter: 33,
    rightEyeOuter: 263,
    leftEyeInner: 133,
    rightEyeInner: 362,
    leftTemple: 127,
    rightTemple: 356,
    leftCheek: 234,
    rightCheek: 454,
    forehead: 10,
    chin: 175,
    noseBridge: 168,
    noseTip: 1
};

export const FACE_OVAL = [
    10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
    397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
    172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
];

export const CFG = {
    refHeadWidth: 140,      // Reference head width (pixels) for scale normalization
    refFaceHeight: 210,     // Reference face height (pixels)
    glassesDepth: -50,       // Z-offset: how far glasses sit in front of the face
    glassesDown: -10,         // Y-offset: push glasses slightly downward
    glassesCenterX: 0,      // X-offset: horizontal fine-tuning
    glassesScale: 1.22      // Overall scale multiplier
};

const sm = {
    ready: false,
    gPos: new THREE.Vector3(),
    gQuat: new THREE.Quaternion(),
    gScale: new THREE.Vector3(1, 1, 1),
    prev: new THREE.Vector3()
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared engine creator — avoids duplicating the MediaPipe boilerplate
// ─────────────────────────────────────────────────────────────────────────────
async function createFaceLandmarker(
    runningMode: "VIDEO" | "IMAGE"
): Promise<vision.FaceLandmarker> {
    const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://unpkg.com/@mediapipe/tasks-vision@0.10.7/wasm"
    );

    return vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
            modelAssetPath:
                "https://storage.googleapis.com/mediapipe-assets/face_landmarker.task",
            delegate: "GPU",
        },
        runningMode,
        numFaces: 1,
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main service (VIDEO mode — used by the webcam page)
// ─────────────────────────────────────────────────────────────────────────────
export class FaceLandmarkerService {
    private faceLandmarker: vision.FaceLandmarker | undefined;
    private predictionInFlight = false;

    private glassesObj?: THREE.Object3D;
    private faceObj?: THREE.Mesh;
    private baseScale!: THREE.Vector3;

    /** Optional callback fired each frame a face is detected. Used for face shape analysis. */
    onLandmarksDetected?: (
        landmarks: vision.NormalizedLandmark[],
        width: number,
        height: number
    ) => void;

    setThreeObjects(glasses: THREE.Object3D, face: THREE.Mesh) {
        this.glassesObj = glasses;
        this.faceObj = face;
        this.baseScale = this.glassesObj.scale.clone();
    }

    async initializeEngine() {
        this.faceLandmarker = await createFaceLandmarker("VIDEO");
    }

    startPrediction(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d")!;

        const predict = () => {
            if (!this.faceLandmarker) {
                requestAnimationFrame(predict);
                return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            if (video.readyState >= 2) {
                const now = performance.now();
                const results = this.faceLandmarker.detectForVideo(video, now);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.faceLandmarks.length > 0) {
                    // landmarks available
                }
            }

            requestAnimationFrame(predict);
        };

        predict();
    }

    scheduleNextPrediction(video: HTMLVideoElement) {
        if (!video) {
            requestAnimationFrame(() => this.scheduleNextPrediction(video));
            return;
        }
        if (typeof video.requestVideoFrameCallback === 'function') {
            video.requestVideoFrameCallback(() => { this.renderPrediction(video); });
        } else {
            requestAnimationFrame(() => this.renderPrediction(video));
        }
    }

    renderPrediction(video: HTMLVideoElement) {
        if (this.predictionInFlight) {
            this.scheduleNextPrediction(video);
            return;
        }
        this.predictionInFlight = true;

        if (!this.faceLandmarker) {
            this.predictionInFlight = false;
            this.scheduleNextPrediction(video);
            return;
        }

        const results = this.faceLandmarker.detectForVideo(video, performance.now());

        if (results.faceLandmarks && results.faceLandmarks.length > 0 && this.glassesObj) {
            this.glassesObj.visible = true;
            this.applyLandmarks(results.faceLandmarks[0], video.videoWidth, video.videoHeight);
            this.onLandmarksDetected?.(results.faceLandmarks[0], video.videoWidth, video.videoHeight);
        } else {
            if (this.glassesObj) this.glassesObj.visible = false;
            if (this.faceObj) this.faceObj.visible = false;
            sm.ready = false;
        }

        this.predictionInFlight = false;
        this.scheduleNextPrediction(video);
    }

    // Shared landmark → Three.js logic (used by both VIDEO and IMAGE services)
    applyLandmarks(
        landmarks: vision.NormalizedLandmark[],
        width: number,
        height: number
    ) {
        if (!this.glassesObj) return;

        const pts = toPixels(landmarks, { videoWidth: width, videoHeight: height } as HTMLVideoElement);

        let lEye = eyeMid(pts, LM.leftEyeInner, LM.leftEyeOuter);
        let rEye = eyeMid(pts, LM.rightEyeInner, LM.rightEyeOuter);
        let nose = toV(pts, LM.noseBridge);
        let nTip = toV(pts, LM.noseTip);
        let fHead = toV(pts, LM.forehead);
        let chn = toV(pts, LM.chin);
        let lTmp = toV(pts, LM.leftTemple);
        let rTmp = toV(pts, LM.rightTemple);
        let lChk = toV(pts, LM.leftCheek);
        let rChk = toV(pts, LM.rightCheek);

        let eMid = mid(lEye, rEye);
        let eW = lEye.distanceTo(rEye);
        let tW = lTmp.distanceTo(rTmp);
        let cW = lChk.distanceTo(rChk);
        let fW = Math.max(eW, tW, cW);
        let fH = fHead.distanceTo(chn);

        let xAxis = rEye.clone().sub(lEye).normalize();
        let yRaw = fHead.clone().sub(chn).normalize();
        let zAxis = xAxis.clone().cross(yRaw).normalize();
        if (zAxis.z < 0) zAxis.negate();
        let yAxis = zAxis.clone().cross(xAxis).normalize();

        let rotMat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
        let targetQuat = new THREE.Quaternion().setFromRotationMatrix(rotMat);

        let btt = nTip.clone().sub(nose);
        let depAdj = clamp(btt.length() * 0.1, 0, 6);

        let tGPos = eMid.clone()
            .addScaledVector(xAxis, CFG.glassesCenterX)
            .addScaledVector(yAxis, CFG.glassesDown)
            .addScaledVector(zAxis, CFG.glassesDepth + depAdj);

        let wS = fW / CFG.refHeadWidth;
        let hS = fH / CFG.refFaceHeight;
        let bS = (wS * 0.7) + (hS * 0.3);
        let gS = bS * CFG.glassesScale;
        let tGScale = new THREE.Vector3(gS, gS, gS);

        let mov = tGPos.distanceTo(sm.prev);
        let aDelta = qDelta(sm.gQuat, targetQuat);
        let aP = clamp(0.15 + mov * 0.015, 0.15, 0.55);
        let aR = clamp(0.20 + aDelta * 0.6, 0.20, 0.75);
        let aS = clamp(0.16 + mov * 0.010, 0.16, 0.45);

        if (sm.ready) {
            sm.gPos.lerp(tGPos, aP);
            sm.gQuat.slerp(targetQuat, aR);
            sm.gScale.lerp(tGScale, aS);
        } else {
            sm.gPos.copy(tGPos);
            sm.gQuat.copy(targetQuat);
            sm.gScale.copy(tGScale);
            sm.ready = true;
        }

        sm.prev.copy(tGPos);

        this.glassesObj!.scale.set(
            sm.gScale.x * this.baseScale.x,
            sm.gScale.y * this.baseScale.y,
            sm.gScale.z * this.baseScale.z
        );

        this.normalizePosition(this.glassesObj!);
        this.glassesObj!.position.set(
            sm.gPos.x + this.glassesObj!.position.x,
            sm.gPos.y + this.glassesObj!.position.y,
            sm.gPos.z + this.glassesObj!.position.z
        );

        this.glassesObj!.quaternion.copy(sm.gQuat);
        this.glassesObj!.updateWorldMatrix(true, true);

        if (this.faceObj) {
            let posAttr = this.faceObj.geometry.getAttribute('position');
            let cx = 0, cy = 0, cz = 0;
            let fwdOff = 8;
            for (let fi = 0; fi < FACE_OVAL.length; fi++) {
                let fv = toV(pts, FACE_OVAL[fi]);
                fv.addScaledVector(zAxis, fwdOff);
                posAttr.setXYZ(fi + 1, fv.x, fv.y, fv.z);
                cx += fv.x; cy += fv.y; cz += fv.z;
            }
            cx /= FACE_OVAL.length;
            cy /= FACE_OVAL.length;
            cz /= FACE_OVAL.length;

            let coneD = fW * 0.5;
            posAttr.setXYZ(0,
                cx - zAxis.x * coneD,
                cy - zAxis.y * coneD,
                cz - zAxis.z * coneD
            );
            posAttr.needsUpdate = true;
        }
    }

    normalizePosition(model: THREE.Object3D) {
        const center = new THREE.Vector3();
        const box = new THREE.Box3().setFromObject(model);
        box.getCenter(center);
        model.position.sub(center);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Image mode service — used by the photo upload page
// ─────────────────────────────────────────────────────────────────────────────
export class ImageFaceLandmarkerService {
    private faceLandmarker: vision.FaceLandmarker | undefined;

    private glassesObj?: THREE.Object3D;
    private faceObj?: THREE.Mesh;
    private baseScale!: THREE.Vector3;

    // Reuse the shared landmark applier from the parent class
    private videoService = new FaceLandmarkerService();

    setThreeObjects(glasses: THREE.Object3D, face: THREE.Mesh) {
        this.glassesObj = glasses;
        this.faceObj = face;
        this.baseScale = glasses.scale.clone();
        // Share objects with inner service so applyLandmarks() can use them
        this.videoService.setThreeObjects(glasses, face);
    }

    async initializeEngine() {
        this.faceLandmarker = await createFaceLandmarker("IMAGE");
    }

    /**
     * Run detection on a static HTMLImageElement and place glasses once.
     * Returns { found, landmarks } — landmarks are used for face shape analysis.
     */
    async detectAndApply(img: HTMLImageElement): Promise<{
        found: boolean;
        landmarks: vision.NormalizedLandmark[] | null;
    }> {
        if (!this.faceLandmarker || !this.glassesObj) return { found: false, landmarks: null };

        // Reset smoothing state for a fresh image (no lerp needed)
        sm.ready = false;

        const results = this.faceLandmarker.detect(img);

        if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
            this.glassesObj.visible = false;
            if (this.faceObj) this.faceObj.visible = false;
            return { found: false, landmarks: null };
        }

        this.glassesObj.visible = true;
        this.videoService.applyLandmarks(
            results.faceLandmarks[0],
            img.naturalWidth,
            img.naturalHeight
        );

        return { found: true, landmarks: results.faceLandmarks[0] };
    }
}