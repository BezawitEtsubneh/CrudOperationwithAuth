import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/api/artists";

export const artistAPI = {
  // Get all artists
  getAll: async () => {
    const res = await axios.get(`${BASE_URL}/all`);
    return res.data;
  },

  // Create artist (FormData)
  create: async (formData: FormData) => {
    const res = await axios.post(`${BASE_URL}/create`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Update artist (FormData)
  update: async (Artist_id: number, formData: FormData) => {
    const res = await axios.put(`${BASE_URL}/${Artist_id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  // Delete artist
  delete: async (Artist_id: number) => {
    const res = await axios.delete(`${BASE_URL}/${Artist_id}`);
    return res.data;
  },

  // Search artists
  search: async (query: string) => {
    const res = await axios.get(`${BASE_URL}/search`, { params: { query } });
    return res.data;
  },
};
