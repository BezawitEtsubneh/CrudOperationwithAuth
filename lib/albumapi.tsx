import axios from "axios";

// Base URL of your FastAPI backend for albums
const BASE_URL = "http://127.0.0.1:8000/api/albums";

export const albumAPI = {
  // Fetch all albums
  getAll: async () => {
    try {
      const response = await axios.get(`${BASE_URL}/all`);
      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error fetching albums:", error);
      throw error;
    }
  },

  // Create new album with optional audio file
  create: async (album: { Album_title: string; Total_tracks: number; audioFile?: File }) => {
    try {
      const formData = new FormData();
      formData.append("Album_title", album.Album_title);
      formData.append("Total_tracks", album.Total_tracks.toString());

      if (album.audioFile) {
        formData.append("audio", album.audioFile); // Must match backend parameter name
      }

      const response = await axios.post(`${BASE_URL}/create`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error creating album:", error);
      throw error;
    }
  },

  // Update album (requires backend PUT endpoint)
  update: async (
    Album_id: number,
    album: { Album_title: string; Total_tracks: number; audioFile?: File }
  ) => {
    try {
      const formData = new FormData();
      formData.append("Album_title", album.Album_title);
      formData.append("Total_tracks", album.Total_tracks.toString());

      if (album.audioFile) {
        formData.append("audio", album.audioFile);
      }

      const response = await axios.put(`${BASE_URL}/${Album_id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error updating album:", error);
      throw error;
    }
  },

  // Delete album
  delete: async (Album_id: number) => {
    try {
      const response = await axios.delete(`${BASE_URL}/${Album_id}`);
      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error deleting album:", error);
      throw error;
    }
  },

  // Search albums by title (placeholder, implement backend later)
  search: async (query: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/search`, { params: { query } });
      if (response.status === 200) return response.data;
      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      console.error("Error searching albums:", error);
      throw error;
    }
  },
};
