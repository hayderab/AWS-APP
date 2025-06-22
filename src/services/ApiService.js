import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Dynamic API URL based on platform
const getApiUrl = () => {
  if (Platform.OS === "web") {
    // For web, use localhost
    return "http://localhost:5000/api";
  } else if (Platform.OS === "ios") {
    // For iOS simulator, use localhost
    return "http://localhost:5000/api";
  } else if (Platform.OS === "android") {
    // For Android emulator, use 10.0.2.2
    return "http://10.0.2.2:5000/api";
  } else {
    // Default fallback
    return "http://localhost:5000/api";
  }
};

const API_URL = getApiUrl();
console.log(`Platform: ${Platform.OS}, Using API URL: ${API_URL}`);

// Create an axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Add a longer timeout for slower connections
  timeout: 30000, // 30 seconds
});

// Add response interceptor for better error logging
api.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Success: ${response.config.method?.toUpperCase()} ${
        response.config.url
      } - Status: ${response.status}`
    );
    return response;
  },
  (error) => {
    console.error(
      `❌ API Error: ${error.config?.method?.toUpperCase()} ${
        error.config?.url
      }`,
      {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        baseURL: error.config?.baseURL,
      }
    );
    return Promise.reject(error);
  }
);

// Add a request interceptor to add the token to requests
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${
        config.url
      }`
    );
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API service object
const ApiService = {
  // Expose the base URL for debugging
  baseURL: API_URL,

  // User endpoints
  user: {
    register: async (userData) => {
      try {
        const response = await api.post("/users/register", userData);
        return response.data;
      } catch (error) {
        console.error("API Error - Register User:", error);
        throw error;
      }
    },
    login: async (credentials) => {
      try {
        const response = await api.post("/users/login", credentials);
        return response.data;
      } catch (error) {
        console.error("API Error - Login User:", error);

        // Create a more user-friendly error message based on the status code
        // while following security best practices (not revealing if user exists)
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (error.response.status === 401 || error.response.status === 404) {
            // Combine 401 and 404 errors to avoid user enumeration
            throw new Error(
              "Invalid credentials. Please check your email and password."
            );
          } else if (error.response.status === 429) {
            throw new Error("Too many login attempts. Please try again later.");
          } else if (error.response.status >= 500) {
            throw new Error("Server error. Please try again later.");
          } else {
            // Generic message for other errors
            throw new Error("Authentication failed. Please try again.");
          }
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error(
            "Network error. Please check your internet connection."
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error("An unexpected error occurred. Please try again.");
        }
      }
    },
    getById: async (userId) => {
      try {
        const response = await api.get(`/users/${userId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get User:", error);
        throw error;
      }
    },
  },

  // Certification endpoints
  certification: {
    create: async (certificationData) => {
      try {
        const response = await api.post("/certifications", certificationData);
        return response.data;
      } catch (error) {
        console.error("API Error - Create Certification:", error);
        throw error;
      }
    },
    getByUser: async (userId) => {
      try {
        const response = await api.get(`/certifications/user/${userId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Certifications:", error);
        throw error;
      }
    },
    getById: async (certificationId) => {
      try {
        const response = await api.get(`/certifications/${certificationId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Certification:", error);
        throw error;
      }
    },
    update: async (certificationId, updateData) => {
      try {
        const response = await api.put(
          `/certifications/${certificationId}`,
          updateData
        );
        return response.data;
      } catch (error) {
        console.error("API Error - Update Certification:", error);
        throw error;
      }
    },
    delete: async (certificationId) => {
      try {
        const response = await api.delete(`/certifications/${certificationId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Delete Certification:", error);
        throw error;
      }
    },
  },

  // Topic endpoints
  topic: {
    create: async (topicData) => {
      try {
        const response = await api.post("/topics", topicData);
        return response.data;
      } catch (error) {
        console.error("API Error - Create Topic:", error);
        throw error;
      }
    },
    getByCertification: async (certificationId) => {
      try {
        const response = await api.get(
          `/topics/certification/${certificationId}`
        );
        return response.data;
      } catch (error) {
        console.error("API Error - Get Topics:", error);
        throw error;
      }
    },
    getById: async (topicId) => {
      try {
        const response = await api.get(`/topics/${topicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Topic:", error);
        throw error;
      }
    },
    update: async (topicId, updateData) => {
      try {
        const response = await api.put(`/topics/${topicId}`, updateData);
        return response.data;
      } catch (error) {
        console.error("API Error - Update Topic:", error);
        throw error;
      }
    },
    delete: async (topicId) => {
      try {
        const response = await api.delete(`/topics/${topicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Delete Topic:", error);
        throw error;
      }
    },
  },

  // Subtopic endpoints
  subtopic: {
    create: async (subtopicData) => {
      try {
        // Create a copy of the data to avoid modifying the original object
        const processedData = { ...subtopicData };

        // Automatically truncate title if it's too long
        if (processedData.title && processedData.title.length > 100) {
          console.warn(
            `Subtopic title too long (${processedData.title.length} chars). Truncating to 100 characters.`
          );
          processedData.title = processedData.title.substring(0, 97) + "...";
        }

        const response = await api.post("/subtopics", processedData);
        return response.data;
      } catch (error) {
        console.error("API Error - Create Subtopic:", error);

        // Extract meaningful error messages from server response
        if (error.response && error.response.status === 500) {
          // Try to parse validation errors from the response
          try {
            const errorData = error.response.data;
            if (errorData && errorData.message) {
              // Extract specific validation error message
              if (
                typeof errorData.message === "string" &&
                errorData.message.includes("validation failed")
              ) {
                throw new Error(
                  errorData.message.split("validation failed:")[1]?.trim() ||
                    "Validation failed. Please check your input."
                );
              }
            }
          } catch (parseError) {
            // If we can't parse the error, fall back to a generic message
            console.error("Error parsing server error:", parseError);
          }

          // Default validation error message if we couldn't extract a specific one
          throw new Error("Invalid subtopic data. Please check your input.");
        } else if (error.response && error.response.status === 400) {
          throw new Error("Invalid subtopic data. Please check your input.");
        } else if (error.response && error.response.status === 401) {
          throw new Error("Authentication required. Please sign in again.");
        } else if (error.request) {
          throw new Error(
            "Network error. Please check your internet connection."
          );
        }

        // If it's already a custom error we created above, just rethrow it
        if (error.message && !error.response) {
          throw error;
        }

        // Default error
        throw new Error("Failed to create subtopic. Please try again.");
      }
    },
    getByTopic: async (topicId) => {
      try {
        const response = await api.get(`/subtopics/topic/${topicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Subtopics:", error);
        throw error;
      }
    },
    getById: async (subtopicId) => {
      try {
        const response = await api.get(`/subtopics/${subtopicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Subtopic:", error);
        throw error;
      }
    },
    update: async (subtopicId, updateData) => {
      try {
        const response = await api.put(`/subtopics/${subtopicId}`, updateData);
        return response.data;
      } catch (error) {
        console.error("API Error - Update Subtopic:", error);
        throw error;
      }
    },
    delete: async (subtopicId) => {
      try {
        const response = await api.delete(`/subtopics/${subtopicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Delete Subtopic:", error);
        throw error;
      }
    },
  },

  // Note endpoints
  note: {
    create: async (noteData) => {
      try {
        const response = await api.post("/notes", noteData);
        return response.data;
      } catch (error) {
        console.error("API Error - Create Note:", error);
        throw error;
      }
    },
    getByUser: async (userId) => {
      try {
        const response = await api.get(`/notes/user/${userId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Notes by User:", error);
        throw error;
      }
    },
    getByTopic: async (topicId) => {
      try {
        const response = await api.get(`/notes/topic/${topicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Notes by Topic:", error);
        throw error;
      }
    },
    getBySubtopic: async (subtopicId) => {
      try {
        const response = await api.get(`/notes/subtopic/${subtopicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Notes by Subtopic:", error);
        throw error;
      }
    },
    getById: async (noteId) => {
      try {
        const response = await api.get(`/notes/${noteId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Note:", error);
        throw error;
      }
    },
    update: async (noteId, updateData) => {
      try {
        const response = await api.put(`/notes/${noteId}`, updateData);
        return response.data;
      } catch (error) {
        console.error("API Error - Update Note:", error);
        throw error;
      }
    },
    delete: async (noteId) => {
      try {
        const response = await api.delete(`/notes/${noteId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Delete Note:", error);
        throw error;
      }
    },
  },

  // Quiz endpoints
  quiz: {
    create: async (quizData) => {
      try {
        const response = await api.post("/quizzes", quizData);
        return response.data;
      } catch (error) {
        console.error("API Error - Create Quiz:", error);
        throw error;
      }
    },
    getByTopic: async (topicId) => {
      try {
        const response = await api.get(`/quizzes/topic/${topicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Quizzes by Topic:", error);
        throw error;
      }
    },
    getBySubtopic: async (subtopicId) => {
      try {
        const response = await api.get(`/quizzes/subtopic/${subtopicId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Quizzes by Subtopic:", error);
        throw error;
      }
    },
    getById: async (quizId) => {
      try {
        const response = await api.get(`/quizzes/${quizId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Quiz:", error);
        throw error;
      }
    },
    saveToHistory: async (quizData) => {
      try {
        const response = await api.post("/quizzes/history", quizData);
        return response.data;
      } catch (error) {
        console.error("API Error - Save Quiz to History:", error);
        throw error;
      }
    },
    getHistory: async () => {
      try {
        const response = await api.get("/quizzes/history");
        return response.data;
      } catch (error) {
        console.error("API Error - Get Quiz History:", error);
        throw error;
      }
    },
    clearHistory: async () => {
      try {
        const response = await api.delete("/quizzes/history");
        return response.data;
      } catch (error) {
        console.error("API Error - Clear Quiz History:", error);
        throw error;
      }
    },
  },

  // Quiz Result endpoints
  quizResult: {
    save: async (resultData) => {
      try {
        const response = await api.post("/quiz-results", resultData);
        return response.data;
      } catch (error) {
        console.error("API Error - Save Quiz Result:", error);
        throw error;
      }
    },
    getByUser: async (userId) => {
      try {
        const response = await api.get(`/quiz-results/user/${userId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Quiz Results by User:", error);
        throw error;
      }
    },
    getByQuiz: async (quizId) => {
      try {
        const response = await api.get(`/quiz-results/quiz/${quizId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Quiz Results by Quiz:", error);
        throw error;
      }
    },
    getById: async (resultId) => {
      try {
        const response = await api.get(`/quiz-results/${resultId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get Quiz Result:", error);
        throw error;
      }
    },
    delete: async (resultId) => {
      try {
        const response = await api.delete(`/quiz-results/${resultId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Delete Quiz Result:", error);
        throw error;
      }
    },
  },

  // Analytics endpoints
  analytics: {
    getPerformanceByUser: async (userId) => {
      try {
        const response = await api.get(`/analytics/performance/${userId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get User Performance:", error);
        throw error;
      }
    },
    getReadinessByUser: async (userId) => {
      try {
        const response = await api.get(`/analytics/readiness/${userId}`);
        return response.data;
      } catch (error) {
        console.error("API Error - Get User Readiness:", error);
        throw error;
      }
    },
  },
};

export default ApiService;
