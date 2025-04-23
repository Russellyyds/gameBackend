/**
 * JoinGame.jsx
 * This screen allows players to join a game session by entering their name and a session ID.
 * It handles session validation, error feedback, API communication, and redirects to gameplay.
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import * as api from '../services/api';

const JoinGame = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gameCode, setGameCode] = useState(sessionId || '');

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const handleJoinGame = async (e) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter your name',
        severity: 'error'
      });
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Join the game
      const response = await api.joinGame(gameCode, playerName);
      console.log(response)
      const playerId = response.playerId;
      
      // Save player info to localStorage
      localStorage.setItem('player_id', playerId);
      localStorage.setItem('player_name', playerName);
      localStorage.setItem('session_id', gameCode);
      
      // Navigate to the game page
      navigate(`/play/game/${playerId}`);
      
    } catch (err) {
      console.error('Error joining game:', err);
      setError(err.message || 'Failed to join game. The session might have already started or does not exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          Join Game Session
        </Typography>
        
        <Typography variant="body1" align="center" paragraph>
          You have been invited to join a BigBrain game session!
        </Typography>
        
        <Box component="form" onSubmit={handleJoinGame} sx={{ mt: 3 }}>
          <TextField
            label="Game Code"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
            fullWidth
            margin="normal"
            required
            sx={{ mb: 3 }}
          />
          
          <TextField
            label="Your Name"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            fullWidth
            margin="normal"
            required
            autoFocus
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Join Game'}
          </Button>
        </Box>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default JoinGame;