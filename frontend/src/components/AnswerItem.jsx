import {
  Box,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Radio,
  IconButton,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
  
/**
 * AnswerItem represents a single answer row in the question editor.
 * Supports both checkbox (multiple choice) and radio (single/judgement).
 */
const AnswerItem = ({
  index,
  answer,
  questionType,
  disableDelete,
  onChange,
  onMarkCorrect,
  onDelete,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        mb: 2,
        p: 2,
        border: "1px solid #e0e0e0",
        borderRadius: 1,
        bgcolor: answer.isCorrect ? "#e8f5e9" : "transparent",
      }}
    >
        
      <Typography variant="body2" sx={{ width: "30px", mr: 1 }}>
        {index + 1}.
      </Typography>
      <TextField
        label="Answer Text"
        value={answer.text}
        onChange={(e) => onChange(answer.id, "text", e.target.value)}
        fullWidth
        margin="dense"
        size="small"
      />
      {questionType === "multiple" ? (
        <FormControlLabel
          control={
            <Checkbox
              checked={answer.isCorrect}
              onChange={() => onMarkCorrect(answer.id)}
            />
          }
          label="Correct"
          sx={{ mx: 1, minWidth: "100px" }}
        />
      ) : (
        <FormControlLabel
          control={
            <Radio
              checked={answer.isCorrect}
              onChange={() => onMarkCorrect(answer.id)}
            />
          }
          label="Correct"
          sx={{ mx: 1, minWidth: "100px" }}
        />
      )}
      {!disableDelete && (
        <IconButton color="error" onClick={() => onDelete(answer.id)}>
          <DeleteIcon />
        </IconButton>
      )}
    </Box>
  );
};
  
export default AnswerItem;  