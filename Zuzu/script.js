// --- MOCK DATA ---
const CURRENT_DATE = "2025-11-14";

const MESSAGES = [
  { id: 101, client: "Kevin 林", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin", platform: "Threads", lastMessage: "你們的系統可以串接 Notion 嗎？", time: "5分鐘前", status: "pending_review", history: [{ sender: "client", text: "你們的系統可以串接 Notion 嗎？我在 Threads 上看到介紹覺得很酷！", time: "10:30" }] },
  { id: 102, client: "Jessica Wang", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica", platform: "LINE", lastMessage: "我想預約下週三下午兩點的線上諮詢。", time: "35分鐘前", status: "pending_review", history: [{ sender: "client", text: "我想預約下週三下午兩點的線上諮詢。", time: "10:00" }] },
  { id: 103, client: "Bella", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella", platform: "Instagram", lastMessage: "太棒了！感謝你的推薦！", time: "1小時前", status: "replied", history: [{ sender: "client", text: "請問有適合美妝產業的自動化範例嗎？想了解～", time: "09:15" }, { sender: "ai", text: "Bella 妳好！💄 我們有專門為美業/美妝設計的自動化流程喔！包含自動發送作品集、預約提醒等等。", time: "09:16" }, { sender: "client", text: "太棒了！感謝你的推薦！", time: "09:20" }] },
];

const ALL_DATA = [
  { id: 1, date: "2025-11-14", time: "10:00", client: "Kevin 林", service: "系統架構諮詢", status: "upcoming", industry: "設計", plan: "Lite", payment: "unpaid", amount: 1500 },
  { id: 2, date: "2025-11-14", time: "14:00", client: "Jessica Wang", service: "ZuZu 導入教學", status: "confirmed", industry: "運動/健康", plan: "Pro", payment: "paid", amount: 3000 },
  { id: 3, date: "2025-11-15", time: "11:00", client: "Tom Wu", service: "現場諮詢", status: "upcoming", industry: "其他", plan: "None", payment: "unpaid", amount: 1500 },
];

const CLIENTS = [
    { id: 1, name: "Kevin 林", status: "洽談中", tags: ["對 n8n 有興趣"], totalSpent: 0 },
    { id: 2, name: "Jessica Wang", status: "已簽約", tags: ["急需預約功能", "Pro"], totalSpent: 12000 },
    { id: 3, name: "Bella", status: "潛在", tags: ["IG 網紅"], totalSpent: 0 },
    { id: 6, name: "Mike 健身", status: "已簽約", tags: ["健身", "Pro"], totalSpent: 24000 }
];

// --- STATE MANAGEMENT ---
let activeTab = 'dashboard';
let selectedMsgId = 101;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initSidebar();
    renderDashboard();
    renderInbox(); // Pre-render inbox structure
    renderOrders(); // Pre-render orders
    renderCRM();
    lucide.createIcons();
});

// --- NAVIGATION LOGIC ---
function switchTab(tabId) {
    activeTab = tabId;
    
    // Hide all views
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
    
    // Show active view
    const activeView = document.getElementById(`view-${tabId}`);
    if(activeView) {
        activeView.classList.remove('hidden');
        activeView.classList.add('fade-in');
    }

    // Update Sidebar State (Desktop)
    document.querySelectorAll('#sidebar-nav button').forEach(btn => {
        if(btn.dataset.tab === tabId) {
            btn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 bg-orange-500 text-white shadow-lg shadow-orange-200";
        } else {
            btn.className = "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-slate-500 hover:bg-orange-50 hover:text-orange-600";
        }
    });

    // Update Mobile Nav State
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        if(btn.dataset.tab === tabId) {
            btn.classList.remove('text-slate-400');
            btn.classList.add('text-orange-600');
        } else {
            btn.classList.add('text-slate-400');
            btn.classList.remove('text-orange-600');
        }
    });

    lucide.createIcons();
}

