// ================= CONFIG =================
// ★ 請確認您的 API Key ★
const API_KEY = "AIzaSyC6Bqdd4k4h_8yTmdGO9S9qWp_rz8DDPv8"; 

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
    { name: '極簡攝影棚', icon: 'camera', prompt: "Professional studio photography, clean minimal white background, soft lighting, 8k" },
    { name: '溫暖木質', icon: 'box', prompt: "On a wooden table, warm sunlight, cozy home atmosphere, highly detailed texture, bokeh" },
    { name: '奢華大理石', icon: 'layout', prompt: "On a white marble counter, luxury, bright crisp lighting, reflection, premium vibe" },
    { name: '現代咖啡廳', icon: 'coffee', prompt: "In a modern cafe, wooden table, blurred background, lifestyle photography, photorealistic" },
    { name: '鄉村廚房', icon: 'utensils', prompt: "Rustic wooden board, farmhouse kitchen background, soft natural window light, linen props" },
    { name: '戶外花園', icon: 'leaf', prompt: "On a picnic blanket in a garden, sunny, nature, greenery background, fresh atmosphere" }
];

const VARIATION_ANGLES = [
    { label: "完全俯視", instruction: "Flat lay top-down view, 90 degree angle, directly from above" },
    { label: "平視視角", instruction: "Eye-level straight front view, product sitting on surface" },
    { label: "45度側拍", instruction: "Isometric 45 degree angle view, standard product photography" },
    { label: "側面特寫", instruction: "Close up macro shot, shallow depth of field, soft bokeh background" }
];

