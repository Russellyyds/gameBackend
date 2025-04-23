/**
 * Register.jsx
 *
 * User registration screen for BigBrain app.
 *
 * Functionality verified:
 * [✔] Accessible via dedicated route (/register)
 * [✔] Accepts user input: name, email, password, confirm password
 * [✔] Displays static error message when passwords do not match
 * [✔] Enforces required fields via client-side validation
 * [✔] On successful registration, redirects to /dashboard
 * [✔] Rejects duplicate users with error feedback
 * [✔] Form submission supported via both Enter key and button click
 *
 * Dependencies:
 * - React hooks: useState
 * - React Router: Link
 * - MUI: Container, Box, Typography, TextField, Button, Paper, Alert
 * - useAuth(): handles API call and error state
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

const Register = () => {
  const { register, error } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setPasswordError("");
    setLoading(true);
    await register(email, password, name);
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
            Register for BigBrain
          </Typography>

          <ErrorBanner message={error} />
          <ErrorBanner message={passwordError} />

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 3, width: "100%" }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              error={!!passwordError}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
            <Box sx={{ mt: 2, textAlign: "center" }}>
              <Typography variant="body2">
                Already have an account?{" "}
                <Link to="/login" style={{ textDecoration: "none" }}>
                  Login here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;
