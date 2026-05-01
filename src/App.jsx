import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Wallet, 
  TrendingUp, 
  Clock, 
  LayoutGrid, 
  CreditCard,
  Settings as SettingsIcon,
  X,
  Utensils,
  Car,
  ShoppingBag,
  Film,
  Banknote,
  MoreHorizontal,
  ChevronRight,
  PieChart as PieIcon,
  User,
  Target,
  Coins,
  Search,
  Lock,
  Unlock,
  ShieldCheck,
  AlertCircle,
  Trash2,
  Edit3,
  Calendar,
  Zap,
  Activity,
  HandCoins,
  CheckCircle2,
  Palette,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const VERSION = "1.3.0";

// Currency Rates & Config
const CURRENCIES = {
  THB: { symbol: '฿', rate: 1, name: 'Thai Baht' },
  USD: { symbol: '$', rate: 0.027, name: 'US Dollar' },
  EUR: { symbol: '€', rate: 0.025, name: 'Euro' },
  JPY: { symbol: '¥', rate: 4.2, name: 'Japanese Yen' }
};

// Card Skins Config
const CARD_SKINS = {
  midnight: {
    name: 'Midnight Gold',
    bg: 'linear-gradient(135deg, #1e1e2d 0%, #11111d 100%)',
    border: 'rgba(212,175,55,0.3)',
    text: '#d4af37'
  },
  marble: {
    name: 'White Marble',
    bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
    border: 'rgba(0,0,0,0.1)',
    text: '#2c3e50'
  },
  carbon: {
    name: 'Space Carbon',
    bg: 'linear-gradient(135deg, #2c3e50 0%, #000000 100%)',
    border: 'rgba(255,255,255,0.1)',
    text: '#ecf0f1'
  },
  holo: {
    name: 'Holographic',
    bg: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)',
    border: 'rgba(255,255,255,0.5)',
    text: '#2980b9'
  },
  crimson: {
    name: 'Crimson Peak',
    bg: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
    border: 'rgba(255,255,255,0.2)',
    text: '#ffffff'
  }
};