function initSidebar() {
    const items = [
        { id: 'dashboard', icon: 'layout-dashboard', label: '總覽儀表板' },
        { id: 'inbox', icon: 'message-square', label: '智慧收件匣', count: MESSAGES.filter(m=>m.status==='pending_review').length },
        { id: 'calendar', icon: 'calendar', label: '預約行事曆' },
        { id: 'orders', icon: 'clipboard-list', label: '訂單管理' },
        { id: 'finance', icon: 'dollar-sign', label: '金流分析' },
        { id: 'marketing', icon: 'megaphone', label: '行銷助手' },
        { id: 'analysis', icon: 'brain-circuit', label: '智能分析' },
        { id: 'crm', icon: 'users', label: '客戶名單' },
        { id: 'integrations', icon: 'plug', label: '整合中心' },
        { id: 'owner_setup', icon: 'settings', label: 'AI 設定' },
    ];

    const nav = document.getElementById('sidebar-nav');
    nav.innerHTML = items.map(item => `
        <button onclick="switchTab('${item.id}')" data-tab="${item.id}" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${item.id === 'dashboard' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'text-slate-500 hover:bg-orange-50 hover:text-orange-600'}">
            <i data-lucide="${item.icon}" class="w-5 h-5"></i>
            <span class="font-medium">${item.label}</span>
            ${item.count ? `<span class="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">${item.count}</span>` : ''}
        </button>
    `).join('');
}

// --- RENDER FUNCTIONS ---

