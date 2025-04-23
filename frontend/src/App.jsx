// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./hooks/useAuthProvider";
import { SearchProvider } from "./hooks/SearchContext";
import AuthGuard from "./components/AuthGuard";
import Navbar from "./components/Navbar";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import EditGame from "./pages/EditGame";
import EditQuestion from "./pages/EditQuestion";
import SessionResults from "./pages/SessionResults";
import JoinGame from "./pages/JoinGame";
import GamePlay from "./pages/GamePlay";
import GameSessionHistory from "./pages/GameSessionHistory";
// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#f50057",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <SearchProvider>
            <Navbar />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/play/join" element={<JoinGame />} />
              <Route path="/play/join/:sessionId" element={<JoinGame />} />
              <Route path="/play/game/:playerId" element={<GamePlay />} />
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <AuthGuard>
                    <Dashboard />
                  </AuthGuard>
                }
              />
              <Route
                path="/game/:gameId"
                element={
                  <AuthGuard>
                    <EditGame />
                  </AuthGuard>
                }
              />
              <Route
                path="/game/:gameId/question/:questionId"
                element={
                  <AuthGuard>
                    <EditQuestion />
                  </AuthGuard>
                }
              />
              <Route
                path="/session/:sessionId"
                element={
                  <AuthGuard>
                    <SessionResults />
                  </AuthGuard>
                }
              />
              <Route
                path="/game/:gameId/history"
                element={
                  <AuthGuard>
                    <GameSessionHistory />
                  </AuthGuard>
                }
              />

              {/* Redirect to login by default */}
              <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
          </SearchProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
