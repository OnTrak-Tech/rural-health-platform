import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Chip,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Search,
  Download,
  Visibility,
  Description,
  Image,
  PictureAsPdf,
  Close
} from '@mui/icons-material';
import { getToken } from '../authToken';

const API_BASE = (process.env.REACT_APP_API_BASE || 'http://localhost:8000') + '/api';

export default function MedicalHistoryViewer({ consultationId, patientId, user }) {
  const [medicalFiles, setMedicalFiles] = useState([]);
  const [patientInfo, setPatientInfo] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (consultationId) {
      fetchConsultationFiles();
    } else if (patientId) {
      fetchPatientHistory();
    }
  }, [consultationId, patientId]);

  const fetchConsultationFiles = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/medical-history/consultations/${consultationId}/medical-files`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch medical files');
      const data = await res.json();
      setMedicalFiles(data.files);
      setPatientInfo({ name: data.patient_name });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientHistory = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/medical-history/patients/${patientId}/medical-history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch patient history');
      const data = await res.json();
      setPatientInfo(data.patient);
      setConsultations(data.consultations);
      setMedicalFiles(data.medical_files);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileAccess = async (fileId, accessType) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE}/medical-history/medical-files/${fileId}/access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ access_type: accessType })
      });
      if (!res.ok) throw new Error('Access denied');
      const data = await res.json();
      
      if (accessType === 'download') {
        // Trigger file download
        const downloadRes = await fetch(`${API_BASE}/files/${data.filename}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const blob = await downloadRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.original_name;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return <PictureAsPdf color="error" />;
      case 'jpg':
      case 'jpeg':
      case 'png': return <Image color="primary" />;
      default: return <Description color="action" />;
    }
  };

  const getFileCategory = (category) => {
    const categories = {
      lab_results: { label: 'Lab Results', color: 'primary' },
      x_ray: { label: 'X-Ray', color: 'secondary' },
      prescription: { label: 'Prescription', color: 'success' },
      report: { label: 'Report', color: 'info' }
    };
    return categories[category] || { label: 'Other', color: 'default' };
  };

  const filteredFiles = medicalFiles.filter(file =>
    file.original_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (file.description && file.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <Typography>Loading medical history...</Typography>;

  return (
    <Box sx={{ width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {patientInfo && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">Patient: {patientInfo.name}</Typography>
          {patientInfo.age && <Typography variant="body2">Age: {patientInfo.age}</Typography>}
          {patientInfo.allergies && patientInfo.allergies.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="error">
                Allergies: {patientInfo.allergies.join(', ')}
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {patientId && (
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="Medical Files" />
          <Tab label="Consultation History" />
        </Tabs>
      )}

      {(tabValue === 0 || consultationId) && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Medical Files ({filteredFiles.length})</Typography>
            <TextField
              size="small"
              placeholder="Search files..."
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

          {filteredFiles.length === 0 ? (
            <Typography color="text.secondary">No medical files found</Typography>
          ) : (
            <List>
              {filteredFiles.map((file) => {
                const categoryInfo = getFileCategory(file.category);
                return (
                  <ListItem key={file.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                    <Box sx={{ mr: 2 }}>
                      {getFileIcon(file.file_type)}
                    </Box>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">{file.original_name}</Typography>
                          <Chip 
                            label={categoryInfo.label} 
                            color={categoryInfo.color}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          {file.description && (
                            <Typography variant="body2">{file.description}</Typography>
                          )}
                          <Typography variant="caption" color="text.secondary">
                            Uploaded: {new Date(file.uploaded_at).toLocaleDateString()} by {file.uploaded_by}
                          </Typography>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Size: {(file.file_size / 1024).toFixed(1)} KB
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        color="primary"
                        onClick={() => handleFileAccess(file.id, 'view')}
                        title="View file"
                      >
                        <Visibility />
                      </IconButton>
                      <IconButton
                        color="secondary"
                        onClick={() => handleFileAccess(file.id, 'download')}
                        title="Download file"
                      >
                        <Download />
                      </IconButton>
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          )}
        </Paper>
      )}

      {tabValue === 1 && patientId && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Consultation History</Typography>
          {consultations.length === 0 ? (
            <Typography color="text.secondary">No consultation history</Typography>
          ) : (
            <List>
              {consultations.map((consultation) => (
                <ListItem key={consultation.id} sx={{ border: '1px solid #e0e0e0', mb: 1, borderRadius: 1 }}>
                  <ListItemText
                    primary={`Consultation - ${new Date(consultation.date).toLocaleDateString()}`}
                    secondary={
                      <Box>
                        <Typography variant="body2">
                          <strong>Symptoms:</strong> {consultation.symptoms}
                        </Typography>
                        {consultation.diagnosis && (
                          <Typography variant="body2">
                            <strong>Diagnosis:</strong> {consultation.diagnosis}
                          </Typography>
                        )}
                        <Chip 
                          label={consultation.status} 
                          color={consultation.status === 'completed' ? 'success' : 'primary'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Box>
  );
}