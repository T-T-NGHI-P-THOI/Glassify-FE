import * as THREE from 'three';
import { FACE_OVAL } from './FaceLandmarkerService';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { API_CONFIG } from '@/api/axios.config';

const CANVAS_WIDTH = 880;

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
    viewerModel?: THREE.Object3D;

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
    async initalizeThreeJs(video: HTMLVideoElement, canvas: HTMLCanvasElement, frameGroupId: string) {
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

        this.glassesObj = await this.loadGlassesModel(frameGroupId);
        this.normalizeModel(this.glassesObj);
        this.glassesObj.visible = false;
        scene.add(this.glassesObj);

        window.addEventListener('resize', () => handleResize(camera, renderer, vw, vh), false);

        this.animate(bgResult.bg, scene, camera, renderer);
    }

    // ── IMAGE mode (photo upload page) ───────────────────────────────────
    async initializeWithImage(img: HTMLImageElement, canvas: HTMLCanvasElement, frameGroupId: string) {
        const vw = img.naturalWidth;
        const vh = img.naturalHeight;

        const camera = await this.createCamera(vw, vh);
        this.camera = camera;

        const renderer = await this.createRenderer(vw, vh, canvas);
        this.renderer = renderer;

        const scene = new THREE.Scene();
        this.scene = scene;

        const texture = new THREE.TextureLoader().load(img.src);
        texture.colorSpace = THREE.SRGBColorSpace;

        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
            map: texture,
            depthWrite: false,
            side: THREE.DoubleSide,
        }));
        sprite.center.set(0.5, 0.5);
        sprite.scale.set(-vw, vh, 1);
        sprite.position.copy(camera.position);
        sprite.position.z = 0;
        scene.add(sprite);

        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileCubemapShader();
        scene.environment = pmrem.fromScene(new THREE.Scene()).texture;
        pmrem.dispose();

        const lights = await this.createLights();
        lights.forEach(l => scene.add(l));

        this.faceObj = await this.createDynamicFaceMesh();
        this.faceObj.visible = false;
        scene.add(this.faceObj);

        this.glassesObj = await this.loadGlassesModel(frameGroupId);
        this.normalizeModel(this.glassesObj);
        this.glassesObj.visible = false;
        scene.add(this.glassesObj);

        renderer.render(scene, camera);
    }

    // ── 3D VIEWER mode (Upload3DModelPage) ───────────────────────────────
    /**
     * Khởi Three.js viewer độc lập cho trang upload model.
     *
     * normalizeModel() gốc dùng TARGET_WIDTH=140 (pixel-space webcam) — sẽ
     * scale model lên rất lớn so với PerspectiveCamera fov45/z=6.
     * Method này dùng normalizeModelForViewer() riêng: scale về maxDim=2 units
     * rồi đặt đáy ngay mặt ground y=0.
     *
     * @param canvas  HTMLCanvasElement đã set width/height attribute thực
     * @param file    File object (.glb/.gltf/...) từ user upload
     * @returns       cleanup function — gọi khi unmount hoặc đổi file
     */
    initializeThreeDViewer(canvas: HTMLCanvasElement, file: File): () => void {
        const w = canvas.width;
        const h = canvas.height;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setSize(w, h, false); // false = không override CSS
        renderer.setClearColor(0xffffff);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
        camera.position.set(0, 2, 6);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minDistance = 2.5;
        controls.maxDistance = 7;
        controls.minPolarAngle = 1.5;
        controls.maxPolarAngle = Math.PI / 2 + 0.2;
        controls.autoRotateSpeed = 1.5;
        controls.target.set(0, 1, 0);
        controls.update();

        // Ground
        // const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
        // groundGeometry.rotateX(-Math.PI / 2);
        // const groundMesh = new THREE.Mesh(
        //     groundGeometry,
        //     new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide })
        // );
        // groundMesh.receiveShadow = true;
        // scene.add(groundMesh);

        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambient);

        const spotLight = new THREE.SpotLight(0xffffff, 80, 30, 0.4, 0.5);
        spotLight.position.set(0, 8, 4);
        spotLight.castShadow = true;
        spotLight.shadow.bias = -0.0001;
        scene.add(spotLight);

        const fillLight = new THREE.DirectionalLight(0xaabbff, 1.0);
        fillLight.position.set(-4, 3, 4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(4, 2, -4);
        scene.add(rimLight);

        // Load model từ File object
        const objectURL = URL.createObjectURL(file);
        const loader = new GLTFLoader();
        loader.load(
            objectURL,
            (gltf) => {
                const mesh = gltf.scene;
                mesh.traverse((child) => {
                    child.castShadow = true;
                    child.receiveShadow = true;
                });

                this.normalizeModelForViewer(mesh);

                const box = new THREE.Box3().setFromObject(mesh);
                const center = new THREE.Vector3();
                box.getCenter(center);
                controls.target.set(center.x, center.y, center.z);
                controls.update();

                scene.add(mesh);
                this.viewerModel = mesh; // ✅ lưu lại để apply texture sau
                URL.revokeObjectURL(objectURL);
            },
            (xhr) => {
                if (xhr.total > 0) {
                    console.log(`[3D Viewer] ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
                }
            },
            (error) => {
                console.error('[3D Viewer] load error', error);
                URL.revokeObjectURL(objectURL);
            }
        );

        // Resize
        const onResize = () => {
            const cw = canvas.clientWidth;
            const ch = canvas.clientHeight;
            if (cw === 0 || ch === 0) return;
            camera.aspect = cw / ch;
            camera.updateProjectionMatrix();
            renderer.setSize(cw, ch, false);
        };
        window.addEventListener('resize', onResize);

        // Animate loop
        let animId: number;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            controls.dispose();
            renderer.dispose();
            scene.clear();
        };
    }

    initializeThreeDViewerFromUrl(
        canvas: HTMLCanvasElement,
        modelUrl: string,
        options?: {
            requestHeaders?: Record<string, string>;
            onLoaded?: () => void;
            onError?: (error: unknown) => void;
        }
    ): () => void {
        const w = canvas.width;
        const h = canvas.height;

        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.setSize(w, h, false);
        renderer.setClearColor(0x555555);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 1000);
        camera.position.set(0, 2, 6);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.minDistance = 1;
        controls.maxDistance = 20;
        controls.minPolarAngle = 0.3;
        controls.maxPolarAngle = Math.PI / 2 + 0.2;
        controls.autoRotateSpeed = 1.5;
        controls.target.set(0, 1, 0);
        controls.update();

        const groundGeometry = new THREE.PlaneGeometry(20, 20, 32, 32);
        groundGeometry.rotateX(-Math.PI / 2);
        const groundMesh = new THREE.Mesh(
            groundGeometry,
            new THREE.MeshStandardMaterial({ color: 0x555555, side: THREE.DoubleSide })
        );
        groundMesh.receiveShadow = true;
        scene.add(groundMesh);

        const ambient = new THREE.AmbientLight(0xffffff, 1.2);
        scene.add(ambient);

        const spotLight = new THREE.SpotLight(0xffffff, 80, 30, 0.4, 0.5);
        spotLight.position.set(0, 8, 4);
        spotLight.castShadow = true;
        spotLight.shadow.bias = -0.0001;
        scene.add(spotLight);

        const fillLight = new THREE.DirectionalLight(0xaabbff, 1.0);
        fillLight.position.set(-4, 3, 4);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
        rimLight.position.set(4, 2, -4);
        scene.add(rimLight);

        this.viewerModel = undefined;

        const loader = new GLTFLoader();
        if (options?.requestHeaders) {
            loader.setRequestHeader(options.requestHeaders);
        }
        loader.load(
            modelUrl,
            (gltf) => {
                const mesh = gltf.scene;
                mesh.traverse((child) => {
                    child.castShadow = true;
                    child.receiveShadow = true;
                });

                this.normalizeModelForViewer(mesh);

                const box = new THREE.Box3().setFromObject(mesh);
                const center = new THREE.Vector3();
                box.getCenter(center);
                controls.target.set(center.x, center.y, center.z);
                controls.update();

                scene.add(mesh);
                this.viewerModel = mesh;
                options?.onLoaded?.();
            },
            undefined,
            (error) => {
                console.error('[3D Viewer] load error', error);
                options?.onError?.(error);
            }
        );

        const onResize = () => {
            const cw = canvas.clientWidth;
            const ch = canvas.clientHeight;
            if (cw === 0 || ch === 0) return;
            camera.aspect = cw / ch;
            camera.updateProjectionMatrix();
            renderer.setSize(cw, ch, false);
        };
        window.addEventListener('resize', onResize);

        let animId: number;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', onResize);
            controls.dispose();
            renderer.dispose();
            scene.clear();
        };
    }

    // Trong ThreeJsService.ts
    applyTextureFromUrl(object: THREE.Object3D, url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const loader = new THREE.TextureLoader();
            loader.setCrossOrigin('anonymous'); // Tránh lỗi CORS

            loader.load(
                url,
                (texture) => {
                    texture.colorSpace = "srgb"; // Đảm bảo màu sắc chuẩn
                    object.traverse((child) => {
                        if ((child as any).isMesh) {
                            const mesh = child as THREE.Mesh;
                            if (mesh.material) {
                                (mesh.material as any).map = texture;
                                (mesh.material as any).needsUpdate = true;
                            }
                        }
                    });
                    console.log("Texture loaded successfully");
                    resolve(); // Báo hiệu đã xong
                },
                undefined,
                (err) => {
                    console.error("Texture load failed", err);
                    reject(err);
                }
            );
        });
    }

    applyTextureToModel(model: THREE.Object3D, textureFile: File): void {
        const objectURL = URL.createObjectURL(textureFile);
        const loader = new THREE.TextureLoader();

        loader.load(
            objectURL,
            (texture) => {
                texture.colorSpace = THREE.SRGBColorSpace;
                texture.flipY = false; // GLTF cần flipY = false

                model.traverse((child) => {
                    if (child instanceof THREE.Mesh) {
                        const mat = child.material;

                        if (Array.isArray(mat)) {
                            mat.forEach(m => {
                                m.map = texture;
                                m.needsUpdate = true;
                            });
                        } else {
                            mat.map = texture;
                            mat.needsUpdate = true;
                        }
                    }
                });

                URL.revokeObjectURL(objectURL);
            },
            undefined,
            (err) => {
                console.error('[Texture] load error', err);
                URL.revokeObjectURL(objectURL);
            }
        );
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
        let key = new THREE.DirectionalLight(0xffffff, 1.2);
        key.position.set(0, 120, 250);

        let fill = new THREE.DirectionalLight(0xeef0ff, 0.5);
        fill.position.set(-100, 40, 120);

        let rim = new THREE.DirectionalLight(0xffffff, 0.4);
        rim.position.set(60, 80, -100);

        let topAccent = new THREE.DirectionalLight(0xffffff, 0.25);
        topAccent.position.set(0, 200, 50);

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

    async loadGlassesModel(frameGroupId: string) {
        const loader = new GLTFLoader();
        const gltf = await loader.loadAsync(`${API_CONFIG.BASE_URL}/api/v1/product/frame-group/model-3d?frameGroupId=${frameGroupId}`);
        const mesh = gltf.scene;

        mesh.traverse((child: THREE.Object3D) => {
            child.castShadow = true;
            child.receiveShadow = true;
        });

        return mesh;
    }

    /**
     * normalize cho webcam/image mode — scale theo TARGET_WIDTH pixel-space.
     * KHÔNG dùng cho initializeThreeDViewer.
     */
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

    /**
     * normalize cho PerspectiveCamera viewer (fov 45, camera z≈6).
     * Scale model về maxDim = 2 world-units, đặt đáy ngay y=0 (ground).
     */
    private normalizeModelForViewer(model: THREE.Object3D) {
        // Reset trước
        model.position.set(0, 0, 0);
        model.rotation.set(0, 0, 0);
        model.scale.set(1, 1, 1);

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        // Scale: chiều dài lớn nhất = 2 world units
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
            model.scale.setScalar(2 / maxDim);
        }

        // Tính lại bounding box sau scale
        const scaledBox = new THREE.Box3().setFromObject(model);
        const scaledCenter = new THREE.Vector3();
        scaledBox.getCenter(scaledCenter);

        // Căn giữa X/Z, đáy model chạm y=0
        model.position.x = -scaledCenter.x;
        model.position.z = -scaledCenter.z;
        model.position.y = -scaledBox.min.y;
    }
}