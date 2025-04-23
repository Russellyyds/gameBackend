// src/components/ErrorBanner.jsx
import { Alert } from "@mui/material";

/**
 * Renders an error alert banner.
 * Only renders when `message` is a non-empty string.
 */
const ErrorBanner = ({ message }) => {
  if (!message) return null;

  return (
    <Alert severity="error" sx={{ width: "100%", mt: 2 }}>
      {message}
    </Alert>
  );
};

export default ErrorBanner;