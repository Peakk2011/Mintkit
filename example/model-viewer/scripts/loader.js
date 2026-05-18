import * as THREE from 'three';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// Scene Setup
let scene, camera, renderer;
let currentModel = null;
let isAnimating = false;
let isWireframe = false;

// Camera orbit
let mouseDown = false, isPanning = false;
let mouseX = 0, mouseY = 0;
let cameraDistance = 15;
let cameraTheta = 0, cameraPhi = Math.PI / 4;
let targetTheta = 0, targetPhi = Math.PI / 4;
let panTarget = new THREE.Vector3(0, 3, 0);

let fileMap = {};
let mainFile = null;
let mainFileType = null;

function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x141414);
    scene.fog = new THREE.Fog(0x141414, 30, 120);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
    updateCameraPosition();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    sun.position.set(20, 30, 20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 200;
    sun.shadow.camera.left = sun.shadow.camera.bottom = -30;
    sun.shadow.camera.right = sun.shadow.camera.top = 30;
    scene.add(sun);

    const fill = new THREE.DirectionalLight(0x8090ff, 0.6);
    fill.position.set(-15, 10, -15);
    scene.add(fill);

    // Ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(200, 200),
        new THREE.MeshLambertMaterial({ color: 0x1e1e1e })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(200, 80, 0x303030, 0x202020);
    grid.position.y = 0.01;
    scene.add(grid);

    setupControls();
    animate();
}

// File Handling
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');

fileInput.addEventListener('change', e => processFiles(e.target.files));

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    processFiles(e.dataTransfer.files);
});

function processFiles(fileList) {
    for (const f of fileList) {
        fileMap[f.name] = f;
    }
    rebuildFileList();
}

function rebuildFileList() {
    mainFile = null;
    mainFileType = null;

    const listEl = document.getElementById('file-list');
    const secEl = document.getElementById('file-list-section');
    listEl.innerHTML = '';

    const files = Object.values(fileMap);
    if (!files.length) { secEl.style.display = 'none'; return; }
    secEl.style.display = 'block';

    for (const f of files) {
        const ext = f.name.split('.').pop().toLowerCase();
        let badgeClass = 'badge-tex', itemClass = 'tex';

        if (ext === 'obj') { badgeClass = 'badge-obj'; itemClass = 'main'; mainFile = f; mainFileType = 'obj'; }
        else if (ext === 'dae') { badgeClass = 'badge-obj'; itemClass = 'main'; mainFile = f; mainFileType = 'dae'; }
        else if (ext === 'mtl') { badgeClass = 'badge-mtl'; itemClass = 'mtl'; }

        const item = document.createElement('div');
        item.className = `file-item ${itemClass}`;
        item.innerHTML = `
      <span class="file-badge ${badgeClass}">${ext.toUpperCase()}</span>
      <span class="file-name" title="${f.name}">${f.name}</span>
      <button class="file-remove" onclick="removeFile('${f.name}')">×</button>`;
        listEl.appendChild(item);
    }

    document.getElementById('loadBtn').disabled = !mainFile;
    setStatus(mainFile
        ? `Ready to load: ${mainFile.name}`
        : 'Add an .OBJ or .DAE file to load', '');
}

window.removeFile = name => {
    delete fileMap[name];
    rebuildFileList();
};

function createBlobURL(file) {
    return URL.createObjectURL(file);
}

function buildMTLManager() {
    const manager = new THREE.LoadingManager();

    manager.setURLModifier(url => {
        const basename = url.split(/[/\\]/).pop();
        const match = Object.keys(fileMap).find(
            k => k.toLowerCase() === basename.toLowerCase()
        );
        if (match) return URL.createObjectURL(fileMap[match]);
        return url;
    });

    return manager;
}

// Load OBJ + MTL
async function loadOBJ() {
    const manager = buildMTLManager();

    const mtlFile = Object.values(fileMap).find(
        f => f.name.toLowerCase().endsWith('.mtl')
    );

    let object;

    if (mtlFile) {
        // Read MTL text
        const mtlText = await mtlFile.text();

        const mtlLoader = new MTLLoader(manager);
        mtlLoader.setMaterialOptions({ side: THREE.DoubleSide });

        const mtlBlob = new Blob([mtlText], { type: 'text/plain' });
        const mtlURL = URL.createObjectURL(mtlBlob);

        const materials = await new Promise((res, rej) =>
            mtlLoader.load(mtlURL, res, undefined, rej)
        );
        materials.preload();
        URL.revokeObjectURL(mtlURL);

        const objLoader = new OBJLoader(manager);
        objLoader.setMaterials(materials);

        const objURL = createBlobURL(mainFile);
        object = await new Promise((res, rej) =>
            objLoader.load(objURL, res, onProgress, rej)
        );
        URL.revokeObjectURL(objURL);

    } else {
        // No MTL – load OBJ with default material
        const objLoader = new OBJLoader(manager);
        const objURL = createBlobURL(mainFile);
        object = await new Promise((res, rej) =>
            objLoader.load(objURL, res, onProgress, rej)
        );
        URL.revokeObjectURL(objURL);
    }

    return object;
}

