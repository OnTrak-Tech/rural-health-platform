import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Box,
  IconButton,
  Alert
} from '@mui/material';
import { Send, Videocam, VideocamOff, Mic, MicOff } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { SOCKET_BASE } from '../config';
import { getToken } from '../authToken';

function VideoConsultation({ user }) {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const localStreamRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!consultationId) {
      setError('No consultation ID provided');
      return;
    }
    
    fetchConsultation();
    initializeSocket();
    initializeVideo();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      const stream = localStreamRef.current;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [consultationId]);

  const fetchConsultation = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${process.env.REACT_APP_API_BASE || 'http://localhost:8000'}/api/consultations/${consultationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Consultation not found');
      const data = await res.json();
      setConsultation(data);
    } catch (e) {
      setError(e.message);
    }
  };

  const initializeSocket = () => {
    console.log('Initializing socket connection to:', SOCKET_BASE);
    const newSocket = io(SOCKET_BASE, {
      transports: ['websocket', 'polling']
    });
    
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setConnected(true);
      newSocket.emit('join_consultation', { consultationId });
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setConnected(false);
    });

    newSocket.on('user_joined', (data) => {
      console.log('User joined:', data);
    });

    // Only add messages from other users, not our own
    newSocket.on('chat-message', (data) => {
      console.log('Received chat message:', data);
      const currentUserName = user.name || user.email;
      if (data.sender !== currentUserName) {
        setMessages(prev => [...prev, { ...data, isOwn: false }]);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setError('Failed to connect to chat server');
    });

    setSocket(newSocket);
  };

  const initializeVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket && connected) {
      const messageData = {
        text: newMessage,
        sender: user.name || user.email,
        consultationId,
        timestamp: new Date().toLocaleTimeString()
      };
      
      console.log('Sending message:', messageData);
      
      // Add message locally as "own" message
      setMessages(prev => [...prev, { ...messageData, isOwn: true }]);
      
      // Send to server (will be received by other users only)
      socket.emit('chat_message', messageData);
      setNewMessage('');
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioOn(audioTrack.enabled);
      }
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Video Section */}
      <Grid item xs={12} md={8}>
        <Paper sx={{ p: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Typography variant="h6">
              {consultation ? `Consultation with Dr. ${consultation.doctorName}` : 'Video Consultation'}
            </Typography>
            <Typography variant="body2" color={connected ? 'success.main' : 'error.main'}>
              {connected ? '● Connected' : '● Disconnected'}
            </Typography>
          </Box>
          {consultation && (
            <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
              Scheduled: {new Date(consultation.date).toLocaleString()}
            </Typography>
          )}
          
          {/* Local Video */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Your Video</Typography>
            <video
              ref={localVideoRef}
              autoPlay
              muted
              style={{ 
                width: '100%', 
                maxHeight: '300px', 
                backgroundColor: '#000',
                borderRadius: '8px'
              }}
            />
          </Box>

          {/* Remote Video */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2">Doctor's Video</Typography>
            <video
              ref={remoteVideoRef}
              autoPlay
              style={{ 
                width: '100%', 
                maxHeight: '300px', 
                backgroundColor: '#000',
                borderRadius: '8px'
              }}
            />
          </Box>

          {/* Video Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <IconButton 
              onClick={toggleVideo}
              color={isVideoOn ? 'primary' : 'error'}
              size="large"
            >
              {isVideoOn ? <Videocam /> : <VideocamOff />}
            </IconButton>
            <IconButton 
              onClick={toggleAudio}
              color={isAudioOn ? 'primary' : 'error'}
              size="large"
            >
              {isAudioOn ? <Mic /> : <MicOff />}
            </IconButton>
          </Box>
        </Paper>
      </Grid>

      {/* Chat Section */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Chat {connected ? '(Connected)' : '(Disconnected)'}
          </Typography>
          
          {/* Messages */}
          <Box sx={{ 
            flexGrow: 1, 
            overflow: 'auto', 
            mb: 2, 
            border: '1px solid #e0e0e0', 
            borderRadius: 1, 
            p: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            {messages.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 2 }}>
                No messages yet. Start the conversation!
              </Typography>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.isOwn;
                return (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      mb: 1
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: '70%',
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: isOwn ? 'primary.main' : 'grey.200',
                        color: isOwn ? 'white' : 'text.primary'
                      }}
                    >
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {message.text}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block', 
                          mt: 0.5, 
                          opacity: 0.8,
                          fontSize: '0.7rem'
                        }}
                      >
                        {isOwn ? 'You' : message.sender} • {message.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </Box>

          {/* Message Input */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!connected}
            />
            <IconButton 
              onClick={sendMessage} 
              color="primary"
              disabled={!connected || !newMessage.trim()}
            >
              <Send />
            </IconButton>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default VideoConsultation;