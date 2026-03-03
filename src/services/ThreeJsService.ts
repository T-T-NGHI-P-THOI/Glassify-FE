import * as THREE from 'three';
import { FACE_OVAL } from './FaceLandmarkerService';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const CANVAS_WIDTH = 640;


function handleResize(camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer, video: HTMLVideoElement) {
    let vw = video.videoWidth, vh = video.videoHeight;
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

    animate = (
        bg: THREE.Texture,
        scene: THREE.Scene,
        camera: THREE.OrthographicCamera,
        renderer: THREE.WebGLRenderer
    ) => {
        bg.needsUpdate = true;
        requestAnimationFrame(() =>
            this.animate(bg, scene, camera, renderer)
        );
        renderer.render(scene, camera);
    };

    async initalizeThreeJs(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
        // Camera
        let camera = await this.createCamera(video);

        // Video background
        let bgResult = await this.createVideoBackground(video, camera);
        let bg = bgResult.bg;

        // Renderer (created early so PMREMGenerator can use it)
        let renderer = await this.createRenderer(video, canvas);

        // Scene
        let scene = new THREE.Scene();
        scene.add(bgResult.sprite);

        // Environment map for realistic reflections on clearcoat / metallic surfaces
        let pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileCubemapShader();
        let neutralEnv = pmrem.fromScene(new THREE.Scene()).texture;
        scene.environment = neutralEnv;
        pmrem.dispose();

        // Lights
        await this.createLights().then((lights) => {
            lights.forEach(function (light) { scene.add(light); });
        });

        // Face mesh occluder
        this.faceObj = await this.createDynamicFaceMesh();
        this.faceObj.visible = false;
        scene.add(this.faceObj);

        // Glasses model
        // Example: clear-browline-glasses, eyeglasses_black_v5, glasses
        // eyeglasses_subject_visualization, blue-eyeglasses
        this.glassesObj = await this.loadGlassesModel("/models/glasses.glb");
        // this.glassesObj = createSunglasses();
        
        // Normalize glasses
        this.normalizeModel(this.glassesObj);

        this.glassesObj.visible = false;
        scene.add(this.glassesObj);

        window.addEventListener('resize', function () {
            handleResize(camera, renderer, video);
        }, false);

        // Animate
        this.animate(bg, scene, camera, renderer)
    }

    async createCamera(video: HTMLVideoElement) {
        let vw = video.videoWidth;
        let vh = video.videoHeight;
        let cam = new THREE.OrthographicCamera(
            -vw / 2, vw / 2,
            vh / 2, -vh / 2,
            0.1, 5000
        );
        cam.position.set(-vw / 2, -vh / 2, 500);
        return cam;
    }

    async createVideoBackground(video: HTMLVideoElement, camera: THREE.Camera) {
        let vw = video.videoWidth;
        let vh = video.videoHeight;

        let bg = new THREE.VideoTexture(video);
        bg.colorSpace = THREE.SRGBColorSpace;
        bg.minFilter = THREE.LinearFilter;

        let sprite = new THREE.Sprite(new THREE.SpriteMaterial({
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

    /** Create the WebGL renderer with production-quality settings. */
    async createRenderer(video: HTMLVideoElement, canvas: HTMLCanvasElement) {
        let r = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true
        });
        r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        r.setSize(CANVAS_WIDTH, CANVAS_WIDTH * video.videoHeight / video.videoWidth);
        r.toneMapping = THREE.ACESFilmicToneMapping;
        r.toneMappingExposure = 1.1;
        r.outputColorSpace = THREE.SRGBColorSpace;
        return r;
    }

    async createDynamicFaceMesh() {
        let nOval = FACE_OVAL.length;
        let nVerts = nOval + 1;

        let positions = new Float32Array(nVerts * 3);
        let indices = [];

        // Triangle fan: center (0) → oval[i] (i+1) → oval[next] (next+1)
        for (let i = 0; i < nOval; i++) {
            indices.push(0, i + 1, ((i + 1) % nOval) + 1);
        }

        let geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setIndex(indices);

        let mat = new THREE.MeshBasicMaterial({
            colorWrite: false,
            side: THREE.DoubleSide
        });

        let mesh = new THREE.Mesh(geo, mat);
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

        // reset transform
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);

        // compute box
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();

        box.getSize(size);

        // --- SCALE ---
        const TARGET_WIDTH = 140;
        const scaleFactor = TARGET_WIDTH / size.x;
        model.scale.setScalar(scaleFactor);

        // recompute box after scale
        const newBox = new THREE.Box3().setFromObject(model);
        newBox.getCenter(center);
        
        // --- POSITION ---
        model.position.sub(center);

        console.log("Center: ", center)
        return model;
    }
}