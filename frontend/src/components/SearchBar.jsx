import { InputBase, IconButton, Box } from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";

/**
 * SearchBar component for game filtering on dashboard
 * @param {string} value - current input value
 * @param {function} onChange - callback when input changes
 */
const SearchBar = ({ value, onChange }) => {
  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <Box
      sx={{
        position: "relative",
        backgroundColor: "rgba(255, 255, 255, 0.15)",
        "&:hover": { backgroundColor: "rgba(255, 255, 255, 0.25)" },
        borderRadius: 1,
        marginRight: 2,
        width: "auto",
        display: "flex",
        alignItems: "center",
      }}
    >
      <IconButton sx={{ p: 1 }} aria-label="search">
        <SearchIcon />
      </IconButton>
      <InputBase
        sx={{
          color: "inherit",
          width: "100%",
          "& .MuiInputBase-input": {
            padding: "8px 8px 8px 0",
            width: "100%",
            minWidth: "200px",
          },
        }}
        placeholder="Search games..."
        value={value}
        onChange={handleInputChange}
      />
    </Box>
  );
};

export default SearchBar;