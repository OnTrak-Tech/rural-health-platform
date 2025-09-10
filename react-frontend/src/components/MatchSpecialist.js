import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Grid, Alert, List, ListItem, ListItemText } from '@mui/material';
import { getToken } from '../authToken';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

export default function MatchSpecialist({ onSelect }) {
  const [specialization, setSpecialization] = useState('');
  const [state, setState] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [results, setResults] = useState([]);
  const [aiResults, setAiResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAi, setShowAi] = useState(true);

  const search = async () => {
    setLoading(true);
    setError('');
    setResults([]);
    try {
      const token = getToken();
      const q = new URLSearchParams({
        ...(specialization ? { specialization } : {}),
        ...(state ? { state } : {}),
        limit: '5'
      }).toString();
      const res = await fetch(`${API_BASE}/doctors/match?${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.text()) || 'Search failed');
      const data = await res.json();
      setResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getAiRecommendations = async () => {
    setLoading(true);
    setError('');
    setAiResults([]);
    try {
      const token = getToken();
      const q = new URLSearchParams({
        ...(symptoms ? { symptoms } : {})
      }).toString();
      const res = await fetch(`${API_BASE}/doctors/ai-recommend?${q}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error((await res.text()) || 'AI recommendation failed');
      const data = await res.json();
      setAiResults(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Find a Specialist</Typography>
        <Box sx={{ mb: 2 }}>
          <Button 
            variant={showAi ? "contained" : "outlined"} 
            onClick={() => setShowAi(true)} 
            sx={{ mr: 1 }}
          >
            AI Recommended
          </Button>
          <Button 
            variant={!showAi ? "contained" : "outlined"} 
            onClick={() => setShowAi(false)}
          >
            Manual Search
          </Button>
        </Box>
        
        {showAi ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <TextField 
                fullWidth 
                label="Describe your symptoms" 
                placeholder="chest pain, headache, skin rash" 
                value={symptoms} 
                onChange={e=>setSymptoms(e.target.value)} 
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button fullWidth variant="contained" onClick={getAiRecommendations} disabled={loading}>
                {loading ? 'Finding...' : 'Get AI Recommendations'}
              </Button>
            </Grid>
          </Grid>
        ) : (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Specialization" placeholder="cardiology" value={specialization} onChange={e=>setSpecialization(e.target.value)} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="State (optional)" placeholder="CA" value={state} onChange={e=>setState(e.target.value.toUpperCase())} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button fullWidth variant="contained" onClick={search} disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
            </Grid>
          </Grid>
        )}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <List>
        {(showAi ? aiResults : results).map(doc => (
          <ListItem key={doc.id} button onClick={() => onSelect && onSelect(doc)}>
            <ListItemText
              primary={`${doc.name} — ${doc.specialization} ${doc.isAiRecommended ? '🤖' : ''}`}
              secondary={doc.isAiRecommended ? 
                `${doc.matchReason} · Score: ${Math.round(doc.score)}` :
                `Experience: ${doc.yearsOfPractice || 0} yrs · States: ${(doc.telemedicineStates || []).join(', ')}`
              }
            />
            <Button onClick={() => onSelect && onSelect(doc)} variant="outlined">Select</Button>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}

