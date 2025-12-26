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
        
        <div className="mt-8 text-center">
            <button 
                type="button"
                onClick={() => {
                    setIsStaffLogin(!isStaffLogin);
                    setPassword('');
                }} 
                className="text-xs text-gray-500 hover:text-white underline cursor-pointer px-4 py-2 transition-colors"
            >
                {isStaffLogin ? '← 返回学员登录' : '工作人员入口 (需密码)'}
            </button>
        </div>
      </div>
    </div>
  );
};

// 2. Admin Component
const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [records, setRecords] = useState<DrawRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRecords = async () => {
        setLoading(true);
        if (!isSupabaseConfigured || !supabase) {
            // Explicitly clearing records to avoid confusion
            setRecords([]);
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('records')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;

            if (data) {
                const formattedData = data.map((item: any) => ({
                    ...item,
                    id: String(item.id) 
                }));
                setRecords(formattedData as DrawRecord[]);
            }
        } catch (error: any) {
            alert("读取记录失败: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeem = async (idStr: string) => {
        if (!confirm('确认要核销这个奖品吗？')) return;

        if (isSupabaseConfigured && supabase) {
            setProcessingId(idStr); 
            
            try {
                const dbId = parseInt(idStr); 

                const { data, error } = await supabase
                    .from('records')
                    .update({ is_redeemed: true })
                    .eq('id', dbId)
                    .select();
                
                if (error) {
                    alert('❌ 核销失败 (数据库错误): ' + error.message);
                } else if (!data || data.length === 0) {
                    alert('❌ 核销失败: 未找到该记录，请尝试刷新列表');
                } else {
                    // Success!
                    await fetchRecords(); // Immediately refresh list
                }
            } catch (e: any) {
                alert('系统错误: ' + e.message);
            } finally {
                setProcessingId(null);
            }
        } else {
            alert("无法核销：数据库未连接");
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    if (!isSupabaseConfigured) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 pt-20 flex flex-col items-center justify-center">
                <div className="bg-red-500/10 border border-red-500 p-6 rounded-xl max-w-lg text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">无法连接后台</h2>
                    <p className="mb-6 text-gray-300">
                        检测到未配置 Supabase 数据库。工作人员后台必须连接数据库才能读取学员的抽奖记录。
                        <br/><br/>
                        请检查您的 <code>.env.local</code> (本地) 或 Vercel 环境变量配置。
                    </p>
                    <button onClick={onBack} className="bg-gray-700 px-6 py-2 rounded text-white hover:bg-gray-600">返回</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 pt-16">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-epe-blue">管理后台 - 核销中心</h1>
                        <p className="text-gray-400 text-sm mt-1">实时监控抽奖数据与核销管理</p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={fetchRecords} className="flex items-center gap-2 px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-500 font-bold shadow-lg transition-transform hover:scale-105 active:scale-95">
                            🔄 刷新数据
                        </button>
                        <button onClick={onBack} className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
                            退出
                        </button>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-700 text-gray-300">
                                <tr>
                                    <th className="p-4 whitespace-nowrap">时间</th>
                                    <th className="p-4 whitespace-nowrap">姓名</th>
                                    <th className="p-4 whitespace-nowrap">奖品内容</th>
                                    <th className="p-4 whitespace-nowrap">类型</th>
                                    <th className="p-4 text-center whitespace-nowrap">当前状态</th>
                                    <th className="p-4 text-center whitespace-nowrap">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-gray-400 animate-pulse">正在从数据库加载记录...</td></tr>
                                ) : records.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-gray-500">
                                        暂无中奖记录。
                                        <br/>
                                        <span className="text-sm">(请确保学员端已进行抽奖，且数据库连接正常)</span>
                                    </td></tr>
                                ) : (
                                    records.map(record => (
                                        <tr key={record.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                                            <td className="p-4 text-sm text-gray-400 whitespace-nowrap">{new Date(record.created_at).toLocaleString()}</td>
                                            <td className="p-4 font-medium text-lg text-white">{record.user_name}</td>
                                            <td className="p-4">
                                                <span className="font-bold text-epe-gold text-lg">{record.prize_name}</span>
                                            </td>
                                            <td className="p-4 text-sm">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                    record.prize_type === 'CASH' ? 'bg-red-900 text-red-200' : 
                                                    record.prize_type === 'PHYSICAL' ? 'bg-blue-900 text-blue-200' : 'bg-gray-900 text-gray-400'
                                                }`}>
                                                    {record.prize_type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {record.is_redeemed ? 
                                                    <div className="inline-flex items-center gap-1 text-green-400 font-bold bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                                                        <span>✓</span> 已核销
                                                    </div> : 
                                                    <div className="inline-flex items-center gap-1 text-red-400 bg-red-400/10 px-3 py-1 rounded-full border border-red-400/20">
                                                        <span>!</span> 待处理
                                                    </div>
                                                }
                                            </td>
                                            <td className="p-4 text-center">
                                                {!record.is_redeemed && record.prize_type !== 'EMPTY' && record.prize_type !== 'POINT' && record.prize_type !== 'FRAGMENT' && (
                                                    <button 
                                                        onClick={() => handleRedeem(record.id)}
                                                        disabled={processingId === record.id}
                                                        className={`w-24 py-2 font-bold text-sm rounded shadow-lg transition-all ${
                                                            processingId === record.id 
                                                            ? 'bg-gray-600 text-gray-300 cursor-wait' 
                                                            : 'bg-epe-blue text-black hover:bg-cyan-300 hover:scale-105 active:scale-95'
                                                        }`}
                                                    >
                                                        {processingId === record.id ? '处理中...' : '确认核销'}
                                                    </button>
                                                )}
                                                {(record.prize_type === 'EMPTY' || record.prize_type === 'POINT' || record.prize_type === 'FRAGMENT') && (
                                                    <span className="text-gray-600 text-xs italic">自动发放</span>
                                                )}
                                                {record.is_redeemed && (
                                                    <span className="text-gray-500 text-xs">已完成</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
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

        {/* Fragment Dashboard */}
        <div className="w-full max-w-4xl p-4 grid grid-cols-2 gap-4 z-20 mt-12 md:mt-12">
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

// --- Main App Logic ---

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    // Initial load for fragments if returning user
    const handleLogin = async (name: string) => {
        setLoginLoading(true);
        
        let foundUser: User | null = null;

        if (isSupabaseConfigured && supabase) {
            // Check if user exists in DB
             const { data } = await supabase
                .from('users')
                .select('*')
                .eq('name', name)
                .single();
            
            if (data) {
                // User exists, load their real data
                foundUser = {
                    id: data.id,
                    name: data.name,
                    points: data.points,
                    fragment_500: data.fragment_500,
                    fragment_free: data.fragment_free,
                };
            } else {
                // User does not exist, create new one.
                const { data: newUser, error } = await supabase
                    .from('users')
                    .insert([{ name, points: 300 }]) // Default points for new users
                    .select()
                    .single();
                
                if (newUser && !error) {
                    foundUser = {
                        id: newUser.id,
                        name: newUser.name,
                        points: newUser.points,
                        fragment_500: newUser.fragment_500,
                        fragment_free: newUser.fragment_free,
                    };
                }
            }
        } else {
            // Offline/Demo Mode
            foundUser = {
                id: 0,
                name,
                points: 300, 
                fragment_500: 0,
                fragment_free: 0,
            };
        }

        setUser(foundUser);
        setLoginLoading(false);
    };

    const handleUpdateUser = (updates: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updates });
        }
    };

    return (
        <>
            <ConnectionStatus />
            {!isSupabaseConfigured && <DatabaseSetupGuide />}
            
            {isAdmin ? (
                <AdminPanel onBack={() => setIsAdmin(false)} />
            ) : !user ? (
                <LoginForm 
                    onLogin={handleLogin} 
                    isAdminMode={isAdmin} 
                    toggleAdmin={() => setIsAdmin(true)}
                    loading={loginLoading}
                />
            ) : (
                <GachaMachine 
                    user={user} 
                    onLogout={() => setUser(null)}
                    onUpdateUser={handleUpdateUser}
                />
            )}
        </>
    );
};

export default App;