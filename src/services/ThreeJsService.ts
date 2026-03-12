import * as THREE from 'three';
import { FACE_OVAL } from './FaceLandmarkerService';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const CANVAS_WIDTH = 640;

function handleResize(camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer, vw: number, vh: number) {
    camera.left = -vw / 2;
    camera.right = vw / 2;
    camera.top = vh / 2;
    camera.bottom = -vh / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(CANVAS_WIDTH, CANVAS_WIDTH * vh / vw);
}

export class ThreeJsService {

    glassesObj?: THREE.Object3D;
    faceObj?: THREE.Mesh;

    private scene?: THREE.Scene;
    private camera?: THREE.OrthographicCamera;
    private renderer?: THREE.WebGLRenderer;
    private animFrameId?: number;

    animate = (
        bg: THREE.Texture,
        scene: THREE.Scene,
        camera: THREE.OrthographicCamera,
        renderer: THREE.WebGLRenderer
    ) => {
        bg.needsUpdate = true;
        this.animFrameId = requestAnimationFrame(() =>
            this.animate(bg, scene, camera, renderer)
        );
        renderer.render(scene, camera);
    };

    // ── VIDEO mode (webcam page) ──────────────────────────────────────────
    async initalizeThreeJs(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        const camera = await this.createCamera(vw, vh);
        this.camera = camera;

        const bgResult = await this.createVideoBackground(video, camera);
        const renderer = await this.createRenderer(vw, vh, canvas);
        this.renderer = renderer;

        const scene = new THREE.Scene();
        this.scene = scene;
        scene.add(bgResult.sprite);

        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileCubemapShader();
        scene.environment = pmrem.fromScene(new THREE.Scene()).texture;
        pmrem.dispose();

        const lights = await this.createLights();
        lights.forEach(l => scene.add(l));

        this.faceObj = await this.createDynamicFaceMesh();
        this.faceObj.visible = false;
        scene.add(this.faceObj);

        this.glassesObj = await this.loadGlassesModel("/models/Frame.glb");
        this.normalizeModel(this.glassesObj);
        this.glassesObj.visible = false;
        scene.add(this.glassesObj);

        window.addEventListener('resize', () => handleResize(camera, renderer, vw, vh), false);

        this.animate(bgResult.bg, scene, camera, renderer);
    }