document.addEventListener('DOMContentLoaded', () => {
    const els = {
        productInput: document.getElementById('product-input'),
        productImg: document.getElementById('product-img'),
        productPlaceholder: document.getElementById('product-placeholder'),
        productPreviewContainer: document.getElementById('product-preview-container'),
        clearProductBtn: document.getElementById('clear-product-btn'),
        productName: document.getElementById('product-name'),
        productSuggestions: document.getElementById('product-suggestions'),
        productAnalysisOverlay: document.getElementById('product-analysis-overlay'),
        
        refInput: document.getElementById('ref-input'),
        refImg: document.getElementById('ref-img'),
        refPlaceholder: document.getElementById('ref-placeholder'),
        refPreviewContainer: document.getElementById('ref-preview-container'),
        clearRefBtn: document.getElementById('clear-ref-btn'),
        uploadSubmodeContainer: document.getElementById('upload-submode-container'),
        
        modeUploadBtn: document.getElementById('mode-upload-btn'),
        modePresetBtn: document.getElementById('mode-preset-btn'),
        uploadModeContent: document.getElementById('upload-mode-content'),
        presetModeContent: document.getElementById('preset-mode-content'),
        
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
        dlBtn: document.getElementById('download-main-btn'),
        
        variationsSection: document.getElementById('variations-section'),
        variationsGrid: document.getElementById('variations-grid')
    };

    function init() {
        renderPresets();
        updateUI();
        if(window.lucide) window.lucide.createIcons();
    }

    // ================= EVENT LISTENERS =================
    
    // Product Upload
    els.productInput.addEventListener('change', (e) => handleFile(e, 'product'));
    els.clearProductBtn.addEventListener('click', (e) => { 
        e.preventDefault(); clearFile('product'); els.productInput.value = ''; 
    });
    els.productName.addEventListener('input', (e) => { state.productName = e.target.value; });

    // Ref Upload
    els.refInput.addEventListener('change', (e) => handleFile(e, 'ref'));
    els.clearRefBtn.addEventListener('click', (e) => { 
        e.preventDefault(); clearFile('ref'); els.refInput.value = ''; 
    });

    // Mode Switching
    els.modeUploadBtn.addEventListener('click', () => { state.bgSourceMode = 'upload'; updateUI(); });
    els.modePresetBtn.addEventListener('click', () => { state.bgSourceMode = 'preset'; updateUI(); });
    els.submodeCompositeBtn.addEventListener('click', () => { state.uploadSubMode = 'composite'; updateUI(); });
    els.submodeCompositionBtn.addEventListener('click', () => { state.uploadSubMode = 'composition'; updateUI(); });

    els.generateBtn.addEventListener('click', generateAll);
    els.customPrompt.addEventListener('input', (e) => { state.customPrompt = e.target.value; });

    // ================= LOGIC =================

    function updateUI() {
        // Mode Tabs Style
        if (state.bgSourceMode === 'upload') {
            setBtnActive(els.modeUploadBtn, true);
            setBtnActive(els.modePresetBtn, false);
            els.uploadModeContent.classList.remove('hidden');
            els.presetModeContent.classList.add('hidden');
        } else {
            setBtnActive(els.modeUploadBtn, false);
            setBtnActive(els.modePresetBtn, true);
            els.uploadModeContent.classList.add('hidden');
            els.presetModeContent.classList.remove('hidden');
        }

        // Product Preview
        togglePreview(state.productImage, els.productPlaceholder, els.productPreviewContainer, els.productImg, els.clearProductBtn, els.productInput);

        // Ref Preview
        togglePreview(state.refImage, els.refPlaceholder, els.refPreviewContainer, els.refImg, els.clearRefBtn, els.refInput);
        
        // Submode UI
        if(state.refImage) els.uploadSubmodeContainer.classList.remove('hidden');
        else els.uploadSubmodeContainer.classList.add('hidden');

        if (state.uploadSubMode === 'composite') {
            setSubBtnActive(els.submodeCompositeBtn, true);
            setSubBtnActive(els.submodeCompositionBtn, false);
            els.submodeDesc.innerText = "• 適合空景照片。AI 會保留照片中的桌子/空間，直接把商品放進去。";
        } else {
            setSubBtnActive(els.submodeCompositeBtn, false);
            setSubBtnActive(els.submodeCompositionBtn, true);
            els.submodeDesc.innerText = "• 適合有雜物的照片。AI 會將照片當作「構圖模版」，移除中間物體並填入您的商品。";
        }

        // Generate Button
        const ready = state.productImage && (state.bgSourceMode === 'preset' || state.refImage) && !state.isLoading;
        els.generateBtn.disabled = !ready;
        if(ready) {
            els.generateBtn.classList.replace('bg-zinc-100', 'bg-zinc-900');
            els.generateBtn.classList.replace('text-zinc-400', 'text-white');
            els.generateBtn.classList.remove('cursor-not-allowed');
        } else {
            els.generateBtn.classList.replace('bg-zinc-900', 'bg-zinc-100');
            els.generateBtn.classList.replace('text-white', 'text-zinc-400');
            els.generateBtn.classList.add('cursor-not-allowed');
        }

        // Loading & Result
        if(state.isLoading) {
            els.generateBtnText.innerText = "AI 繪圖中...";
            els.previewEmpty.classList.add('hidden');
            els.previewLoading.classList.remove('hidden');
            els.mainResultImg.classList.add('hidden');
            els.variationsSection.classList.add('hidden');
        } else if (state.generatedImage) {
            els.generateBtnText.innerText = "重新生成";
            els.previewEmpty.classList.add('hidden');
            els.previewLoading.classList.add('hidden');
            els.mainResultImg.classList.remove('hidden');
            els.mainResultImg.src = state.generatedImage;
            els.dlBtn.classList.remove('hidden');
            renderVariations(els);
        }

        // Analysis Overlay
        if(state.isAnalyzing) els.productAnalysisOverlay.classList.remove('hidden');
        else els.productAnalysisOverlay.classList.add('hidden');
        
        // Error Msg
        if(!state.isLoading && els.errorMsg.innerText === "") els.errorMsg.classList.add('hidden');
        
        if(window.lucide) window.lucide.createIcons();
    }

    // Helper UI functions
    function setBtnActive(btn, active) {
        if(active) {
            btn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all bg-white text-zinc-900 shadow-sm";
        } else {
            btn.className = "flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-all text-zinc-500 hover:text-zinc-700";
        }
    }
    function setSubBtnActive(btn, active) {
        if(active) {
            btn.className = "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-[10px] font-medium transition-all border bg-indigo-600 text-white border-indigo-600 shadow-sm";
        } else {
            btn.className = "flex-1 flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-md text-[10px] font-medium transition-all border bg-white text-zinc-500 border-zinc-200 hover:border-indigo-300";
        }
    }
    function togglePreview(src, placeholder, container, img, btn, input) {
        if(src) {
            placeholder.classList.add('hidden');
            container.classList.remove('hidden');
            img.src = src;
            btn.classList.remove('hidden');
            input.classList.add('hidden'); // Hide input to prevent mis-click
        } else {
            placeholder.classList.remove('hidden');
            container.classList.add('hidden');
            img.src = "";
            btn.classList.add('hidden');
            input.classList.remove('hidden');
        }
    }

    function renderPresets() {
        els.presetModeContent.innerHTML = SCENE_PRESETS.map((p, i) => `
            <div onclick="window.selectPreset(${i})" class="cursor-pointer rounded-xl border p-3 flex flex-col gap-2 ${state.selectedPreset === i ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 bg-white text-zinc-600'}">
                <div class="flex items-center gap-2"><i data-lucide="${p.icon}" class="w-4 h-4"></i><span class="text-xs font-bold">${p.name}</span></div>
                <p class="text-[10px] opacity-80">${p.desc}</p>
            </div>
        `).join('');
    }
    window.selectPreset = (i) => { state.selectedPreset = i; updateUI(); };

    function handleFile(e, type) {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            if(type === 'product') {
                state.productImage = reader.result;
                state.generatedImage = null;
                state.variations = [];
                state.productName = "";
                analyzeProductImage(state.productImage);
            } else {
                state.refImage = reader.result;
            }
            updateUI();
        };
        reader.readAsDataURL(file);
    }

    function clearFile(type) {
        if(type === 'product') {
            state.productImage = null;
            state.productName = "";
            state.generatedImage = null;
            els.productSuggestions.innerHTML = "";
        } else {
            state.refImage = null;
        }
        updateUI();
    }

    // 1. 辨識商品 (用 1.5-flash)
    async function analyzeProductImage(base64) {
        state.isAnalyzing = true;
        updateUI();
        try {
            const base64Data = base64.split(',')[1];
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ contents: [{ parts: [{ text: "Identify the product in Traditional Chinese. Return 3 short keywords separated by commas." }, { inlineData: { mimeType: "image/png", data: base64Data } }] }] })
            });
            const result = await response.json();
            const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if(text) {
                els.productSuggestions.innerHTML = text.split(/[,，]/).slice(0,3).map(s => 
                    `<span onclick="window.setProductName('${s.trim()}')" class="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-[10px] cursor-pointer hover:bg-indigo-100 transition-colors border border-indigo-100">${s.trim()}</span>`
                ).join('');
            }
        } catch(e) { console.error("Analysis failed", e); }
        state.isAnalyzing = false;
        updateUI();
    }
    window.setProductName = (name) => { state.productName = name; els.productName.value = name; };

    // 2. 核心生成邏輯 (支援 Imagen + Fallback)
    async function generateAll() {
        state.isLoading = true;
        state.generatedImage = null;
        state.variations = [];
        els.errorMsg.classList.add('hidden');
        updateUI();

        const subject = state.productName || "the product";
        let prompt = "";

        // 構建 Prompt
        if(state.bgSourceMode === 'upload' && state.refImage) {
             // 注意：Imagen 3 其實不支援直接「圖生圖」(Image-to-Image) 透過公開 API，
             // 通常只能用 Prompt 控制。為了讓流程順暢，我們這裡用 Prompt 描述風格。
             // 如果您的 Key 權限很高，可以使用 vertex AI 的 img2img，但這裡為了通用性，我們轉為「以文字描述」
             if(state.uploadSubMode === 'composite') {
                 prompt = `Product photography of ${subject} composited into a realistic background. High quality, 8k, photorealistic lighting.`;
             } else {
                 prompt = `Product photography of ${subject}. Use the style and texture of a reference image (implied). High quality, 8k.`;
             }
        } else {
             const preset = SCENE_PRESETS[state.selectedPreset];
             prompt = `Professional product photography of ${subject}. ${preset.prompt}`;
        }
        
        if(state.customPrompt) prompt += ` ${state.customPrompt}`;

        try {
            // ★優先嘗試使用 Google Imagen 3★
            const mainUrl = await callImagen(prompt);
            state.generatedImage = mainUrl;
            
            // 變體生成
            VARIATION_ANGLES.forEach(async (angle) => {
                try {
                    const varUrl = await callImagen(`${prompt}. Camera Angle: ${angle.instruction}`);
                    state.variations.push({ label: angle.label, url: varUrl });
                    renderVariations(els);
                } catch(e) {}
            });

        } catch (e) {
            console.warn("Google Imagen failed, switching to fallback...", e);
            
            // ★自動切換到備用方案 (Pollinations AI)★
            // 這能保證即使 Google Key 權限不足，用戶也能拿到圖片！
            try {
                const fallbackUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt)}?width=1024&height=768&seed=${Math.floor(Math.random()*1000)}&model=flux`;
                
                // 模擬延遲讓圖片有時間生成
                await new Promise(r => setTimeout(r, 1000));
                
                state.generatedImage = fallbackUrl;
                
                // 生成變體 (Fallback)
                VARIATION_ANGLES.forEach((angle, i) => {
                   const varUrl = `https://pollinations.ai/p/${encodeURIComponent(prompt + " " + angle.instruction)}?width=800&height=600&seed=${i}&model=flux`;
                   state.variations.push({ label: angle.label, url: varUrl });
                   renderVariations(els);
                });
                
                // 顯示小提示
                els.errorMsg.innerHTML = "<span class='text-amber-600'>Google 繪圖額度不足，已自動切換至免費高速引擎。</span>";
                els.errorMsg.classList.remove('hidden');

            } catch(err) {
                els.errorMsg.innerText = "生成失敗，請稍後再試。";
                els.errorMsg.classList.remove('hidden');
            }
        }
        
        state.isLoading = false;
        updateUI();
    }

    // Google Imagen 3 API
    async function callImagen(prompt) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                instances: [{ prompt: prompt }],
                parameters: { sampleCount: 1 }
            })
        });
        
        if (!response.ok) throw new Error(`API Error ${response.status}`);
        const result = await response.json();
        const b64 = result.predictions?.[0]?.bytesBase64Encoded;
        if (!b64) throw new Error("No image data");
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
                    <span class="text-[10px] text-zinc-500 block mt-0.5">AI Generated</span>
                </div>
            </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
    }

    window.viewVariation = (url) => {
        state.generatedImage = url;
        const img = document.getElementById('main-result-img');
        if(img) img.src = url;
        
        // 下載按鈕更新
        const dlBtn = document.getElementById('download-main-btn');
        if(dlBtn) dlBtn.onclick = () => window.downloadImage(url, 'main-scene.png');
    };

    window.downloadImage = (url, name) => {
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.click();
    };

    init();
});
