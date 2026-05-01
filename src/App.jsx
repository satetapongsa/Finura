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
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

const VERSION = "1.2.0";

// Categories Definition
const CATEGORIES = {
  Food: { icon: <Utensils size={20} />, color: '#FF9F43' },
  Transport: { icon: <Car size={20} />, color: '#00CFE8' },
  Shopping: { icon: <ShoppingBag size={20} />, color: '#EA5455' },
  Entertainment: { icon: <Film size={20} />, color: '#7367F0' },
  Income: { icon: <Banknote size={20} />, color: '#28C76F' },
  Other: { icon: <MoreHorizontal size={20} />, color: '#4B4B4B' },
};

const INITIAL_TRANSACTIONS = [
  { id: 1, title: 'Welcome Bonus', amount: 1000, category: 'Income', date: '2026-05-01' },
];

function App() {
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('finura_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });
  
  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('finura_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Alex Rivera',
      cardName: 'FINURA PLATINUM',
      initialBalance: 0,
      savingsGoal: 100000,
      pin: '',
      isSecurityEnabled: false,
      budgets: { Food: 5000, Transport: 2000, Shopping: 3000, Entertainment: 1000, Other: 2000 },
      subscriptions: [],
      debts: [] // { id, person, amount, type: 'owe_me' | 'i_owe', resolved: false }
    };
  });

  const [activeTab, setActiveTab] = useState('home');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
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

  // Calculations
  const totals = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.amount > 0) acc.income += t.amount;
      else acc.expense += Math.abs(t.amount);
      return acc;
    }, { income: 0, expense: 0 });
  }, [transactions]);

  const balance = Number(userProfile.initialBalance) + totals.income - totals.expense;
  const totalSubMonthly = (userProfile.subscriptions || []).reduce((sum, s) => sum + Number(s.amount), 0);

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
      data.push({ name: dateStr.split('-')[2], amount: dailyExpense });
    }
    return data;
  }, [transactions]);

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
    const amountNum = parseFloat(newAmount);
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

  const addSubscription = () => {
    if (!subName || !subAmount) return;
    const newSub = { id: Date.now(), name: subName, amount: subAmount, date: subDate };
    setUserProfile({ ...userProfile, subscriptions: [...(userProfile.subscriptions || []), newSub] });
    setSubName(''); setSubAmount(''); setSubDate(''); setShowSubModal(false);
  };

  const addDebt = () => {
    if (!debtPerson || !debtAmount) return;
    const newDebt = { id: Date.now(), person: debtPerson, amount: debtAmount, type: debtType, resolved: false };
    setUserProfile({ ...userProfile, debts: [...(userProfile.debts || []), newDebt] });
    setDebtPerson(''); setDebtAmount(''); setShowDebtModal(false);
  };

  const resolveDebt = (id) => {
    setUserProfile({
      ...userProfile,
      debts: userProfile.debts.map(d => d.id === id ? { ...d, resolved: !d.resolved } : d)
    });
  };

  const deleteDebt = (id) => {
    setUserProfile({ ...userProfile, debts: userProfile.debts.filter(d => d.id !== id) });
  };

  const deleteSub = (id) => {
    setUserProfile({ ...userProfile, subscriptions: userProfile.subscriptions.filter(s => s.id !== id) });
  };

  const deleteTransaction = (id) => {
    if (window.confirm('ลบรายการนี้ใช่หรือไม่?')) {
      setTransactions(transactions.filter(t => t.id !== id));
      resetForm();
    }
  };

  const resetForm = () => {
    setNewTitle(''); setNewAmount(''); setNewCategory('Food'); setIsIncome(false);
    setShowAddModal(false); setEditingTransaction(null);
  };

  const openEditModal = (t) => {
    setEditingTransaction(t);
    setNewTitle(t.title);
    setNewAmount(Math.abs(t.amount).toString());
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

  // Views
  if (isAppLocked) {
    return (
      <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px auto', color: 'black' }}><Lock size={40} /></div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', textAlign: 'center' }}>Finura Secure</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '48px', textAlign: 'center' }}>Enter PIN to unlock</p>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '64px', justifyContent: 'center' }}>
            {[1, 2, 3, 4].map((i) => (<div key={i} style={{ width: '16px', height: '16px', borderRadius: '50%', background: enteredPin.length >= i ? 'var(--primary)' : 'rgba(255,255,255,0.1)' }}></div>))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (<button key={n} onClick={() => handlePinSubmit(n.toString())} className="glass-card" style={{ width: '72px', height: '72px', borderRadius: '50%', fontSize: '24px', fontWeight: 700, border: 'none', color: 'white' }}>{n}</button>))}
            <div /><button key={0} onClick={() => handlePinSubmit('0')} className="glass-card" style={{ width: '72px', height: '72px', borderRadius: '50%', fontSize: '24px', fontWeight: 700, border: 'none', color: 'white' }}>0</button>
            <button onClick={() => setEnteredPin('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)' }}><X /></button>
          </div>
        </motion.div>
      </div>
    );
  }

  const renderHome = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="glass-card" style={{ padding: '4px 16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Search size={18} color="var(--text-muted)" />
        <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ background: 'none', border: 'none', color: 'white', height: '48px', width: '100%', outline: 'none' }} />
      </div>

      <motion.div className="glass-card" style={{ padding: '24px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(212,175,55,0.15) 0%, rgba(255,255,255,0.05) 100%)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '8px' }}>Total Balance</p>
        <h2 style={{ fontSize: '36px', fontWeight: 800, marginBottom: '24px' }}>฿{balance.toLocaleString()}</h2>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}><p style={{ color: '#28C76F', fontSize: '12px', marginBottom: '4px' }}>Income</p><p style={{ fontWeight: 700 }}>฿{totals.income.toLocaleString()}</p></div>
          <div style={{ flex: 1 }}><p style={{ color: '#EA5455', fontSize: '12px', marginBottom: '4px' }}>Expense</p><p style={{ fontWeight: 700 }}>฿{totals.expense.toLocaleString()}</p></div>
        </div>
      </motion.div>

      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Recent Activity</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredTransactions.slice(0, 5).map((t) => (
          <motion.div whileTap={{ scale: 0.98 }} key={t.id} onClick={() => openEditModal(t)} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${CATEGORIES[t.category]?.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: CATEGORIES[t.category]?.color }}>{CATEGORIES[t.category]?.icon}</div>
            <div style={{ flex: 1 }}><h4 style={{ fontSize: '15px', fontWeight: 600 }}>{t.title}</h4><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.category} • {t.date}</p></div>
            <p style={{ fontSize: '16px', fontWeight: 700, color: t.amount > 0 ? '#28C76F' : 'white' }}>{t.amount > 0 ? '+' : ''}{t.amount.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderStats = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Analytics</h2>
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>Spending Trend (7 Days)</h3>
        <div style={{ width: '100%', height: '180px' }}><ResponsiveContainer><AreaChart data={trendData}><defs><linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/><stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/></linearGradient></defs><Tooltip contentStyle={{ background: '#1e1e2d', border: 'none', borderRadius: '8px' }} /><Area type="monotone" dataKey="amount" stroke="var(--primary)" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
      </div>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>By Category</h3>
        <div style={{ width: '100%', height: '200px' }}><ResponsiveContainer><PieChart><Pie data={categoryData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">{categoryData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>
    </motion.div>
  );

  const renderWallet = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
         <button onClick={() => setShowDebtModal(true)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.3)', color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><HandCoins size={20} /> Add Debt</button>
         <button onClick={() => setShowSubModal(true)} style={{ flex: 1, padding: '16px', borderRadius: '16px', background: 'rgba(115,103,240,0.1)', border: '1px solid rgba(115,103,240,0.3)', color: '#7367F0', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Calendar size={20} /> Add Sub</button>
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Debts & Loans (หนี้สิน)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
        {(userProfile.debts || []).map(debt => (
          <div key={debt.id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', opacity: debt.resolved ? 0.5 : 1 }}>
            <div style={{ color: debt.type === 'owe_me' ? '#28C76F' : '#EA5455' }}><HandCoins size={24} /></div>
            <div style={{ flex: 1 }}>
               <h4 style={{ fontWeight: 700 }}>{debt.person}</h4>
               <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{debt.type === 'owe_me' ? 'Owes you' : 'You owe them'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
               <p style={{ fontWeight: 700, color: debt.type === 'owe_me' ? '#28C76F' : 'white' }}>฿{Number(debt.amount).toLocaleString()}</p>
               <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                 <button onClick={() => resolveDebt(debt.id)} style={{ background: 'none', border: 'none', color: debt.resolved ? '#28C76F' : 'var(--text-muted)' }}><CheckCircle2 size={18} /></button>
                 <button onClick={() => deleteDebt(debt.id)} style={{ background: 'none', border: 'none', color: '#EA5455' }}><Trash2 size={18} /></button>
               </div>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Subscriptions</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {(userProfile.subscriptions || []).map(sub => (
          <div key={sub.id} className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ color: '#7367F0' }}><Zap size={24} /></div>
            <div style={{ flex: 1 }}><h4 style={{ fontWeight: 700 }}>{sub.name}</h4><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due day {sub.date}</p></div>
            <div style={{ textAlign: 'right' }}><p style={{ fontWeight: 700 }}>฿{Number(sub.amount).toLocaleString()}</p><button onClick={() => deleteSub(sub.id)} style={{ background: 'none', border: 'none', color: '#EA5455', fontSize: '12px' }}>Remove</button></div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderSettings = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px' }}>Settings</h2>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><ShieldCheck color={userProfile.isSecurityEnabled ? '#28C76F' : 'var(--text-muted)'} /><div><p style={{ fontWeight: 600 }}>Security PIN</p><p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{userProfile.isSecurityEnabled ? 'Enabled' : 'Disabled'}</p></div></div>
          <button onClick={() => setUserProfile({...userProfile, isSecurityEnabled: !userProfile.isSecurityEnabled})} style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', background: userProfile.isSecurityEnabled ? 'rgba(40,199,111,0.1)' : 'rgba(255,255,255,0.05)', color: userProfile.isSecurityEnabled ? '#28C76F' : 'white', fontWeight: 600 }}>{userProfile.isSecurityEnabled ? 'ON' : 'OFF'}</button>
        </div>
      </div>
      <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>Finura Financial App</p>
        <p style={{ fontSize: '14px', fontWeight: 700, textAlign: 'center', color: 'var(--primary)' }}>Version {VERSION}</p>
      </div>
      <button onClick={() => { if(window.confirm('Reset everything?')) { setTransactions([]); setUserProfile({...userProfile, debts: [], subscriptions: []}); localStorage.clear(); window.location.reload(); } }} style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'rgba(234,84,85,0.1)', color: '#EA5455', border: '1px solid rgba(234,84,85,0.2)', fontWeight: 700 }}>Reset Data</button>
    </motion.div>
  );

  return (
    <div className="app-container" style={{ padding: '24px 20px 100px 20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black' }}><User size={24} /></div><div><h1 style={{ fontSize: '18px', fontWeight: 800 }}>{userProfile.name}</h1></div></div>
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

      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="glass-card" style={{ width: '100%', padding: '32px 24px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h2>{editingTransaction ? 'Edit' : 'Add'}</h2><button onClick={resetForm}><X size={24} /></button></div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}><button onClick={() => setIsIncome(false)} style={{ flex: 1, padding: '12px', background: !isIncome ? 'var(--primary)' : 'transparent', color: !isIncome ? 'black' : 'white', borderRadius: '12px' }}>Expense</button><button onClick={() => setIsIncome(true)} style={{ flex: 1, padding: '12px', background: isIncome ? '#28C76F' : 'transparent', color: 'white', borderRadius: '12px' }}>Income</button></div>
              <input type="text" className="input-field" placeholder="Title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} style={{ marginBottom: '16px' }} />
              <input type="number" className="input-field" placeholder="Amount" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} style={{ marginBottom: '16px' }} />
              {!isIncome && (<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>{Object.keys(CATEGORIES).filter(c => c !== 'Income').map(cat => (<button key={cat} onClick={() => setNewCategory(cat)} style={{ padding: '12px 8px', borderRadius: '12px', background: newCategory === cat ? CATEGORIES[cat].color : 'transparent', color: newCategory === cat ? 'white' : 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>{CATEGORIES[cat].icon}</button>))}</div>)}
              <button onClick={saveTransaction} className="btn-primary" style={{ width: '100%', marginTop: '24px' }}>Save</button>
            </motion.div>
          </motion.div>
        )}

        {showDebtModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
             <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="glass-card" style={{ width: '100%', padding: '32px 24px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h3>Add Debt/Loan</h3><button onClick={() => setShowDebtModal(false)}><X size={24} /></button></div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                  <button onClick={() => setDebtType('owe_me')} style={{ flex: 1, padding: '12px', background: debtType === 'owe_me' ? '#28C76F' : 'transparent', borderRadius: '12px' }}>They owe me</button>
                  <button onClick={() => setDebtType('i_owe')} style={{ flex: 1, padding: '12px', background: debtType === 'i_owe' ? '#EA5455' : 'transparent', borderRadius: '12px' }}>I owe them</button>
                </div>
                <input type="text" className="input-field" placeholder="Person Name" value={debtPerson} onChange={(e) => setDebtPerson(e.target.value)} style={{ marginBottom: '16px' }} />
                <input type="number" className="input-field" placeholder="Amount" value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)} style={{ marginBottom: '16px' }} />
                <button onClick={addDebt} className="btn-primary" style={{ width: '100%' }}>Add Debt Record</button>
             </motion.div>
          </motion.div>
        )}

        {showSubModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
             <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="glass-card" style={{ width: '100%', padding: '32px 24px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}><h3>Subscription</h3><button onClick={() => setShowSubModal(false)}><X size={24} /></button></div>
                <input type="text" className="input-field" placeholder="Name" value={subName} onChange={(e) => setSubName(e.target.value)} style={{ marginBottom: '16px' }} />
                <input type="number" className="input-field" placeholder="Amount" value={subAmount} onChange={(e) => setSubAmount(e.target.value)} style={{ marginBottom: '16px' }} />
                <input type="number" className="input-field" placeholder="Billing Day" value={subDate} onChange={(e) => setSubDate(e.target.value)} style={{ marginBottom: '16px' }} />
                <button onClick={addSubscription} className="btn-primary" style={{ width: '100%' }}>Save Subscription</button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