    // ── IMAGE mode (photo upload page) ───────────────────────────────────
    /**
     * Same as initalizeThreeJs but uses a static HTMLImageElement as the
     * background instead of a VideoTexture.  No animation loop is started —
     * a single render() call is made after glasses are placed.
     */
    async initializeWithImage(img: HTMLImageElement, canvas: HTMLCanvasElement) {
        const vw = img.naturalWidth;
        const vh = img.naturalHeight;

        const camera = await this.createCamera(vw, vh);
        this.camera = camera;

        const renderer = await this.createRenderer(vw, vh, canvas);
        this.renderer = renderer;

        const scene = new THREE.Scene();
        this.scene = scene;

        // ── Static image background ──
        const texture = new THREE.TextureLoader().load(img.src);
        texture.colorSpace = THREE.SRGBColorSpace;

        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            depthWrite: false,
            side: THREE.DoubleSide,
        }));
        sprite.center.set(0.5, 0.5);
        sprite.scale.set(-vw, vh, 1);   // negative X mirrors like webcam feed
        sprite.position.copy(camera.position);
        sprite.position.z = 0;
        scene.add(sprite);

        // ── Environment / lights ──
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileCubemapShader();
        scene.environment = pmrem.fromScene(new THREE.Scene()).texture;
        pmrem.dispose();

        const lights = await this.createLights();
        lights.forEach(l => scene.add(l));

        // ── Face occluder ──
        this.faceObj = await this.createDynamicFaceMesh();
        this.faceObj.visible = false;
        scene.add(this.faceObj);

        // ── Glasses model ──
        this.glassesObj = await this.loadGlassesModel("/models/Frame.glb");
        this.normalizeModel(this.glassesObj);
        this.glassesObj.visible = false;
        scene.add(this.glassesObj);

        // Render once immediately (glasses are placed after this resolves)
        renderer.render(scene, camera);
    }

    /** Call after detectAndApply() to refresh the canvas with glasses on. */
    renderOnce() {
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // ── Shared helpers ────────────────────────────────────────────────────

    async createCamera(vw: number, vh: number) {
        const cam = new THREE.OrthographicCamera(
            -vw / 2, vw / 2,
            vh / 2, -vh / 2,
            0.1, 5000
        );
        cam.position.set(-vw / 2, -vh / 2, 500);
        return cam;
    }

    async createVideoBackground(video: HTMLVideoElement, camera: THREE.Camera) {
        const vw = video.videoWidth;
        const vh = video.videoHeight;

        const bg = new THREE.VideoTexture(video);
        bg.colorSpace = THREE.SRGBColorSpace;
        bg.minFilter = THREE.LinearFilter;

        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: bg,
            depthWrite: false,
            side: THREE.DoubleSide
        }));

        sprite.center.set(0.5, 0.5);
        sprite.scale.set(-vw, vh, 1);
        sprite.position.copy(camera.position);
        sprite.position.z = 0;

        return { bg, sprite };
    }

    async createLights() {
        // Key light — main illumination from upper front
        let key = new THREE.DirectionalLight(0xffffff, 1.2);
        key.position.set(0, 120, 250);

        // Fill light — softer, from left side to reduce harsh shadows
        let fill = new THREE.DirectionalLight(0xeef0ff, 0.5);
        fill.position.set(-100, 40, 120);

        // Rim light — back-lighting for edge highlights on frame
        let rim = new THREE.DirectionalLight(0xffffff, 0.4);
        rim.position.set(60, 80, -100);

        // Top accent — helps clearcoat reflections on brow line
        let topAccent = new THREE.DirectionalLight(0xffffff, 0.25);
        topAccent.position.set(0, 200, 50);

        // Ambient — hemisphere for natural outdoor feel
        let amb = new THREE.HemisphereLight(0xffffff, 0x444466, 0.5);

        return [key, fill, rim, topAccent, amb];
    }

    async createRenderer(vw: number, vh: number, canvas: HTMLCanvasElement) {
        const r = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
        });
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        r.setSize(CANVAS_WIDTH, CANVAS_WIDTH * vh / vw);
        r.toneMapping = THREE.ACESFilmicToneMapping;
        r.toneMappingExposure = 1.1;
        r.outputColorSpace = THREE.SRGBColorSpace;
        return r;
    }

    async createDynamicFaceMesh() {
        const nOval = FACE_OVAL.length;
        const nVerts = nOval + 1;

        const positions = new Float32Array(nVerts * 3);
        const indices: number[] = [];

        for (let i = 0; i < nOval; i++) {
            indices.push(0, i + 1, ((i + 1) % nOval) + 1);
        }

        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setIndex(indices);

        const mat = new THREE.MeshBasicMaterial({
            colorWrite: false,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geo, mat);
        mesh.renderOrder = 1;
        mesh.frustumCulled = false;
        return mesh;
    }

    async loadGlassesModel(path: string) {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(path);
        const mesh = gltf.scene;

        mesh.traverse((child: THREE.Object3D) => {
            child.castShadow = true;
            child.receiveShadow = true;
        });

        return mesh;
    }

    normalizeModel(model: THREE.Object3D) {
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);

        const TARGET_WIDTH = 140;
        const scaleFactor = TARGET_WIDTH / size.x;
        model.scale.setScalar(scaleFactor);

        const newBox = new THREE.Box3().setFromObject(model);
        newBox.getCenter(center);
        model.position.sub(center);

        return model;
    }
}