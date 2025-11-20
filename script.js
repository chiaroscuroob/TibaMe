// ================= CONFIG =================
const API_KEY = "AIzaSyC6Bqdd4k4h_8yTmdGO9S9qWp_rz8DDPv8"; // ★請在此填入您的 Google Gemini API Key★

// ================= STATE =================
const state = {
    productImage: null,
    refImage: null,
    productName: "",
    bgSourceMode: 'upload',
    uploadSubMode: 'composite',
    selectedPreset: 0,
    customPrompt: "",
    isLoading: false,
    isAnalyzing: false,
    generatedImage: null,
    variations: []
};

const SCENE_PRESETS = [
    { name: '極簡攝影棚', desc: '純淨光影，專業打光', icon: 'camera', prompt: "Professional studio photography. Clean, minimal white or light grey background. Soft diffused lighting from above. Sharp focus, 8k resolution, highly detailed texture." },
    { name: '溫暖木質', desc: '居家氛圍，自然窗光', icon: 'box', prompt: "Beautiful light oak wooden surface. Warm natural sunlight streaming from a window. Sharp product focus with creamy bokeh background. Cozy home atmosphere." },
    { name: '奢華大理石', desc: '高級冷調，表面反光', icon: 'layout', prompt: "Luxurious white marble countertop. Elegant setting. Bright, crisp soft lighting. Realistic reflections on the surface. Premium lifestyle vibe." },
    { name: '現代咖啡廳', desc: '時尚散景，悠閒感', icon: 'coffee', prompt: "Stylish wooden table in a modern cafe. Blurred bokeh lights in background. Warm inviting atmosphere. Photorealistic food photography style." },
    { name: '鄉村廚房', desc: '手作感，亞麻與香草', icon: 'utensils', prompt: "Rustic wooden cutting board in a cozy farmhouse kitchen. Soft natural window light. Linen and herbs props. High texture detail." },
    { name: '戶外花園', desc: '清新自然，明亮陽光', icon: 'leaf', prompt: "Picnic blanket in a sunny garden. Blurred greenery background. Bright natural sunlight. Fresh atmosphere. Sharp details." }
];

