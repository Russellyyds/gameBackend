// CountdownTimer.jsx
import { Typography, LinearProgress, Box } from '@mui/material';

const CountdownTimer = ({ remaining, total, criticalThreshold = 10 }) => {
  const progress = (remaining / total) * 100;
  const isCritical = remaining < criticalThreshold;

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Time Remaining: {remaining} seconds
      </Typography>
      <LinearProgress
        variant="determinate"
        value={progress}
        color={isCritical ? 'error' : 'primary'}
        sx={{ height: 10, borderRadius: 5 }}
      />
    </Box>
  );
};

export default CountdownTimer;
