'use client'
import React, { useState, useEffect } from "react";
import ArtistCard from "@/components/forms/ArtistFormCard";
import Searchbar from "@/components/ui/Searchbar";
import { artistAPI } from "@/lib/artistapi";

interface Artist {
  Artist_id: number;
  Artist_name: string;
  Country: string;
  audio_url?: string;
}

export default function Artist() {
  const [showCard, setShowCard] = useState(false);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const data = await artistAPI.getAll();
      setArtists(data);
    } catch (error) {
      console.error("Error fetching artists:", error);
      alert("Failed to fetch artists");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleDeleteArtist = async (Artist_id: number) => {
    if (!confirm("Are you sure you want to delete this artist?")) return;
    try {
      await artistAPI.delete(Artist_id);
      fetchArtists();
      alert("Artist deleted successfully");
    } catch (error) {
      console.error("Error deleting artist:", error);
      alert("Failed to delete artist");
    }
  };

  const handleEditArtist = (artist: Artist) => {
    setEditingArtist(artist);
    setShowCard(true);
  };

  const handleAddClick = () => {
    setEditingArtist(null);
    setShowCard(true);
  };

  const handleCloseCard = () => {
    setShowCard(false);
    setEditingArtist(null);
  };

  const handleArtistSuccess = () => {
    fetchArtists();
    handleCloseCard();
  };

  return (
    <div>
      {showCard ? (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md border">
          <div className="bg-amber-500 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {editingArtist ? "Edit Artist" : "Add Artist"}
            </h2>
            <button onClick={handleCloseCard} className="text-white text-xl">×</button>
          </div>
          <ArtistCard
            onClose={handleCloseCard}
            editingArtist={editingArtist}
            onSuccess={handleArtistSuccess}
          />
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center mt-10 ml-4">
            <Searchbar />
            <button onClick={handleAddClick} className="w-9 h-9 bg-amber-500 text-white rounded">+</button>
          </div>

          <div className="mt-6 p-4">
            {loading ? (
              <p className="text-center">Loading artists...</p>
            ) : artists.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No artists found. Click + to add an artist.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {artists.map((artist) => (
                  <div key={artist.Artist_id} className="border p-4 rounded shadow bg-white hover:shadow-lg transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">{artist.Artist_name}</h3>
                    <p className="text-gray-600 mb-3">
                      Country: <span className="font-medium">{artist.Country}</span>
                    </p>

                    {artist.audio_url && (
                      <audio controls className="w-full mb-3">
                        <source src={`http://127.0.0.1:8000${artist.audio_url}`} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    )}

                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => handleEditArtist(artist)}
                        className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteArtist(artist.Artist_id)}
                        className="flex-1 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 mt-4 mr-4">
            <button
              onClick={fetchArtists}
              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
