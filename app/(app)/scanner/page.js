'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

const modes = ['Lookup', 'Receive', 'Count', 'Pick'];

export default function ScannerPage() {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('Lookup');
  const [locationId, setLocationId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [lot, setLot] = useState('');
  const [expiry, setExpiry] = useState('');
  const [expectedSku, setExpectedSku] = useState('');
  const [message, setMessage] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch('/api/products').then((response) => response.json()).then((data) => setProducts(data.products || []));
    fetch('/api/locations').then((response) => response.json()).then((data) => {
      const rows = data.locations || data || [];
      setLocations(Array.isArray(rows) ? rows : []);
    });
  }, []);

  const match = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (value.length < 3) return null;
    return products.find((product) => [product.sku, product.barcode, product.name].filter(Boolean).some((field) => String(field).toLowerCase() === value))
      || products.find((product) => product.sku.toLowerCase().includes(value) || product.name.toLowerCase().includes(value));
  }, [products, query]);

  const startCamera = async () => {
    if (!('BarcodeDetector' in window)) {
      setMessage('This browser has no BarcodeDetector. Type the barcode instead.');
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    videoRef.current.srcObject = stream;
    setCameraOn(true);
    await videoRef.current.play();
    const detector = new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
    const tick = async () => {
      if (!videoRef.current?.srcObject) return;
      const codes = await detector.detect(videoRef.current).catch(() => []);
      if (codes[0]?.rawValue) {
        setQuery(String(codes[0].rawValue).toUpperCase());
        stream.getTracks().forEach((track) => track.stop());
        setCameraOn(false);
        return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const submit = async () => {
    if (!match || !locationId) {
      setMessage('Scan a product and select a location first.');
      return;
    }
    if (mode === 'Pick' && expectedSku && match.sku !== expectedSku) {
      setMessage(`This item is not on the current pick. Expected product SKU: ${expectedSku}.`);
      return;
    }
    if (mode === 'Receive') {
      const response = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locationId, lines: [{ productId: match.id, quantity: Number(quantity) }] }),
      });
      const data = await response.json();
      if (response.ok && lot && expiry) {
        await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: match.id, locationId, lotCode: lot, quantity: Number(quantity), expiresAt: expiry }),
        });
      }
      setMessage(response.ok ? `Receipt draft ${data.receipt?.reference || ''} created. Validate it to post stock.` : data.error);
    }
    if (mode === 'Count') {
      const response = await fetch('/api/counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: match.id, locationId, blind: true }),
      });
      const data = await response.json();
      if (response.ok) {
        await fetch(`/api/counts/${data.task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit', countedQty: Number(quantity), reason: 'Scanner count' }),
        });
      }
      setMessage(response.ok ? 'Blind count submitted for manager approval.' : data.error);
    }
    if (mode === 'Pick') setMessage(`Pick confirmed: ${match.name}, qty ${quantity}.`);
  };

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Floor operations</p>
        <h1 className="text-2xl font-black mt-1">Scan and act</h1>
        <p className="text-sm text-slate-500">Camera when the browser supports it. Manual barcode entry always works.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {modes.map((item) => (
          <button key={item} type="button" onClick={() => setMode(item)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${mode === item ? 'bg-slate-900 text-white' : 'bg-white border'}`}>{item}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value.toUpperCase())} placeholder="Scan barcode or SKU" className="flex-1 border-2 border-emerald-200 rounded-2xl px-4 py-3 font-mono" />
        <button type="button" onClick={startCamera} className="px-3 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Camera</button>
      </div>
      {cameraOn && <video ref={videoRef} className="w-full rounded-2xl bg-black max-h-64" muted playsInline />}
      <div className="flex flex-wrap gap-2">
        {products.slice(0, 6).map((product) => (
          <button key={product.id} type="button" onClick={() => setQuery(product.sku)} className="px-3 py-1.5 bg-white border rounded-full text-xs font-mono font-bold">{product.sku}</button>
        ))}
      </div>
      {mode !== 'Lookup' && (
        <div className="grid sm:grid-cols-2 gap-2">
          <select value={locationId} onChange={(event) => setLocationId(event.target.value)} className="border rounded-xl px-3 py-2">
            <option value="">Select location</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
          <input type="number" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="border rounded-xl px-3 py-2" placeholder="Quantity" />
          {mode === 'Receive' && <input value={lot} onChange={(event) => setLot(event.target.value)} className="border rounded-xl px-3 py-2" placeholder="Batch / lot" />}
          {mode === 'Receive' && <input type="date" value={expiry} onChange={(event) => setExpiry(event.target.value)} className="border rounded-xl px-3 py-2" />}
          {mode === 'Pick' && <input value={expectedSku} onChange={(event) => setExpectedSku(event.target.value.toUpperCase())} className="border rounded-xl px-3 py-2" placeholder="Expected SKU" />}
        </div>
      )}
      {message && <p className="text-sm font-bold text-emerald-800">{message}</p>}
      {match && (
        <section className="bg-[#10231c] text-white rounded-3xl p-5">
          <p className="text-emerald-300 text-xs font-bold">{match.sku}</p>
          <h2 className="text-2xl font-black">{match.name}</h2>
          <p className="text-4xl font-black mt-3">{match.totalStock} <span className="text-base">{match.uom}</span></p>
          <div className="grid sm:grid-cols-2 gap-2 mt-4">
            {(match.stockLevels || []).map((level) => (
              <div key={level.id} className="bg-white/10 rounded-xl p-3 flex justify-between text-sm"><span>{level.location?.name}</span><b>{Number(level.quantity)}</b></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {mode === 'Lookup' ? <Link href={`/products/${match.id}`} className="px-3 py-2 bg-white/10 rounded-xl text-sm font-bold">Open product</Link> : <button type="button" onClick={submit} className="px-3 py-2 bg-emerald-400 text-emerald-950 rounded-xl text-sm font-black">Submit {mode}</button>}
          </div>
        </section>
      )}
    </div>
  );
}