const CATEGORIES = {
  Food: { icon: <Utensils size={20} />, color: '#FF9F43' },
  Transport: { icon: <Car size={20} />, color: '#00CFE8' },
  Shopping: { icon: <ShoppingBag size={20} />, color: '#EA5455' },
  Entertainment: { icon: <Film size={20} />, color: '#7367F0' },
  Income: { icon: <Banknote size={20} />, color: '#28C76F' },
  Other: { icon: <MoreHorizontal size={20} />, color: '#4B4B4B' },
};

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('finura_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('finura_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Alex Rivera',
      cardName: 'FINURA PLATINUM',
      initialBalance: 0,
      pin: '',
      isSecurityEnabled: false,
      budgets: { Food: 5000, Transport: 2000, Shopping: 3000, Entertainment: 1000, Other: 2000 },
      subscriptions: [],
      debts: [],
      currency: 'THB',
      cardSkin: 'midnight'
    };
  });

  const [activeTab, setActiveTab] = useState('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showSkinModal, setShowSkinModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAppLocked, setIsAppLocked] = useState(userProfile.isSecurityEnabled);
  const [enteredPin, setEnteredPin] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Forms
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState('Food');
  const [isIncome, setIsIncome] = useState(false);
  
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subDate, setSubDate] = useState('');

  const [debtPerson, setDebtPerson] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtType, setDebtType] = useState('owe_me');

  useEffect(() => {
    localStorage.setItem('finura_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('finura_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Currency Utils
  const currency = CURRENCIES[userProfile.currency || 'THB'];
  const formatVal = (val) => {
    const converted = val * currency.rate;
    return `${currency.symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: converted < 1 ? 2 : 0 })}`;
  };

  // Calculations
  const totals = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.amount > 0) acc.income += t.amount;
      else acc.expense += Math.abs(t.amount);
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const balance = Number(userProfile.initialBalance) + totals.income - totals.expense;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => b.id - a.id);
  }, [transactions, searchQuery]);

  const trendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dailyExpense = transactions
        .filter(t => t.date === dateStr && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      data.push({ name: dateStr.split('-')[2], amount: dailyExpense * currency.rate });
    }
    return data;
  }, [transactions, currency.rate]);

  const categorySpending = useMemo(() => {
    const data = {};
    transactions.filter(t => t.amount < 0).forEach(t => {
      data[t.category] = (data[t.category] || 0) + Math.abs(t.amount);
    });
    return data;
  }, [transactions]);

  const categoryData = useMemo(() => {
    return Object.keys(categorySpending).map(key => ({ 
      name: key, value: categorySpending[key], color: CATEGORIES[key]?.color || '#ccc' 
    }));
  }, [categorySpending]);

  const saveTransaction = () => {
    if (!newTitle || !newAmount) return;
    const amountNum = parseFloat(newAmount) / currency.rate; // Store as base currency
    const transaction = {
      id: editingTransaction ? editingTransaction.id : Date.now(),
      title: newTitle,
      amount: isIncome ? Math.abs(amountNum) : -Math.abs(amountNum),
      category: isIncome ? 'Income' : newCategory,
      date: editingTransaction ? editingTransaction.date : new Date().toISOString().split('T')[0]
    };
    if (editingTransaction) {
      setTransactions(transactions.map(t => t.id === editingTransaction.id ? transaction : t));
    } else {
      setTransactions([transaction, ...transactions]);
    }
    resetForm();
  };

  const resetForm = () => {
    setNewTitle(''); setNewAmount(''); setNewCategory('Food'); setIsIncome(false);
    setShowAddModal(false); setEditingTransaction(null);
  };

  const openEditModal = (t) => {
    setEditingTransaction(t);
    setNewTitle(t.title);
    setNewAmount(Math.abs(t.amount * currency.rate).toString());
    setNewCategory(t.category === 'Income' ? 'Food' : t.category);
    setIsIncome(t.amount > 0);
    setShowAddModal(true);
  };

  const handlePinSubmit = (val) => {
    const newPin = enteredPin + val;
    if (newPin.length <= 4) {
      setEnteredPin(newPin);
      if (newPin === userProfile.pin) {
        setTimeout(() => { setIsAppLocked(false); setEnteredPin(''); }, 300);
      } else if (newPin.length === 4) {
        setTimeout(() => setEnteredPin(''), 500);
      }
    }
  };

  const currentSkin = CARD_SKINS[userProfile.cardSkin || 'midnight'];

  const renderHome = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="glass-card" style={{ padding: '4px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', height: '48px', width: '100%', outline: 'none' }} />
      </div>

      <motion.div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: currentSkin.bg, border: `1px solid ${currentSkin.border}`, color: currentSkin.text }}>
        <p style={{ opacity: 0.6, fontSize: '14px', marginBottom: '8px' }}>Total Balance</p>
        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '24px' }}>{formatVal(balance)}</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}><p style={{ opacity: 0.6, fontSize: '11px', marginBottom: '4px' }}>Income</p><p style={{ fontWeight: 700 }}>{formatVal(totals.income)}</p></div>
          <div style={{ flex: 1 }}><p style={{ opacity: 0.6, fontSize: '11px', marginBottom: '4px' }}>Expense</p><p style={{ fontWeight: 700 }}>{formatVal(totals.expense)}</p></div>
        </div>
      </motion.div>

      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTransactions.slice(0, 8).map((t) => (
          <motion.div whileTap={{ scale: 0.98 }} key={t.id} onClick={() => openEditModal(t)} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${CATEGORIES[t.category]?.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CATEGORIES[t.category]?.color }}>{CATEGORIES[t.category]?.icon}</div>
            <div style={{ flex: 1 }}><h4 style={{ fontSize: '15px', fontWeight: 600 }}>{t.title}</h4><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.category} • {t.date}</p></div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: t.amount > 0 ? '#28C76F' : 'white' }}>{t.amount > 0 ? '+' : ''}{formatVal(Math.abs(t.amount))}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderStats = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Analytics</h2>
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>Spending Trend ({currency.symbol})</h3>
        <div style={{ width: '100%', height: '180px' }}><ResponsiveContainer><AreaChart data={trendData}><defs><linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs><Tooltip contentStyle={{ background: '#1e1e2d', border: 'none', borderRadius: '8px' }} /><Area type="monotone" dataKey="amount" stroke="var(--primary)" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>Spending by Category</h3>
        <div style={{ width: '100%', height: '200px' }}><ResponsiveContainer><PieChart><Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>
    </motion.div>
  );

  const renderWallet = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
       <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>My Cards</h2>
       <motion.div className="glass-card" style={{ padding: '24px', background: currentSkin.bg, border: `1px solid ${currentSkin.border}`, color: currentSkin.text, height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginBottom: '24px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}><CreditCard size={32} /><span style={{ fontSize: '12px', fontWeight: 700 }}>{userProfile.cardName.toUpperCase()}</span></div>
         <h2 style={{ fontSize: '28px', fontWeight: 700 }}>{formatVal(balance)}</h2>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}><p style={{ fontSize: '16px', fontWeight: 600 }}>{userProfile.name}</p><div style={{ width: '40px', height: '24px', background: currentSkin.text, opacity: 0.3, borderRadius: '4px' }}></div></div>
       </motion.div>

       <button onClick={() => setShowSkinModal(true)} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
         <Palette size={20} color="var(--primary)" /> Change Card Skin
       </button>

       <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
         <button onClick={() => setShowDebtModal(true)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(212,175,55,0.1)', color: 'var(--primary)', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><HandCoins size={20} /> Debts</button>
         <button onClick={() => setShowSubModal(true)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(115,103,240,0.1)', color: '#7367F0', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Calendar size={20} /> Subs</button>
      </div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Settings</h2>
      
      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '16px' }}>Global Currency</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {Object.keys(CURRENCIES).map(code => (
            <button key={code} onClick={() => setUserProfile({...userProfile, currency: code})} style={{ padding: '12px', borderRadius: '12px', background: userProfile.currency === code ? 'var(--primary)' : 'rgba(255,255,255,0.05)', color: userProfile.currency === code ? 'black' : 'white', border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Globe size={16} /> {code}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><ShieldCheck color={userProfile.isSecurityEnabled ? '#28C76F' : 'var(--text-muted)'} /><div><p style={{ fontWeight: 600 }}>Security PIN</p></div></div>
          <button onClick={() => setUserProfile({...userProfile, isSecurityEnabled: !userProfile.isSecurityEnabled})} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: userProfile.isSecurityEnabled ? 'rgba(40,199,111,0.1)' : 'rgba(255,255,255,0.05)', color: userProfile.isSecurityEnabled ? '#28C76F' : 'white', fontWeight: 600 }}>{userProfile.isSecurityEnabled ? 'ON' : 'OFF'}</button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px', marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>User Name</label>
        <input type="text" className="input-field" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} />
      </div>

      <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Finura Global v{VERSION}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="app-container" style={{ padding: '24px 20px 100px 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}><User size={24} /></div><h1 style={{ fontSize: '18px', fontWeight: 800 }}>{userProfile.name}</h1></div>
        <div style={{ display: 'flex', gap: '8px' }}>{userProfile.isSecurityEnabled && (<button onClick={() => setIsAppLocked(true)} className="glass-card" style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={18} /></button>)}<button onClick={() => setActiveTab('settings')} className="glass-card" style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeTab === 'settings' ? 'var(--primary)' : 'white' }}><SettingsIcon size={20} /></button></div>
      </header>

      {activeTab === 'home' && renderHome()}
      {activeTab === 'stats' && renderStats()}
      {activeTab === 'wallet' && renderWallet()}
      {activeTab === 'settings' && renderSettings()}

      <nav className="glass-card" style={{ position: 'fixed', bottom: '24px', left: '20px', right: '20px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'space-around', borderRadius: '24px', zIndex: 100 }}>
        <button onClick={() => setActiveTab('home')} style={{ color: activeTab === 'home' ? 'var(--primary)' : 'var(--text-muted)' }}><LayoutGrid size={24} /></button>
        <button onClick={() => setActiveTab('stats')} style={{ color: activeTab === 'stats' ? 'var(--primary)' : 'var(--text-muted)' }}><Activity size={24} /></button>
        <div style={{ width: '48px' }}></div>
        <button onClick={() => setActiveTab('wallet')} style={{ color: activeTab === 'wallet' ? 'var(--primary)' : 'var(--text-muted)' }}><Wallet size={24} /></button>
        <button onClick={() => setActiveTab('settings')} style={{ color: activeTab === 'settings' ? 'var(--primary)' : 'var(--text-muted)' }}><SettingsIcon size={24} /></button>
      </nav>

      <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ position: 'fixed', bottom: '36px', left: '50%', transform: 'translateX(-50%)', width: '60px', height: '60px', borderRadius: '20px', zIndex: 101, padding: 0 }}><Plus size={32} strokeWidth={3} /></button>

      {/* Modals */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="glass-card" style={{ width: '100%', padding: '32px 24px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h2>{editingTransaction ? 'Edit' : 'Add'} ({currency.symbol})</h2><button onClick={resetForm}><X size={24} /></button></div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}><button onClick={() => setIsIncome(false)} style={{ flex: 1, padding: '12px', background: !isIncome ? 'var(--primary)' : 'transparent', color: !isIncome ? 'black' : 'white', borderRadius: '12px' }}>Expense</button><button onClick={() => setIsIncome(true)} style={{ flex: 1, padding: '12px', background: isIncome ? '#28C76F' : 'transparent', color: 'white', borderRadius: '12px' }}>Income</button></div>
              <input type="text" className="input-field" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ marginBottom: '16px' }} />
              <input type="number" className="input-field" placeholder={`Amount in ${userProfile.currency}`} value={newAmount} onChange={(e) => setNewAmount(e.target.value)} style={{ marginBottom: '16px' }} />
              {!isIncome && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>{Object.keys(CATEGORIES).filter(c => c !== 'Income').map(cat => (<button key={cat} onClick={() => setNewCategory(cat)} style={{ padding: '12px 8px', borderRadius: '12px', background: newCategory === cat ? CATEGORIES[cat].color : 'transparent', color: newCategory === cat ? 'white' : 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>{CATEGORIES[cat].icon}</button>))}</div>)}
              <button onClick={saveTransaction} className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>Save</button>
            </motion.div>
          </motion.div>
        )}

        {showSkinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
             <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="glass-card" style={{ width: '100%', padding: '32px 24px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h3>Select Card Skin</h3><button onClick={() => setShowSkinModal(false)}><X size={24} /></button></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.keys(CARD_SKINS).map(key => (
                    <button key={key} onClick={() => { setUserProfile({...userProfile, cardSkin: key}); setShowSkinModal(false); }} style={{ width: '100%', padding: '20px', borderRadius: '16px', background: CARD_SKINS[key].bg, border: userProfile.cardSkin === key ? `2px solid var(--primary)` : '1px solid rgba(255,255,255,0.1)', color: CARD_SKINS[key].text, fontWeight: 700, textAlign: 'left' }}>
                      {CARD_SKINS[key].name}
                    </button>
                  ))}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
