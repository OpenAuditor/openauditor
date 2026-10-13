'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

export function TaskSummary({ projectId }: { projectId: string }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  async function summarise() {
    setLoading(true);
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, message: 'Summarise the open tasks and recent comments for this project.' }),
    });
    const data = await res.json();
    setSummary(data.text);
    setLoading(false);
  }

  return (
    <section>
      <button onClick={summarise} disabled={loading}>{loading ? 'Summarising...' : 'Summarise with AI'}</button>
      {summary && <ReactMarkdown>{summary}</ReactMarkdown>}
    </section>
  );
}
