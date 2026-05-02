import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Home, 
  PieChart as AssetsIcon, 
  FileText, 
  Bell, 
  Menu,
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ChevronRight,
  Search,
  Lock,
  Unlock,
  X,
  Calendar,
  Wallet,
  Settings,
  MoreHorizontal,
  TrendingUp,
  Clock,
  ShoppingCart,
  Eye,
  EyeOff,
  Filter,
  TrendingDown,
  Activity,
  GripVertical,
  ShieldCheck,
  CheckCircle2,
  KeyRound,
  User,
  Download,
  Share2,
  PieChart,
  BarChart3,
  HelpCircle,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, LineChart, Line } from 'recharts';

// Import logo from local assets
import AppLogo from './assets/logo.png';

const VERSION = "2.9.2";

const INITIAL_MARKET = [
  { id: 'nvda', name: 'NVIDIA Corp.', symbol: 'NVDA', price: 875.28, change: 3.42, vol: '24.5M', logo: 'https://logo.clearbit.com/nvidia.com' },
  { id: 'spy', name: 'SPDR S&P 500 ETF', symbol: 'SPY', price: 512.12, change: 0.12, vol: '68.2M', logo: 'https://logo.clearbit.com/ssga.com' },
  { id: 'ivv', name: 'iShares Core S&P 500', symbol: 'IVV', price: 514.45, change: 0.13, vol: '12.1M', logo: 'https://logo.clearbit.com/blackrock.com' },
  { id: 'voo', name: 'Vanguard S&P 500', symbol: 'VOO', price: 470.32, change: 0.11, vol: '15.4M', logo: 'https://logo.clearbit.com/vanguard.com' },
  { id: 'btc', name: 'Bitcoin', symbol: 'BTC', price: 64231.50, change: 0.84, vol: '32.1B', logo: 'https://logo.clearbit.com/bitcoin.org' },
  { id: 'aapl', name: 'Apple Inc.', symbol: 'AAPL', price: 172.62, change: 1.25, vol: '45.8M', logo: 'https://logo.clearbit.com/apple.com' },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showBalance, setShowBalance] = useState(true);
  const [marketData, setMarketData] = useState(INITIAL_MARKET);
  const [priceFlash, setPriceFlash] = useState({});

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('finura_transactions');
      return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });
  
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('finura_profile');
      const parsed = saved ? JSON.parse(saved) : null;
      return {
        name: parsed?.name || 'Satetapong',
        totalWealth: parsed?.totalWealth || 1000000,
        pin: parsed?.pin || '123456',
        isSecurityEnabled: parsed?.isSecurityEnabled ?? true,
        holdings: parsed?.holdings || {}
      };
    } catch(e) {
      return { name: 'Satetapong', totalWealth: 1000000, pin: '123456', isSecurityEnabled: true, holdings: {} };
    }
  });

  const [isAppLocked, setIsAppLocked] = useState(true);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinMode, setPinMode] = useState('unlock'); 
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeType, setTradeType] = useState('BUY');
  const [tradeAmount, setTradeAmount] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);

  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState({ text: '', color: '' });

  useEffect(() => {
    localStorage.setItem('finura_transactions', JSON.stringify(transactions));
    localStorage.setItem('finura_profile', JSON.stringify(userProfile));
  }, [transactions, userProfile]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(item => {
        const move = (Math.random() - 0.49) * (item.price * 0.0005);
        const newPrice = item.price + move;
        setPriceFlash(f => ({ ...f, [item.id]: move > 0 ? 'up' : 'down' }));
        setTimeout(() => setPriceFlash(f => ({ ...f, [item.id]: null })), 500);
        return { ...item, price: newPrice, change: item.change + (move/100) };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const cashBalance = useMemo(() => {
    const tradeImpact = transactions.reduce((acc, t) => acc + (t.impact || 0), 0);
    return (userProfile.totalWealth || 0) + tradeImpact;
  }, [transactions, userProfile.totalWealth]);

  const handlePinInput = (digit) => {
    const newPin = enteredPin + digit;
    if (newPin.length <= 6) {
      setEnteredPin(newPin);
      if (newPin.length === 6) {
        if (newPin === userProfile.pin) {
          if (pinMode === 'unlock') {
            setTimeout(() => { setIsAppLocked(false); setEnteredPin(''); }, 200);
          } else {
            finalizeTrade();
          }
        } else {
          setTimeout(() => setEnteredPin(''), 500);
        }
      }
    }
  };

  const finalizeTrade = () => {
    const price = selectedStock.price;
    const amount = Number(tradeAmount);
    const units = amount / price;
    const symbol = selectedStock.symbol;
    const impact = tradeType === 'BUY' ? -amount : amount;
    const unitImpact = tradeType === 'BUY' ? units : -units;

    const t = {
      id: Date.now(),
      title: `${tradeType} ${symbol}`,
      symbol: symbol,
      type: tradeType,
      amount: amount,
      units: units.toFixed(4),
      impact: impact,
      price: price.toFixed(2),
      date: new Date().toLocaleString(),
      ref: Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    const currentHoldings = userProfile.holdings || {};
    const currentUnits = (currentHoldings[symbol]?.units || 0);
    const newUnits = Math.max(0, currentUnits + unitImpact);
    const newHoldings = { ...currentHoldings, [symbol]: { units: newUnits, avgPrice: price } };

    setTransactions([t, ...transactions]);
    setUserProfile({ ...userProfile, holdings: newHoldings });
    setLastReceipt(t);
    
    setTimeout(() => { 
      setPinMode('unlock'); setEnteredPin(''); setIsAppLocked(false);
      setSelectedStock(null); setShowReceipt(true); setTradeAmount('');
    }, 200);
  };

  const validateTrade = () => {
    const amount = Number(tradeAmount);
    if (!amount || amount <= 0) return { valid: false, msg: 'กรุณาใส่จำนวนเงิน' };
    if (tradeType === 'BUY') {
      if (amount > cashBalance) return { valid: false, msg: 'ยอดเงินคงเหลือไม่พอ' };
    } else {
      const ownedUnits = (userProfile.holdings || {})[selectedStock?.symbol]?.units || 0;
      const unitsToSell = amount / (selectedStock?.price || 1);
      if (unitsToSell > ownedUnits) return { valid: false, msg: 'จำนวนหุ้นที่คุณถือไม่พอขาย' };
    }
    return { valid: true };
  };

  const handleChangePin = () => {
    if (currentPinInput !== userProfile.pin) {
      setPinMessage({ text: 'รหัสปัจจุบันไม่ถูกต้อง', color: '#EA5455' });
      return;
    }
    if (newPinInput.length !== 6) {
      setPinMessage({ text: 'รหัสใหม่ต้องมี 6 หลัก', color: '#EA5455' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinMessage({ text: 'รหัสใหม่ไม่ตรงกัน', color: '#EA5455' });
      return;
    }
    setUserProfile({ ...userProfile, pin: newPinInput });
    setPinMessage({ text: 'เปลี่ยนรหัสสำเร็จ!', color: '#10B981' });
    setCurrentPinInput(''); setNewPinInput(''); setConfirmPinInput('');
  };

  const renderHome = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={AppLogo} style={{ width: '40px', height: '40px', borderRadius: '10px' }} />
            <div>
               <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>Finura</h1>
               <p style={{ color: '#64748B', fontSize: '11px', fontWeight: 700 }}>WEALTH TERMINAL</p>
            </div>
         </div>
         <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ background: 'white', padding: '10px', borderRadius: '12px', border: '1px solid #F1F5F9' }}><Bell size={18} color="#64748B" /></div>
         </div>
      </header>

      <div className="section-group">
         <div className="section-header">
            <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>WATCHLIST</h3>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#004CC7' }}>LIVE TICKER</span>
         </div>
         <Reorder.Group axis="y" values={marketData} onReorder={setMarketData}>
            {marketData.map(item => (
              <Reorder.Item key={item.id} value={item} style={{ listStyle: 'none' }}>
                 <div className="list-item" onClick={() => setSelectedStock(item)} style={{ cursor: 'pointer', paddingRight: '12px' }}>
                    <div style={{ color: '#CBD5E0' }}><GripVertical size={16} /></div>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                       <img src={item.logo} style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ flex: 1, marginLeft: '12px' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h4 style={{ fontWeight: 800, fontSize: '15px' }}>{item.symbol}</h4>
                          <span style={{ fontSize: '9px', fontWeight: 800, background: '#F1F5F9', color: '#64748B', padding: '2px 6px', borderRadius: '4px' }}>{item.vol}</span>
                       </div>
                       <p style={{ fontSize: '11px', color: '#64748B' }}>{item.name}</p>
                    </div>
                    
                    {/* Sparkline in front of price */}
                    <div style={{ width: '50px', height: '25px', marginRight: '8px' }}>
                       <ResponsiveContainer>
                          <LineChart data={[...Array(10)].map(() => ({ v: Math.random() }))}>
                             <Line type="monotone" dataKey="v" stroke={item.change > 0 ? '#10B981' : '#EF4444'} strokeWidth={2} dot={false} />
                          </LineChart>
                       </ResponsiveContainer>
                    </div>

                    <div style={{ textAlign: 'right', minWidth: '70px' }}>
                       <p style={{ fontWeight: 800, fontSize: '15px', color: priceFlash[item.id] === 'up' ? '#10B981' : priceFlash[item.id] === 'down' ? '#EF4444' : '#0F172A' }}>
                          {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </p>
                       <p style={{ fontSize: '10px', fontWeight: 700, color: item.change > 0 ? '#10B981' : '#EF4444' }}>{item.change > 0 ? '+' : ''}{item.change.toFixed(2)}%</p>
                    </div>
                 </div>
              </Reorder.Item>
            ))}
         </Reorder.Group>
      </div>
    </motion.div>
  );

  const renderAssets = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px' }}>
      <header style={{ marginBottom: '24px' }}>
         <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A' }}>My Portfolio</h1>
      </header>

      <div style={{ background: 'linear-gradient(135deg, #004CC7 0%, #00368C 100%)', borderRadius: '28px', padding: '30px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(0,76,199,0.25)', marginBottom: '32px' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
               <p style={{ opacity: 0.7, fontSize: '12px', fontWeight: 600 }}>AVAILABLE BALANCE</p>
               <h2 style={{ fontSize: '36px', fontWeight: 800, marginTop: '4px' }}>{showBalance ? cashBalance.toLocaleString() : '••••••'} <span style={{ fontSize: '18px', fontWeight: 400 }}>฿</span></h2>
            </div>
            <img src={AppLogo} style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.2)' }} />
         </div>
         <div style={{ marginTop: '30px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={18} /></div>
            <p style={{ fontSize: '14px', fontWeight: 700 }}>{userProfile.name}</p>
            <button onClick={() => setShowBalance(!showBalance)} style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', padding: '8px', borderRadius: '12px', color: 'white' }}>{showBalance ? <Eye size={18} /> : <EyeOff size={18} />}</button>
         </div>
      </div>

      <div className="section-group">
         <div className="section-header"><h3 style={{ fontSize: '14px', fontWeight: 800, color: '#64748B' }}>MY HOLDINGS</h3></div>
         {Object.keys(userProfile.holdings || {}).filter(s => userProfile.holdings[s].units > 0).length === 0 ? (
           <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}><PieChart size={40} style={{ opacity: 0.1, marginBottom: '12px' }} /><p style={{ fontSize: '14px' }}>Start trading to see holdings</p></div>
         ) : (
           Object.entries(userProfile.holdings || {}).map(([symbol, data]) => {
             if (data.units <= 0) return null;
             const currentPrice = marketData.find(m => m.symbol === symbol)?.price || 0;
             return (
               <div key={symbol} className="list-item">
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BarChart3 size={20} color="#004CC7" /></div>
                  <div style={{ flex: 1 }}>
                     <h4 style={{ fontWeight: 800 }}>{symbol}</h4>
                     <p style={{ fontSize: '11px', color: '#64748B' }}>{data.units.toFixed(4)} Units</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <p style={{ fontWeight: 800 }}>{(data.units * currentPrice).toLocaleString()} ฿</p>
                  </div>
               </div>
             );
           })
         )}
      </div>
    </motion.div>
  );

  if (isAppLocked) {
    return (
      <div className="app-container" style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'white' }}>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img src={AppLogo} style={{ width: '80px', height: '80px', borderRadius: '24px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(0,76,199,0.15)' }} />
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>Finura Wealth</h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '48px' }}>Identity Verification</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '60px' }}>{[1, 2, 3, 4, 5, 6].map(i => (<div key={i} style={{ width: '12px', height: '12px', borderRadius: '50%', background: enteredPin.length >= i ? '#004CC7' : '#E2E8F0' }}></div>))}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (<button key={n} onClick={() => handlePinInput(n.toString())} style={{ width: '72px', height: '72px', borderRadius: '24px', background: '#F8FAFC', border: '1px solid #F1F5F9', fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>{n}</button>))}
            <div /><button onClick={() => handlePinInput('0')} style={{ width: '72px', height: '72px', borderRadius: '24px', background: '#F8FAFC', border: '1px solid #F1F5F9', fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>0</button>
            <button onClick={() => setEnteredPin('')} style={{ background: 'none', border: 'none', color: '#94A3B8' }}><X /></button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {activeTab === 'home' && renderHome()}
      {activeTab === 'assets' && renderAssets()}
      {activeTab === 'history' && (
        <div style={{ padding: '20px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginBottom: '24px' }}>Order History</h1>
          <div className="section-group">
            {transactions.map(t => (
              <div key={t.id} className="list-item">
                 <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: t.type === 'BUY' ? '#EBF8FF' : '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{t.type === 'BUY' ? <ShoppingCart size={18} color="#004CC7" /> : <ProfitIcon size={18} color="#10B981" />}</div>
                 <div style={{ flex: 1 }}><h4 style={{ fontWeight: 800 }}>{t.title}</h4><p style={{ fontSize: '11px', color: '#64748B' }}>{t.date}</p></div>
                 <div style={{ textAlign: 'right' }}><p style={{ fontWeight: 800, color: t.type === 'BUY' ? '#EF4444' : '#10B981' }}>{t.type === 'BUY' ? '-' : '+'}{Math.abs(t.amount || 0).toLocaleString()} ฿</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'more' && (
        <div style={{ padding: '20px' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
             <img src={AppLogo} style={{ width: '80px', height: '80px', borderRadius: '24px', marginBottom: '16px' }} />
             <h2 style={{ fontSize: '22px', fontWeight: 800 }}>{userProfile.name}</h2>
             <p style={{ color: '#64748B', fontSize: '13px' }}>Enterprise Wealth Client</p>
          </div>
          <div className="section-group">
             <div className="section-header"><h3 style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>PROFILE SETTINGS</h3></div>
             <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}><label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>FULL NAME</label><input className="input-field" value={userProfile.name} onChange={(e) => setUserProfile({...userProfile, name: e.target.value})} /></div>
             <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}><label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}>INITIAL CAPITAL (฿)</label><input type="number" className="input-field" value={userProfile.totalWealth} onChange={(e) => setUserProfile({...userProfile, totalWealth: Number(e.target.value)})} /></div>
          </div>
          <div className="section-group">
             <div className="section-header"><h3 style={{ fontSize: '13px', fontWeight: 800, color: '#64748B' }}>SECURITY</h3></div>
             <div className="list-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                   <input type="password" maxLength={6} className="input-field" placeholder="Current PIN" value={currentPinInput} onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g,''))} />
                   <input type="password" maxLength={6} className="input-field" placeholder="New PIN" value={newPinInput} onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g,''))} />
                   <input type="password" maxLength={6} className="input-field" placeholder="Confirm PIN" value={confirmPinInput} onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g,''))} />
                   {pinMessage.text && <p style={{ fontSize: '12px', color: pinMessage.color, fontWeight: 700, textAlign: 'center' }}>{pinMessage.text}</p>}
                   <button onClick={handleChangePin} className="btn-primary">Update Security PIN</button>
                </div>
             </div>
          </div>
          <p style={{ textAlign: 'center', color: '#64748B', fontSize: '12px', marginTop: '20px' }}>Finura Enterprise v{VERSION}</p>
        </div>
      )}

      {/* TRADE MODAL */}
      <AnimatePresence>
        {selectedStock && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', alignItems: 'flex-end' }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} style={{ width: '100%', background: 'white', borderRadius: '32px 32px 0 0', padding: '32px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}><div onClick={() => setSelectedStock(null)}><X size={24} /></div><h2 style={{ fontSize: '18px', fontWeight: 800 }}>Trade Terminal</h2><div /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}><img src={selectedStock.logo} style={{ width: '48px', height: '48px', objectFit: 'contain' }} /><div><h3 style={{ fontSize: '20px', fontWeight: 800 }}>{selectedStock.symbol}</h3><p style={{ fontSize: '13px', color: '#64748B' }}>{selectedStock.name}</p></div><div style={{ marginLeft: 'auto', textAlign: 'right' }}><p style={{ fontSize: '20px', fontWeight: 800 }}>{selectedStock.price.toFixed(2)}</p></div></div>
              <div style={{ height: '140px', background: '#F8FAFC', borderRadius: '24px', marginBottom: '24px', padding: '12px' }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={[...Array(10)].map(() => ({v: Math.random()}))}><Area type="monotone" dataKey="v" stroke="#004CC7" fill="#004CC7" fillOpacity={0.1} strokeWidth={3} /></AreaChart></ResponsiveContainer></div>
              <div className="tab-container" style={{ marginBottom: '24px' }}><div onClick={() => setTradeType('BUY')} className={`tab-item ${tradeType === 'BUY' ? 'active' : ''}`}>BUY</div><div onClick={() => setTradeType('SELL')} className={`tab-item ${tradeType === 'SELL' ? 'active' : ''}`}>SELL</div></div>
              <input type="number" className="input-field" placeholder="0.00" style={{ fontSize: '26px', fontWeight: 800, textAlign: 'center' }} value={tradeAmount} onChange={(e) => setTradeAmount(e.target.value)} />
              {tradeAmount && !validateTrade().valid && <p style={{ fontSize: '12px', color: '#EF4444', marginTop: '12px', textAlign: 'center' }}>⚠️ {validateTrade().msg}</p>}
              <button disabled={!validateTrade().valid} onClick={() => { setPinMode('transaction'); setIsAppLocked(true); setEnteredPin(''); }} className="btn-primary" style={{ width: '100%', marginTop: '24px', height: '64px', opacity: validateTrade().valid ? 1 : 0.5, background: tradeType === 'BUY' ? '#004CC7' : '#EF4444' }}>Confirm {tradeType}</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{showReceipt && lastReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
             <div style={{ background: 'white', borderRadius: '32px', width: '100%', maxWidth: '380px', padding: '32px', textAlign: 'center' }}>
                <CheckCircle2 size={64} color="#10B981" style={{ marginBottom: '24px' }} />
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Trade Success</h2>
                <p style={{ color: '#64748B', marginBottom: '32px' }}>Your order has been executed.</p>
                <button onClick={() => setShowReceipt(false)} className="btn-primary" style={{ width: '100%' }}>Done</button>
             </div>
          </motion.div>
      )}</AnimatePresence>

      <nav className="bottom-nav">
        <div className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}><Home size={22} /><span>MARKETS</span></div>
        <div className={`nav-link ${activeTab === 'assets' ? 'active' : ''}`} onClick={() => setActiveTab('assets')}><AssetsIcon size={22} /><span>PORTFOLIO</span></div>
        <div className={`nav-link ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><FileText size={22} /><span>HISTORY</span></div>
        <div className={`nav-link ${activeTab === 'more' ? 'active' : ''}`} onClick={() => setActiveTab('more')}><Settings size={22} /><span>SECURITY</span></div>
      </nav>
    </div>
  );
}

export default App;
