import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  CardContent,
  Grid,
  // DashboardIcon
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  SkipNext as NextIcon,
  Stop as StopIcon,
  EmojiEvents as TrophyIcon,
} from "@mui/icons-material";
import * as api from "../services/api";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const SessionResults = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [gameId, setGameId] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(30); // 倒计时30秒
  const timerRef = useRef(null);

  // 获取会话数据和相关游戏ID
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // 获取会话状态
        const response = await api.getSessionStatus(sessionId);
        console.log(response);
        setSessionData(response.results);

        // 获取所有游戏以找到会话对应的游戏ID
        const gamesResponse = await api.getGames();
        console.log("gamesResponse:", gamesResponse);
        const foundGame = gamesResponse.games.find(
          (g) => g.active == sessionId
        );
        console.log("foundGame:", foundGame);

        if (foundGame) {
          setGameId(foundGame.id);
        } else {
          setError("Game not found for this session");
        }

        // 获取会话结果数据
        try {
          const resultsResponse = await api.getSessionResults(sessionId);
          setResultsData(resultsResponse.results);
        } catch (err) {
          console.log(err);
          console.log("Session might still be in progress, no results yet");
        }
      } catch (err) {
        console.error("Error fetching session data:", err);
        setError("Failed to load session data");
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId]);

  // 设置倒计时定时器，但不自动前进
  useEffect(() => {
    // 只有当会话活跃且非Lobby阶段时启动定时器
    if (sessionData && sessionData.active && sessionData.position >= 0) {
      // 获取当前问题的持续时间或使用默认值30秒
      const currentQuestion =
        sessionData.questions && sessionData.questions[sessionData.position];
      const duration = currentQuestion?.duration || 30;

      // 重置倒计时
      setTimeRemaining(duration);

      // 清除之前的定时器
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // 启动新的倒计时，但不自动前进
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // 时间到，但不自动前进
            clearInterval(timerRef.current);
            return 0; // 保持为0
          }
          return prev - 1;
        });
      }, 1000);
    }

    // 组件卸载时清除定时器
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [sessionData]);

  // 前进到下一个问题
  const handleAdvanceQuestion = async () => {
    if (!gameId) return;

    try {
      await api.advanceGame(gameId);
      // 刷新会话数据
      const response = await api.getSessionStatus(sessionId);
      setSessionData(response.results);

      // 如果会话结束，获取结果
      if (!response.results.active) {
        try {
          const resultsResponse = await api.getSessionResults(sessionId);
          setResultsData(resultsResponse.results);
        } catch (err) {
          console.error("Error fetching session results:", err);
        }
      }
    } catch (err) {
      console.error("Error advancing question:", err);
      setError("Failed to advance to next question");
    }
  };

  // 停止游戏会话
  const handleEndGame = async () => {
    if (!gameId) return;

    try {
      await api.endGame(gameId);
      // 刷新会话数据
      const response = await api.getSessionStatus(sessionId);
      setSessionData(response.results);

      // 获取结果
      try {
        const resultsResponse = await api.getSessionResults(sessionId);
        setResultsData(resultsResponse.results);
      } catch (err) {
        console.error("Error fetching session results:", err);
      }
    } catch (err) {
      console.error("Error ending game:", err);
      setError("Failed to end game session");
    }
  };

  // 检查是否是会话开始前的状态
  const isLobbyPhase = sessionData && sessionData.position === -1;

  // 检查会话是否已结束
  const isSessionFinished = sessionData && !sessionData.active;

  // 计算倒计时进度百分比
  const calculateProgress = () => {
    const currentQuestion = sessionData?.questions?.[sessionData.position];
    const totalDuration = currentQuestion?.duration || 30;
    return ((totalDuration - timeRemaining) / totalDuration) * 100;
  };

  // 计算玩家分数
  const calculatePlayerScores = () => {
    if (!resultsData) return [];

    return resultsData
      .map((player) => {
        const score = player.answers.reduce((total, answer) => {
          return total + (answer.correct ? 1 : 0);
        }, 0);

        return {
          name: player.name,
          score: score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // 只取前5名
  };

  // 准备问题准确率图表数据
  const prepareAccuracyChartData = () => {
    if (!resultsData || !sessionData?.questions) return [];

    return sessionData.questions.map((question, index) => {
      const totalAnswers = resultsData.length;
      const correctAnswers = resultsData.reduce((count, player) => {
        const playerAnswerForQuestion = player.answers[index];
        return count + (playerAnswerForQuestion?.correct ? 1 : 0);
      }, 0);

      const percentCorrect =
        totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;

      return {
        questionNumber: `Q${index + 1}`,
        percentCorrect: parseFloat(percentCorrect.toFixed(1)),
        questionText:
          question.text.substring(0, 20) +
          (question.text.length > 20 ? "..." : ""),
      };
    });
  };
  // 返回到仪表板
  const handleReturnToDashboard = () => {
    navigate("/dashboard");
  };
  // 准备平均回答时间图表数据
  const prepareResponseTimeChartData = () => {
    if (!resultsData || !sessionData?.questions) return [];

    return sessionData.questions.map((question, index) => {
      const answeredQuestions = resultsData.filter((player) => {
        const answer = player.answers[index];
        return answer && answer.questionStartedAt && answer.answeredAt;
      });

      let avgTime = 0;

      if (answeredQuestions.length > 0) {
        const totalTime = answeredQuestions.reduce((sum, player) => {
          const answer = player.answers[index];
          const startTime = new Date(answer.questionStartedAt).getTime();
          const endTime = new Date(answer.answeredAt).getTime();
          return sum + (endTime - startTime) / 1000; // 转换为秒
        }, 0);

        avgTime = totalTime / answeredQuestions.length;
      }

      return {
        questionNumber: `Q${index + 1}`,
        avgResponseTime: parseFloat(avgTime.toFixed(1)),
        questionText:
          question.text.substring(0, 20) +
          (question.text.length > 20 ? "..." : ""),
      };
    });
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" gutterBottom>
        Game Session: {sessionId}
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          {/* 会话控制按钮 - 仅在会话未结束时显示 */}
          {!isSessionFinished && (
            <Box sx={{ mb: 4, display: "flex", gap: 2 }}>
              {isLobbyPhase ? (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayIcon />}
                  onClick={handleAdvanceQuestion}
                >
                  Start First Question
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<NextIcon />}
                  onClick={handleAdvanceQuestion}
                >
                  Next Question
                </Button>
              )}

              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleEndGame}
              >
                End Session
              </Button>
            </Box>
          )}

          {/* 倒计时进度条 - 只在非Lobby阶段且会话活跃时显示 */}
          {!isLobbyPhase && sessionData.active && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" align="center">
                Time remaining: {timeRemaining} seconds
              </Typography>
              <LinearProgress
                variant="determinate"
                value={calculateProgress()}
                color={timeRemaining < 10 ? "error" : "secondary"}
                sx={{ height: 8, borderRadius: 1 }}
              />
              {timeRemaining === 0 && (
                <Typography
                  variant="body2"
                  align="center"
                  color="error"
                  sx={{ mt: 1 }}
                >
                  Time is up! Click &quotNext Question&quot to continue.
                </Typography>
              )}
            </Box>
          )}

          {/* 会话状态信息 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6">Session Status</Typography>
            <Typography>
              Position:{" "}
              {sessionData.position === -1 ? "Lobby" : sessionData.position + 1}
            </Typography>
            <Typography>Active: {sessionData.active ? "Yes" : "No"}</Typography>
            <Typography>Players: {sessionData.players?.length || 0}</Typography>
          </Box>

          {/* 当前问题信息 */}
          {sessionData.position >= 0 && sessionData.questions && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6">Current Question</Typography>
              <Typography variant="h5">
                {sessionData.questions[sessionData.position]?.text ||
                  "No question text"}
              </Typography>
            </Box>
          )}

          {/* 会话结果区域 */}
          {(isSessionFinished || resultsData) && resultsData && (
            <Box sx={{ mt: 4 }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ display: "flex", alignItems: "center" }}
              >
                <TrophyIcon sx={{ mr: 1, color: "gold" }} />
                Session Results
              </Typography>

              <Grid container spacing={3}>
                {/* 前5名玩家得分表格 */}
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Players
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Rank</TableCell>
                              <TableCell>Player</TableCell>
                              <TableCell align="right">Score</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {calculatePlayerScores().map((player, index) => (
                              <TableRow
                                key={player.name}
                                sx={
                                  index === 0
                                    ? {backgroundColor:"rgba(255, 215, 0, 0.1)"}: {}
                                }
                              >
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{player.name}</TableCell>
                                <TableCell align="right">
                                  {player.score}
                                </TableCell>
                              </TableRow>
                            ))}
                            {calculatePlayerScores().length === 0 && (
                              <TableRow>
                                <TableCell colSpan={3} align="center">
                                  No player data available
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 问题准确率图表 */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Question Accuracy
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={prepareAccuracyChartData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="questionNumber"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis
                            label={{
                              value: "Correct Answers (%)",
                              angle: -90,
                              position: "insideLeft",
                            }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            formatter={(value) => [`${value}%`, "Correct"]}
                            labelFormatter={(value, entry) => {
                              const item = entry[0]?.payload;
                              return `${value}: ${item?.questionText}`;
                            }}
                          />
                          <Legend />
                          <Bar
                            dataKey="percentCorrect"
                            name="Correct Answers (%)"
                            fill="#8884d8"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 平均回答时间图表 */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Average Response Time
                      </Typography>
                      <ResponsiveContainer width="100%" height={500}>
                        <LineChart
                          data={prepareResponseTimeChartData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="questionNumber"
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis
                            label={{
                              value: "Response Time (seconds)",
                              angle: -90,
                              position: "insideLeft",
                            }}
                          />
                          <Tooltip
                            formatter={(value) => [
                              `${value} seconds`,
                              "Avg Time",
                            ]}
                            labelFormatter={(value, entry) => {
                              const item = entry[0]?.payload;
                              return `${value}: ${item?.questionText}`;
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="avgResponseTime"
                            name="Avg Response Time (s)"
                            stroke="#82ca9d"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 额外信息：按问题查看详细情况 */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Question Details
                      </Typography>
                      <TableContainer component={Paper}>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Question</TableCell>
                              <TableCell>Text</TableCell>
                              <TableCell align="right">
                                Correct Answers
                              </TableCell>
                              <TableCell align="right">
                                Completion Rate
                              </TableCell>
                              <TableCell align="right">Avg Time (s)</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {sessionData.questions?.map((question, index) => {
                              const answeredCount = resultsData.filter(
                                (player) => {
                                  return (
                                    player.answers[index]?.answeredAt != null
                                  );
                                }
                              ).length;

                              const correctCount = resultsData.filter(
                                (player) => {
                                  return (
                                    player.answers[index]?.correct === true
                                  );
                                }
                              ).length;

                              const completionRate =
                                resultsData.length > 0
                                  ? ((answeredCount / resultsData.length) *100).toFixed(1) + "%"
                                  : "0%";

                              const avgResponseTime =
                                prepareResponseTimeChartData()[index]
                                  ?.avgResponseTime || 0;

                              return (
                                <TableRow key={index}>
                                  <TableCell>Q{index + 1}</TableCell>
                                  <TableCell>
                                    {question.text.substring(0, 40) +
                                      (question.text.length > 40 ? "..." : "")}
                                  </TableCell>
                                  <TableCell align="right">
                                    {correctCount}/{resultsData.length}
                                  </TableCell>
                                  <TableCell align="right">
                                    {completionRate}
                                  </TableCell>
                                  <TableCell align="right">
                                    {avgResponseTime.toFixed(1)}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  // startIcon={<DashboardIcon />}
                  onClick={handleReturnToDashboard}
                  size="large"
                >
                  Return to Dashboard
                </Button>
              </Box>
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default SessionResults;
