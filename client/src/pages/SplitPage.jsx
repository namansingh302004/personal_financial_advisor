import { useState, useRef } from 'react';
import { Camera, Upload, Users, Plus, X, Calculator, Copy, Check, ArrowRight, RotateCcw } from 'lucide-react';
import api from '../api/axiosInstance';
import Sidebar from '../components/Sidebar';
import toast from 'react-hot-toast';
import './SplitPage.css';

const STEPS = ['scan', 'assign', 'results'];

const SplitPage = () => {
  const [step, setStep] = useState(0);
  const [billData, setBillData] = useState(null);
  const [people, setPeople] = useState(['You']);
  const [newPerson, setNewPerson] = useState('');
  const [items, setItems] = useState([]);
  const [results, setResults] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef(null);

  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target.result;
      setScanning(true);

      try {
        const { data } = await api.post('/api/split/scan', { image: base64 });
        setBillData(data);
        setItems(data.items.map((item) => ({ ...item, assignedTo: [] })));
        setStep(1);
        toast.success('Bill scanned successfully!');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to scan bill');
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const addPerson = () => {
    const name = newPerson.trim();
    if (!name) return;
    if (people.includes(name)) {
      toast.error('Person already added');
      return;
    }
    setPeople([...people, name]);
    setNewPerson('');
  };

  const removePerson = (name) => {
    if (name === 'You') return;
    setPeople(people.filter((p) => p !== name));
    setItems(items.map((item) => ({
      ...item,
      assignedTo: item.assignedTo.filter((p) => p !== name),
    })));
  };

  const toggleAssignment = (itemId, person) => {
    setItems(items.map((item) => {
      if (item.id !== itemId) return item;
      const isAssigned = item.assignedTo.includes(person);
      return {
        ...item,
        assignedTo: isAssigned
          ? item.assignedTo.filter((p) => p !== person)
          : [...item.assignedTo, person],
      };
    }));
  };

  const assignAllTo = (person) => {
    setItems(items.map((item) => ({
      ...item,
      assignedTo: item.assignedTo.includes(person)
        ? item.assignedTo
        : [...item.assignedTo, person],
    })));
  };

  const calculateSplit = async () => {
    if (people.length < 2) {
      toast.error('Add at least 2 people to split');
      return;
    }

    setCalculating(true);
    try {
      const { data } = await api.post('/api/split/calculate', {
        items,
        tax: billData?.tax || 0,
        serviceCharge: billData?.serviceCharge || 0,
        tip: billData?.tip || 0,
        total: billData?.total || 0,
        people,
      });
      setResults(data);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to calculate split');
    } finally {
      setCalculating(false);
    }
  };

  const copyResults = () => {
    if (!results) return;
    const text = results.shares.map((share) => {
      const itemList = share.items.map((i) =>
        `  • ${i.name}: ${fmt(i.amount)}${i.shared ? ` (split ${i.sharedWith} ways)` : ''}`
      ).join('\n');
      return `${share.name}: ${fmt(share.total)}\n${itemList}`;
    }).join('\n\n');

    const summary = `\n─────────\nTotal: ${fmt(results.summary.grandTotal)} (incl. ${fmt(results.summary.extras)} tax/charges)`;

    navigator.clipboard.writeText(
      `🧾 Bill Split — ${billData?.restaurant || 'Restaurant'}\n\n${text}${summary}\n\nSplit by Finwise ✨`
    );
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setStep(0);
    setBillData(null);
    setPeople(['You']);
    setItems([]);
    setResults(null);
    setCopied(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getPersonColor = (index) => {
    const colors = ['#064e3b', '#6366f1', '#ec4899', '#f59e0b', '#0ea5e9', '#ef4444', '#8b5cf6', '#14b8a6'];
    return colors[index % colors.length];
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page">
          <div className="split-header mb-4">
            <div>
              <h1 className="page-title">split the vibe</h1>
              <p className="page-subtitle">scan a bill & split it fairly</p>
            </div>
            {step > 0 && (
              <button className="btn btn-ghost" onClick={reset}>
                <RotateCcw size={14} />
                start over
              </button>
            )}
          </div>

          {/* Step Indicator */}
          <div className="split-steps">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`split-step ${i === step ? 'active' : ''} ${i < step ? 'completed' : ''}`}
              >
                <div className="split-step-dot">
                  {i < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="split-step-label">{s}</span>
              </div>
            ))}
          </div>

          {/* Step 0: Scan */}
          {step === 0 && (
            <div className="split-scan-section">
              <div
                className={`split-upload-zone ${scanning ? 'scanning' : ''}`}
                onClick={() => !scanning && fileInputRef.current?.click()}
              >
                {scanning ? (
                  <div className="split-scanning">
                    <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
                    <p>Scanning bill with AI...</p>
                    <span className="text-xs text-muted">This may take a few seconds</span>
                  </div>
                ) : (
                  <>
                    <div className="split-upload-icon">
                      <Camera size={36} strokeWidth={1.2} />
                    </div>
                    <h3 className="split-upload-title">Scan a Bill</h3>
                    <p className="split-upload-text">
                      Take a photo or upload an image of a restaurant bill.
                      Our AI will parse every item automatically.
                    </p>
                    <div className="split-upload-btn">
                      <Upload size={14} />
                      Upload Photo
                    </div>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Step 1: Assign */}
          {step === 1 && billData && (
            <div className="split-assign-section">
              {/* Restaurant Info */}
              <div className="split-restaurant card">
                <h2 className="split-restaurant-name">🍽️ {billData.restaurant}</h2>
                <div className="split-restaurant-meta">
                  {billData.date && <span>{billData.date}</span>}
                  <span>Total: {fmt(billData.total)}</span>
                  <span>{items.length} items</span>
                </div>
              </div>

              {/* People */}
              <div className="split-people card mt-4">
                <h3 className="card-title">who's splitting?</h3>
                <div className="split-people-list">
                  {people.map((person, i) => (
                    <div
                      key={person}
                      className="split-person-tag"
                      style={{ borderColor: getPersonColor(i), color: getPersonColor(i) }}
                    >
                      <span className="split-person-dot" style={{ background: getPersonColor(i) }} />
                      {person}
                      {person !== 'You' && (
                        <button className="split-person-remove" onClick={() => removePerson(person)}>
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                  <div className="split-add-person">
                    <input
                      type="text"
                      placeholder="Add person..."
                      value={newPerson}
                      onChange={(e) => setNewPerson(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addPerson()}
                      className="split-person-input"
                    />
                    <button className="btn-icon" onClick={addPerson} disabled={!newPerson.trim()}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Assignment */}
              <div className="split-items card mt-4">
                <div className="split-items-header">
                  <h3 className="card-title">assign items</h3>
                  <div className="split-assign-all">
                    {people.map((person, i) => (
                      <button
                        key={person}
                        className="split-assign-all-btn"
                        onClick={() => assignAllTo(person)}
                        title={`Assign all to ${person}`}
                        style={{ borderColor: getPersonColor(i), color: getPersonColor(i) }}
                      >
                        All → {person}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="split-items-list">
                  {items.map((item) => (
                    <div key={item.id} className="split-item">
                      <div className="split-item-info">
                        <span className="split-item-name">
                          {item.name}
                          {item.qty > 1 && <span className="split-item-qty"> ×{item.qty}</span>}
                        </span>
                        <span className="split-item-price">{fmt(item.price * item.qty)}</span>
                      </div>
                      <div className="split-item-assignees">
                        {people.map((person, i) => {
                          const isAssigned = item.assignedTo.includes(person);
                          return (
                            <button
                              key={person}
                              className={`split-assignee ${isAssigned ? 'assigned' : ''}`}
                              onClick={() => toggleAssignment(item.id, person)}
                              style={isAssigned ? {
                                background: getPersonColor(i),
                                borderColor: getPersonColor(i),
                                color: '#fff',
                              } : {
                                borderColor: getPersonColor(i) + '40',
                                color: getPersonColor(i),
                              }}
                            >
                              {person.charAt(0).toUpperCase()}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Extras */}
                {(billData.tax > 0 || billData.serviceCharge > 0 || billData.tip > 0) && (
                  <div className="split-extras">
                    {billData.tax > 0 && (
                      <div className="split-extra-item">
                        <span>Tax</span>
                        <span>{fmt(billData.tax)}</span>
                      </div>
                    )}
                    {billData.serviceCharge > 0 && (
                      <div className="split-extra-item">
                        <span>Service Charge</span>
                        <span>{fmt(billData.serviceCharge)}</span>
                      </div>
                    )}
                    {billData.tip > 0 && (
                      <div className="split-extra-item">
                        <span>Tip</span>
                        <span>{fmt(billData.tip)}</span>
                      </div>
                    )}
                    <p className="split-extras-note">
                      Tax & charges are split proportionally based on each person's items
                    </p>
                  </div>
                )}
              </div>

              {/* Calculate Button */}
              <div className="split-calculate mt-4">
                <button
                  className="btn btn-primary"
                  onClick={calculateSplit}
                  disabled={people.length < 2 || calculating}
                  style={{ width: '100%', justifyContent: 'center', padding: '14px' }}
                >
                  {calculating ? (
                    <>
                      <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                      calculating...
                    </>
                  ) : (
                    <>
                      <Calculator size={16} />
                      [ calculate split ]
                    </>
                  )}
                </button>
                {people.length < 2 && (
                  <p className="text-xs text-muted mt-1" style={{ textAlign: 'center' }}>
                    Add at least 2 people to split the bill
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Results */}
          {step === 2 && results && (
            <div className="split-results-section">
              <div className="split-results-header card">
                <h2 className="split-results-title">🧾 {billData?.restaurant || 'Restaurant'}</h2>
                <div className="split-results-summary">
                  <div className="split-summary-item">
                    <span>Items</span>
                    <span>{fmt(results.summary.itemsSubtotal)}</span>
                  </div>
                  {results.summary.extras > 0 && (
                    <div className="split-summary-item">
                      <span>Tax + Charges</span>
                      <span>{fmt(results.summary.extras)}</span>
                    </div>
                  )}
                  <div className="split-summary-item total">
                    <span>Grand Total</span>
                    <span>{fmt(results.summary.grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Individual Shares */}
              <div className="split-shares mt-4">
                {results.shares.map((share, i) => (
                  <div key={share.name} className="split-share-card card">
                    <div className="split-share-header">
                      <div className="split-share-person">
                        <span
                          className="split-share-avatar"
                          style={{ background: getPersonColor(i) }}
                        >
                          {share.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="split-share-name">{share.name}</span>
                      </div>
                      <span className="split-share-total" style={{ color: getPersonColor(i) }}>
                        {fmt(share.total)}
                      </span>
                    </div>
                    <div className="split-share-items">
                      {share.items.map((item, j) => (
                        <div key={j} className="split-share-item">
                          <span className="split-share-item-name">
                            {item.name}
                            {item.shared && (
                              <span className="split-share-shared">÷{item.sharedWith}</span>
                            )}
                          </span>
                          <span className="split-share-item-amount">{fmt(item.amount)}</span>
                        </div>
                      ))}
                      {share.extraShare > 0 && (
                        <div className="split-share-item extra">
                          <span className="split-share-item-name">Tax + Charges</span>
                          <span className="split-share-item-amount">{fmt(share.extraShare)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="split-actions mt-4">
                <button className="btn btn-primary" onClick={copyResults}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'copied!' : '[ copy summary ]'}
                </button>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>
                  <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
                  edit assignment
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SplitPage;
