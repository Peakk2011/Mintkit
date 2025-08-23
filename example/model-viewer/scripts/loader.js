// Import ColladaLoader
import { ColladaLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/ColladaLoader.js';

let scene, camera, renderer;
let currentModel = null;
let isAnimating = false;
let isWireframe = false;

// Camera orbit controls
let mouseDown = false;
let mouseX = 0, mouseY = 0;
let cameraDistance = 15;
let cameraTheta = 0;      // horizontal angle
let cameraPhi = Math.PI / 4; // 45 degrees - better starting angle
let targetTheta = 0, targetPhi = Math.PI / 4;
let isPanning = false;
let panTarget = new THREE.Vector3(0, 3, 0);

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1f1f1f);
    scene.fog = new THREE.Fog(0x1f1f1f, 10, 50);

    // Camera
    camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 1000); // FOV 80
    updateCameraPosition();

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(20, 20, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x4444ff, 0.5, 50);
    pointLight.position.set(-10, 10, -10);
    scene.add(pointLight);

    // Ground plane at Y=0
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshLambertMaterial({
        color: 0x2a2a2a,
        transparent: true,
        opacity: 0.7
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Grid at Y=0
    const gridHelper = new THREE.GridHelper(100, 50, 0x555555, 0x333333);
    gridHelper.position.y = 0.01; // Slightly above ground to avoid z-fighting
    scene.add(gridHelper);

    // Axes helper at origin
    const axesHelper = new THREE.AxesHelper(10);
    axesHelper.position.y = 0.02;
    scene.add(axesHelper);

    setupControls();
    animate();
}

function setupControls() {
    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('wheel', onMouseWheel);

    // Make functions global
    window.loadModel = loadModel;
    window.loadSample = loadSample;
    window.toggleWireframe = toggleWireframe;
    window.toggleAnimation = toggleAnimation;
    window.resetView = resetView;
}

function loadModel() {
    const path = document.getElementById('modelPath').value;
    if (!path.trim()) {
        updateStatus('Please enter a model path', 'error');
        return;
    }

    updateStatus('Loading model...', '');

    const loader = new ColladaLoader();

    loader.load(
        path,
        function (collada) {
            // Success
            if (currentModel) {
                scene.remove(currentModel);
            }

            currentModel = collada.scene;

            // Fix model orientation - rotate to normal position
            currentModel.rotation.x = -Math.PI / 2; // Rotate 90 degrees to fix upside down
            currentModel.rotation.y = 0;
            currentModel.rotation.z = 0;

            // Get bounding box after rotation
            const box = new THREE.Box3().setFromObject(currentModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const min = box.min;

            // Scale to reasonable viewport size (5-8 units)
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 0) {
                const targetSize = 0.3; // Good size for viewing
                const scale = targetSize / maxDim;
                currentModel.scale.setScalar(scale);
            }

            // Recalculate box after scaling
            box.setFromObject(currentModel);
            const finalCenter = box.getCenter(new THREE.Vector3());
            const finalMin = box.min;

            // Position model so its bottom sits on Y=0 and centered on XZ
            currentModel.position.set(
                -finalCenter.x,  // Center on X
                -finalMin.y,     // Bottom at Y=0  
                -finalCenter.z   // Center on Z
            );

            // Setup materials and shadows
            let meshCount = 0;
            currentModel.traverse((child) => {
                if (child.isMesh) {
                    meshCount++;
                    child.castShadow = true;
                    child.receiveShadow = true;

                    // Ensure material
                    if (!child.material) {
                        child.material = new THREE.MeshLambertMaterial({
                            color: 0x00ff00
                        });
                    }

                    // Convert to array if needed
                    if (!Array.isArray(child.material)) {
                        child.material = [child.material];
                    }

                    child.material.forEach(mat => {
                        if (mat) {
                            mat.side = THREE.DoubleSide;
                        }
                    });
                }
            });

            scene.add(currentModel);
            updateStatus(`Model loaded successfully! (${meshCount} meshes)`, 'success');
        },
        function (progress) {
            // Progress
            const percent = (progress.loaded / progress.total * 100).toFixed(1);
            updateStatus(`Loading... ${percent}%`, '');
        },
        function (error) {
            // Error
            console.error('Load error:', error);
            updateStatus(`Failed to load: ${error.message || 'Unknown error'}`, 'error');
        }
    );
}

function loadSample() {
    // Create a sample 3D object if no DAE available
    if (currentModel) {
        scene.remove(currentModel);
    }

    currentModel = new THREE.Group();

    // Create sample geometry
    const geometries = [
        new THREE.BoxGeometry(2, 2, 2),
        new THREE.SphereGeometry(1.5, 16, 16),
        new THREE.ConeGeometry(1, 3, 8),
        new THREE.CylinderGeometry(0.5, 1.5, 2, 8)
    ];

    const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];

    geometries.forEach((geom, i) => {
        const material = new THREE.MeshLambertMaterial({ color: colors[i] });
        const mesh = new THREE.Mesh(geom, material);
        mesh.position.x = (i - 1.5) * 4;
        mesh.position.y = Math.sin(i) * 2;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        currentModel.add(mesh);
    });

    scene.add(currentModel);
    updateStatus('Sample model loaded', 'success');
}

