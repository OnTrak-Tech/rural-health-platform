import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  List,
  ListItem,
  ListItemText,
  Button,
  InputAdornment,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Search, History, Person } from '@mui/icons-material';
import { getToken } from '../authToken';
import MedicalHistoryViewer from './MedicalHistoryViewer';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

export default function PatientSearch({ user }) {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => {
    fetchMyPatients();
  }, []);

  const fetchMyPatients = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/medical-history/my-patients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      setPatients(data.patients);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewHistory = (patient) => {
    setSelectedPatient(patient);
    setHistoryOpen(true);
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Typography>Loading patients...</Typography>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" gutterBottom>My Patients</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Paper sx={{ p: 2 }}>
        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            placeholder="Search patients by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {filteredPatients.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Person sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              {searchTerm ? 'No patients found' : 'No consultation history yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm ? 'Try adjusting your search terms' : 'Patients will appear here after consultations'}
            </Typography>
          </Box>
        ) : (
          <List>
            {filteredPatients.map((patient) => (
              <ListItem 
                key={patient.id} 
                sx={{ 
                  border: '1px solid #e0e0e0', 
                  mb: 1, 
                  borderRadius: 1,
                  '&:hover': { backgroundColor: 'action.hover' }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person color="primary" />
                      <Typography variant="h6">{patient.name}</Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Last consultation: {new Date(patient.last_consultation).toLocaleDateString()}
                    </Typography>
                  }
                />
                <Button
                  variant="outlined"
                  startIcon={<History />}
                  onClick={() => handleViewHistory(patient)}
                  sx={{ ml: 2 }}
                >
                  View History
                </Button>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      <Dialog 
        open={historyOpen} 
        onClose={() => setHistoryOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History />
            Medical History - {selectedPatient?.name}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <MedicalHistoryViewer 
              patientId={selectedPatient.id}
              user={user}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}