// Load DAE (Collada)
async function loadDAE() {
    const manager = buildMTLManager();
    const loader = new ColladaLoader(manager);
    const url = createBlobURL(mainFile);

    const collada = await new Promise((res, rej) =>
        loader.load(url, res, onProgress, rej)
    );

    URL.revokeObjectURL(url);
    return collada.scene;
}

// Shared post-load setup
function finalizeModel(object) {
    // For DAE: fix typical SketchUp up-axis
    if (mainFileType === 'dae') {
        object.rotation.set(-Math.PI / 2, 0, 0);
    }

    // Fit to scene
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const targetSize = 8;
    if (maxDim > 0) object.scale.setScalar(targetSize / maxDim);

    // Re-center after scale
    box.setFromObject(object);
    const min = box.min;
    const center2 = box.getCenter(new THREE.Vector3());
    object.position.set(-center2.x, -min.y, -center2.z);

    // Shadows + double-side
    let meshCount = 0, matNames = new Set();
    object.traverse(child => {
        if (!child.isMesh) return;
        meshCount++;
        child.castShadow = true;
        child.receiveShadow = true;
        child.geometry.computeVertexNormals();

        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach(mat => {
            if (!mat) return;
            mat.side = THREE.DoubleSide;
            matNames.add(mat.name || '(unnamed)');
        });
    });

    // Camera distance
    box.setFromObject(object);
    const finalSize = box.getSize(new THREE.Vector3()).length();
    cameraDistance = finalSize * 1.2;
    panTarget.set(0, finalSize * 0.15, 0);
    resetView();

    // Info
    showInfo({ meshes: meshCount, materials: matNames.size, format: mainFileType?.toUpperCase() || '—' });

    return meshCount;
}

// Main load entry
window.loadFiles = async function () {
    if (!mainFile) return;

    showLoadingOverlay(true, 'Parsing files…');
    setStatus('Loading…', 'loading');
    showProgress(0);

    try {
        if (currentModel) { scene.remove(currentModel); currentModel = null; }

        let object;
        if (mainFileType === 'obj') object = await loadOBJ();
        else object = await loadDAE();

        const count = finalizeModel(object);
        currentModel = object;
        scene.add(currentModel);

        setStatus(`✓ Loaded — ${count} mesh${count !== 1 ? 'es' : ''}`, 'success');

    } catch (err) {
        console.error(err);
        setStatus(`Error: ${err.message || err}`, 'error');
    } finally {
        showLoadingOverlay(false);
        showProgress(null);
    }
};

function onProgress(e) {
    if (e.lengthComputable) {
        showProgress(e.loaded / e.total * 100);
        document.getElementById('loading-text').textContent =
            `Loading… ${(e.loaded / e.total * 100).toFixed(0)}%`;
    }
}

// Sample Scene
window.loadSample = function () {
    if (currentModel) { scene.remove(currentModel); currentModel = null; }

    currentModel = new THREE.Group();
    const colors = [0xe8c87a, 0x7ac8e8, 0x6fcf97, 0xeb5757];
    const geoms = [
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.SphereGeometry(1.2, 32, 32),
        new THREE.ConeGeometry(1, 3, 8),
        new THREE.CylinderGeometry(0.5, 1.5, 2, 8)
    ];
    geoms.forEach((g, i) => {
        const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: colors[i], roughness: 0.4, metalness: 0.1 }));
        m.position.set((i - 1.5) * 4, 1 + Math.sin(i) * 1, 0);
        m.castShadow = true;
        currentModel.add(m);
    });

    scene.add(currentModel);
    panTarget.set(0, 2, 0);
    cameraDistance = 18;
    resetView();
    showInfo({ meshes: 4, materials: 4, format: 'SAMPLE' });
    setStatus('Sample loaded', 'success');
    hideInfo();   // no need for info on sample
};

// Wireframe / Animation / View
window.toggleWireframe = function () {
    isWireframe = !isWireframe;
    document.getElementById('wireframeBtn').classList.toggle('active', isWireframe);
    if (!currentModel) return;
    currentModel.traverse(c => {
        if (!c.isMesh) return;
        (Array.isArray(c.material) ? c.material : [c.material])
            .forEach(m => { if (m) m.wireframe = isWireframe; });
    });
};

window.toggleAnimation = function () {
    isAnimating = !isAnimating;
    document.getElementById('animBtn').classList.toggle('active', isAnimating);
};

