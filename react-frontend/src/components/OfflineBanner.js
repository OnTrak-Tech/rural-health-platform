import React, { useEffect, useState, useCallback } from 'react';
import { Alert, Button, Box } from '@mui/material';
import { countQueuedConsultations, syncQueuedConsultations } from '../offlineQueue';

export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [queued, setQueued] = useState(0);
  const [syncing, setSyncing] = useState(false);

  const refreshCounts = useCallback(async () => {
    const c = await countQueuedConsultations();
    setQueued(c);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    refreshCounts();
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [refreshCounts]);

  const doSync = async () => {
    setSyncing(true);
    try {
      await syncQueuedConsultations();
      await refreshCounts();
    } finally {
      setSyncing(false);
    }
  };

  if (online && queued === 0) return null;

  if (!online) {
    return (
      <Box sx={{ my: 1 }}>
        <Alert severity="warning">
          You are offline. {queued > 0 ? `${queued} consultation(s) queued for sync.` : 'Actions will be queued.'}
        </Alert>
      </Box>
    );
  }

  // Online with queued items
  return (
    <Box sx={{ my: 1 }}>
      <Alert
        severity="info"
        action={<Button color="inherit" size="small" onClick={doSync} disabled={syncing}>{syncing ? 'Syncing...' : 'Sync now'}</Button>}
      >
        {queued} queued consultation(s) ready to sync.
      </Alert>
    </Box>
  );
}

