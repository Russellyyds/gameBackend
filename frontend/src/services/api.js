const API_URL = `http://localhost:5005`;

// Helper function for making API requests
const request = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
};

// Auth API
export const login = (email, password) => {
  return request("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const register = (email, password, name) => {
  return request("/admin/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
};

export const logout = () => {
  return request("/admin/auth/logout", {
    method: "POST",
  });
};

// Games API
export const getGames = () => {
  return request("/admin/games");
};

export const updateGames = (games) => {
  return request("/admin/games", {
    method: "PUT",
    body: JSON.stringify({ games }),
  });
};

export const startGame = (gameId) => {
  return request(`/admin/game/${gameId}/mutate`, {
    method: "POST",
    body: JSON.stringify({ mutationType: "START" }),
  });
};

export const advanceGame = (gameId) => {
  return request(`/admin/game/${gameId}/mutate`, {
    method: "POST",
    body: JSON.stringify({ mutationType: "ADVANCE" }),
  });
};

export const endGame = (gameId) => {
  return request(`/admin/game/${gameId}/mutate`, {
    method: "POST",
    body: JSON.stringify({ mutationType: "END" }),
  });
};

export const getSessionStatus = (sessionId) => {
  return request(`/admin/session/${sessionId}/status`);
};

export const getSessionResults = (sessionId) => {
  return request(`/admin/session/${sessionId}/results`);
};

export const joinGame = async (sessionId, name) => {
  try {
    const response = await fetch(`${API_URL}/play/join/${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to join game");
    }

    return await response.json();
  } catch (error) {
    console.error("Error joining game:", error);
    throw error;
  }
};

/**
 * Obtain the status of the game
 * @param {string} playerId
 * @returns {Promise<Object>} - The response containing the game state
 */
export const getGameStatus = async (playerId) => {
  try {
    const response = await fetch(`${API_URL}/play/${playerId}/status`);
    console.log("gameStatus:", response);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get game status");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting game status:", error);
    throw error;
  }
};

/**
 * Get the current problem
 * @param {string} playerId
 * @returns {Promise<Object>} - Responses containing problem information
 */
export const getCurrentQuestion = async (playerId) => {
  try {
    const response = await fetch(`${API_URL}/play/${playerId}/question`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get current question");
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting current question:", error);
    throw error;
  }
};

/** Submit an answer
 * @param {string} playerId
 * @param {Array<number>} answerIds
 * @returns {Promise<Object>}
 */
export const submitAnswers = async (playerId, answers) => {
  try {
    const response = await fetch(`${API_URL}/play/${playerId}/answer`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ answers }),
    });

    if (!response.ok) {
      let errorMsg = "Failed to submit answers";
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        errorMsg = `${response.status}: ${response.statusText || e.errorMsg}`;
      }
      throw new Error(errorMsg);
    }

    // If successful but no content is returned, return a simple success object

    const text = await response.text();
    return text ? JSON.parse(text) : { success: true };
  } catch (error) {
    console.error("Error submitting answers:", error);
    throw error;
  }
};

/**
 * get correct answer
 * @param {string} playerId
 * @returns {Promise<Object>} - The response containing the correct answer ID
 */
export const getAnswers = async (playerId) => {
  try {
    console.log(`Fetching answers for player: ${playerId}`);

    const response = await fetch(`${API_URL}/play/${playerId}/answer`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("getAnswers methods  response:::::::::", response);

    if (!response.ok) {
      let errorMsg = "Failed to get answers";
      try {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } catch (e) {
        errorMsg = `${response.status}: ${response.statusText || e.errorMsg}`;
      }
      throw new Error(errorMsg);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting answers:", error);
    throw error;
  }
};

/**
 * get the game result
 * @param {string} playerId
 * @returns {Promise<Object>} - Responses containing the game results
 */
export const getResults = async (playerId) => {
  const response = await fetch(`${API_URL}/play/${playerId}/results`);

  if (!response.ok) {
    let errorMsg = "Failed to get results";
    const errorData = await response.json();
    errorMsg = errorData.error || errorMsg;
    throw new Error(errorMsg);
  }
  return await response.json();
};