const VARIATION_ANGLES = [
    { label: "完全俯視 (Flat Lay)", instruction: "STRICT 90° OVERHEAD VIEW (ORTHOGRAPHIC). \nCRITICAL RULE: ELIMINATE ALL PERSPECTIVE DEPTH. Do not create a room or horizon. Treat the reference image's ground (e.g. sand, wood) as a FLAT 2D TEXTURE PATTERN (like a wallpaper or texture scan). The product must lay flat on this infinite texture. NO VANISHING POINT." },
    { label: "平視 (Eye Level)", instruction: "STRAIGHT-ON EYE-LEVEL VIEW (0°). Lower the camera to the product's base height. The background surface should look like a flat horizontal line supporting the product. Perfect horizon alignment." },
    { label: "45度側拍 (Classic)", instruction: "NATURAL 45° PRODUCT ANGLE. Ensure REALISTIC SCALE and DEPTH. Show the surface receding into the distance behind the product. Standard e-commerce perspective with sharp focus." },
    { label: "側面特寫 (Detail)", instruction: "CLOSE-UP SIDE PROFILE (Detail Shot). Zoom in on the product. Use a SHALLOW DEPTH OF FIELD (f/2.8) to significantly BLUR the background into soft bokeh. Focus strictly on the product's texture and details." }
];

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
    // 綁定 DOM 元素
    const els = {
        productInput: document.getElementById('product-input'),
        productUploadArea: document.getElementById('product-upload-area'),
        productPlaceholder: document.getElementById('product-placeholder'),
        productPreviewContainer: document.getElementById('product-preview-container'),
        productImg: document.getElementById('product-img'),
        productAnalysisOverlay: document.getElementById('product-analysis-overlay'),
        clearProductBtn: document.getElementById('clear-product-btn'),
        productName: document.getElementById('product-name'),
        productSuggestions: document.getElementById('product-suggestions'),
        
        modeUploadBtn: document.getElementById('mode-upload-btn'),
        modePresetBtn: document.getElementById('mode-preset-btn'),
        
        uploadModeContent: document.getElementById('upload-mode-content'),
        presetModeContent: document.getElementById('preset-mode-content'),
        
        refInput: document.getElementById('ref-input'),
        refUploadArea: document.getElementById('ref-upload-area'),
        refPlaceholder: document.getElementById('ref-placeholder'),
        refPreviewContainer: document.getElementById('ref-preview-container'),
        refImg: document.getElementById('ref-img'),
        clearRefBtn: document.getElementById('clear-ref-btn'),
        
        uploadSubmodeContainer: document.getElementById('upload-submode-container'),
        submodeCompositeBtn: document.getElementById('submode-composite-btn'),
        submodeCompositionBtn: document.getElementById('submode-composition-btn'),
        submodeDesc: document.getElementById('submode-desc'),
        
        customPrompt: document.getElementById('custom-prompt'),
        generateBtn: document.getElementById('generate-btn'),
        generateBtnText: document.getElementById('generate-btn-text'),
        errorMsg: document.getElementById('error-msg'),
        
        previewEmpty: document.getElementById('preview-empty'),
        previewLoading: document.getElementById('preview-loading'),
        mainResultImg: document.getElementById('main-result-img'),
        previewTitle: document.getElementById('preview-title'),
        downloadMainBtn: document.getElementById('download-main-btn'),
        
        variationsSection: document.getElementById('variations-section'),
        variationsGrid: document.getElementById('variations-grid')
    };

    // 初始化 UI
    renderPresets();
    updateUI();
    if (window.lucide) window.lucide.createIcons();

    // ================= EVENT LISTENERS =================
    
    // 1. 商品圖上傳
    els.productUploadArea.addEventListener('click', () => els.productInput.click());
    els.productInput.addEventListener('change', (e) => handleFile(e, 'product'));
    els.clearProductBtn.addEventListener('click', (e) => { e.stopPropagation(); clearFile('product'); });
    els.productName.addEventListener('input', (e) => { state.productName = e.target.value; });

    // 2. 參考圖上傳 (關鍵修復)
    els.refUploadArea.addEventListener('click', () => els.refInput.click());
    els.refInput.addEventListener('change', (e) => handleFile(e, 'ref'));
    els.clearRefBtn.addEventListener('click', (e) => { e.stopPropagation(); clearFile('ref'); });

    // 3. 模式切換
    els.modeUploadBtn.addEventListener('click', () => { state.bgSourceMode = 'upload'; updateUI(); });
    els.modePresetBtn.addEventListener('click', () => { state.bgSourceMode = 'preset'; updateUI(); });
    els.submodeCompositeBtn.addEventListener('click', () => { state.uploadSubMode = 'composite'; updateUI(); });
    els.submodeCompositionBtn.addEventListener('click', () => { state.uploadSubMode = 'composition'; updateUI(); });

    // 4. 生成與提示詞
    els.generateBtn.addEventListener('click', generateAll);
    els.customPrompt.addEventListener('input', (e) => { state.customPrompt = e.target.value; });

    // ================= FUNCTIONS =================

    function updateUI() {
        // 模式切換顯示
        if (state.bgSourceMode === 'upload') {
            els.modeUploadBtn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all bg-white text-zinc-900 shadow-sm";
            els.modePresetBtn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all text-zinc-500 hover:text-zinc-700";
            els.uploadModeContent.classList.remove('hidden');
            els.presetModeContent.classList.add('hidden');
            els.customPrompt.placeholder = "例如: 增加一點桌面反光，讓畫面亮一點...";
        } else {
            els.modeUploadBtn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all text-zinc-500 hover:text-zinc-700";
            els.modePresetBtn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all bg-white text-zinc-900 shadow-sm";
            els.uploadModeContent.classList.add('hidden');
            els.presetModeContent.classList.remove('hidden');
            els.customPrompt.placeholder = "或輸入自定義場景描述...";
        }

        // 商品圖預覽
        if (state.productImage) {
            els.productPlaceholder.classList.add('hidden');
            els.productPreviewContainer.classList.remove('hidden');
            els.productImg.src = state.productImage;
            els.clearProductBtn.classList.remove('hidden');
        } else {
            els.productPlaceholder.classList.remove('hidden');
            els.productPreviewContainer.classList.add('hidden');
            els.productImg.src = "";
            els.clearProductBtn.classList.add('hidden');
        }

        // 參考圖預覽 (★修正處：只切換 placeholder 顯示，不隱藏父層★)
        if (state.refImage) {
            els.refPlaceholder.classList.add('hidden'); 
            els.refPreviewContainer.classList.remove('hidden');
            els.uploadSubmodeContainer.classList.remove('hidden');
            els.refImg.src = state.refImage;
        } else {
            els.refPlaceholder.classList.remove('hidden');
            els.refPreviewContainer.classList.add('hidden');
            els.uploadSubmodeContainer.classList.add('hidden');
        }

        // 子模式按鈕樣式
        const activeSub = "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-[10px] font-medium transition-all border bg-indigo-600 text-white border-indigo-600 shadow-sm";
        const inactiveSub = "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-[10px] font-medium transition-all border bg-white text-zinc-500 border-zinc-200 hover:border-indigo-300";
        
        if (state.uploadSubMode === 'composite') {
            els.submodeCompositeBtn.className = activeSub;
            els.submodeCompositionBtn.className = inactiveSub;
            els.submodeDesc.innerText = "• 適合空景照片。AI 會保留照片中的桌子/空間，直接把商品放進去。";
        } else {
            els.submodeCompositeBtn.className = inactiveSub;
            els.submodeCompositionBtn.className = activeSub;
            els.submodeDesc.innerText = "• 適合有雜物的照片。AI 會將照片當作「構圖模版」，移除中間物體並填入您的商品。";
        }

        // 生成按鈕狀態
        const canGenerate = state.productImage && (state.bgSourceMode === 'preset' || (state.bgSourceMode === 'upload' && state.refImage)) && !state.isLoading;
        els.generateBtn.disabled = !canGenerate;
        if (canGenerate) {
            els.generateBtn.classList.replace('bg-zinc-100', 'bg-zinc-900');
            els.generateBtn.classList.replace('text-zinc-400', 'text-white');
            els.generateBtn.classList.remove('cursor-not-allowed');
            els.generateBtn.classList.add('hover:bg-zinc-800');
        } else {
            els.generateBtn.classList.replace('bg-zinc-900', 'bg-zinc-100');
            els.generateBtn.classList.replace('text-white', 'text-zinc-400');
            els.generateBtn.classList.add('cursor-not-allowed');
            els.generateBtn.classList.remove('hover:bg-zinc-800');
        }

        // 按鈕文字
        if (state.bgSourceMode === 'upload') {
            els.generateBtnText.innerText = state.uploadSubMode === 'composite' ? "合成至背景 + 4視角" : "替換主體 + 4視角";
            els.previewTitle.innerText = state.uploadSubMode === 'composite' ? "Composite Result" : "Swap Result";
        } else {
            els.generateBtnText.innerText = "生成預設場景 + 4視角";
            els.previewTitle.innerText = "AI Generated Result";
        }

        // Loading 狀態
        if (state.isLoading) {
            els.generateBtnText.innerText = "AI 運算中...";
            els.previewEmpty.classList.add('hidden');
            els.previewLoading.classList.remove('hidden');
            els.mainResultImg.classList.add('hidden');
        } else if (state.generatedImage) {
            els.generateBtnText.innerText = "重新生成";
            els.previewEmpty.classList.add('hidden');
            els.previewLoading.classList.add('hidden');
            els.mainResultImg.classList.remove('hidden');
            els.mainResultImg.src = state.generatedImage;
            els.downloadMainBtn.classList.remove('hidden');
            els.downloadMainBtn.onclick = () => downloadImage(state.generatedImage, 'main-scene.png');
            renderVariations(els);
        }

        if (state.isAnalyzing) els.productAnalysisOverlay.classList.remove('hidden');
        else els.productAnalysisOverlay.classList.add('hidden');

        if (window.lucide) window.lucide.createIcons();
    }

    function renderPresets() {
        els.presetModeContent.innerHTML = SCENE_PRESETS.map((preset, idx) => `
            <div onclick="window.selectPreset(${idx})" class="cursor-pointer rounded-xl border transition-all duration-200 p-3 flex flex-col gap-2 ${state.selectedPreset === idx ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm text-zinc-600'}">
                <div class="flex items-center gap-2">
                    <i data-lucide="${preset.icon}" class="w-4 h-4"></i>
                    <span class="text-xs font-bold truncate">${preset.name}</span>
                </div>
                <p class="text-[10px] leading-tight ${state.selectedPreset === idx ? 'text-zinc-300' : 'text-zinc-400'}">${preset.desc}</p>
            </div>
        `).join('');
    }

    window.selectPreset = (idx) => {
        state.selectedPreset = idx;
        renderPresets();
        updateUI();
    };

    function handleFile(e, type) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'product') {
                    state.productImage = reader.result;
                    state.generatedImage = null;
                    state.variations = [];
                    state.productName = "";
                    analyzeProductImage(state.productImage, els);
                } else {
                    state.refImage = reader.result;
                }
                updateUI();
            };
            reader.readAsDataURL(file);
        }
    }

    function clearFile(type) {
        if (type === 'product') {
            state.productImage = null;
            state.productName = "";
            state.generatedImage = null;
            els.productSuggestions.innerHTML = "";
        } else {
            state.refImage = null;
        }
        updateUI();
    }

    async function analyzeProductImage(base64, els) {
        state.isAnalyzing = true;
        updateUI();
        try {
            const base64Data = base64.split(',')[1];
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [
                            { text: "Identify the main product in this image. Provide 3 short, concise labels for it in Traditional Chinese. Return ONLY the 3 labels separated by commas." },
                            { inlineData: { mimeType: "image/png", data: base64Data } }
                        ]
                    }]
                })
            });
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if(text) {
                const suggestions = text.split(/[,，、\n]/).map(s => s.trim()).filter(s => s.length > 0).slice(0, 3);
                els.productSuggestions.innerHTML = suggestions.map(s => 
                    `<button onclick="window.setProductName('${s}')" class="flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] hover:bg-indigo-100 transition-colors"><i data-lucide="sparkle" class="w-2.5 h-2.5"></i>${s}</button>`
                ).join('');
                if (window.lucide) window.lucide.createIcons();
            }
        } catch (e) { console.error(e); }
        state.isAnalyzing = false;
        updateUI();
    }

    window.setProductName = (name) => {
        state.productName = name;
        els.productName.value = name;
    };

    async function generateAll() {
        state.isLoading = true;
        state.generatedImage = null;
        state.variations = [];
        els.errorMsg.classList.add('hidden');
        updateUI();

        const productBase64 = state.productImage.split(',')[1];
        const refBase64 = (state.bgSourceMode === 'upload' && state.refImage) ? state.refImage.split(',')[1] : null;
        const preset = SCENE_PRESETS[state.selectedPreset];
        const subjectLabel = state.productName.trim() ? `the ${state.productName}` : "the product object from Image 1";
        const qualityPrompt = "OUTPUT QUALITY: Photorealistic, 8k resolution, sharp focus, highly detailed texture. NO BLUR. NO ARTIFACTS.";

        let mainInstruction = "";
        if (state.bgSourceMode === 'upload' && refBase64) {
            if (state.uploadSubMode === 'composite') {
                mainInstruction = `TASK: High-Fidelity Composite of ${subjectLabel}.\n1. BACKGROUND: Use Image 2 exactly as is.\n2. SUBJECT: Insert ${subjectLabel} into Image 2.\n3. RELIGHTING: Re-light the product to match the lighting direction.\n4. SHADOWS: Generate deep, realistic contact shadows.\n5. NO CROPPING.\n${qualityPrompt}`;
            } else {
                mainInstruction = `TASK: High-Quality Object Swap.\nGOAL: Replace the central object in Image 2 with ${subjectLabel} from Image 1.\n1. SUBJECT: ${subjectLabel} is the ONLY hero.\n2. ERASE REFERENCE: Remove the object in Image 2.\n3. INSERT HERO: Place ${subjectLabel} there.\n4. INTEGRATION: Copy lighting and shadows.\n5. NEGATIVE PROMPT: Do not include the original object from Image 2.\n${qualityPrompt}`;
            }
        } else {
            mainInstruction = `TASK: Professional Product Photography of ${subjectLabel}.\n1. GENERATE a background that aligns with the product's angle using style: "${preset.name}".\n2. Description: ${preset.prompt}\n3. LIGHTING: Studio-quality lighting.\n${qualityPrompt}`;
        }
        if (state.customPrompt) mainInstruction += `\nADDITIONAL: ${state.customPrompt}`;

        try {
            const mainUrl = await callGemini(mainInstruction, productBase64, refBase64, 0.25);
            state.generatedImage = mainUrl;
            state.isLoading = false;
            updateUI();

            VARIATION_ANGLES.forEach(async (angle) => {
                let varPrompt = "";
                if (state.bgSourceMode === 'upload' && refBase64) {
                    if (state.uploadSubMode === 'composite') {
                        varPrompt = `TASK: RE-IMAGINE the scene from a NEW ANGLE: ${angle.label}\n1. Source: Texture from Image 2.\n2. SUBJECT: ${subjectLabel}.\n3. RE-GEOMETRY: Re-draw background to match ${angle.label}.\n4. ${angle.instruction}\n${qualityPrompt}`;
                    } else {
                        varPrompt = `TASK: Create a product photo of ${subjectLabel} (from Image 1).\nSTRICT: You MUST draw ${subjectLabel}.\nFORBIDDEN: DO NOT draw the object from Image 2.\nTEXTURE ONLY: Extract ONLY the ground texture from Image 2.\nFORCE ANGLE: ${angle.instruction}\n${qualityPrompt}`;
                    }
                } else {
                    varPrompt = `TASK: Create a product photo of ${subjectLabel} from angle: ${angle.label}\n1. FORCE ANGLE: ${angle.instruction}\n2. Background Style: ${preset.name}\n${qualityPrompt}`;
                }

                try {
                    const varUrl = await callGemini(varPrompt, productBase64, refBase64, 0.55);
                    state.variations.push({ label: angle.label, url: varUrl });
                    renderVariations(els);
                } catch(e) { console.error(e); }
            });

        } catch (e) {
            state.isLoading = false;
            els.errorMsg.innerText = "生成失敗，請稍後再試。";
            els.errorMsg.classList.remove('hidden');
            updateUI();
        }
    }

    async function callGemini(prompt, img1, img2, temp) {
        const parts = [{ text: prompt }, { inlineData: { mimeType: "image/png", data: img1 } }];
        if (img2) parts.push({ inlineData: { mimeType: "image/png", data: img2 } });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts }],
                generationConfig: { responseModalities: ["IMAGE"], temperature: temp }
            })
        });
        const result = await response.json();
        const b64 = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
        if (!b64) throw new Error("No image");
        return `data:image/png;base64,${b64}`;
    }

    function renderVariations(els) {
        if (state.variations.length > 0) els.variationsSection.classList.remove('hidden');
        els.variationsGrid.innerHTML = state.variations.map((v, i) => `
            <div class="group relative bg-white border-2 border-zinc-100 hover:border-zinc-300 rounded-xl overflow-hidden cursor-pointer transition-all" onclick="window.viewVariation('${v.url}')">
                <div class="aspect-[4/3] overflow-hidden bg-zinc-50 flex items-center justify-center relative">
                    <img src="${v.url}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105">
                    <button onclick="event.stopPropagation(); window.downloadImage('${v.url}', 'var-${i}.png')" class="absolute top-2 right-2 p-2 bg-white/90 rounded-lg shadow hover:bg-zinc-200 transition-colors opacity-0 group-hover:opacity-100"><i data-lucide="download" class="w-4 h-4"></i></button>
                </div>
                <div class="p-3 bg-white border-t border-zinc-100">
                    <span class="text-xs font-bold text-zinc-800">${v.label}</span>
                    <span class="text-[10px] text-zinc-500 block mt-0.5">AI Re-rendered</span>
                </div>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    window.viewVariation = (url) => {
        state.generatedImage = url;
        // Re-find elements because this is outside DOMContentLoaded scope if not careful, 
        // but here we rely on the closure if we move it inside, or just re-query.
        // Actually, let's just re-trigger updateUI by passing a dummy state change or calling it.
        // But updateUI is inside the scope. 
        // Simplest fix: just update the image directly.
        const img = document.getElementById('main-result-img');
        const loading = document.getElementById('preview-loading');
        const empty = document.getElementById('preview-empty');
        const dlBtn = document.getElementById('download-main-btn');
        
        img.src = url;
        img.classList.remove('hidden');
        loading.classList.add('hidden');
        empty.classList.add('hidden');
        dlBtn.classList.remove('hidden');
        dlBtn.onclick = () => window.downloadImage(url, 'main-scene.png');
    };

    window.downloadImage = (url, name) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
    };
});

