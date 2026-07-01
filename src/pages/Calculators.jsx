import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';

function Field({ label, value, onChange, prefix, suffix, min = 0, step = 1 }) {
  return (
    <div>
      <label className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground block mb-1">{label}</label>
      <div className="flex items-center bg-muted rounded-xl overflow-hidden border border-border">
        {prefix && <span className="px-3 text-sm font-bold text-muted-foreground">{prefix}</span>}
        <input type="number" value={value} min={min} step={step}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 bg-transparent px-3 py-2.5 text-sm font-bold text-foreground outline-none" />
        {suffix && <span className="px-3 text-sm font-bold text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function Result({ label, value, highlight }) {
  return (
    <div className={`flex-1 rounded-xl p-3 text-center ${highlight ? 'bg-primary/10 border border-primary/30' : 'bg-muted'}`}>
      <p className={`text-xl font-black ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
      <p className="text-[10px] font-bold text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function fmt(n) {
  if (isNaN(n) || !isFinite(n)) return '—';
  return '€' + Math.round(n).toLocaleString();
}

function CompoundCalc() {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(7);
  const [years, setYears] = useState(10);
  const [monthly, setMonthly] = useState(100);

  const r = rate / 100 / 12;
  const n = years * 12;
  const futureInitial = principal * Math.pow(1 + r, n);
  const futureMonthly = monthly * (Math.pow(1 + r, n) - 1) / r;
  const total = futureInitial + futureMonthly;
  const invested = principal + monthly * n;
  const growth = total - invested;

  return (
    <div className="space-y-3">
      <Field label="Starting amount" value={principal} onChange={setPrincipal} prefix="€" min={0} step={100} />
      <Field label="Monthly contribution" value={monthly} onChange={setMonthly} prefix="€" min={0} step={50} />
      <Field label="Annual return (%)" value={rate} onChange={setRate} suffix="%" min={0} step={0.5} />
      <Field label="Years" value={years} onChange={setYears} suffix="yrs" min={1} step={1} />
      <div className="flex gap-2 pt-1">
        <Result label="Final value" value={fmt(total)} highlight />
        <Result label="Invested" value={fmt(invested)} />
        <Result label="Growth" value={fmt(growth)} />
      </div>
      <p className="text-[10px] text-center text-muted-foreground">Assumes annual return compounded monthly</p>
    </div>
  );
}

function MortgageCalc() {
  const [price, setPrice] = useState(300000);
  const [deposit, setDeposit] = useState(30000);
  const [rate, setRate] = useState(4);
  const [years, setYears] = useState(30);

  const loan = Math.max(0, price - deposit);
  const r = rate / 100 / 12;
  const n = years * 12;
  const monthly = r === 0 ? loan / n : loan * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  const totalPaid = monthly * n;
  const totalInterest = totalPaid - loan;

  return (
    <div className="space-y-3">
      <Field label="Property price" value={price} onChange={setPrice} prefix="€" min={0} step={5000} />
      <Field label="Deposit" value={deposit} onChange={setDeposit} prefix="€" min={0} step={5000} />
      <Field label="Interest rate (%)" value={rate} onChange={setRate} suffix="%" min={0} step={0.1} />
      <Field label="Mortgage term" value={years} onChange={setYears} suffix="yrs" min={1} step={1} />
      <div className="flex gap-2 pt-1">
        <Result label="Monthly payment" value={fmt(monthly)} highlight />
        <Result label="Total repaid" value={fmt(totalPaid)} />
        <Result label="Interest paid" value={fmt(totalInterest)} />
      </div>
    </div>
  );
}

function SavingsCalc() {
  const [goal, setGoal] = useState(10000);
  const [current, setCurrent] = useState(0);
  const [monthly, setMonthly] = useState(200);
  const [rate, setRate] = useState(4);

  const r = rate / 100 / 12;
  const needed = Math.max(0, goal - current);
  let months;
  if (r === 0) {
    months = monthly === 0 ? Infinity : needed / monthly;
  } else {
    months = Math.log(1 + (needed * r) / monthly) / Math.log(1 + r);
  }
  const years = months / 12;
  const totalSaved = current + monthly * months;
  const interest = Math.max(0, totalSaved - (current + monthly * months) + (totalSaved - goal));

  const timeLabel = !isFinite(months) ? '∞' : years >= 1
    ? `${Math.floor(years)}y ${Math.round((years % 1) * 12)}m`
    : `${Math.round(months)}m`;

  return (
    <div className="space-y-3">
      <Field label="Savings goal" value={goal} onChange={setGoal} prefix="€" min={0} step={500} />
      <Field label="Already saved" value={current} onChange={setCurrent} prefix="€" min={0} step={100} />
      <Field label="Monthly saving" value={monthly} onChange={setMonthly} prefix="€" min={1} step={50} />
      <Field label="Interest rate (%)" value={rate} onChange={setRate} suffix="%" min={0} step={0.5} />
      <div className="flex gap-2 pt-1">
        <Result label="Time to goal" value={timeLabel} highlight />
        <Result label="Still needed" value={fmt(needed)} />
      </div>
    </div>
  );
}

const CALCS = [
  { id: 'compound', label: 'Compound Interest', emoji: '📈', sub: 'How investments grow over time', component: CompoundCalc },
  { id: 'mortgage', label: 'Mortgage',          emoji: '🏠', sub: 'Monthly payments & total cost',  component: MortgageCalc },
  { id: 'savings',  label: 'Savings Goal',      emoji: '🎯', sub: 'Time to reach your target',     component: SavingsCalc },
];

export default function Calculators() {
  const [open, setOpen] = useState('compound');

  return (
    <div className="min-h-screen bg-background pb-20 max-w-lg mx-auto">
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-4 pt-12 pb-6 text-white">
        <Link to="/play" className="inline-flex items-center gap-1 text-white/70 text-sm font-bold mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-extrabold">Calculators</h1>
        <p className="text-white/70 text-sm mt-1">Run the numbers on your financial decisions</p>
      </div>

      <div className="px-4 pt-5 space-y-3">
        {CALCS.map(({ id, label, emoji, sub, component: Comp }) => (
          <div key={id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <button onClick={() => setOpen(open === id ? null : id)}
              className="w-full flex items-center gap-4 px-4 py-4">
              <span className="text-2xl">{emoji}</span>
              <div className="flex-1 text-left">
                <p className="font-extrabold text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{sub}</p>
              </div>
              {open === id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            {open === id && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="px-4 pb-5 border-t border-border pt-4">
                <Comp />
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
