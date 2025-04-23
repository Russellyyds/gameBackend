// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Snackbar,
  Alert,
  CircularProgress,
  ButtonGroup,
} from "@mui/material";
import { Add as AddIcon, Upload as UploadIcon } from "@mui/icons-material";
import * as api from "../services/api";
import GameCard from "../components/GameCard";
import useSearch from "../hooks/useSearch";

const Dashboard = () => {
  const { searchQuery } = useSearch();
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newGameDialog, setNewGameDialog] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [importGameDialog, setImportGameDialog] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [gameData, setGameData] = useState(null);

  useEffect(() => {
    fetchGames();
  }, []);

  // Filter games when search query or games list changes
  useEffect(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      setFilteredGames(games);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = games.filter((game) =>
        game.name.toLowerCase().includes(lowercaseQuery)
      );
      setFilteredGames(filtered);
    }
  }, [searchQuery, games]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const data = await api.getGames();
      console.log("dashboard::", data);
      setGames(data.games || []);
      setFilteredGames(data.games || []); // Initialize filtered games with all games
      console.log("Dashboard Page:", data.games);
      setError(null);
    } catch (err) {
      setError("Failed to load games. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGame = async () => {
    if (!newGameName.trim()) {
      setSnackbar({
        open: true,
        message: "Game name cannot be empty",
        severity: "error",
      });
      return;
    }

    try {
      const newGameId = Math.floor(Math.random() * 100000000);
      const newGame = {
        id: newGameId,
        name: newGameName,
        owner: localStorage.getItem("email") || "",
        questions: [],
        thumbnail: "",
        active: null,
      };
      // Get all games
      const allGamesResponse = await api.getGames();
      const allGames = allGamesResponse.games || [];
      const updatedGames = [...allGames, newGame];
      await api.updateGames(updatedGames);
      await fetchGames();

      setSnackbar({
        open: true,
        message: "Game created successfully!",
        severity: "success",
      });

      setNewGameDialog(false);
      setNewGameName("");
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to create game",
        severity: "error",
      });
    }
  };

  // Upload JSON file
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    setFileError(null);
    setGameData(null);

    if (!file) return;

    // Verify the file type
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setFileError("Please upload a JSON file");
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileContent = e.target.result;
        const parsedData = JSON.parse(fileContent);

        // Verify data structure
        if (!validateGameData(parsedData)) {
          setFileError("Invalid game data format. Check the example format.");
          return;
        }

        setGameData(parsedData);

        setSnackbar({
          open: true,
          message: "Game data loaded successfully!",
          severity: "success",
        });
      } catch (error) {
        setFileError("Error parsing JSON file: " + error.message);
      }
    };

    reader.onerror = () => {
      setFileError("Error reading file");
    };

    reader.readAsText(file);
  };

  // Verify data structure
  const validateGameData = (data) => {
    if (!data || typeof data !== "object") return false;

    if (typeof data.title !== "string" || !data.title.trim()) return false;

    // Optional description
    if (data.description !== undefined && typeof data.description !== "string")
      return false;

    if (!Array.isArray(data.questions)) return false;

    for (const question of data.questions) {
      if (!validateQuestionData(question)) return false;
    }

    return true;
  };

  // Verify data structure
  const validateQuestionData = (question) => {
    if (!question || typeof question !== "object") return false;

    if (typeof question.text !== "string" || !question.text.trim())
      return false;
    if (!["single", "multiple", "judgement"].includes(question.type))
      return false;
    if (typeof question.duration !== "number" || question.duration <= 0)
      return false;
    if (typeof question.points !== "number" || question.points <= 0)
      return false;

    if (!Array.isArray(question.answers) || question.answers.length < 2)
      return false;

    // All answers should contain: id、text and isCorrect
    for (const answer of question.answers) {
      if (typeof answer !== "object") return false;
      if (answer.id === undefined) return false;
      if (typeof answer.text !== "string") return false;
      if (typeof answer.isCorrect !== "boolean") return false;
    }

    // correctAnswers
    if (!Array.isArray(question.correctAnswers)) {
      // 如果没有correctAnswers字段，我们可以根据isCorrect生成一个
      question.correctAnswers = question.answers
        .filter((answer) => answer.isCorrect)
        .map((answer) => answer.id.toString());
    }

    // correctAnswers == isCorrect?
    const correctIds = new Set(
      question.correctAnswers.map((id) => id.toString())
    );
    for (const answer of question.answers) {
      if (answer.isCorrect !== correctIds.has(answer.id.toString())) {
        return false;
      }
    }

    // Always have only ONE correct answer for these questions
    if (question.type === "single" || question.type === "judgement") {
      if (question.correctAnswers.length !== 1) return false;
    }

    // At least ONE answer should be correct
    if (question.type === "multiple") {
      if (question.correctAnswers.length < 1) return false;
    }

    return true;
  };

  const handleCreateGameFromFile = async () => {
    if (!gameData) {
      setSnackbar({
        open: true,
        message: "Please upload a valid game data file first",
        severity: "error",
      });
      return;
    }

    try {
      const newGameId = Math.floor(Math.random() * 100000000);

      const questionsWithIds = gameData.questions.map((question) => {
        // Generate question id if none
        if (!question.id) {
          question.id = Date.now().toString();
        }

        if (!question.correctAnswers) {
          question.correctAnswers = question.answers
            .filter((answer) => answer.isCorrect)
            .map((answer) => answer.id.toString());
        }

        return question;
      });

      const newGame = {
        id: newGameId,
        name: gameData.title,
        description: gameData.description || "",
        owner: localStorage.getItem("email") || "",
        questions: questionsWithIds,
        thumbnail: "",
        active: null,
      };

      // Load all the games
      const allGamesResponse = await api.getGames();
      const allGames = allGamesResponse.games || [];
      const updatedGames = [...allGames, newGame];
      await api.updateGames(updatedGames);
      await fetchGames();

      setSnackbar({
        open: true,
        message: "Game created successfully from file!",
        severity: "success",
      });

      setImportGameDialog(false);
      setGameData(null);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to create game from file",
        severity: "error",
      });
    }
  };

  const handleDeleteGame = async (gameId) => {
    try {
      // Get all games
      const allGamesResponse = await api.getGames();
      const allGames = allGamesResponse.games || [];

      // Filter out the game to be deleted
      const updatedGames = allGames.filter((game) => game.id !== gameId);

      // Update games through API
      await api.updateGames(updatedGames);

      // Update local state
      setGames(updatedGames);

      // Show success message
      setSnackbar({
        open: true,
        message: "Game deleted successfully!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete game",
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" component="h1">
          My Games {searchQuery && `- Search: "${searchQuery}"`}
        </Typography>
        <ButtonGroup variant="contained">
          <Button
            startIcon={<AddIcon />}
            onClick={() => setNewGameDialog(true)}
          >
            New Game
          </Button>
          <Button
            startIcon={<UploadIcon />}
            onClick={() => setImportGameDialog(true)}
          >
            Import Game
          </Button>
        </ButtonGroup>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {filteredGames.length === 0 ? (
        <Box textAlign="center" py={8}>
          {searchQuery ? (
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No games found matching &quot{searchQuery}&quot
            </Typography>
          ) : (
            <>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                You do not have any games yet
              </Typography>
              <Box mt={2}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setNewGameDialog(true)}
                  sx={{ mr: 2 }}
                >
                  Create your first game
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setImportGameDialog(true)}
                >
                  Import a game
                </Button>
              </Box>
            </>
          )}
        </Box>
      ) : (
        <Grid container spacing={5} justifyContent="center">
          {filteredGames.map((game) => (
            <Grid item xs={12} sm={6} md={4} key={game.id}>
              <GameCard
                game={game}
                // Re-fetch the page
                onGameUpdate={() => fetchGames()}
                onGameDelete={() => handleDeleteGame(game.id)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* New Game Dialog */}
      <Dialog open={newGameDialog} onClose={() => setNewGameDialog(false)}>
        <DialogTitle>Create New Game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter a name for your new game.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Game Name"
            type="text"
            fullWidth
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewGameDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateGame}>Create</Button>
        </DialogActions>
      </Dialog>

      {/* Import Game Dialog */}
      <Dialog
        open={importGameDialog}
        onClose={() => setImportGameDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Import Game from File</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Upload a JSON file containing your game data. This will create a new
            game with questions and answers from the file.
          </DialogContentText>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              my: 2,
            }}
          >
            <input
              accept=".json"
              style={{ display: "none" }}
              id="game-file-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="game-file-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<UploadIcon />}
              >
                Select JSON File
              </Button>
            </label>

            <Button variant="text" href="/2.5.json" download sx={{ mt: 1 }}>
              Download Example File
            </Button>
          </Box>

          {fileError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {fileError}
            </Alert>
          )}

          {gameData && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                File validated successfully!
              </Alert>
              <Typography variant="subtitle1" gutterBottom>
                Game Details:
              </Typography>
              <Typography variant="body2">
                <strong>Title:</strong> {gameData.title}
              </Typography>
              {gameData.description && (
                <Typography variant="body2">
                  <strong>Description:</strong> {gameData.description}
                </Typography>
              )}
              <Typography variant="body2">
                <strong>Questions:</strong> {gameData.questions.length}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportGameDialog(false)}>Cancel</Button>
          <Button
            onClick={handleCreateGameFromFile}
            disabled={!gameData}
            variant="contained"
          >
            Create Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for alerts */}
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

export default Dashboard;