function toggleWireframe() {
    isWireframe = !isWireframe;
    if (currentModel) {
        currentModel.traverse((child) => {
            if (child.isMesh && child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.wireframe = isWireframe);
                } else {
                    child.material.wireframe = isWireframe;
                }
            }
        });
    }
}

function toggleAnimation() {
    isAnimating = !isAnimating;
}

function resetView() {
    cameraDistance = 15; // Good viewing distance
    cameraTheta = 0;
    cameraPhi = Math.PI / 4; // 45 degrees
    targetTheta = 0;
    targetPhi = Math.PI / 4;
    panTarget.set(0, 3, 0); // Focus at model center height
    updateCameraPosition();
}

function updateCameraPosition() {
    // Spherical coordinates to cartesian
    const x = cameraDistance * Math.sin(cameraPhi) * Math.cos(cameraTheta);
    const y = cameraDistance * Math.cos(cameraPhi);
    const z = cameraDistance * Math.sin(cameraPhi) * Math.sin(cameraTheta);

    camera.position.set(x, y, z);
    camera.position.add(panTarget);
    camera.lookAt(panTarget);
}

function updateStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Mouse controls - Orbit Camera
function onMouseDown(event) {
    event.preventDefault();
    mouseDown = true;
    isPanning = event.shiftKey;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseMove(event) {
    event.preventDefault();
    if (!mouseDown) return;

    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;

    if (isPanning) {
        // Pan camera (move target point)
        const panSpeed = 0.005;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3();

        camera.getWorldDirection(new THREE.Vector3());
        right.setFromMatrixColumn(camera.matrixWorld, 0);
        up.setFromMatrixColumn(camera.matrixWorld, 1);

        panTarget.add(right.multiplyScalar(-deltaX * panSpeed * cameraDistance * 0.1));
        panTarget.add(up.multiplyScalar(deltaY * panSpeed * cameraDistance * 0.1));
    } else {
        // Orbit camera - fixed direction
        targetTheta += deltaX * 0.005; // Reduced sensitivity
        targetPhi = Math.max(0.1, Math.min(Math.PI - 0.1, targetPhi + deltaY * 0.005));
    }

    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseUp(event) {
    event.preventDefault();
    mouseDown = false;
    isPanning = false;
}

function onMouseWheel(event) {
    event.preventDefault();
    const zoomSpeed = event.deltaY > 0 ? 1.1 : 0.9;
    cameraDistance *= zoomSpeed;
    cameraDistance = Math.max(3, Math.min(100, cameraDistance));
}

function animate() {
    requestAnimationFrame(animate);

    // Smooth camera orbit with reduced bounce
    cameraTheta += (targetTheta - cameraTheta) * 0.15; // Increased smoothing
    cameraPhi += (targetPhi - cameraPhi) * 0.15;

    updateCameraPosition();

    // Auto rotate model if enabled
    if (currentModel && isAnimating) {
        currentModel.rotation.y += 0.008; // Slightly slower
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize);
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loadModelBtn').addEventListener('click', loadModel);
    document.getElementById('loadSampleBtn').addEventListener('click', loadSample);
    document.getElementById('toggleWireframeBtn').addEventListener('click', toggleWireframe);
    document.getElementById('toggleAnimationBtn').addEventListener('click', toggleAnimation);
    document.getElementById('resetViewBtn').addEventListener('click', resetView);
});
init();