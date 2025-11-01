'use client'
import React, { useState, useEffect } from "react";
import { artistAPI } from "@/lib/artistapi";

interface Artist {
  Artist_id: number;
  Artist_name: string;
  Country: string;
  audio_url?: string;
}

interface ArtistCardProps {
  onClose: () => void;
  editingArtist?: Artist | null;
  onSuccess: () => void;
}

export default function ArtistCard({ onClose, editingArtist, onSuccess }: ArtistCardProps) {
  const [artistName, setArtistName] = useState("");
  const [country, setCountry] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);

  useEffect(() => {
    if (editingArtist) {
      setArtistName(editingArtist.Artist_name);
      setCountry(editingArtist.Country);
    } else {
      setArtistName("");
      setCountry("");
      setAudioFile(null);
    }
  }, [editingArtist]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudioFile(e.target.files[0]);
    }
  };

  const removeFile = () => setAudioFile(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistName || !country) {
      alert("Please fill in all fields.");
      return;
    }

    const formData = new FormData();
    formData.append("Artist_name", artistName);
    formData.append("Country", country);
    if (audioFile) formData.append("audio", audioFile);

    try {
      if (editingArtist) {
        await artistAPI.update(editingArtist.Artist_id, formData);
        alert("Artist updated successfully!");
      } else {
        await artistAPI.create(formData);
        alert("Artist added successfully!");
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving artist:", error);
      alert("Failed to save artist.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4 max-w-md">
      <h2 className="text-xl font-bold">{editingArtist ? "Edit Artist" : "Add Artist"}</h2>

      {/* Artist Name */}
      <div>
        <label className="block mb-2">Artist Name</label>
        <input
          type="text"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      {/* Country */}
      <div>
        <label className="block mb-2">Country</label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      {/* Audio Upload */}
      <div>
        <label className="block mb-2">Artist Audio</label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="w-full"
        />
        <p className="text-sm text-gray-600">
          {audioFile ? "Audio file selected" : "Upload an audio file"}
        </p>
      </div>

      {/* Show selected file */}
      {audioFile && (
        <div className="flex justify-between items-center bg-gray-100 p-2 rounded">
          <span className="text-sm">{audioFile.name}</span>
          <button type="button" onClick={removeFile} className="text-red-500 text-lg">
            ×
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 p-2 border rounded hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 p-2 bg-amber-500 text-white rounded hover:bg-amber-600"
        >
          {editingArtist ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
