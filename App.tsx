import React, { useState, useEffect, useRef } from 'react';
import { Prize, User, DrawRecord, PrizeType, Rarity } from './types';
import { PRIZE_POOL, COST_PER_DRAW } from './constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DatabaseSetupGuide } from './components/DatabaseSetupGuide';

// --- Helper: Offline Banner ---
const ConnectionStatus = () => {
    if (isSupabaseConfigured) return null;
    return (
        <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-xs font-bold text-center py-1 z-50">
            ⚠️ 警告：数据库未连接。当前为演示模式，数据不会保存，刷新页面即消失。请配置 .env 文件或部署到 Vercel。
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-epe-black via-epe-dark to-purple-900 pt-12">
      <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-epe-purple shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-epe-blue to-epe-purple mb-2">EPE</h1>
            <p className="text-gray-300 text-sm tracking-widest uppercase">Elite Performance Equipment</p>
            <h2 className="text-2xl font-bold mt-4 text-white">
                {isStaffLogin ? '工作人员通道' : '盲盒抽奖系统'}
            </h2>
        </div>

        {!isStaffLogin ? (
            <form onSubmit={handleStudentSubmit} className="space-y-6">
            <div>
                <label className="block text-epe-blue text-sm font-bold mb-2">学员姓名</label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:border-epe-blue focus:ring-1 focus:ring-epe-blue transition-all"
                placeholder="请输入您的姓名"
                required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-epe-purple to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {loading ? '查询中...' : '进入系统'}
            </button>
            </form>
        ) : (
            <form onSubmit={handleStaffSubmit} className="space-y-6">
            <div>
                <label className="block text-red-400 text-sm font-bold mb-2">管理员密码</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-red-500 text-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all"
                placeholder="请输入密码"
                autoFocus
                required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition hover:scale-105 active:scale-95"
            >
                验证身份
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
                className="text-xs text-gray-500 hover:text-white underline cursor-pointer px-4 py-2"
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
            alert("⚠️ 数据库未连接，无法获取真实数据。当前显示为空。");
            setRecords([]);
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('records')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error(error);
            alert("读取记录失败: " + error.message);
        }

        if (data) {
            const formattedData = data.map((item: any) => ({
                ...item,
                id: String(item.id) 
            }));
            setRecords(formattedData as DrawRecord[]);
        }
        setLoading(false);
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
                    alert("✅ 核销成功！");
                    await fetchRecords(); 
                }
            } catch (e: any) {
                alert('系统错误: ' + e.message);
            } finally {
                setProcessingId(null);
            }
        }
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 pt-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-epe-blue">管理后台 - 核销中心</h1>
                    <div className="flex gap-4">
                        <button onClick={fetchRecords} className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500">🔄 刷新列表</button>
                        <button onClick={onBack} className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600">退出后台</button>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-700 text-gray-300">
                                <tr>
                                    <th className="p-4">时间</th>
                                    <th className="p-4">姓名</th>
                                    <th className="p-4">奖品</th>
                                    <th className="p-4">类型</th>
                                    <th className="p-4 text-center">状态</th>
                                    <th className="p-4 text-center">操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={6} className="p-8 text-center">加载中...</td></tr>
                                ) : records.length === 0 ? (
                                    <tr><td colSpan={6} className="p-8 text-center">暂无记录 (数据库为空或未连接)</td></tr>
                                ) : (
                                    records.map(record => (
                                        <tr key={record.id} className="border-b border-gray-700 hover:bg-gray-750">
                                            <td className="p-4 text-sm text-gray-400">{new Date(record.created_at).toLocaleString()}</td>
                                            <td className="p-4 font-medium">{record.user_name}</td>
                                            <td className="p-4 font-bold text-epe-gold">{record.prize_name}</td>
                                            <td className="p-4 text-sm"><span className="px-2 py-1 rounded bg-gray-900">{record.prize_type}</span></td>
                                            <td className="p-4 text-center">
                                                {record.is_redeemed ? 
                                                    <span className="text-green-500 font-bold bg-green-500/10 px-2 py-1 rounded">已核销</span> : 
                                                    <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded">未核销</span>
                                                }
                                            </td>
                                            <td className="p-4 text-center">
                                                {!record.is_redeemed && record.prize_type !== 'EMPTY' && record.prize_type !== 'POINT' && record.prize_type !== 'FRAGMENT' && (
                                                    <button 
                                                        onClick={() => handleRedeem(record.id)}
                                                        disabled={processingId === record.id}
                                                        className={`px-3 py-1 font-bold text-sm rounded transition shadow-lg ${
                                                            processingId === record.id 
                                                            ? 'bg-gray-500 cursor-wait' 
                                                            : 'bg-epe-blue text-black hover:bg-cyan-400 hover:scale-105'
                                                        }`}
                                                    >
                                                        {processingId === record.id ? '处理中...' : '确认核销'}
                                                    </button>
                                                )}
                                                {(record.prize_type === 'EMPTY' || record.prize_type === 'POINT' || record.prize_type === 'FRAGMENT') && (
                                                    <span className="text-gray-600 text-xs">无需核销</span>
                                                )}
                                                {record.is_redeemed && (
                                                    <span className="text-gray-500 text-xs">OK</span>
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
        // If offline, just update local history for visual effect
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
        alert("⚠️ 严重错误：中奖记录保存失败！网络可能不稳定。");
    }

    const { error: userError } = await supabase.from('users').update({
        points: finalPoints,
        fragment_500: currentF500,
        fragment_free: currentFFree
    }).eq('id', user.id);

    if (userError) {
         console.error(userError);
    }

    // Sync UI with final calculated values
    onUpdateUser({ 
        points: finalPoints,
        fragment_500: currentF500,
        fragment_free: currentFFree
    });
    
    // Refresh History from DB to be sure (optional, but good for consistency)
    const tempId = Date.now().toString();
    setHistory(prev => [{...newRecord, id: tempId, created_at: new Date().toISOString()}, ...prev]);
  };

  const reset = () => {
    setState('IDLE');
    setPrize(null);
  };

  return (
    <div className="min-h-screen bg-epe-black text-white flex flex-col items-center relative overflow-hidden pt-12">
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
        <div className="w-full max-w-4xl p-4 grid grid-cols-2 gap-4 z-20 mt-12 md:mt-16">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">500元红包碎片</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-6 h-8 rounded ${i <= user.fragment_500 % 3 && user.fragment_500 > 0 ? 'bg-epe-gold shadow-[0_0_10px_#ffd700]' : 'bg-gray-600'}`}></div>
                    ))}
                </div>
                <span className="text-xs mt-1 text-epe-gold">{user.fragment_500}/3</span>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center">
                <span className="text-xs text-gray-400 mb-1">季度免单碎片</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-6 h-8 rounded ${i <= user.fragment_free % 3 && user.fragment_free > 0 ? 'bg-epe-purple shadow-[0_0_10px_#b026ff]' : 'bg-gray-600'}`}></div>
                    ))}
                </div>
                <span className="text-xs mt-1 text-epe-purple">{user.fragment_free}/3</span>
            </div>
        </div>

        {/* Main Stage */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 p-6">
            
            {/* The Pack */}
            {state !== 'REVEALED' && (
                <div 
                    onClick={handleStart}
                    className={`cursor-pointer relative w-64 h-80 transition-transform duration-300 ${state === 'SHAKING' ? 'animate-shake' : 'hover:scale-105'} ${state === 'OPENING' ? 'opacity-0 scale-150' : 'opacity-100'}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-700 to-black rounded-lg border-2 border-gray-600 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
                        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"></div>
                        
                        <h1 className="text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-epe-gold to-yellow-600 z-10 transform -rotate-12 drop-shadow-lg">EPE</h1>
                        <p className="mt-4 text-gray-400 font-mono text-xs z-10 border border-gray-500 px-2 py-1 rounded">PREMIUM PACK</p>
                        
                        <div className="absolute bottom-4 text-epe-blue text-sm font-bold animate-pulse">
                            {user.points >= COST_PER_DRAW ? `点击开启 (${COST_PER_DRAW}积分)` : `积分不足 (${user.points}/${COST_PER_DRAW})`}
                        </div>
                    </div>
                </div>
            )}

            {/* The Card (Revealed) */}
            {state === 'REVEALED' && prize && (
                <div className="animate-pop w-72 h-[26rem] perspective-1000 relative">
                    <div className={`relative w-full h-full rounded-xl shadow-2xl overflow-hidden border-4 ${prize.type === 'EMPTY' ? 'border-gray-500' : 'border-epe-gold animate-glow'} bg-gray-900 flex flex-col items-center p-6 text-center`}>
                        <div className={`absolute top-0 left-0 w-full h-full opacity-30 bg-gradient-to-b ${prize.rarity.replace('bg-', 'from-')} to-transparent`}></div>
                        
                        <div className="z-10 mt-8 mb-4">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white ${prize.rarity} shadow-lg`}>
                                {prize.rarity === Rarity.LEGENDARY ? '传说' : prize.rarity === Rarity.RARE ? '稀有' : prize.rarity === Rarity.UNCOMMON ? '优秀' : '普通'}
                            </span>
                        </div>

                        <div className="z-10 flex-1 flex flex-col items-center justify-center">
                            <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-md">{prize.name}</h2>
                            <p className="text-gray-300 text-sm">{prize.description}</p>
                            
                            {prize.type !== 'EMPTY' && <div className="mt-6 text-5xl">🎁</div>}
                            {prize.type === 'EMPTY' && <div className="mt-6 text-5xl">💨</div>}
                        </div>

                        <div className="z-10 w-full mt-4">
                            <button 
                                onClick={reset}
                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition shadow-lg"
                            >
                                收下奖励
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* History List */}
        <div className="w-full max-w-2xl bg-gray-900/80 p-4 border-t border-gray-800 z-20 h-48 overflow-y-auto mb-8">
            <h3 className="text-gray-400 text-xs font-bold uppercase mb-2 sticky top-0 bg-gray-900 py-1">近期记录</h3>
            <div className="space-y-2">
                {history.map((rec) => (
                    <div key={rec.id} className="flex justify-between items-center bg-gray-800 p-2 rounded text-sm">
                        <span className="text-gray-400 text-xs">{new Date(rec.created_at).toLocaleTimeString()}</span>
                        <span className={rec.prize_type === 'EMPTY' ? 'text-gray-500' : 'text-white font-bold'}>
                            {rec.prize_name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-black/30 text-gray-400">
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
                // CHANGED: DEFAULT 300 POINTS FOR NEW USERS (FOR TESTING)
                const { data: newUser, error } = await supabase
                    .from('users')
                    .insert([{ name, points: 300 }])
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