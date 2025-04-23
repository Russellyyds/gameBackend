// src/components/GameCard.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Box,
  Snackbar,
  Alert,
} from "@mui/material";
import * as api from "../services/api";

const GameCard = ({ game, onGameUpdate, onGameStop, onGameDelete }) => {
  const navigate = useNavigate();
  const [confirmStopDialog, setConfirmStopDialog] = useState(false);
  const [viewResultsDialog, setViewResultsDialog] = useState(false);
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState(false);
  const [sessionStartDialog, setSessionStartDialog] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const calculateTotalDuration = (questions) => {
    if (!questions || !questions.length) return 0;
    return questions.reduce((total, q) => total + (q.duration || 0), 0);
  };
  const handleManageSession = () => {
    navigate(`/session/${sessionId}`);
    setSessionStartDialog(false);
  };
  const handleStartGame = async () => {
    // to do check问题的长度  需要创建问题才能开始游戏
    // calculateTotalDuration()
    try {
      const response = await api.startGame(game.id);
      const newSessionId = response.data.sessionId;
      console.log("", newSessionId);
      setSessionId(newSessionId);
      setSessionStartDialog(true);
    } catch (error) {
      console.error("Error starting game:", error);
      setSnackbar({
        open: true,
        message: "Failed to start game session",
        severity: "error",
      });
    }
  };

  const handleStopGame = async () => {
    try {
      await api.endGame(game.id);
      setConfirmStopDialog(false);
      setViewResultsDialog(true);

      if (onGameStop) {
        onGameStop(game.id);
      }

      if (onGameUpdate) {
        onGameUpdate();
      }
    } catch (error) {
      console.error("Error stopping game:", error);
      setSnackbar({
        open: true,
        message: "Failed to stop game session",
        severity: "error",
      });
    }
  };

  const handleViewResults = () => {
    setViewResultsDialog(false);
    navigate(`/session/${game.active}`);
  };

  const handleDeleteConfirm = () => {
    if (onGameDelete) {
      onGameDelete(game.id);
    }
    setDeleteConfirmDialog(false);
  };

  const handleCopySessionLink = () => {
    const link = `${window.location.origin}/play/join/${sessionId}`;
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setSnackbar({
          open: true,
          message: "Link copied to clipboard!",
          severity: "success",
        });
      })
      .catch((err) => {
        console.error("Could not copy text: ", err);
        setSnackbar({
          open: true,
          message: "Failed to copy link",
          severity: "error",
        });
      });
  };
  const handleViewSessionHistory = () => {
    navigate(`/game/${game.id}/history`);
  };
  return (
    <>
      <Card
        sx={{
          width: 350,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <CardActionArea onClick={() => navigate(`/game/${game.id}`)}>
          <CardMedia
            component="img"
            height="140"
            image={game.thumbnail || "https://picsum.photos/200/300"}
            alt={`the picture of ${game.name}`}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              {game.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Questions: {game.questions?.length || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Duration: {calculateTotalDuration(game.questions)} seconds
            </Typography>
          </CardContent>
        </CardActionArea>
        <CardActions>
          <Button size="small" onClick={() => navigate(`/game/${game.id}`)}>
            Edit
          </Button>
          {game.active ? (
            <Button
              size="small"
              color="secondary"
              onClick={() => setConfirmStopDialog(true)}
            >
              Stop Session
            </Button>
          ) : (
            <Button size="small" color="primary" onClick={handleStartGame}>
              Start Game
            </Button>
          )}
          <Button size="small" color="info" onClick={handleViewSessionHistory}>
            History
          </Button>
          <Button size="small" onClick={() => setDeleteConfirmDialog(true)}>
            Delete
          </Button>
        </CardActions>
      </Card>

      {/* Session Start Dialog (New) */}
      <Dialog
        open={sessionStartDialog}
        onClose={() => setSessionStartDialog(false)}
      >
        <DialogTitle>Game Session Started</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Your game session has been started. Share the session ID or link
            with players:
          </DialogContentText>
          <Box sx={{ my: 2, p: 2, bgcolor: "grey.100", borderRadius: 1 }}>
            <Typography variant="h6" align="center">
              {sessionId}
            </Typography>
          </Box>
          <DialogContentText>
            Players can join by going to the game URL and entering this code, or
            by using the direct link below.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleManageSession}
            color="primary"
            variant="contained"
          >
            Manage Session
          </Button>
          <Button
            onClick={() => {
              setSessionStartDialog(false);
              onGameUpdate();
            }}
          >
            Close
          </Button>
          <Button onClick={handleCopySessionLink} color="primary">
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Stop Game Dialog */}
      <Dialog
        open={confirmStopDialog}
        onClose={() => setConfirmStopDialog(false)}
      >
        <DialogTitle>Stop Game Session</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to stop the current game session? This action
            cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmStopDialog(false)}>Cancel</Button>
          <Button onClick={handleStopGame} color="secondary">
            Stop Session
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Results Dialog */}
      <Dialog
        open={viewResultsDialog}
        onClose={() => setViewResultsDialog(false)}
      >
        <DialogTitle>Session Ended</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The game session has been ended. Would you like to view the results?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewResultsDialog(false)}>Close</Button>
          <Button onClick={handleViewResults} color="primary">
            View Results
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmDialog}
        onClose={() => setDeleteConfirmDialog(false)}
      >
        <DialogTitle>Delete Game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{game.name}&quot;? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </>
  );
};

export default GameCard;
