export const Content = {
    components: `
    <div class="controls">
        <h3 style="margin: 0 0 10px 0;">DAE Model Loader</h3>

        <div id="control-label">Model Path:</div>
        <input type="text" id="modelPath" class="path-input" value="./model.dae" placeholder="Enter path to .dae file">

        <div style="margin: 10px 0;">
            <button id="loadModelBtn">Load Model</button>
            <button id="loadSampleBtn">Load Sample</button>
        </div>

        <div>
            <button id="toggleWireframeBtn">Wireframe</button>
            <button id="toggleAnimationBtn">Auto Rotate</button>
            <button id="resetViewBtn">Reset View</button>
        </div>

        <div class="status" id="status">Ready to load model</div>

        <div style="margin-top: 10px; font-size: 10px; opacity: 0.6;" id="help-text">
            <div>• Drag mouse to orbit camera</div>
            <div>• Shift + Drag to pan view</div>
            <div>• Scroll to zoom</div>
            <div>• Put .dae file in same folder</div>
        </div>
    </div>
  `,
}