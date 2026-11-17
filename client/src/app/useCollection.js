import { useEffect, useState } from 'react';
import { api } from './api.js';

export function useCollection(route) {
  const [result, setResult] = useState(null), [error, setError] = useState(''), [loading, setLoading] = useState(true), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setResult(null);
    api(route, { signal: controller.signal }).then(value => { if (!controller.signal.aborted) setResult(value); }).catch(failure => { if (!controller.signal.aborted) setError(failure.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [route, attempt]);
  return { result, loading, error, refresh: () => setAttempt(value => value + 1) };
}
