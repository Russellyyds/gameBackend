/**
 * GamePlay.jsx
 * This component renders the player's view during a live game session.
 * It handles question display, countdown, answer submission, and final results.
 * Supports image/video embedding, multiple/single choice, and real-time scoring.
 * Also manages player-side logic defined in 2.4: waiting room, answer lock, and session state sync.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  CircularProgress,
  Alert,
  RadioGroup,
  FormGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import * as api from "../services/api";

import CountdownTimer from "../components/CountdownTimer";

// Convert Youtube URL for embedding
const formatYouTubeUrl = (url) => {
  const match = url.match(/(?:watch\?v=|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

const retryApiCall = async (
  fn,
  retries = 3,
  initialDelay = 1000,
  backoffFactor = 1.5
) => {
  let delay = initialDelay;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      console.warn(`Attempt ${attempt} failed:`, err.message || err);

      if (
        err.message &&
        (err.message.includes("game has ended") ||
          err.message.includes("no more questions") ||
          err.message.includes("game not found") ||
          err.message.includes("session expired") ||
          err.message.includes("not an active session") ||
          err.message.includes("Session ID is not an active session"))
      ) {
        throw err; 
      }

      if (attempt === retries) throw err;

      await new Promise((res) => setTimeout(res, delay));
      delay = Math.min(delay * backoffFactor, 8000); // 8s

      console.log(`Trying again in ${delay}ms...`);
    }
  }
};

const GamePlay = () => {
  const { playerId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState([]);
  const [gameEnded, setGameEnded] = useState(false);
  const [totalScore, setTotalScore] = useState(0);
  const [currentQuestionScore, setCurrentQuestionScore] = useState(0);
  const [resultsData, setResultsData] = useState([]);

  // Refs for storing values that need to persist between renders
  const selectedAnswersRef = useRef([]);
  const timerRef = useRef(null);
  const gameEndingRef = useRef(false);
  const prevQuestionIdRef = useRef(null);
  // Refs to help with stale closure issues
  const currentQuestionRef = useRef(null);
  const scoreCalculatedRef = useRef(false);

  const getCorrectAnswers = useCallback(async () => {
    try {
      console.log("Loading correct answers...");

      if (scoreCalculatedRef.current) {
        console.log("Correct answers loaded");
        setShowResults(true);
        return;
      }

      scoreCalculatedRef.current = true;

      // Correct answers
      try {
        const response = await retryApiCall(
          () => api.getAnswers(playerId),
          3,
          1000
        );
        console.log("Correct answers:", response);

        const correctAnswerIds = response.answerIds || [];
        console.log("Correct answer ID:", correctAnswerIds);

        setCorrectAnswers(correctAnswerIds);

        const questionData = currentQuestionRef.current;
        const userAnswers = selectedAnswersRef.current;

        let earnedPoints = 0;
        if (questionData) {
          if (questionData.type === "multiple") {
            // MCQ
            const isExactMatch =
              userAnswers.length === correctAnswerIds.length &&
              userAnswers.every((id) => correctAnswerIds.includes(id)) &&
              correctAnswerIds.every((id) => userAnswers.includes(id));

            if (isExactMatch) {
              earnedPoints = questionData.points || 0;
            }
          } else {
            // SCQ
            if (
              userAnswers.length === 1 &&
              correctAnswerIds.includes(userAnswers[0])
            ) {
              earnedPoints = questionData.points || 0;
            }
          }
        }

        console.log(`Earned points: ${earnedPoints}`);
        setCurrentQuestionScore(earnedPoints);
        setTotalScore((prev) => prev + earnedPoints);
      } catch (apiErr) {
        console.error("API Error:", apiErr);
        setCorrectAnswers([]);
        setCurrentQuestionScore(0);
      }

      setShowResults(true);
    } catch (err) {
      console.error("Failed to load the correct answers:", err);

      setShowResults(true);

      if (
        err.message &&
        (err.message.includes("game has ended") ||
          err.message.includes("no more questions") ||
          err.message.includes("game not found") ||
          err.message.includes("session expired") ||
          err.message.includes("not an active session") ||
          err.message.includes("Session ID is not an active session"))
      ) {
        if (!gameEndingRef.current) {
          gameEndingRef.current = true;
          setGameEnded(true);
        }
      }
    }
  }, [playerId]);

  // Changing answers is allowed
  const handleAnswerSelect = async (answerId, isMultiple) => {
    console.log("Selected answer:", answerId);

    // Result out
    if (showResults || scoreCalculatedRef.current) {
      console.log("Unable to change your answers.");
      return;
    }

    answerId = answerId.toString();

    let newSelectedAnswers;

    if (isMultiple) {
      if (selectedAnswers.includes(answerId)) {
        newSelectedAnswers = selectedAnswers.filter((id) => id !== answerId);
      } else {
        newSelectedAnswers = [...selectedAnswers, answerId];
      }
    } else {
      newSelectedAnswers = [answerId];
    }

    console.log("New selected answers:", newSelectedAnswers);

    setSelectedAnswers(newSelectedAnswers);
    selectedAnswersRef.current = newSelectedAnswers;

    try {
      const answerIdsAsStrings = newSelectedAnswers.map((id) => id.toString());
      console.log("Submitting answers:", answerIdsAsStrings);
      await submitAnswer(answerIdsAsStrings);
    } catch (error) {
      if (
        error.message &&
        error.message.includes("Can't answer question once answer is available")
      ) {
        console.log("Answer is locked, cannot submit anymore.");
        if (!scoreCalculatedRef.current) {
          console.log("Answer is locked, triggering result fetch.");
          getCorrectAnswers();
        }
      } else {
        console.error("Failed to submit answer:", error);
      }
    }
  };

  const submitAnswer = useCallback(
    async (answers) => {
      if (scoreCalculatedRef.current || showResults) {
        console.log("Score already calculated or results already shown, skipping submission.");
        return false;
      }

      try {
        await api.submitAnswers(playerId, answers);
        console.log("Answer submission successful");
        return true;
      } catch (err) {
        console.error("Error submitting answer:", err);

        if (
          err.message &&
          err.message.includes("Can't answer question once answer is available")
        ) {
          if (!scoreCalculatedRef.current) {
            console.log("Answer already available at submission time, fetching correct answers.");
            setTimeout(() => getCorrectAnswers(), 100);
          }
        }
        else if (
          err.message &&
          (err.message.includes("game has ended") ||
            err.message.includes("no more questions") ||
            err.message.includes("game not found") ||
            err.message.includes("session expired") ||
            err.message.includes("not an active session") ||
            err.message.includes("Session ID is not an active session"))
        ) {
          if (!gameEndingRef.current) {
            gameEndingRef.current = true;
            setGameEnded(true);
          }
        }

        throw err;
      }
    },
    [playerId, getCorrectAnswers, showResults]
  );

  const fetchCurrentQuestion = useCallback(async () => {
    try {
      const response = await api.getCurrentQuestion(playerId);
      console.log("Current question response:", response);

      const newQuestion = response.question;
      const newQuestionId = newQuestion?.id;

      if (timerRef.current) {
        console.log("Clearing previous timer.");
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setCurrentQuestion(newQuestion);
      currentQuestionRef.current = newQuestion;

      const isNewQuestion = newQuestionId !== prevQuestionIdRef.current;

      let initialRemaining = 0;
      if (newQuestion && newQuestion.duration) {
        const endTime = new Date(newQuestion.isoTimeLastQuestionStarted);
        endTime.setSeconds(endTime.getSeconds() + newQuestion.duration);
        const now = new Date();
        initialRemaining = Math.max(0, Math.floor((endTime - now) / 1000));
      }

      console.log(`Initial remaining time for new question: ${initialRemaining}s`);

      if (isNewQuestion) {
        console.log("New question detected, resetting all states.");

        setSelectedAnswers([]);
        selectedAnswersRef.current = [];
        setShowResults(false);
        setCorrectAnswers([]);
        setCurrentQuestionScore(0);

        scoreCalculatedRef.current = false;

        prevQuestionIdRef.current = newQuestionId;

        if (initialRemaining <= 5 && initialRemaining > 0) {
          console.log(
            `Initial remaining time too short (${initialRemaining}s), setting to safe minimum of 10 seconds.`
          );
          initialRemaining = 10;
        }
      }

      setTimeRemaining(initialRemaining);
      console.log(`Setting new timer, adjusted remaining time: ${initialRemaining} seconds.`);

      if (initialRemaining <= 0) {
        console.log("Time is up, fetching correct answers immediately.");
        if (!scoreCalculatedRef.current) {
          setTimeout(() => getCorrectAnswers(), 50);
        }
        return;
      }

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            timerRef.current = null;

            if (
              !scoreCalculatedRef.current &&
              prevQuestionIdRef.current === currentQuestionRef.current?.id
            ) {
              console.log("Countdown finished, fetching correct answers.");
              setTimeout(() => getCorrectAnswers(), 50);
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      timerRef.current = timer;
    } catch (err) {
      console.error("Error fetching question:", err);
    }
  }, [playerId, getCorrectAnswers]);

  // Check if game has started
  useEffect(() => {
    const checkGameStatus = async () => {
      try {
        const response = await api.getGameStatus(playerId);
        console.log("Game status response:", response);

        // Only set if game has started
        setGameStarted(response.started);

        if (response.started) {
          // Game has started, get current question
          fetchCurrentQuestion();
        }
      } catch (err) {
        console.error("Error checking game status:", err);

        // Check if error message indicates game has ended
        if (
          err.message &&
          (err.message.includes("game has ended") ||
            err.message.includes("no more questions") ||
            err.message.includes("game not found") ||
            err.message.includes("session expired") ||
            err.message.includes("not an active session") ||
            err.message.includes("Session ID is not an active session"))
        ) {
          if (!gameEndingRef.current) {
            gameEndingRef.current = true;
            const response = await api.getResults(playerId);
            // console.log("result:::::",res)
            // const  response=res.answers;
            //
            console.log("getResults::", response);

            // Store results data for displaying answer times
            setResultsData(response);

            setGameEnded(true);
            setLoading(false);
            return; // Avoid setting general error state
          }
        } else {
          setError("Failed to check game status");
        }
      } finally {
        if (!gameEndingRef.current) {
          setLoading(false);
        }
      }
    };

    checkGameStatus();

    // Poll game status periodically
    const intervalId = setInterval(checkGameStatus, 1000);

    return () => {
      clearInterval(intervalId);
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playerId, fetchCurrentQuestion]);

  // Check if answer is correct
  const isAnswerCorrect = (answerId) => {
    const answerIdString = String(answerId);
    console.log(
      "Checking if answer is correct:",
      answerIdString,
      "Type:",
      typeof answerIdString,
      "Correct answers:",
      correctAnswers,
      "Includes:",
      correctAnswers.includes(answerIdString)
    );

    return correctAnswers.includes(answerIdString);
  };

  // Calculate answer time in seconds
  const calculateAnswerTime = (questionStartedAt, answeredAt) => {
    const startTime = new Date(questionStartedAt);
    const endTime = new Date(answeredAt);
    return ((endTime - startTime) / 1000).toFixed(2);
  };

  // Close game end dialog
  const handleCloseGameEnd = () => {
    // Navigate to home or lobby
    window.location.href = "/";
  };

  if (loading && !gameEnded) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !gameEnded) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
          onClick={() => (window.location.href = "/")}
        >
          Return to Lobby
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {/* Game end dialog */}
      <Dialog
        open={gameEnded}
        onClose={handleCloseGameEnd}
        aria-labelledby="game-end-dialog-title"
        aria-describedby="game-end-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          id="game-end-dialog-title"
          sx={{
            textAlign: "center",
            bgcolor: "primary.main",
            color: "white",
            fontSize: "1.75rem",
            py: 2,
          }}
        >
          Game Over!
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          <DialogContentText
            id="game-end-dialog-description"
            sx={{ textAlign: "center", mb: 3 }}
          >
            The game has ended. Thank you for playing!
          </DialogContentText>

          {/* Score display */}
          <Box
            sx={{
              textAlign: "center",
              mb: 3,
              p: 3,
              border: "2px solid #2196f3",
              borderRadius: 2,
              bgcolor: "rgba(33, 150, 243, 0.05)",
            }}
          >
            <Typography variant="h5" gutterBottom>
              Final Score
            </Typography>
            <Typography
              variant="h3"
              color="primary"
              sx={{ fontWeight: "bold", my: 2 }}
            >
              {totalScore} points
            </Typography>
          </Box>

          {/* Answer times display */}
          {resultsData && resultsData.length > 0 && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 2,
                bgcolor: "background.paper",
              }}
            >
              <Typography
                variant="h6"
                gutterBottom
                sx={{ borderBottom: "1px solid #e0e0e0", pb: 1, mb: 2 }}
              >
                Your Answer Times
              </Typography>
              <List sx={{ width: "100%" }}>
                {resultsData.map((result, index) => (
                  <Box key={index}>
                    <ListItem
                      sx={{
                        py: 2,
                        backgroundColor: result.correct
                          ? "rgba(76, 175, 80, 0.05)"
                          : "rgba(244, 67, 54, 0.05)",
                        borderRadius: 1,
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                          >
                            <Typography variant="subtitle1">
                              Question {index + 1}
                            </Typography>
                            <Chip
                              label={`${calculateAnswerTime(
                                result.questionStartedAt,
                                result.answeredAt
                              )} s`}
                              color={result.correct ? "success" : "default"}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box
                            display="flex"
                            justifyContent="space-between"
                            alignItems="center"
                            mt={1}
                          >
                            <Typography variant="body2" color="text.secondary">
                              Selected: {result?.answers?.join(", ")}
                            </Typography>
                            <Chip
                              label={result.correct ? "Correct" : "Incorrect"}
                              color={result.correct ? "success" : "error"}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < resultsData.length - 1 && (
                      <Divider variant="middle" sx={{ my: 1 }} />
                    )}
                  </Box>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, justifyContent: "center" }}>
          <Button
            variant="contained"
            onClick={handleCloseGameEnd}
            color="primary"
            size="large"
            sx={{ minWidth: 120 }}
          >
            Return to Lobby
          </Button>
        </DialogActions>
      </Dialog>

      {!gameStarted && !gameEnded ? (
        // Waiting for game to start
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" gutterBottom>
            Waiting for the game to start...
          </Typography>
          <Typography variant="body1">
            The host will start the game shortly. Please wait.
          </Typography>
          <Box sx={{ mt: 3 }}>
            <CircularProgress />
          </Box>
        </Paper>
      ) : !gameEnded ? (
        // Game started, show current question
        <Paper sx={{ p: 4 }}>
          {currentQuestion ? (
            <>
              {/* Countdown */}
              <CountdownTimer
                remaining={timeRemaining}
                total={currentQuestion.duration || 30}
                criticalThreshold={10}
              />

              {/* Question text */}
              <Typography variant="h4" gutterBottom>
                {currentQuestion.text}
              </Typography>

              {/* Media (image or video) */}
              {currentQuestion.imageUrl && (
                <Box sx={{ my: 3, textAlign: "center" }}>
                  <img
                    src={currentQuestion.imageUrl}
                    alt="Question media"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "300px",
                      objectFit: "contain",
                    }}
                  />
                </Box>
              )}

              {currentQuestion.youtubeUrl && (
                <>
                  {console.log("youtubeUrl:", currentQuestion.youtubeUrl)}
                  <Box
                    sx={{
                      my: 3,
                      textAlign: "center",
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                    }}
                  >
                    <iframe
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                      }}
                      src={formatYouTubeUrl(currentQuestion.youtubeUrl)}
                      title="Question video"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </Box>
                </>
              )}

              {/* Answer options */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                  {currentQuestion.type === "multiple"
                    ? "Select all correct answers"
                    : "Select the correct answer"}
                </Typography>

                {currentQuestion.type === "multiple" ? (
                  <FormGroup>
                    {currentQuestion.answers &&
                      currentQuestion.answers.map((answer) => (
                        <FormControlLabel
                          key={answer.id}
                          control={
                            <Checkbox
                              checked={selectedAnswers.includes(
                                String(answer.id)
                              )}
                              onChange={() =>
                                handleAnswerSelect(String(answer.id), true)
                              }
                              disabled={showResults}
                              color={
                                showResults &&
                                isAnswerCorrect(String(answer.id))
                                  ? "success"
                                  : "primary"
                              }
                            />
                          }
                          label={
                            <Typography
                              color={
                                showResults
                                  ? isAnswerCorrect(String(answer.id))
                                    ? "success.main"
                                    : selectedAnswers.includes(String(answer.id))? "error.main": "text.primary": "text.primary"
                              }
                            >
                              {answer.text}
                            </Typography>
                          }
                          sx={{
                            p: 1.5,
                            my: 1,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            borderColor: showResults
                              ? isAnswerCorrect(String(answer.id))
                                ? "green"
                                : selectedAnswers.includes(String(answer.id))? "red": "#e0e0e0": "#e0e0e0",
                            backgroundColor: showResults
                              ? isAnswerCorrect(String(answer.id))
                                ? "rgba(76, 175, 80, 0.1)"
                                : selectedAnswers.includes(String(answer.id)) &&
                                  !isAnswerCorrect(String(answer.id))? "rgba(244, 67, 54, 0.1)": "transparent"
                              : "transparent",
                          }}
                        />
                      ))}
                  </FormGroup>
                ) : (
                  <RadioGroup
                    value={selectedAnswers[0] || ""}
                    onChange={(e) => handleAnswerSelect(e.target.value, false)}
                  >
                    {currentQuestion.answers &&
                      currentQuestion.answers.map((answer) => (
                        <FormControlLabel
                          key={answer.id}
                          value={answer.id}
                          control={
                            <Radio
                              disabled={showResults}
                              color={
                                showResults &&
                                isAnswerCorrect(String(answer.id))
                                  ? "success"
                                  : "primary"
                              }
                            />
                          }
                          label={
                            <Typography
                              color={
                                showResults
                                  ? isAnswerCorrect(String(answer.id))
                                    ? "success.main"
                                    : selectedAnswers.includes(String(answer.id))? "error.main": "text.primary"
                                  : "text.primary"
                              }
                            >
                              {answer.text}
                            </Typography>
                          }
                          sx={{
                            p: 1.5,
                            my: 1,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            borderColor: showResults
                              ? isAnswerCorrect(String(answer.id))
                                ? "green"
                                : selectedAnswers.includes(String(answer.id))? "red": "#e0e0e0"
                              : "#e0e0e0",
                            backgroundColor: showResults
                              ? isAnswerCorrect(String(answer.id))
                                ? "rgba(76, 175, 80, 0.1)"
                                : selectedAnswers.includes(String(answer.id)) &&
                                  !isAnswerCorrect(String(answer.id))? "rgba(244, 67, 54, 0.1)": "transparent"
                              : "transparent",
                          }}
                        />
                      ))}
                  </RadioGroup>
                )}
              </Box>

              {/* Results display with score */}
              {showResults && (
                <Box
                  sx={{
                    mt: 4,
                    p: 3,
                    bgcolor: "rgba(33, 150, 243, 0.1)",
                    borderRadius: 2,
                    border: "1px solid #2196f3",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" color="primary">
                      Answer Results
                    </Typography>
                    <Chip
                      label={`+${currentQuestionScore} points`}
                      color={currentQuestionScore > 0 ? "success" : "default"}
                      variant="outlined"
                      sx={{ fontWeight: "bold" }}
                    />
                  </Box>

                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {correctAnswers.length > 0
                      ? currentQuestionScore > 0
                        ? "Your answer is correct!"
                        : "Your answer is incorrect."
                      : "Waiting for answer verification..."}
                  </Typography>

                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      bgcolor: "rgba(255, 255, 255, 0.7)",
                      borderRadius: 1,
                      border: "1px dashed rgba(33, 150, 243, 0.5)",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      gutterBottom
                    >
                      {correctAnswers.length > 0
                        ? `Correct Answer${correctAnswers.length > 1 ? "s" : ""}:`
                        : "Answer verification in progress..."}
                    </Typography>
                    {correctAnswers.length > 0 ? (
                      <Typography>
                        {currentQuestion.answers
                          .filter((answer) =>
                            correctAnswers.includes(String(answer.id))
                          )
                          .map((answer) => answer.text)
                          .join(", ")}
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontStyle: "italic" }}
                      >
                        The system is verifying the correct answer. Your
                        selection has been recorded.
                      </Typography>
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 2,
                      pt: 2,
                      borderTop: "1px solid rgba(33, 150, 243, 0.2)",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Waiting for the host to move to the next question...
                    </Typography>
                  </Box>
                </Box>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: "center", py: 4 }}>
              <CircularProgress size={40} sx={{ mb: 2 }} />
              <Typography>Loading question...</Typography>
            </Box>
          )}
        </Paper>
      ) : null}
    </Container>
  );
};

export default GamePlay;
