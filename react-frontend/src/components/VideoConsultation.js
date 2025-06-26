import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Box,
  IconButton
} from '@mui/material';
import { Send, Videocam, VideocamOff, Mic, MicOff } from '@mui/icons-material';
import io from 'socket.io-client';

function VideoConsultation({ user }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    // Join consultation room
    newSocket.emit('join-consultation', { consultationId: 'room_123' });

    // Listen for chat messages
    newSocket.on('chat-message', (data) => {
      setMessages(prev => [...prev, data]);
    });

    // Initialize video
    initializeVideo();

    return () => {
      newSocket.close();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const initializeVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket) {
      const messageData = {
        text: newMessage,
        sender: user.email,
        consultationId: 'room_123',
        timestamp: new Date().toLocaleTimeString()
      };
      
      socket.emit('chat-message', messageData);
      setMessages(prev => [...prev, messageData]);
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
          <Typography variant="h6" sx={{ mb: 2 }}>Video Consultation</Typography>
          
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
          <Typography variant="h6" sx={{ mb: 2 }}>Chat</Typography>
          
          {/* Messages */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
            <List>
              {messages.map((message, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={message.text}
                    secondary={`${message.sender} - ${message.timestamp}`}
                  />
                </ListItem>
              ))}
            </List>
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
            />
            <IconButton onClick={sendMessage} color="primary">
              <Send />
            </IconButton>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default VideoConsultation;