'use client';

import { useState } from 'react';

const prompts = [
  'Which products should be reordered?',
  'Which batches expire next week?',
  'Where were negative adjustments in the last 7 days?',
];

export default function AssistantPage() {
  const [question, setQuestion] = useState(prompts[0]);
  const [answer, setAnswer] = useState(null);

  const ask = async (value = question) => {
    const response = await fetch('/api/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: value }) });
    setAnswer(await response.json());
  };

  return (
    <div className="max-w-3xl space-y-5 animate-fade-in">
      <div>
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-700">Grounded answers</p>
        <h1 className="text-2xl font-black mt-1">Inventory assistant</h1>
        <p className="text-sm text-slate-500 mt-1">Answers come from StockSense records. It can explain. It cannot post stock.</p>
      </div>
      <div className="flex flex-wrap gap-2">{prompts.map((prompt) => <button key={prompt} type="button" onClick={() => { setQuestion(prompt); ask(prompt); }} className="px-3 py-1.5 bg-white border rounded-full text-xs font-bold">{prompt}</button>)}</div>
      <div className="flex gap-2">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} className="flex-1 border rounded-xl px-3 py-2" />
        <button type="button" onClick={() => ask()} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold">Ask</button>
      </div>
      {answer && (
        <section className="bg-white border rounded-2xl p-5">
          <p className="font-black">{answer.answer || answer.error}</p>
          <p className="text-xs text-slate-500 mt-2">{answer.scope} · {answer.range} · as of {answer.asOf}</p>
          <ul className="mt-3 text-sm space-y-1">{(answer.records || []).map((record) => <li key={record}>{record}</li>)}</ul>
        </section>
      )}
    </div>
  );
}
