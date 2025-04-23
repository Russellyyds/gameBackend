// EditGame page feature checklist:
// [x] Route: /game/{game_id}
// [x] View all questions and edit a selected one
// [x] Add new question with instant rendering
// [x] Delete question and update UI instantly
// [x] Edit game metadata (title, thumbnail)

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Divider,
  Paper,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  QuestionAnswer as QuestionIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import * as api from "../services/api";

const EditGame = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newQuestionDialog, setNewQuestionDialog] = useState(false);
  const [deleteQuestionDialog, setDeleteQuestionDialog] = useState({
    open: false,
    index: null,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [editMetadataDialog, setEditMetadataDialog] = useState(false);
  const [gameNameEdit, setGameNameEdit] = useState("");
  const [gameThumbnailEdit, setGameThumbnailEdit] = useState("");

  // New question initial state
  const [newQuestion, setNewQuestion] = useState({
    text: "",
    type: "single",
    duration: 30,
    points: 10,
  });

  useEffect(() => {
    fetchGame();
  }, [gameId]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const data = await api.getGames();
      const foundGame = data.games.find((g) => g.id.toString() === gameId);

      if (!foundGame) {
        setError("Game not found");
        return;
      }

      setGame(foundGame);
      setGameNameEdit(foundGame.name || "");
      setGameThumbnailEdit(foundGame.thumbnail || "");
      setError(null);
    } catch (err) {
      setError("Failed to load game. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // New function to handle image upload and conversion to base64
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: "Image too large. Maximum size is 2MB.",
          severity: "error",
        });
        return;
      }

      // Check file type
      if (!file.type.match("image.*")) {
        setSnackbar({
          open: true,
          message: "Please select an image file.",
          severity: "error",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setGameThumbnailEdit(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateMetadata = async () => {
    try {
      if (!gameNameEdit.trim()) {
        setSnackbar({
          open: true,
          message: "Game name cannot be empty",
          severity: "error",
        });
        return;
      }

      // Create a copy of the game with updated metadata
      const updatedGame = {
        ...game,
        name: gameNameEdit,
        thumbnail: gameThumbnailEdit || game.thumbnail,
      };

      // Get all games
      const allGamesResponse = await api.getGames();
      const allGames = allGamesResponse.games;

      // Replace the updated game in the games list
      const updatedGames = allGames.map((g) =>
        g.id === game.id ? updatedGame : g
      );

      // Update games through API
      await api.updateGames(updatedGames);

      // Update local state
      setGame(updatedGame);

      // Close dialog and show success message
      setEditMetadataDialog(false);
      setSnackbar({
        open: true,
        message: "Game details updated successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to update game details",
        severity: "error",
      });
    }
  };

  const handleAddQuestion = async () => {
    try {
      // Validate question data
      if (!newQuestion.text.trim()) {
        setSnackbar({
          open: true,
          message: "Question text cannot be empty",
          severity: "error",
        });
        return;
      }

      // Create a copy of the game
      const updatedGame = { ...game };

      // Initialize questions array if it doesn't exist
      if (!updatedGame.questions) {
        updatedGame.questions = [];
      }

      // Add new question in the format expected by the backend
      const questionToAdd = {
        id: Date.now().toString(), // Generate a unique ID
        text: newQuestion.text,
        type: newQuestion.type,
        duration: newQuestion.duration,
        points: newQuestion.points,
      };

      // If there are media URLs, add them
      if (newQuestion.youtubeUrl) {
        questionToAdd.youtubeUrl = newQuestion.youtubeUrl;
      }
      if (newQuestion.imageUrl) {
        questionToAdd.imageUrl = newQuestion.imageUrl;
      }

      updatedGame.questions.push(questionToAdd);

      // Get all games
      const allGamesResponse = await api.getGames();
      const allGames = allGamesResponse.games;

      // Replace the updated game in the games list
      const updatedGames = allGames.map((g) =>
        g.id === game.id ? updatedGame : g
      );

      // Update games through API
      await api.updateGames(updatedGames);

      // Update local state
      setGame(updatedGame);

      // Close dialog and show success message
      setNewQuestionDialog(false);
      setSnackbar({
        open: true,
        message: "Question added successfully!",
        severity: "success",
      });

      // Reset form
      setNewQuestion({
        text: "",
        type: "single",
        duration: 30,
        points: 10,
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to add question",
        severity: "error",
      });
    }
  };

  const handleDeleteQuestion = async (index) => {
    try {
      // Create a copy of the game
      const updatedGame = { ...game };

      // Remove the question at the specified index
      updatedGame.questions.splice(index, 1);

      // Get all games
      const allGamesResponse = await api.getGames();
      const allGames = allGamesResponse.games;

      // Replace the updated game in the games list
      const updatedGames = allGames.map((g) =>
        g.id === game.id ? updatedGame : g
      );

      // Update games through API
      await api.updateGames(updatedGames);

      // Update local state
      setGame(updatedGame);

      // Close dialog and show success message
      setDeleteQuestionDialog({ open: false, index: null });
      setSnackbar({
        open: true,
        message: "Question deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete question",
        severity: "error",
      });
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  if (!game) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 3 }}>
          Game not found
        </Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{ mt: 2 }}
        >
          Back to Dashboard
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/dashboard")}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontSize: { xs: "1.0rem", sm: "1.5rem", md: "2.5rem" } }}
        >
          Edit Game: {game.name}
        </Typography>
        <Button
          variant="outlined"
          startIcon={<EditIcon />}
          onClick={() => setEditMetadataDialog(true)}
          sx={{ ml: "auto" }}
        >
          Edit Game Details
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Game Details
        </Typography>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={3}>
          {/* Game thumbnail display */}
          <Box
            sx={{
              width: { xs: "50%", sm: "230px", md: "250px" },
              height: "150px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              overflow: "hidden",
              bgcolor: "#f5f5f5",
            }}
          >
            {game.thumbnail ? (
              <img
                src={game.thumbnail}
                alt={`${game.name} thumbnail`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.target.src = "https://picsum.photos/200/300";
                }}
              />
            ) : (
              // <Typography color="textSecondary">No thumbnail image</Typography>
              <img
                src={"https://picsum.photos/800/500"}
                alt={`${game.name} thumbnail`}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.target.src = "https://picsum.photos/200/300";
                }}
              />
            )}
          </Box>

          {/* Game details information */}
          <Box display="flex" flexDirection="column" gap={2} flexGrow={1}>
            <Typography>
              <strong>Game Name:</strong> {game.name}
            </Typography>
            <Typography>
              <strong>Game ID:</strong> {game.id}
            </Typography>
            <Typography>
              <strong>Total Questions:</strong> {game.questions?.length || 0}
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h5">Questions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setNewQuestionDialog(true)}
        >
          Add Question
        </Button>
      </Box>

      {!game.questions || game.questions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography color="textSecondary" gutterBottom>
            No questions added yet
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setNewQuestionDialog(true)}
            sx={{ mt: 2 }}
          >
            Add your first question
          </Button>
        </Paper>
      ) : (
        <Paper>
          <List>
            {game.questions.map((question, index) => (
              <Box key={index}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemIcon>
                    <QuestionIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary={question.text || `Question ${index + 1}`}
                    secondary={`Type: ${question.type || "single"} | Time: ${
                      question.duration || 30
                    }s | Points: ${question.points || 10}`}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      aria-label="edit"
                      onClick={() =>
                        navigate(`/game/${gameId}/question/${index}`)
                      }
                      sx={{ mr: 1 }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={() =>
                        setDeleteQuestionDialog({ open: true, index })
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      {/* Add New Question Dialog */}
      <Dialog
        open={newQuestionDialog}
        onClose={() => setNewQuestionDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Add New Question</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the details for the new question.
          </DialogContentText>
          <Box sx={{ mt: 2 }}>
            <TextField
              autoFocus
              margin="dense"
              id="question-text"
              label="Question Text"
              type="text"
              fullWidth
              value={newQuestion.text}
              onChange={(e) =>
                setNewQuestion({ ...newQuestion, text: e.target.value })
              }
              sx={{ mb: 2 }}
            />
            <Box display="flex" gap={2} mb={2}>
              <TextField
                select
                label="Question Type"
                value={newQuestion.type}
                onChange={(e) =>
                  setNewQuestion({ ...newQuestion, type: e.target.value })
                }
                SelectProps={{
                  native: true,
                }}
                fullWidth
              >
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
                <option value="judgement">Judgement</option>
              </TextField>
              <TextField
                label="Time Limit (seconds)"
                type="number"
                value={newQuestion.duration}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    duration: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
              />
              <TextField
                label="Points"
                type="number"
                value={newQuestion.points}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    points: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewQuestionDialog(false)}>Cancel</Button>
          <Button onClick={handleAddQuestion}>Add Question</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Question Confirmation Dialog */}
      <Dialog
        open={deleteQuestionDialog.open}
        onClose={() => setDeleteQuestionDialog({ open: false, index: null })}
      >
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this question? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setDeleteQuestionDialog({ open: false, index: null })
            }
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleDeleteQuestion(deleteQuestionDialog.index)}
            color="error"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Game Metadata Dialog */}
      <Dialog
        open={editMetadataDialog}
        onClose={() => setEditMetadataDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Game Details</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Update the name and thumbnail for your game.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="game-name"
            label="Game Name"
            type="text"
            fullWidth
            value={gameNameEdit}
            onChange={(e) => setGameNameEdit(e.target.value)}
            sx={{ mb: 2, mt: 2 }}
          />

          {/* Image upload section with file input */}
          <Box sx={{ mt: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Game Thumbnail
            </Typography>
            <input
              accept="image/*"
              style={{ display: "none" }}
              id="thumbnail-upload"
              type="file"
              onChange={handleImageUpload}
            />
            <label htmlFor="thumbnail-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<ImageIcon />}
              >
                Upload Image
              </Button>
            </label>
            {gameThumbnailEdit && (
              <Button
                color="error"
                sx={{ ml: 2 }}
                onClick={() => setGameThumbnailEdit("")}
              >
                Remove Image
              </Button>
            )}
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Maximum size: 2MB. Recommended dimensions: 300x150px.
            </Typography>
          </Box>

          {gameThumbnailEdit && (
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="subtitle2" gutterBottom>
                Thumbnail Preview:
              </Typography>
              <img
                src={gameThumbnailEdit}
                alt="Thumbnail preview"
                style={{
                  maxWidth: "100%",
                  maxHeight: "150px",
                  objectFit: "contain",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "4px",
                }}
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/300x150?text=Invalid+Image";
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMetadataDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateMetadata}>Update</Button>
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
    </Container>
  );
};

export default EditGame;
