export const Content = {
    components: `
    <div id="canvas-container"></div>

    <button id="toggle-panel" onclick="togglePanel()">Panel</button>

    <!-- Loading overlay -->
    <div id="loading-overlay">
        <div class="spinner"></div>
        <div class="loading-text" id="loading-text">Loading model…</div>
    </div>

    <!-- Side Panel -->
    <div id="panel">
        <div id="panel-header">
            <h1>3D Model Viewer</h1>
            <p>OBJ · MTL · DAE · Textures</p>
        </div>

        <div id="panel-body">

            <!-- Drop Zone -->
            <div>
                <div class="section-label">Load Files</div>
                <div id="drop-zone">
                    <input type="file" id="file-input" multiple
                        accept=".obj,.mtl,.dae,.png,.jpg,.jpeg,.bmp,.tga,.webp,.gif">
                    <div class="drop-icon">⬆</div>
                    <div class="drop-title">Drop files here</div>
                    <div class="drop-hint">OBJ + MTL + Textures<br>or single DAE / Collada</div>
                </div>
            </div>

            <!-- File List -->
            <div id="file-list-section" style="display:none">
                <div class="section-label">Loaded Files</div>
                <div id="file-list"></div>
            </div>

            <!-- Load / Sample Buttons -->
            <div class="btn-row">
                <button class="btn primary" id="loadBtn" onclick="loadFiles()" disabled>Load Model</button>
                <button class="btn" onclick="loadSample()">Sample</button>
            </div>

            <!-- Progress -->
            <div id="progress-wrap">
                <div id="progress-bar"></div>
            </div>

            <!-- Status -->
            <div id="status-bar">Ready — drop files or load sample</div>

            <!-- View Controls -->
            <div>
                <div class="section-label">View</div>
                <div class="btn-row">
                    <button class="btn" id="wireframeBtn" onclick="toggleWireframe()">Wireframe</button>
                    <button class="btn" id="animBtn" onclick="toggleAnimation()">Auto Rotate</button>
                </div>
                <div class="btn-row" style="margin-top:6px">
                    <button class="btn" onclick="resetView()">Reset View</button>
                    <button class="btn" onclick="clearScene()">Clear</button>
                </div>
            </div>

            <!-- Model Info -->
            <div id="model-info">
                <div class="section-label">Model Info</div>
                <div id="info-rows"></div>
            </div>

            <!-- Controls hint -->
            <div id="controls-hint">
                Drag — Orbit &nbsp;|&nbsp; Shift+Drag — Pan<br>
                Scroll — Zoom &nbsp;|&nbsp; Touch — Pinch zoom
            </div>

        </div>
    </div>
  `,
}