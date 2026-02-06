import React, { useState, useEffect, useRef } from 'react';
import { Prize, User, DrawRecord, PrizeType, Rarity } from './types';
import { PRIZE_POOL, COST_PER_DRAW } from './constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DatabaseSetupGuide } from './components/DatabaseSetupGuide';

// --- Helper: Connection Status Banner ---
const ConnectionStatus = () => {
    if (isSupabaseConfigured) return null;
    return (
        <div className="fixed top-0 left-0 w-full bg-red-600/90 backdrop-blur text-white text-xs md:text-sm font-bold text-center py-2 z-[100] border-b border-red-400 shadow-lg">
            ⚠️ 警告：数据库未连接。当前为【单机演示模式】。
            <span className="hidden md:inline"> 学员端的抽奖数据无法传送到工作人员后台。请按教程配置 Supabase 和 Vercel。</span>
        </div>
    );
};

// --- Sub-Components ---

// 0. Prize Ticker Component (Scrolling Marquee)
const PrizeTicker: React.FC = () => {
    const items = [
        { icon: "🏆", text: "传说级大奖: 100元现金红包 / 500元碎片 / 免单碎片", color: "text-epe-gold" },
        { icon: "🧸", text: "潮流福利: BILIBILI 大会员 / 泡泡玛特盲盒", color: "text-pink-400" },
        { icon: "👕", text: "运动实物: EPE定制T恤 / 随机运动装备", color: "text-epe-blue" },
        { icon: "💰", text: "现金红包: 5元 / 10元 / 20元 微信红包", color: "text-green-400" },
        { icon: "🎫", text: "课程福利: 50元 课程代金券", color: "text-purple-400" },
        { icon: "✨", text: "积分返还: 100% 中奖几率", color: "text-gray-300" },
    ];

    return (
        <div className="w-full bg-black/40 backdrop-blur-md border-y border-white/10 overflow-hidden py-2.5 relative z-10">
            {/* Gradient Masks for smooth fade out */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-epe-black to-transparent z-20 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-epe-black to-transparent z-20 pointer-events-none"></div>

            <div className="flex animate-marquee whitespace-nowrap">
                {/* Duplicate the list to ensure seamless infinite scrolling */}
                {[...items, ...items, ...items].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 mx-6">
                        <span className="text-lg filter drop-shadow-md">{item.icon}</span>
                        <span className={`text-xs md:text-sm font-bold tracking-wide ${item.color} drop-shadow-sm`}>
                            {item.text}
                        </span>
                        <span className="text-gray-600 text-[10px] ml-6">•</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 1. Login Component
interface LoginProps {
  onLogin: (name: string) => void;
  isAdminMode: boolean;
  toggleAdmin: () => void;
  loading: boolean;
}

const LoginForm: React.FC<LoginProps> = ({ onLogin, isAdminMode, toggleAdmin, loading }) => {
  const [name, setName] = useState('');
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [password, setPassword] = useState('');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'EPE2026') {
        toggleAdmin();
    } else {
        alert("密码错误！");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-epe-black via-epe-dark to-purple-900 pt-16">
      <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-epe-purple shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-epe-blue to-epe-purple"></div>
        
        <div className="text-center mb-8">
            <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-epe-blue to-epe-purple mb-2 drop-shadow-lg">EPE</h1>
            <p className="text-gray-400 text-xs tracking-[0.3em] uppercase border-b border-gray-700 pb-4">Elite Performance Equipment</p>
            <h2 className="text-2xl font-bold mt-6 text-white flex items-center justify-center gap-2">
                {isStaffLogin ? '🛡️ 工作人员通道' : '⚡ 盲盒抽奖系统'}
            </h2>
        </div>

        {!isStaffLogin ? (
            <form onSubmit={handleStudentSubmit} className="space-y-6">
            <div>
                <label className="block text-epe-blue text-sm font-bold mb-2 uppercase tracking-wider">学员姓名</label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-4 rounded-lg bg-gray-800/50 border border-gray-600 text-white text-lg focus:outline-none focus:border-epe-blue focus:ring-1 focus:ring-epe-blue transition-all placeholder-gray-500"
                placeholder="请输入您的姓名"
                required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-epe-purple to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-95 text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {loading ? '正在查询数据...' : '🚀 进入系统'}
            </button>
            </form>
        ) : (
            <form onSubmit={handleStaffSubmit} className="space-y-6">
            <div>
                <label className="block text-red-400 text-sm font-bold mb-2 uppercase tracking-wider">管理员密码</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-lg bg-gray-800/50 border border-red-500 text-white text-lg focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all placeholder-gray-600"
                placeholder="请输入密码"
                autoFocus
                required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-4 rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-95 text-lg"
            >
                🔓 验证身份
            </button>
            </form>
        )}
        
        <div className="mt-8 text-center pt-4 border-t border-white/10">
            <button 
                type="button"
                onClick={() => {
                    setIsStaffLogin(!isStaffLogin);
                    setPassword('');
                }} 
                className={`text-sm px-4 py-2 rounded-full transition-all ${isStaffLogin ? 'bg-gray-700 text-white' : 'bg-black/40 text-gray-400 hover:text-white border border-gray-600'}`}
            >
                {isStaffLogin ? '← 返回学员登录' : '🔐 工作人员入口 (需密码)'}
            </button>
            <p className="text-[10px] text-gray-600 mt-4 font-mono">System v1.2</p>
        </div>
      </div>
    </div>
  );
};

// 2. Admin Component
const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'redeem' | 'users'>('redeem');
    
    // --- Redeem Logic ---
    const [records, setRecords] = useState<DrawRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);
    // NEW: Search state for records
    const [recordSearchTerm, setRecordSearchTerm] = useState('');

    // --- Users Logic ---
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [pointsDelta, setPointsDelta] = useState<string>(''); // For inputting +100 or -50
    const [pasteContent, setPasteContent] = useState(''); // Textarea content
    const [importStatus, setImportStatus] = useState<string>(''); // Progress message
    const [currentPage, setCurrentPage] = useState(1);
    const USERS_PER_PAGE = 50;

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch Records
    const fetchRecords = async () => {
        setLoadingRecords(true);
        if (!isSupabaseConfigured || !supabase) {
            setRecords([]);
            setLoadingRecords(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('records')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                const formattedData = data.map((item: any) => ({ ...item, id: String(item.id) }));
                setRecords(formattedData as DrawRecord[]);
            }
        } catch (error: any) {
            alert("读取记录失败: " + error.message);
        } finally {
            setLoadingRecords(false);
        }
    };

    // Filter Records based on search
    const filteredRecords = records.filter(record => {
        const term = recordSearchTerm.toLowerCase();
        return (
            record.user_name.toLowerCase().includes(term) ||
            record.prize_name.toLowerCase().includes(term)
        );
    });

    // Fetch Users
    const fetchUsers = async () => {
        setLoadingUsers(true);
        if (!isSupabaseConfigured || !supabase) {
            setUsers([]);
            setLoadingUsers(false);
            return;
        }
        try {
            let query = supabase.from('users').select('*').order('points', { ascending: false });
            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }
            const { data, error } = await query;
            if (error) throw error;
            if (data) {
                setUsers(data as User[]);
                setCurrentPage(1); // Reset to page 1 on search/refresh
            }
        } catch (error: any) {
            alert("读取用户失败: " + error.message);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleRedeem = async (idStr: string) => {
        if (!confirm('确认要核销这个奖品吗？')) return;
        if (isSupabaseConfigured && supabase) {
            setProcessingId(idStr); 
            try {
                const dbId = parseInt(idStr); 
                const { data, error } = await supabase.from('records').update({ is_redeemed: true }).eq('id', dbId).select();
                if (error) alert('❌ 核销失败: ' + error.message);
                else await fetchRecords();
            } catch (e: any) {
                alert('系统错误: ' + e.message);
            } finally {
                setProcessingId(null);
            }
        }
    };

    // --- NEW: Delete Record ---
    const handleDelete = async (idStr: string) => {
        if (!confirm('⚠️ 警告：确定要永久删除这条记录吗？\n\n删除后无法恢复，且不会自动退还用户积分。仅建议用于删除测试数据。')) return;
        
        if (isSupabaseConfigured && supabase) {
            try {
                const dbId = parseInt(idStr);
                const { error } = await supabase.from('records').delete().eq('id', dbId);
                if (error) throw error;
                // Optimistic update
                setRecords(prev => prev.filter(r => r.id !== idStr));
            } catch (e: any) {
                alert('删除失败: ' + e.message);
            }
        } else {
             // Offline delete
             setRecords(prev => prev.filter(r => r.id !== idStr));
        }
    };

    // --- NEW: Export to CSV ---
    const handleExport = () => {
        const dataToExport = filteredRecords.length > 0 ? filteredRecords : records;

        if (dataToExport.length === 0) {
            alert("暂无记录可导出");
            return;
        }
        
        // Define CSV Header
        const headers = ["记录ID", "中奖时间", "学员姓名", "奖品名称", "奖品类型", "奖品价值", "是否已核销"];
        
        // Map data to CSV rows
        const rows = dataToExport.map(r => [
            r.id,
            new Date(r.created_at).toLocaleString(),
            r.user_name,
            r.prize_name,
            r.prize_type,
            r.prize_value,
            r.is_redeemed ? "已核销" : "未核销"
        ]);
        
        // Join with commas and newlines. Add quotes to handle commas in data.
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(item => `"${String(item).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        // Add BOM for Excel UTF-8 compatibility
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute("download", `EPE_中奖记录_${dateStr}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUpdatePoints = async () => {
        if (!editingUser || !pointsDelta) return;
        const delta = parseInt(pointsDelta);
        if (isNaN(delta)) {
            alert("请输入有效的数字");
            return;
        }

        if (!confirm(`确认要给 ${editingUser.name} ${delta >= 0 ? '增加' : '扣除'} ${Math.abs(delta)} 积分吗？\n\n当前: ${editingUser.points}\n修改后: ${editingUser.points + delta}`)) return;

        if (isSupabaseConfigured && supabase) {
            try {
                // 1. Fetch latest data to avoid race conditions
                const { data: latestUser, error: fetchError } = await supabase.from('users').select('points').eq('id', editingUser.id).single();
                if (fetchError || !latestUser) throw new Error("获取最新数据失败");

                const newTotal = latestUser.points + delta;

                // 2. Update
                const { error: updateError } = await supabase.from('users').update({ points: newTotal }).eq('id', editingUser.id);
                if (updateError) throw updateError;

                alert("✅ 修改成功！");
                setEditingUser(null);
                setPointsDelta('');
                fetchUsers(); // Refresh list
            } catch (e: any) {
                alert("修改失败: " + e.message);
            }
        }
    };

    // --- CSV Bulk Import Logic ---
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!isSupabaseConfigured || !supabase) {
            alert("❌ 请先连接数据库（无法在演示模式下使用导入功能）");
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            const text = e.target?.result as string;
            await processCSV(text);
        };
        reader.readAsText(file);
        // Clear input so same file can be selected again
        event.target.value = '';
    };

    const processCSV = async (csvText: string) => {
        if (!isSupabaseConfigured || !supabase) {
             alert("❌ 请先连接数据库");
             return;
        }

        // 1. Parse CSV
        const lines = csvText.split(/\r?\n/);
        const updates: {name: string, points: number}[] = [];

        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            // Support EN comma, CN comma, and Tab (for Excel copy-paste)
            const parts = line.split(/,|，|\t/); 
            if (parts.length < 2) continue;

            const name = parts[0].trim();
            const pointsStr = parts[1].trim();
            const points = parseInt(pointsStr);

            // Basic validation: skip header or invalid numbers
            if (!name || isNaN(points)) continue;

            updates.push({ name, points });
        }

        if (updates.length === 0) {
            alert("⚠️ 未能识别有效数据。\n格式要求：姓名, 积分 (每行一个)\n例如：\n张三, 100\n李四, 200");
            return;
        }

        const confirmMsg = `📄 识别到 ${updates.length} 条数据。\n\n即将执行【积分累加/充值】模式：\n1. 老用户：原有积分 + 导入积分\n2. 新用户：自动创建并设置初始积分\n\n确认执行吗？`;
        if (!confirm(confirmMsg)) return;

        setLoadingUsers(true);
        setImportStatus('正在初始化...');
        
        try {
            // 2. Batch Processing for existing user lookup
            // Fetching all users first is safer for checking accumulation than batching reads if list is small enough (<2000)
            // But we will batch the WRITES which is the bottleneck.
            
            const names = updates.map(u => u.name);
            const { data: existingUsers, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .in('name', names);

            if (fetchError) throw fetchError;

            const existingMap = new Map<string, any>((existingUsers || []).map((u: any) => [u.name, u]));

            // 3. Prepare Payload
            const fullPayload = updates.map(update => {
                const existing = existingMap.get(update.name);
                if (existing) {
                    // MODE A: Accumulate
                    // CRITICAL FIX: DO NOT include 'id'. Let onConflict handle matching by name.
                    // Including 'id' causes "null value in column id" error if mixed with new inserts.
                    return {
                        name: existing.name, // Match Key
                        points: existing.points + update.points,
                        fragment_500: existing.fragment_500,
                        fragment_free: existing.fragment_free,
                    };
                } else {
                    // INSERT: New User
                    return {
                        name: update.name,
                        points: update.points,
                        fragment_500: 0,
                        fragment_free: 0
                    };
                }
            });

            // 4. Batch Execution (Chunking)
            const BATCH_SIZE = 50;
            const totalBatches = Math.ceil(fullPayload.length / BATCH_SIZE);
            
            for (let i = 0; i < fullPayload.length; i += BATCH_SIZE) {
                const chunk = fullPayload.slice(i, i + BATCH_SIZE);
                const currentBatch = Math.floor(i / BATCH_SIZE) + 1;
                
                setImportStatus(`正在写入第 ${currentBatch}/${totalBatches} 批数据 (${chunk.length}条)...`);
                
                // Using upsert with onConflict on 'name'
                const { error: upsertError } = await supabase
                    .from('users')
                    .upsert(chunk, { onConflict: 'name' });

                if (upsertError) throw upsertError;
            }

            alert(`✅ 成功导入/更新 ${fullPayload.length} 位学员积分！`);
            setPasteContent(''); 
            fetchUsers(); 

        } catch (err: any) {
            console.error(err);
            alert("❌ 导入失败: " + err.message);
        } finally {
            setLoadingUsers(false);
            setImportStatus('');
        }
    };


    useEffect(() => {
        if (activeTab === 'redeem') fetchRecords();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab]);

    // Debounce search
    useEffect(() => {
        if (activeTab === 'users') {
            const timer = setTimeout(fetchUsers, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm]);

    // Pagination Logic
    const totalPages = Math.ceil(users.length / USERS_PER_PAGE);
    const paginatedUsers = users.slice(
        (currentPage - 1) * USERS_PER_PAGE,
        currentPage * USERS_PER_PAGE
    );

    if (!isSupabaseConfigured) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 pt-20 flex flex-col items-center justify-center">
                <div className="bg-red-500/10 border border-red-500 p-6 rounded-xl max-w-lg text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">无法连接后台</h2>
                    <p className="mb-6 text-gray-300">检测到未配置 Supabase 数据库。</p>
                    <button onClick={onBack} className="bg-gray-700 px-6 py-2 rounded text-white hover:bg-gray-600">返回</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 pt-16">
            <div className="max-w-6xl mx-auto">
                {/* Admin Header */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 border-b border-gray-700 pb-4">
                    <div className="text-center md:text-left">
                        <h1 className="text-2xl font-bold text-epe-blue">管理后台</h1>
                        <p className="text-gray-400 text-xs">EPE ADMIN PANEL</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <button onClick={onBack} className="px-4 py-2 bg-gray-800 border border-gray-600 rounded text-sm hover:bg-gray-700">← 退出系统</button>
                    </div>
                </div>

                {/* Tab Navigation (Big & Clear) */}
                <div className="flex gap-2 mb-8 bg-gray-800/50 p-2 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('redeem')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2 ${activeTab === 'redeem' ? 'bg-epe-blue text-black shadow-lg scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        🎁 奖品核销
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm md:text-base transition-all flex items-center justify-center gap-2 ${activeTab === 'users' ? 'bg-epe-purple text-white shadow-lg scale-[1.02]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                    >
                        👥 学员管理 (充值)
                    </button>
                </div>

                {activeTab === 'redeem' ? (
                    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700 animate-pop">
                         <div className="p-4 border-b border-gray-700 flex flex-col md:flex-row justify-between items-center bg-gray-750 gap-4">
                            <h3 className="font-bold text-lg text-white">核销记录列表</h3>
                            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-center">
                                {/* NEW: Search Input */}
                                <input 
                                    type="text" 
                                    placeholder="🔍 搜索姓名或奖品..." 
                                    value={recordSearchTerm}
                                    onChange={(e) => setRecordSearchTerm(e.target.value)}
                                    className="bg-black/30 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:border-epe-blue focus:outline-none w-full md:w-48"
                                />
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button 
                                        onClick={handleExport} 
                                        className="text-sm bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded flex items-center justify-center gap-1 font-bold shadow-sm transition flex-1 md:flex-none"
                                    >
                                        📥 导出
                                    </button>
                                    <button 
                                        onClick={fetchRecords} 
                                        className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded border border-gray-600 transition flex-1 md:flex-none"
                                    >
                                        ↻ 刷新
                                    </button>
                                </div>
                            </div>
                         </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-700 text-gray-300">
                                    <tr>
                                        <th className="p-4 whitespace-nowrap">时间</th>
                                        <th className="p-4 whitespace-nowrap">姓名</th>
                                        <th className="p-4 whitespace-nowrap">奖品内容</th>
                                        <th className="p-4 whitespace-nowrap">状态</th>
                                        <th className="p-4 text-center whitespace-nowrap">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingRecords ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-gray-400 animate-pulse">加载中...</td></tr>
                                    ) : filteredRecords.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-gray-500">{records.length === 0 ? "暂无记录" : "未找到相关记录"}</td></tr>
                                    ) : (
                                        filteredRecords.map(record => (
                                            <tr key={record.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors group">
                                                <td className="p-4 text-sm text-gray-400">{new Date(record.created_at).toLocaleString()}</td>
                                                <td className="p-4 font-medium">{record.user_name}</td>
                                                <td className="p-4">
                                                    <span className="font-bold text-epe-gold">{record.prize_name}</span>
                                                    <span className="text-xs text-gray-500 ml-2">({record.prize_type})</span>
                                                </td>
                                                <td className="p-4">
                                                    {record.is_redeemed ? <span className="text-green-400 font-bold text-xs border border-green-900 bg-green-900/20 px-2 py-1 rounded">已核销</span> : <span className="text-red-400 font-bold text-xs border border-red-900 bg-red-900/20 px-2 py-1 rounded">待处理</span>}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-3">
                                                        {!record.is_redeemed && record.prize_type !== 'EMPTY' && record.prize_type !== 'POINT' && record.prize_type !== 'FRAGMENT' && (
                                                            <button 
                                                                onClick={() => handleRedeem(record.id)}
                                                                disabled={processingId === record.id}
                                                                className="px-3 py-1 bg-epe-blue text-black text-xs font-bold rounded hover:bg-cyan-300 shadow-lg min-w-[60px]"
                                                            >
                                                                {processingId === record.id ? '...' : '核销'}
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDelete(record.id)}
                                                            className="text-gray-600 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-900/20"
                                                            title="删除此记录"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 animate-pop">
                         
                         {/* Paste Import Area */}
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 mb-2 shadow-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    ⚡ 极速导入 (支持 Excel 直接粘贴)
                                </h3>
                                <span className="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">
                                    自动识别：逗号 或 Tab分隔
                                </span>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4">
                                <textarea
                                    value={pasteContent}
                                    onChange={(e) => setPasteContent(e.target.value)}
                                    placeholder={`格式：姓名, 积分 (每行一个)\n\n例子：\n张三, 100\n李四, 500\n新来的小赵, 300\n\n(您可以直接从 Excel 复制两列数据粘贴到这里)`}
                                    className="flex-1 bg-black/40 border border-gray-600 rounded-lg p-3 text-sm text-white focus:border-epe-blue focus:outline-none h-32 font-mono resize-none leading-relaxed placeholder-gray-600"
                                />
                                <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                                    <button
                                        onClick={async () => {
                                            if(!pasteContent.trim()) return;
                                            await processCSV(pasteContent);
                                        }}
                                        disabled={!pasteContent.trim() || !!importStatus}
                                        className={`py-3 px-4 rounded-lg font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${pasteContent.trim() && !importStatus ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white transform hover:scale-105' : 'bg-gray-700 text-gray-500 cursor-not-allowed'}`}
                                    >
                                        {importStatus ? '⏳ 处理中...' : '🚀 执行导入'}
                                    </button>
                                    <button
                                        onClick={() => setPasteContent('')}
                                        className="py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-xs transition"
                                    >
                                        清空内容
                                    </button>
                                </div>
                            </div>
                            {/* Import Progress Bar */}
                            {importStatus && (
                                <div className="mt-3 bg-black/50 rounded-lg p-2 text-center">
                                    <span className="text-green-400 font-mono text-sm animate-pulse">{importStatus}</span>
                                </div>
                            )}
                        </div>

                         {/* User Management Toolbar */}
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between gap-4 items-center">
                             <div className="flex gap-2 flex-1 w-full md:w-auto">
                                <input 
                                    type="text" 
                                    placeholder="🔍 搜索学员姓名..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-black/30 border border-gray-600 rounded px-4 py-2 text-white focus:border-epe-purple focus:outline-none w-full md:w-64"
                                />
                                {/* Legacy Bulk Import Button (Hidden or Secondary) */}
                                <input 
                                    type="file" 
                                    accept=".csv" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    className="hidden" 
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded text-xs flex items-center gap-2 whitespace-nowrap transition border border-gray-600"
                                    title="如果您一定要传文件，可以用这个"
                                >
                                    📁 传文件
                                </button>
                             </div>
                             
                             <div className="text-sm text-gray-400 flex items-center justify-end">
                                 共 {users.length} 位
                             </div>
                        </div>

                        {/* Paginated List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loadingUsers ? (
                                <div className="col-span-full py-12 text-center text-gray-500">正在获取学员数据...</div>
                            ) : paginatedUsers.length === 0 ? (
                                <div className="col-span-full py-12 text-center text-gray-500">
                                    {users.length === 0 ? '暂无学员数据' : '当前页无数据'}
                                </div>
                            ) : (
                                paginatedUsers.map(u => (
                                    <div key={u.id || u.name} className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg flex flex-col justify-between hover:border-epe-purple/50 transition-colors">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{u.name}</h3>
                                                <p className="text-gray-500 text-xs">ID: {u.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-2xl font-bold text-epe-gold">{u.points}</span>
                                                <span className="text-xs text-gray-400">当前积分</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-black/20 rounded p-2 mb-4 grid grid-cols-2 gap-2 text-center">
                                             <div>
                                                <span className="block text-xs text-gray-500">500元碎片</span>
                                                <span className="font-mono text-epe-blue">{u.fragment_500}/3</span>
                                             </div>
                                             <div>
                                                <span className="block text-xs text-gray-500">免单碎片</span>
                                                <span className="font-mono text-epe-purple">{u.fragment_free}/3</span>
                                             </div>
                                        </div>

                                        <button 
                                            onClick={() => setEditingUser(u)}
                                            className="w-full py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold transition-colors border border-gray-600 hover:border-epe-purple hover:text-white"
                                        >
                                            ✏️ 修改/充值积分
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {users.length > USERS_PER_PAGE && (
                            <div className="flex justify-center gap-2 mt-6 pb-8">
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-4 py-2 rounded bg-gray-800 border border-gray-600 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                                >
                                    上一页
                                </button>
                                <span className="px-4 py-2 text-gray-400 text-sm flex items-center">
                                    第 {currentPage} / {totalPages} 页
                                </span>
                                <button 
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`px-4 py-2 rounded bg-gray-800 border border-gray-600 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                                >
                                    下一页
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Edit Points Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-600 shadow-2xl animate-pop">
                        <h3 className="text-xl font-bold mb-1">积分变动: {editingUser.name}</h3>
                        <p className="text-gray-400 text-sm mb-6">当前余额: <span className="text-epe-gold">{editingUser.points}</span></p>
                        
                        <div className="mb-6">
                            <label className="block text-xs uppercase text-gray-500 font-bold mb-2">变动数值 (正数增加，负数扣除)</label>
                            <input 
                                type="number" 
                                autoFocus
                                value={pointsDelta}
                                onChange={(e) => setPointsDelta(e.target.value)}
                                placeholder="例如: 100 或 -30"
                                className="w-full bg-black/50 border border-gray-500 rounded px-4 py-3 text-xl text-white focus:border-epe-blue focus:outline-none"
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setPointsDelta('100')} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-xs font-bold text-green-300 border border-green-900">+100</button>
                                <button onClick={() => setPointsDelta('500')} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-xs font-bold text-green-300 border border-green-900">+500</button>
                                <button onClick={() => setPointsDelta('-30')} className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded text-xs font-bold text-red-300 border border-red-900">-30</button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setEditingUser(null); setPointsDelta(''); }}
                                className="flex-1 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleUpdatePoints}
                                className="flex-1 py-3 bg-epe-blue text-black rounded-lg hover:bg-cyan-400 font-bold shadow-lg"
                            >
                                确认执行
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// 3. Main Gacha Component
interface GachaProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const GachaMachine: React.FC<GachaProps> = ({ user, onLogout, onUpdateUser }) => {
  const [state, setState] = useState<'IDLE' | 'SHAKING' | 'OPENING' | 'REVEALED'>('IDLE');
  const [prize, setPrize] = useState<Prize | null>(null);
  const [history, setHistory] = useState<DrawRecord[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
        if (!isSupabaseConfigured || !supabase) return;
        const { data } = await supabase
            .from('records')
            .select('*')
            .eq('user_name', user.name)
            .order('created_at', { ascending: false })
            .limit(10);
        if (data) {
             const formatted = data.map((d: any) => ({...d, id: String(d.id)}));
             setHistory(formatted as DrawRecord[]);
        }
    };
    loadHistory();
  }, [user.name]);

  const drawPrize = (): Prize => {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const p of PRIZE_POOL) {
      cumulative += p.probability;
      if (rand <= cumulative) return p;
    }
    return PRIZE_POOL[0];
  };

  const handleStart = async () => {
    if (state !== 'IDLE') return;

    if (user.points < COST_PER_DRAW) {
        alert(`积分不足！需要 ${COST_PER_DRAW} 积分，你只有 ${user.points} 积分。`);
        return;
    }
    
    // Optimistic UI Update
    const newPoints = user.points - COST_PER_DRAW;
    onUpdateUser({ points: newPoints });

    setState('SHAKING');

    setTimeout(async () => {
      const result = drawPrize();
      setPrize(result);
      setState('OPENING');
      
      // DB Transaction
      await processDrawTransaction(result, newPoints);
      
      setTimeout(() => {
        setState('REVEALED');
      }, 1000);
    }, 800);
  };

  const processDrawTransaction = async (wonPrize: Prize, pointsAfterDeduction: number) => {
    if (!isSupabaseConfigured || !supabase || !user.id) {
        // Offline Fallback for visual confirmation only
        const tempId = Date.now().toString();
        setHistory(prev => [{
            id: tempId,
            user_name: user.name,
            prize_name: wonPrize.name,
            prize_type: wonPrize.type,
            prize_value: wonPrize.value,
            is_redeemed: false,
            created_at: new Date().toISOString()
        }, ...prev]);
        return;
    }

    const newRecord: Omit<DrawRecord, 'id' | 'created_at'> = {
        user_name: user.name,
        prize_name: wonPrize.name,
        prize_type: wonPrize.type,
        prize_value: wonPrize.value,
        is_redeemed: false,
    };

    let currentF500 = user.fragment_500;
    let currentFFree = user.fragment_free;
    let finalPoints = pointsAfterDeduction;

    if (wonPrize.id === 'p_frag_500') currentF500 += 1;
    if (wonPrize.id === 'p_frag_free') currentFFree += 1;
    if (wonPrize.type === PrizeType.POINT) finalPoints += wonPrize.value;

    // Database Updates
    const { error: recordError } = await supabase.from('records').insert([newRecord]);
    
    if (recordError) {
        alert("⚠️ 严重错误：中奖记录保存失败！可能是网络问题，请截图联系管理员。");
    }

    const { error: userError } = await supabase.from('users').update({
        points: finalPoints,
        fragment_500: currentF500,
        fragment_free: currentFFree
    }).eq('id', user.id);

    if (userError) {
         console.error("更新积分失败:", userError);
    }

    onUpdateUser({ 
        points: finalPoints,
        fragment_500: currentF500,
        fragment_free: currentFFree
    });
    
    // Refresh History from DB
    const tempId = Date.now().toString();
    setHistory(prev => [{...newRecord, id: tempId, created_at: new Date().toISOString()}, ...prev]);
  };

  const reset = () => {
    setState('IDLE');
    setPrize(null);
  };

  return (
    <div className="min-h-screen bg-epe-black text-white flex flex-col items-center relative overflow-hidden pt-16">
        {/* Top Bar */}
        <div className="w-full p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur z-20 border-b border-gray-800 absolute top-0 mt-8 md:mt-0">
            <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-epe-gold border border-epe-gold/30 px-2 py-0.5 rounded-full bg-yellow-900/20">
                        💰 积分: {user.points}
                    </span>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={onLogout} className="text-sm text-gray-500 hover:text-white">退出</button>
            </div>
        </div>
        
        {/* NEW: Scrolling Prize Ticker */}
        <div className="w-full relative z-10 mt-12 md:mt-8">
            <PrizeTicker />
        </div>

        {/* Fragment Dashboard */}
        <div className="w-full max-w-4xl p-4 grid grid-cols-2 gap-4 z-20 mt-2 md:mt-2">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center shadow-lg">
                <span className="text-xs text-gray-400 mb-1 font-bold">500元红包碎片</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-8 h-10 rounded transition-all duration-500 border border-black/50 ${i <= user.fragment_500 % 3 && user.fragment_500 > 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_15px_#ffd700] scale-110' : 'bg-gray-700'}`}></div>
                    ))}
                </div>
                <span className="text-xs mt-1 text-epe-gold font-mono">{user.fragment_500}/3</span>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center shadow-lg">
                <span className="text-xs text-gray-400 mb-1 font-bold">季度免单碎片</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-8 h-10 rounded transition-all duration-500 border border-black/50 ${i <= user.fragment_free % 3 && user.fragment_free > 0 ? 'bg-gradient-to-br from-purple-400 to-purple-700 shadow-[0_0_15px_#b026ff] scale-110' : 'bg-gray-700'}`}></div>
                    ))}
                </div>
                <span className="text-xs mt-1 text-epe-purple font-mono">{user.fragment_free}/3</span>
            </div>
        </div>

        {/* Main Stage */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 p-6">
            
            {/* The Pack */}
            {state !== 'REVEALED' && (
                <div 
                    onClick={handleStart}
                    className={`cursor-pointer relative w-64 h-80 transition-all duration-300 ${state === 'SHAKING' ? 'animate-shake' : 'hover:scale-105 hover:rotate-1'} ${state === 'OPENING' ? 'opacity-0 scale-150' : 'opacity-100'}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black rounded-xl border-2 border-gray-600 shadow-2xl overflow-hidden flex flex-col items-center justify-center group">
                        {/* EPE Pattern Background */}
                        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                        
                        {/* Glossy Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12"></div>
                        
                        <h1 className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-epe-gold to-yellow-700 z-10 transform -rotate-12 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">EPE</h1>
                        <div className="mt-4 px-3 py-1 border border-gray-500 rounded text-[10px] text-gray-400 tracking-[0.2em] z-10 bg-black/50 backdrop-blur">LIMITED EDITION</div>
                        
                        <div className={`absolute bottom-6 w-4/5 text-center py-2 rounded-full text-sm font-bold transition-all shadow-lg ${user.points >= COST_PER_DRAW ? 'bg-epe-blue text-black animate-pulse hover:bg-white' : 'bg-gray-700 text-gray-400'}`}>
                            {user.points >= COST_PER_DRAW ? `点击开启 (-${COST_PER_DRAW})` : `积分不足`}
                        </div>
                    </div>
                </div>
            )}

            {/* The Card (Revealed) */}
            {state === 'REVEALED' && prize && (
                <div className="animate-pop w-72 h-[28rem] perspective-1000 relative">
                    <div className={`relative w-full h-full rounded-2xl shadow-2xl overflow-hidden border-[3px] ${prize.type === 'EMPTY' ? 'border-gray-600' : 'border-epe-gold animate-glow'} bg-gray-900 flex flex-col items-center p-0 text-center`}>
                        {/* Card Header Background */}
                        <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${prize.rarity.replace('bg-', 'from-')} to-gray-900 opacity-60`}></div>
                        
                        <div className="z-10 mt-6 mb-2 w-full px-4 flex justify-between items-start">
                            <span className="text-[10px] text-gray-400 tracking-widest">EPE GACHA</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${prize.rarity} shadow-lg`}>
                                {prize.rarity === Rarity.LEGENDARY ? 'LEGENDARY' : prize.rarity === Rarity.RARE ? 'RARE' : prize.rarity === Rarity.UNCOMMON ? 'UNCOMMON' : 'COMMON'}
                            </span>
                        </div>

                        <div className="z-10 flex-1 flex flex-col items-center justify-center w-full px-6">
                            <div className="mb-4 transform scale-150">
                                {prize.type !== 'EMPTY' ? '🎁' : '💨'}
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide leading-tight drop-shadow-md">{prize.name}</h2>
                            <p className="text-gray-300 text-sm font-light border-t border-white/10 pt-2 w-full">{prize.description}</p>
                        </div>

                        <div className="z-10 w-full p-6 bg-gray-900/80 backdrop-blur-sm">
                            <button 
                                onClick={reset}
                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase tracking-wider text-sm"
                            >
                                收下奖励
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* History List */}
        <div className="w-full max-w-2xl bg-gray-900/90 backdrop-blur border-t border-gray-700 z-20 h-48 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <div className="p-3 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <h3 className="text-gray-300 text-xs font-bold uppercase tracking-wider">近期中奖记录</h3>
                <span className="text-[10px] text-gray-500">仅显示最近10条</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {history.map((rec) => (
                    <div key={rec.id} className="flex justify-between items-center bg-black/40 p-3 rounded border border-gray-800 hover:border-gray-600 transition-colors">
                        <span className="text-gray-500 text-xs font-mono">{new Date(rec.created_at).toLocaleTimeString()}</span>
                        <span className={`text-sm font-medium ${rec.prize_type === 'EMPTY' ? 'text-gray-500' : 'text-epe-blue'}`}>
                            {rec.prize_name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${rec.is_redeemed ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                           {rec.is_redeemed ? '已核销' : '未领取'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

const App: React.FC = () => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (name: string) => {
        setLoading(true);

        // Offline / Demo mode
        if (!isSupabaseConfigured || !supabase) {
            setCurrentUser({
                id: 999,
                name: name,
                points: 100,
                fragment_500: 0,
                fragment_free: 0
            });
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('name', name)
                .single();
            
            if (error && error.code !== 'PGRST116') {
                 throw error;
            }

            if (data) {
                setCurrentUser(data as User);
            } else {
                 // Auto-create user for simplicity
                 const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert([{ name, points: 0 }])
                    .select()
                    .single();
                
                 if (createError) throw createError;
                 if (newUser) setCurrentUser(newUser as User);
            }
        } catch (err: any) {
            alert("登录失败: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = (updates: Partial<User>) => {
        if (currentUser) {
            setCurrentUser({ ...currentUser, ...updates });
        }
    };

    return (
        <>
            <ConnectionStatus />
            <DatabaseSetupGuide />
            
            {isAdmin ? (
                <AdminPanel onBack={() => setIsAdmin(false)} />
            ) : currentUser ? (
                <GachaMachine 
                    user={currentUser} 
                    onLogout={() => setCurrentUser(null)} 
                    onUpdateUser={handleUpdateUser}
                />
            ) : (
                <LoginForm 
                    onLogin={handleLogin} 
                    isAdminMode={isAdmin} 
                    toggleAdmin={() => setIsAdmin(true)} 
                    loading={loading}
                />
            )}
        </>
    );
};

export default App;