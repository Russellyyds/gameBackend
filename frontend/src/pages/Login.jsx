/**
 * Login.jsx
 *
 * User login screen for BigBrain app.
 *
 * Functionality verified:
 * [✔] Accessible via dedicated route (/login)
 * [✔] Accepts user input: email and password
 * [✔] Displays error message when login fails (from useAuth)
 * [✔] On successful login, redirects to /dashboard
 * [✔] Form submission supported via both Enter key and button click
 *
 * Logout behavior (related):
 * [✔] Logout button is visible on protected pages
 * [✔] Clicking logout clears localStorage and redirects to /login
 * [✔] Protected routes enforce authentication (redirect unauthenticated users)
 *
 * Dependencies:
 * - React hooks: useState
 * - React Router: Link
 * - MUI: Container, Box, Typography, TextField, Button, Paper, Alert
 * - useAuth(): handles login request and error state
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";

import ErrorBanner from "../components/ErrorBanner";

const Login = () => {
  const { login, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(email, password);
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            p: 4,
            mt: 8,
          }}
        >
          <Typography component="h1" variant="h5">
            Login to BigBrain
          </Typography>

          <ErrorBanner message={error} />

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 3, width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? "Logging in." : "Login"}
            </Button>
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">
                Don&apos;t have an account?{" "}
                <Link to="/register" style={{ textDecoration: "none" }}>
                  Register here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
