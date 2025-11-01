import axios from "axios";

// Base URL of your FastAPI backend for songs
const BASE_URL = "http://127.0.0.1:8000/api/songs";

export const songAPI = {
  // Fetch all songs
  getAll: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/all`);
      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error fetching songs:", error);
      throw error;
    }
  },

  // Create new song
  create: async (song: { Songs_name: string; Gener: string; audioFile?: File }) => {
    try {
      const formData = new FormData();
      formData.append("Songs_name", song.Songs_name);
      formData.append("Gener", song.Gener);

      if (song.audioFile) {
        formData.append("audio", song.audioFile);
      }

      const response = await axios.post(`${BASE_URL}/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error creating song:", error);
      throw error;
    }
  },

  // Update song
  update: async (
    Songs_id: number,
    song: { Songs_name: string; Gener: string; audioFile?: File }
  ) => {
    try {
      const formData = new FormData();
      formData.append("Songs_name", song.Songs_name);
      formData.append("Gener", song.Gener);

      if (song.audioFile) {
        formData.append("audio", song.audioFile);
      }

      const response = await axios.put(`${BASE_URL}/${Songs_id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error updating song:", error);
      throw error;
    }
  },

  // Delete song
  delete: async (Songs_id: number) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${Songs_id}`);
      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error deleting song:", error);
      throw error;
    }
  },

  // Search songs by name
  search: async (query: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/search`, { params: { query } });
      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error searching songs:", error);
      throw error;
    }
  },
};

