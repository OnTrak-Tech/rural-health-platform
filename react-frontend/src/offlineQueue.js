// IndexedDB-powered offline queue for consultations using idb-keyval
import { get, update } from 'idb-keyval';
import { getToken } from './authToken';

const STORAGE_KEY = 'offline_consultations_v2';

export async function getQueuedConsultations() {
  return (await get(STORAGE_KEY)) || [];
}

export async function countQueuedConsultations() {
  const list = (await get(STORAGE_KEY)) || [];
  return list.length;
}

export async function queueConsultation(item) {
  const nowIso = new Date().toISOString();
  await update(STORAGE_KEY, (list) => {
    const arr = Array.isArray(list) ? list : [];
    const clientId = item.clientId || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    // If item with same clientId exists, update it (e.g., offline edits)
    const idx = arr.findIndex((x) => x.clientId === clientId);
    const payload = { ...item, clientId, updatedAt: nowIso };
    if (idx >= 0) {
      arr[idx] = { ...arr[idx], ...payload };
    } else {
      arr.push(payload);
    }
    return arr;
  });
}

export async function removeQueuedByClientIds(clientIds) {
  await update(STORAGE_KEY, (list) => {
    const arr = Array.isArray(list) ? list : [];
    return arr.filter((x) => !clientIds.includes(x.clientId));
  });
}

export async function syncQueuedConsultations() {
  const base = process.env.REACT_APP_API_BASE || 'http://localhost:8000';
  const token = getToken();
  const list = (await getQueuedConsultations()) || [];
  if (!list.length) return { results: [] };

  try {
    const res = await fetch(`${base}/api/sync/consultations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ items: list }),
    });
    if (!res.ok) return { results: [] };
    const data = await res.json();

    // Reconcile per-item results
    const toRemove = [];
    const toKeep = [];
    (data.results || []).forEach((r) => {
      if (r.status === 'created' || r.status === 'updated' || r.status === 'duplicate' || r.status === 'skipped_newer_server') {
        // Remove from queue on success or skip (server newer)
        if (r.clientId) toRemove.push(r.clientId);
      } else if (r.status === 'error') {
        // Keep for retry
        if (r.clientId) toKeep.push(r.clientId);
      }
    });
    await removeQueuedByClientIds(toRemove);
    return data;
  } catch (_e) {
    // stay queued for next attempt
    return { results: [] };
  }
}

