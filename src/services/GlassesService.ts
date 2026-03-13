import * as THREE from "three";

/**
 * Create a premium wire-frame sunglasses model.
 */
export function createSunglasses(): THREE.Group {
    const g = new THREE.Group();

    // ══════════════════════════════════════════════════════════════════════
    // DIMENSIONS
    // ══════════════════════════════════════════════════════════════════════
    const lensW = 52;
    const lensH = 43;
    const bridgeGap = 17;
    const wireR = 0.7;
    const templeLen = 56;

    const cx = bridgeGap / 2 + lensW / 2 + 1.5;

    // ══════════════════════════════════════════════════════════════════════
    // MATERIALS
    // ══════════════════════════════════════════════════════════════════════
    const acetateMat = new THREE.MeshPhysicalMaterial({
        color: 0x3d1f0d,
        metalness: 0,
        roughness: 0.16,
        clearcoat: 0.95,
        clearcoatRoughness: 0.06,
        reflectivity: 0.5,
        side: THREE.DoubleSide
    });

    const goldMat = new THREE.MeshStandardMaterial({
        color: 0xc9a54e,
        metalness: 0.92,
        roughness: 0.12,
        side: THREE.DoubleSide
    });

    const goldDarkMat = new THREE.MeshStandardMaterial({
        color: 0xa08030,
        metalness: 0.88,
        roughness: 0.18,
        side: THREE.FrontSide
    });

    const lensMat = new THREE.MeshPhysicalMaterial({
        color: 0x1c2e1c,
        metalness: 0.05,
        roughness: 0.02,
        transparent: true,
        opacity: 0.68,
        side: THREE.DoubleSide,
        depthWrite: false,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: 0.3
    });

    // ══════════════════════════════════════════════════════════════════════
    // HELPER: Elliptical curve
    // ══════════════════════════════════════════════════════════════════════
    function ellipseCurve3D(
        w: number,
        h: number,
        segments = 72
    ): THREE.CatmullRomCurve3 {
        const pts: THREE.Vector3[] = [];

        for (let i = 0; i <= segments; i++) {
            const a = (i / segments) * Math.PI * 2;
            pts.push(
                new THREE.Vector3(
                    Math.cos(a) * w * 0.5,
                    Math.sin(a) * h * 0.5,
                    0
                )
            );
        }

        return new THREE.CatmullRomCurve3(pts, true);
    }

    // ══════════════════════════════════════════════════════════════════════
    // METAL RIM
    // ══════════════════════════════════════════════════════════════════════
    function buildRim(xOff: number): THREE.Mesh {
        const curve = ellipseCurve3D(lensW, lensH);
        const geo = new THREE.TubeGeometry(curve, 72, wireR, 8, true);
        const mesh = new THREE.Mesh(geo, goldMat);
        mesh.position.x = xOff;
        return mesh;
    }

    g.add(buildRim(-cx));
    g.add(buildRim(cx));

    // ══════════════════════════════════════════════════════════════════════
    // LENSES
    // ══════════════════════════════════════════════════════════════════════
    function buildLens(xOff: number): THREE.Mesh {
        const shape = new THREE.Shape();
        shape.absellipse(0, 0, lensW * 0.485, lensH * 0.485, 0, Math.PI * 2);

        const geo = new THREE.ShapeGeometry(shape, 48);
        const mesh = new THREE.Mesh(geo, lensMat);
        mesh.position.set(xOff, 0, 0.2);
        return mesh;
    }

    g.add(buildLens(-cx));
    g.add(buildLens(cx));

    // ══════════════════════════════════════════════════════════════════════
    // BRIDGE
    // ══════════════════════════════════════════════════════════════════════
    const bridgePts: THREE.Vector3[] = [
        new THREE.Vector3(-cx + lensW * 0.35, lensH * 0.08, wireR),
        new THREE.Vector3(-bridgeGap * 0.25, lensH * 0.18, wireR * 2),
        new THREE.Vector3(0, lensH * 0.22, wireR * 2.5),
        new THREE.Vector3(bridgeGap * 0.25, lensH * 0.18, wireR * 2),
        new THREE.Vector3(cx - lensW * 0.35, lensH * 0.08, wireR)
    ];

    const bridgeCurve = new THREE.CatmullRomCurve3(bridgePts);
    const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 24, wireR * 1.2, 8);
    g.add(new THREE.Mesh(bridgeGeo, goldMat));

    // ══════════════════════════════════════════════════════════════════════
    // TEMPLES
    // ══════════════════════════════════════════════════════════════════════
    function buildTemple(side: number): THREE.Group {
        const pivot = new THREE.Group();

        const hingeX = side * (cx + lensW * 0.5 + 2.5);
        const hingeY = lensH * 0.2;
        pivot.position.set(hingeX, hingeY, 0);

        const armPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -templeLen * 0.5),
            new THREE.Vector3(0, 0, -templeLen)
        ]);

        const armGeo = new THREE.TubeGeometry(armPath, 32, 1, 8);
        pivot.add(new THREE.Mesh(armGeo, goldMat));

        const tipPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, -templeLen * 0.65),
            new THREE.Vector3(0, 0, -templeLen * 0.82),
            new THREE.Vector3(0, 0, -templeLen)
        ]);

        const tipGeo = new THREE.TubeGeometry(tipPath, 16, 1.6, 8);
        pivot.add(new THREE.Mesh(tipGeo, acetateMat));

        pivot.rotation.y = side * 0.06;

        return pivot;
    }

    g.add(buildTemple(-1));
    g.add(buildTemple(1));

    // ══════════════════════════════════════════════════════════════════════
    // HINGES
    // ══════════════════════════════════════════════════════════════════════
    function buildHinge(side: number): THREE.Group {
        const hg = new THREE.Group();

        const barrel = new THREE.Mesh(
            new THREE.CylinderGeometry(1.4, 1.4, 4, 12),
            goldMat
        );
        hg.add(barrel);

        const plate = new THREE.Mesh(
            new THREE.BoxGeometry(3.5, 5, 1.3),
            goldMat
        );
        plate.position.set(-side * 1.5, 0, 0);
        hg.add(plate);

        const screw = new THREE.Mesh(
            new THREE.CylinderGeometry(0.5, 0.5, 0.4, 8),
            goldDarkMat
        );
        screw.rotation.x = Math.PI / 2;
        screw.position.set(-side * 2.2, 0, 0.8);
        hg.add(screw);

        hg.position.set(
            side * (cx + lensW * 0.5 + 1),
            lensH * 0.2,
            -0.5
        );

        return hg;
    }

    g.add(buildHinge(-1));
    g.add(buildHinge(1));

    // ══════════════════════════════════════════════════════════════════════
    // RENDER ORDER
    // ══════════════════════════════════════════════════════════════════════
    g.traverse((child: THREE.Object3D) => {
        if ((child as THREE.Mesh).isMesh) {
            (child as THREE.Mesh).renderOrder = 3;
        }
    });

    return g;
}