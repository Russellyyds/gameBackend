// EditQuestion page feature checklist:
// [x] Route: /game/{game_id}/question/{question_id}
// [x] Set question type, text, duration, points
// [x] Add/edit 2-6 answers and mark correct ones
// [x] Attach YouTube link or upload image

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Paper,
  Divider,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  InputAdornment,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Save as SaveIcon,
  YouTube as YouTubeIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import * as api from "../services/api";

import AnswerItem from "../components/AnswerItem";

const EditQuestion = () => {
  const { gameId, questionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [game, setGame] = useState(null);
  const [question, setQuestion] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Form fields
  const [questionText, setQuestionText] = useState("");
  const [questionType, setQuestionType] = useState("single");
  const [duration, setDuration] = useState(30);
  const [points, setPoints] = useState(10);
  const [mediaType, setMediaType] = useState("none");
  const [mediaUrl, setMediaUrl] = useState("");
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    fetchGame();
  }, [gameId, questionId]);

  const fetchGame = async () => {
    try {
      setLoading(true);
      const data = await api.getGames();
      console.log("");
      const foundGame = data.games.find((g) => g.id.toString() === gameId);

      if (!foundGame) {
        setError("Game not found");
        return;
      }

      setGame(foundGame);

      // Find the question with the specified index
      const questionIndex = parseInt(questionId, 10);
      if (
        isNaN(questionIndex) ||
        !foundGame.questions ||
        questionIndex >= foundGame.questions.length
      ) {
        setError("Question not found");
        return;
      }

      const foundQuestion = foundGame.questions[questionIndex];
      setQuestion(foundQuestion);

      // Initialize form with question data
      setQuestionText(foundQuestion.text || "");
      setQuestionType(foundQuestion.type || "single");
      setDuration(foundQuestion.duration || 30);
      setPoints(foundQuestion.points || 10);

      // Set media type and URL if available
      if (foundQuestion.youtubeUrl) {
        setMediaType("youtube");
        setMediaUrl(foundQuestion.youtubeUrl);
      } else if (foundQuestion.imageUrl) {
        setMediaType("image");
        setMediaUrl(foundQuestion.imageUrl);
      } else {
        setMediaType("none");
        setMediaUrl("");
      }

      // Initialize answers
      setAnswers(
        foundQuestion.answers || [
          { id: 1, text: "", isCorrect: true },
          { id: 2, text: "", isCorrect: false },
        ]
      );

      setError(null);
    } catch (err) {
      setError("Failed to load question. Please try again later.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // New function to handle image file upload and conversion to base64
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
        setMediaUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddAnswer = () => {
    if (answers.length >= 6) {
      setSnackbar({
        open: true,
        message: "Maximum 6 answers allowed",
        severity: "warning",
      });
      return;
    }

    const newAnswerId = Math.max(...answers.map((a) => a.id), 0) + 1;
    setAnswers([...answers, { id: newAnswerId, text: "", isCorrect: false }]);
  };

  const handleDeleteAnswer = (id) => {
    if (answers.length <= 2) {
      setSnackbar({
        open: true,
        message: "Minimum 2 answers required",
        severity: "warning",
      });
      return;
    }

    setAnswers(answers.filter((answer) => answer.id !== id));
  };

  const handleAnswerChange = (id, field, value) => {
    setAnswers(
      answers.map((answer) => {
        if (answer.id === id) {
          return { ...answer, [field]: value };
        }
        return answer;
      })
    );
  };

  const handleSave = async () => {
    try {
      // Validate form
      if (!questionText.trim()) {
        setSnackbar({
          open: true,
          message: "Question text cannot be empty",
          severity: "error",
        });
        return;
      }

      if (answers.length < 2) {
        setSnackbar({
          open: true,
          message: "At least 2 answers are required",
          severity: "error",
        });
        return;
      }

      if (answers.length > 6) {
        setSnackbar({
          open: true,
          message: "Maximum 6 answers are allowed",
          severity: "error",
        });
        return;
      }

      // Validate that at least one answer is correct
      const hasCorrectAnswer = answers.some((answer) => answer.isCorrect);
      if (!hasCorrectAnswer) {
        setSnackbar({
          open: true,
          message: "At least one answer must be marked as correct",
          severity: "error",
        });
        return;
      }

      // For single choice or judgement, ensure exactly one correct answer
      if (
        (questionType === "single" || questionType === "judgement") &&
        answers.filter((a) => a.isCorrect).length !== 1
      ) {
        setSnackbar({
          open: true,
          message: `${
            questionType === "single" ? "Single choice" : "Judgement"
          } questions must have exactly one correct answer`,
          severity: "error",
        });
        return;
      }

      // Get the IDs of correct answers as strings for the correctAnswers field
      const correctAnswersIds = answers
        .filter((answer) => answer.isCorrect)
        .map((answer) => answer.id.toString());

      // Create updated question object
      const updatedQuestion = {
        ...question,
        text: questionText,
        type: questionType,
        duration: duration,
        points: points,
        correctAnswers: correctAnswersIds,
        answers: answers.map((answer) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
        })),
      };

      // Add media URL if applicable
      if (mediaType === "youtube") {
        updatedQuestion.youtubeUrl = mediaUrl;
        delete updatedQuestion.imageUrl;
      } else if (mediaType === "image") {
        updatedQuestion.imageUrl = mediaUrl;
        delete updatedQuestion.youtubeUrl;
      } else {
        delete updatedQuestion.youtubeUrl;
        delete updatedQuestion.imageUrl;
      }

      // Update game with the modified question
      const updatedGame = { ...game };
      updatedGame.questions[parseInt(questionId, 10)] = updatedQuestion;

      // Get all games
      const allGamesResponse = await api.getGames();
      const allGames = allGamesResponse.games;

      // Replace the updated game in the games list
      const updatedGames = allGames.map((g) =>
        g.id === game.id ? updatedGame : g
      );

      // Update games through API
      await api.updateGames(updatedGames);

      // Show success message
      setSnackbar({
        open: true,
        message: "Question updated successfully!",
        severity: "success",
      });

      // Navigate back to the game edit page
      setTimeout(() => {
        navigate(`/game/${gameId}`);
      }, 1500);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.message || "Failed to update question",
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
          onClick={() => navigate(`/game/${gameId}`)}
          sx={{ mt: 2 }}
        >
          Back to Game
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(`/game/${gameId}`)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Edit Question
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box component="form" noValidate autoComplete="off">
          <Typography variant="h6" gutterBottom>
            Question Details
          </Typography>

          <TextField
            label="Question Text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={4}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Question Type</FormLabel>
                <RadioGroup
                  value={questionType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setQuestionType(newType);

                    // If changing to judgment or single choice, ensure only one correct answer
                    if (newType === "judgement" || newType === "single") {
                      // Find first correct answer or set the first one correct
                      const hasCorrect = answers.some((a) => a.isCorrect);
                      if (!hasCorrect && answers.length > 0) {
                        const newAnswers = [...answers];
                        newAnswers[0].isCorrect = true;
                        setAnswers(newAnswers);
                      } else if (hasCorrect) {
                        // Make sure only one is correct
                        const firstCorrectIndex = answers.findIndex(
                          (a) => a.isCorrect
                        );
                        if (firstCorrectIndex >= 0) {
                          const newAnswers = answers.map((answer, index) => ({
                            ...answer,
                            isCorrect: index === firstCorrectIndex,
                          }));
                          setAnswers(newAnswers);
                        }
                      }
                    }
                  }}
                >
                  <FormControlLabel
                    value="single"
                    control={<Radio />}
                    label="Single Choice (ONLY one correct)"
                  />
                  <FormControlLabel
                    value="multiple"
                    control={<Radio />}
                    label="Multiple Choice (MULTIPLE correct)"
                  />
                  <FormControlLabel
                    value="judgement"
                    control={<Radio />}
                    label="Judgement (SINGLE correct/incorrect)"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">seconds</InputAdornment>
                  ),
                }}
                margin="normal"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Points"
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                fullWidth
                margin="normal"
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3 }}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Media (Optional)</FormLabel>
              <RadioGroup
                value={mediaType}
                onChange={(e) => {
                  setMediaType(e.target.value);
                  if (e.target.value === "none") {
                    setMediaUrl("");
                  }
                }}
                row
              >
                <FormControlLabel
                  value="none"
                  control={<Radio />}
                  label="None"
                />
                <FormControlLabel
                  value="youtube"
                  control={<Radio />}
                  label="YouTube Video"
                />
                <FormControlLabel
                  value="image"
                  control={<Radio />}
                  label="Image"
                />
              </RadioGroup>
            </FormControl>

            {mediaType === "youtube" && (
              <TextField
                label="YouTube URL"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                fullWidth
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <YouTubeIcon />
                    </InputAdornment>
                  ),
                }}
              />
            )}

            {mediaType === "image" && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: "none" }}
                  id="question-image-upload"
                  type="file"
                  onChange={handleImageUpload}
                />
                <label htmlFor="question-image-upload">
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<ImageIcon />}
                  >
                    Upload Image
                  </Button>
                </label>
                {mediaUrl && (
                  <Button
                    color="error"
                    sx={{ ml: 2 }}
                    onClick={() => setMediaUrl("")}
                  >
                    Remove Image
                  </Button>
                )}
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Maximum size: 2MB. Upload an image related to your question.
                </Typography>

                {/* Image preview */}
                {mediaUrl && mediaType === "image" && (
                  <Box sx={{ mt: 2, textAlign: "center" }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Image Preview:
                    </Typography>
                    <img
                      src={mediaUrl}
                      alt="Question image preview"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "200px",
                        objectFit: "contain",
                        border: "1px solid #e0e0e0",
                        borderRadius: "4px",
                        padding: "4px",
                      }}
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/400x300?text=Invalid+Image";
                      }}
                    />
                  </Box>
                )}
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6">Answers</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddAnswer}
              disabled={answers.length >= 6}
            >
              Add Answer
            </Button>
          </Box>

          {answers.map((answer, index) => (
            <AnswerItem
              key={answer.id}
              index={index}
              answer={answer}
              questionType={questionType}
              disableDelete={answers.length <= 2}
              onChange={handleAnswerChange}
              onMarkCorrect={(id) => {
                if (questionType === "multiple") {
                  handleAnswerChange(id, "isCorrect", !answer.isCorrect);
                } else {
                  setAnswers(
                    answers.map((a) => ({ ...a, isCorrect: a.id === id }))
                  );
                }
              }}
              onDelete={handleDeleteAnswer}
            />
          ))}

          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              size="large"
            >
              Save Question
            </Button>
          </Box>
        </Box>
      </Paper>

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

export default EditQuestion;