window.resetView = function () {
    targetTheta = 0;
    targetPhi = Math.PI / 4;
    updateCameraPosition();
};

window.clearScene = function () {
    if (currentModel) { scene.remove(currentModel); currentModel = null; }
    fileMap = {}; mainFile = null; mainFileType = null;
    rebuildFileList();
    document.getElementById('model-info').classList.remove('visible');
    setStatus('Scene cleared', '');
};

// Camera
function updateCameraPosition() {
    const x = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
    const y = cameraDistance * Math.cos(cameraPhi);
    const z = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);
    camera.position.set(x + panTarget.x, y + panTarget.y, z + panTarget.z);
    camera.lookAt(panTarget);
}

function setupControls() {
    const el = renderer.domElement;
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseup', () => { mouseDown = false; });
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', () => { mouseDown = false; touchMode = null; lastDist = 0; });
}

function onMouseDown(e) {
    mouseDown = true; isPanning = e.shiftKey;
    mouseX = e.clientX; mouseY = e.clientY;
}

function onMouseMove(e) {
    if (!mouseDown) return;
    const dx = e.clientX - mouseX, dy = e.clientY - mouseY;
    if (isPanning) {
        const r = new THREE.Vector3(), u = new THREE.Vector3();
        r.setFromMatrixColumn(camera.matrixWorld, 0);
        u.setFromMatrixColumn(camera.matrixWorld, 1);
        panTarget.addScaledVector(r, -dx * 0.003 * cameraDistance * 0.1);
        panTarget.addScaledVector(u, dy * 0.003 * cameraDistance * 0.1);
        panTarget.y = Math.max(0, panTarget.y); // never below ground
    } else {
        targetTheta += dx * 0.005;
        // Lock above ground: phi max = just before horizontal (PI/2 - small buffer)
        targetPhi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, targetPhi + dy * 0.005));
    }
    mouseX = e.clientX; mouseY = e.clientY;
}

function onWheel(e) {
    e.preventDefault();
    cameraDistance *= e.deltaY > 0 ? 1.1 : 0.9;
    cameraDistance = Math.max(0.5, Math.min(500, cameraDistance));
}

let touchMode = null, lastDist = 0, lastTX = 0, lastTY = 0;

function onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        touchMode = 'orbit'; mouseDown = true;
        lastTX = e.touches[0].clientX; lastTY = e.touches[0].clientY;
    } else if (e.touches.length === 2) {
        touchMode = 'zoom'; mouseDown = false;
        lastDist = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
    }
}

function onTouchMove(e) {
    e.preventDefault();
    if (touchMode === 'orbit' && e.touches.length === 1 && mouseDown) {
        const dx = e.touches[0].clientX - lastTX, dy = e.touches[0].clientY - lastTY;
        targetTheta += dx * 0.008;
        targetPhi = Math.max(0.05, Math.min(Math.PI / 2 - 0.02, targetPhi + dy * 0.008));
        lastTX = e.touches[0].clientX; lastTY = e.touches[0].clientY;
    } else if (touchMode === 'zoom' && e.touches.length === 2) {
        const d = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
        );
        if (lastDist > 0) { cameraDistance /= d / lastDist; cameraDistance = Math.max(0.5, Math.min(500, cameraDistance)); }
        lastDist = d;
    }
}

// Animate
function animate() {
    requestAnimationFrame(animate);
    cameraTheta += (targetTheta - cameraTheta) * 0.12;
    cameraPhi += (targetPhi - cameraPhi) * 0.12;
    updateCameraPosition();
    if (currentModel && isAnimating) currentModel.rotation.y += 0.006;
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// UI Helpers
function setStatus(msg, type) {
    const el = document.getElementById('status-bar');
    el.textContent = msg;
    el.className = type || '';
}

function showProgress(pct) {
    const wrap = document.getElementById('progress-wrap');
    const bar = document.getElementById('progress-bar');
    if (pct === null) { wrap.classList.remove('visible'); return; }
    wrap.classList.add('visible');
    bar.style.width = pct + '%';
}

function showLoadingOverlay(visible, text) {
    const el = document.getElementById('loading-overlay');
    el.classList.toggle('visible', visible);
    if (text) document.getElementById('loading-text').textContent = text;
}

function showInfo(data) {
    const el = document.getElementById('model-info');
    const rows = document.getElementById('info-rows');
    rows.innerHTML = Object.entries(data).map(([k, v]) =>
        `<div class="info-row"><span class="info-key">${k}</span><span class="info-val">${v}</span></div>`
    ).join('');
    el.classList.add('visible');
}

function hideInfo() {
    document.getElementById('model-info').classList.remove('visible');
}

window.togglePanel = function () {
    document.body.classList.toggle('panel-hidden');
};

init();