// src/pages/GameSessionHistory.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import * as api from "../services/api";

const GameSessionHistory = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [game, setGame] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  useEffect(() => {
    const fetchGameAndSessions = async () => {
      try {
        setLoading(true);

        // 获取所有游戏
        const gameResponse = await api.getGames();
        console.log(gameResponse);
        const allGames = gameResponse.games;

        // 找到当前 gameId 对应的游戏
        const matchedGame = allGames.find(
          (game) => game.id.toString() === String(gameId)
        );
        console.log(matchedGame);

        if (!matchedGame) {
          throw new Error("Game not found");
        }

        setGame(matchedGame);

        // oldSessions 是 sessionId 数组
        const sessionIds = matchedGame.oldSessions || [];

        // 构建 session 对象数组（你也可以改为实际请求每个 session 详情）

        const sessionStatusList = await Promise.all(
          sessionIds.map(async (id) => {
            try {
              const statusRes = await api.getSessionStatus(id);
              console.log(statusRes);
              return {
                id,
                createdAt: statusRes.results.isoTimeLastQuestionStarted,
                playerCount: statusRes.results.players.length,
                active: statusRes.results.active,
                players: statusRes.results.players,
                questions: statusRes.results.questions,
              };
            } catch (err) {
              console.warn(`获取 session ${id} 状态失败`, err);
              return null;
            }
          })
        );
        console.log(sessionStatusList);
        // 过滤掉失败的
        setSessions(sessionStatusList);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching game session history:", err);
        setError(
          "Failed to load game session history. Please try again later."
        );
        setLoading(false);
      }
    };

    fetchGameAndSessions();
  }, [gameId]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("default", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleViewSessionResults = async (sessionId) => {
    try {
      setSelectedSessionId(sessionId);
      setResultsLoading(true);
      setResultsOpen(true);

      const response = await api.getSessionResults(sessionId);
      console.log(response.results);
      setResultsData(response.results); // 或者 response.results 看你的结构
    } catch (err) {
      console.error("获取 session 结果失败:", err);
      setResultsData({ error: "Failed to load results." });
    } finally {
      setResultsLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          Session History: {game?.name}
        </Typography>
      </Box>

      {sessions.length === 0 ? (
        <Alert severity="info">No past sessions found for this game.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Session ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Players</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Question</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>{session.id}</TableCell>
                  <TableCell>{formatDate(session.createdAt)}</TableCell>
                  <TableCell>{session.playerCount}</TableCell>
                  <TableCell>
                    {session.active ? (
                      <Alert severity="warning" sx={{ py: 0 }}>
                        Active
                      </Alert>
                    ) : (
                      <Alert severity="success" sx={{ py: 0 }}>
                        Completed
                      </Alert>
                    )}
                  </TableCell>
                  <TableCell>{session.questions.length}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleViewSessionResults(session.id)}
                    >
                      View Results
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog
        open={resultsOpen}
        onClose={() => setResultsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <Box sx={{ p: 2 }}>
          <DialogTitle>Session Results: {selectedSessionId}</DialogTitle>
          <DialogContent dividers>
            {resultsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                <CircularProgress />
              </Box>
            ) : resultsData?.error ? (
              <Alert severity="error">{resultsData.error}</Alert>
            ) : (
              resultsData?.map((player, playerIdx) => (
                <Box key={playerIdx} sx={{ mb: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    Player: <strong>{player?.name || "undefined"}</strong>
                  </Typography>

                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Question</TableCell>
                          <TableCell>Start Time</TableCell>
                          <TableCell>Answered At</TableCell>
                          <TableCell>Duration (s)</TableCell>
                          <TableCell>Selected Answers</TableCell>
                          <TableCell>Correct</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {player.answers.map((a, idx) => {
                          const start = new Date(a.questionStartedAt);
                          const end = new Date(a.answeredAt);
                          const duration = ((end - start) / 1000).toFixed(2);

                          return (
                            <TableRow key={idx}>
                              <TableCell>{idx + 1}</TableCell>
                              <TableCell>
                                {start.toLocaleTimeString()}
                              </TableCell>
                              <TableCell>{end.toLocaleTimeString()}</TableCell>
                              <TableCell>{duration}</TableCell>
                              <TableCell>{a.answers?.join(", ")}</TableCell>
                              <TableCell>
                                {a.correct ? (
                                  <Alert
                                    severity="success"
                                    sx={{ py: 0, px: 1 }}
                                  >
                                    ✔
                                  </Alert>
                                ) : (
                                  <Alert severity="error" sx={{ py: 0, px: 1 }}>
                                    ✘
                                  </Alert>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            )}
          </DialogContent>
        </Box>
      </Dialog>
    </Container>
  );
};

export default GameSessionHistory;
