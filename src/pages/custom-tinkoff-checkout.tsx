import React, { useState } from 'react';

export default function CustomTinkoffCheckout() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/custom-tinkoff-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, email, amount }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.payment_url) {
      window.location.href = data.payment_url;
    } else {
      alert('Ошибка: ' + (data.message || 'Не удалось создать платёж'));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Оплата через Тинькофф</h2>
      <input placeholder="Имя" value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} required style={{ width: '100%', marginBottom: 12 }} />
      <input placeholder="Телефон" value={phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)} required style={{ width: '100%', marginBottom: 12 }} />
      <input placeholder="E-mail для чека" type="email" value={email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required style={{ width: '100%', marginBottom: 12 }} />
      <input placeholder="Сумма (₽)" type="number" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)} required style={{ width: '100%', marginBottom: 12 }} />
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, background: '#FFD600', border: 'none', borderRadius: 4 }}>
        {loading ? 'Создание...' : 'Оплатить через Тинькофф'}
      </button>
    </form>
  );
}