function renderDashboard() {
    const container = document.getElementById('view-dashboard');
    const pendingCount = MESSAGES.filter(m => m.status === 'pending_review').length;
    
    container.innerHTML = `
        <div class="bg-orange-500 rounded-2xl p-5 text-white flex justify-between items-center shadow-lg shadow-orange-200 relative overflow-hidden">
            <div class="relative z-10 flex items-center gap-4">
                <div class="p-3 bg-white/20 rounded-full">
                    <i data-lucide="clock" class="w-6 h-6 text-white"></i>
                </div>
                <div>
                    <h2 class="text-xl font-bold mb-1">早安，YUJUN！☀️</h2>
                    <p class="opacity-90 text-sm">ZuZu 今天攔截了 5 筆預約，省下約 1.5 小時。</p>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-4 rounded-xl bg-red-100 text-red-600"><i data-lucide="message-square" class="w-6 h-6"></i></div>
                <div><h3 class="text-slate-500 text-sm font-medium">待回覆訊息</h3><div class="text-2xl font-bold text-slate-800">${pendingCount}</div></div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-4 rounded-xl bg-blue-100 text-blue-600"><i data-lucide="calendar" class="w-6 h-6"></i></div>
                <div><h3 class="text-slate-500 text-sm font-medium">本週預約</h3><div class="text-2xl font-bold text-slate-800">${ALL_DATA.length}</div></div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div class="p-4 rounded-xl bg-green-100 text-green-600"><i data-lucide="trending-up" class="w-6 h-6"></i></div>
                <div><h3 class="text-slate-500 text-sm font-medium">本月預估</h3><div class="text-2xl font-bold text-slate-800">NT$ 125k</div></div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="p-6 border-b border-slate-100 flex justify-between items-center">
                     <h3 class="font-bold text-slate-800 flex items-center gap-2">
                        <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> 最新待辦事項
                     </h3>
                     <button onclick="switchTab('inbox')" class="text-sm text-orange-600 font-bold hover:underline">處理所有</button>
                </div>
                <div class="divide-y divide-slate-50">
                    ${MESSAGES.filter(m => m.status === 'pending_review').map(msg => `
                        <div onclick="switchTab('inbox'); selectMessage(${msg.id})" class="p-4 hover:bg-slate-50 cursor-pointer flex items-center gap-4 transition-colors">
                            <img src="${msg.avatar}" class="w-10 h-10 rounded-full" alt="">
                            <div class="flex-1 min-w-0">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-slate-800 text-sm">${msg.client}</span>
                                    <span class="text-xs text-slate-400">${msg.time}</span>
                                </div>
                                <p class="text-sm text-slate-500 truncate">${msg.lastMessage}</p>
                            </div>
                            <div class="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">AI 擬稿完成</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div class="flex justify-between items-center mb-6">
                     <h3 class="font-bold text-slate-800 flex items-center gap-2"><i data-lucide="calendar" class="w-4 h-4"></i> 今日行程</h3>
                </div>
                <div class="space-y-4">
                    ${ALL_DATA.filter(a => a.date === CURRENT_DATE).map(apt => `
                        <div class="relative pl-6 pb-2">
                            <div class="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${apt.status === 'upcoming' ? 'border-orange-500 bg-white' : 'border-slate-300 bg-slate-100'}"></div>
                            <div class="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-bold text-slate-800 text-sm">${apt.time}</span>
                                    <span class="text-[10px] px-2 py-0.5 rounded font-bold ${apt.status === 'upcoming' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-500'}">${apt.status === 'upcoming' ? '即將開始' : '已確認'}</span>
                                </div>
                                <div class="text-sm font-medium text-slate-700">${apt.service}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderInbox() {
    const container = document.getElementById('view-inbox');
    const selectedMsg = MESSAGES.find(m => m.id === selectedMsgId);
    
    // Create the dual-pane layout
    container.innerHTML = `
        <div class="flex h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="w-1/3 border-r border-slate-100 flex flex-col">
                <div class="p-4 border-b border-slate-100 bg-slate-50">
                    <input type="text" placeholder="搜尋訊息..." class="w-full pl-4 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-orange-200">
                </div>
                <div class="flex-1 overflow-y-auto" id="msg-list">
                    </div>
            </div>
            
            <div class="flex-1 flex flex-col bg-[#F8F9FA] relative" id="chat-detail">
                </div>
        </div>
    `;

    renderMessageList();
    renderChatDetail(selectedMsg);
}

function renderMessageList() {
    const listContainer = document.getElementById('msg-list');
    listContainer.innerHTML = MESSAGES.map(msg => `
        <div onclick="selectMessage(${msg.id})" class="p-4 hover:bg-orange-50 cursor-pointer transition-colors border-b border-slate-50 ${selectedMsgId === msg.id ? 'bg-orange-50 border-orange-100' : ''}">
            <div class="flex justify-between items-start mb-2">
                <div class="font-bold text-slate-800 flex items-center gap-2 text-sm">
                    ${msg.client}
                    ${msg.status === 'pending_review' ? '<span class="w-2 h-2 bg-red-500 rounded-full"></span>' : ''}
                </div>
                <span class="text-xs text-slate-400">${msg.time}</span>
            </div>
            <p class="text-sm text-slate-500 truncate mb-2 font-medium">${msg.lastMessage}</p>
            <div class="flex items-center justify-between">
                <div class="bg-white border border-slate-200 px-2 py-0.5 rounded text-[10px] text-slate-500">${msg.platform}</div>
                ${msg.status === 'replied' ? '<i data-lucide="check-circle" class="w-3 h-3 text-green-500"></i>' : ''}
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

function selectMessage(id) {
    selectedMsgId = id;
    renderMessageList();
    const msg = MESSAGES.find(m => m.id === id);
    renderChatDetail(msg);
}

function renderChatDetail(msg) {
    const detailContainer = document.getElementById('chat-detail');
    if (!msg) {
        detailContainer.innerHTML = '<div class="flex-1 flex items-center justify-center text-slate-400">請選擇訊息</div>';
        return;
    }

    const aiDraft = msg.status === 'pending_review' ? "嗨！感謝你的詢問！關於串接 Notion 是沒問題的喔，我們透過 n8n 可以輕鬆達成。請問方便約個時間展示嗎？😊" : "";

    detailContainer.innerHTML = `
        <div class="p-4 bg-white border-b border-slate-100 flex justify-between items-center shadow-sm z-10">
            <div class="flex items-center gap-3">
                <img src="${msg.avatar}" class="w-10 h-10 rounded-full" alt="">
                <div>
                    <h3 class="font-bold text-slate-800">${msg.client}</h3>
                    <div class="text-xs text-slate-500">來源：${msg.platform}</div>
                </div>
            </div>
        </div>

        <div class="flex-1 p-6 space-y-6 overflow-y-auto pb-24" id="chat-history">
            ${msg.history.map(h => `
                <div class="flex flex-col gap-1 ${h.sender === 'client' ? 'items-start' : 'items-end'}">
                    <div class="p-3 rounded-2xl shadow-sm max-w-[80%] whitespace-pre-wrap ${h.sender === 'client' ? 'bg-white' : 'bg-orange-500 text-white'}">
                        ${h.text}
                    </div>
                    <span class="text-[10px] text-slate-400">${h.time}</span>
                </div>
            `).join('')}
            
            ${msg.status === 'pending_review' ? `
                <div class="bg-orange-50 border border-orange-200 rounded-2xl p-5 mx-8 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                    <div class="flex items-center gap-2 text-orange-700 font-bold text-sm mb-3">
                        <i data-lucide="sparkles" class="w-4 h-4"></i> ZuZu 建議回覆
                    </div>
                    <textarea class="w-full bg-white border border-orange-200 rounded-xl p-3 text-sm mb-3 outline-none resize-none" rows="3">${aiDraft}</textarea>
                    <div class="flex justify-end">
                        <button onclick="showNotification('訊息已發送 ✅');" class="bg-orange-500 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-orange-200 hover:bg-orange-600 transition-colors">
                            <i data-lucide="send" class="w-4 h-4"></i> 確認發送
                        </button>
                    </div>
                </div>
            ` : ''}
        </div>
        
        <div class="p-4 bg-white border-t border-slate-100 absolute bottom-0 w-full">
            <div class="flex gap-2 items-center">
                <input type="text" placeholder="自行輸入訊息..." class="flex-1 bg-slate-50 border-transparent rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-orange-300 border">
                <button class="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800">
                    <i data-lucide="send" class="w-5 h-5"></i>
                </button>
            </div>
        </div>
    `;
    lucide.createIcons();
}

function renderOrders() {
    const container = document.getElementById('view-orders');
    container.innerHTML = `
        <h2 class="text-2xl font-bold text-slate-800">訂單管理</h2>
        <div class="bg-white border border-slate-200 rounded-2xl flex-1 overflow-hidden shadow-sm">
            <table class="w-full text-left">
                <thead class="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500">
                    <tr>
                        <th class="p-4">日期</th>
                        <th class="p-4">時間</th>
                        <th class="p-4">客戶</th>
                        <th class="p-4">服務項目</th>
                        <th class="p-4">金額</th>
                        <th class="p-4">狀態</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    ${ALL_DATA.map(o => `
                        <tr class="hover:bg-slate-50">
                            <td class="p-4 text-sm font-bold text-slate-700">${o.date}</td>
                            <td class="p-4 text-sm text-slate-600">${o.time}</td>
                            <td class="p-4 text-sm font-medium">${o.client}</td>
                            <td class="p-4 text-sm text-slate-500">${o.service}</td>
                            <td class="p-4 text-sm font-bold">NT$ ${o.amount}</td>
                            <td class="p-4"><span class="text-xs px-2 py-1 rounded-full font-bold ${o.payment === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">${o.payment}</span></td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderCRM() {
    const container = document.getElementById('crm-content');
    if(!container) return;
    container.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
             <table class="w-full text-left">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase border-b border-slate-100">
                    <tr>
                        <th class="p-4 pl-6">客戶</th>
                        <th class="p-4">標籤</th>
                        <th class="p-4">狀態</th>
                        <th class="p-4">消費</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    ${CLIENTS.map(c => `
                        <tr class="hover:bg-slate-50">
                            <td class="p-4 pl-6 font-bold text-slate-700">${c.name}</td>
                            <td class="p-4"><div class="flex gap-1">${c.tags.map(t=>`<span class="bg-white border px-2 py-0.5 rounded text-[10px] text-slate-500">${t}</span>`).join('')}</div></td>
                            <td class="p-4"><span class="px-2 py-1 rounded-full text-xs font-bold ${c.status === '已簽約' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}">${c.status}</span></td>
                            <td class="p-4 text-sm font-bold">NT$ ${c.totalSpent}</td>
                        </tr>
                    `).join('')}
                </tbody>
             </table>
        </div>
    `;
}

// --- UTILS ---
function showNotification(text) {
    const toast = document.getElementById('notification-toast');
    const msg = document.getElementById('notification-text');
    msg.textContent = text;
    toast.classList.remove('hidden');
    // Trigger reflow
    void toast.offsetWidth; 
    toast.classList.remove('translate-y-10', 'opacity-0');
    
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}
