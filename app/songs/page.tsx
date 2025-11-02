'use client'
import React from "react"
import { useState, useEffect } from "react" // Added useEffect import
import SongCard from "@/components/forms/SongsFormCard"
import Searchbar from "@/components/ui/Searchbar"
import { songAPI } from '@/lib/songapi'; // Added API import

// Add type definition for Song
interface Song {
  Songs_id: number;
  Songs_name: string;
  Gener: string;
  audio_url?: string;
}

export default function Song(){
    const [showCard, setShowCard] = useState(false);
    const [songs, setSongs] = useState<Song[]>([]); // Added state for songs data
    const [loading, setLoading] = useState(false);
    const [editingSong, setEditingSong] = useState<Song | null>(null); // Added for edit functionality
    
    // Added function to fetch songs from API
    const fetchSongs = async () => {
        try {
            setLoading(true);
            const data = await songAPI.getAll();
            setSongs(data);
        } catch (error) {
            console.error('Error fetching songs:', error);
            alert('Failed to fetch songs');
        } finally {
            setLoading(false);
        }
    };

    // Added useEffect to load songs on component mount
    useEffect(() => {
        fetchSongs();
    }, []);

    // Added function to handle song deletion
    const handleDeleteSong = async (Songs_id: number) => {
        if (!confirm('Are you sure you want to delete this song?')) return;
        
        try {
            await songAPI.delete(Songs_id);
            fetchSongs(); // Refresh the list after deletion
            alert('Song deleted successfully');
        } catch (error) {
            console.error('Error deleting song:', error);
            alert('Failed to delete song');
        }
    };

    // Added function to handle song editing
    const handleEditSong = (song: Song) => {
        setEditingSong(song);
        setShowCard(true);
    };

    // Modified handleAddClick to reset editing state
    const handleAddClick = () => {
        setEditingSong(null);
        setShowCard(true)
    }
    
    // Modified handleCloseCard to reset editing state
    const handleCloseCard = () => {
        setShowCard(false);
        setEditingSong(null);
    }

    // Added function to handle successful song creation/update
    const handleSongSuccess = () => {
        fetchSongs(); // Refresh the list
        handleCloseCard(); // Close the card
    }

    return(
        <div>
            {showCard ? (
                <div className="max-w-md mx-auto bg-white rounded-lg shadow-md border">
                    <div className="bg-amber-500 px-6 py-4">
                        <div className="flex items-center justify-between">
                            {/* Modified title to show edit mode */}
                            <h2 className="text-xl font-bold text-white">
                                {editingSong ? 'Edit Song' : 'Add Song'}
                            </h2>
                            <button onClick={handleCloseCard} className="text-white text-xl">×</button>
                        </div>
                    </div>
                    {/* Passed props to SongCard component */}
                    <SongCard 
                        onClose={handleCloseCard}
                        editingSong={editingSong}
                        onSuccess={handleSongSuccess}
                    />
                </div>
            ) : (
                <div>
                    {/* Search bar and + icon at same height */}
                    <div className="flex justify-between items-center mt-10 ml-4">
                        <Searchbar />
                        <img 
                            onClick={handleAddClick}
                            className="w-9 h-9 cursor-pointer" 
                            src={buttons.num2} 
                            alt="Add"
                        />
                    </div>
                    
                    {/* Songs List - Added this section to display songs */}
                    <div className="mt-6 p-4">
                        {loading ? (
                            <p className="text-center">Loading songs...</p>
                        ) : songs.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No songs found. Click + to add a song.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {songs.map((song) => (
                                    <div key={song.Songs_id} className="border p-4 rounded shadow bg-white hover:shadow-lg transition-shadow">
                                        <h3 className="text-lg font-semibold mb-2">{song.Songs_name}</h3>
                                        <p className="text-gray-600 mb-3">Genre: <span className="font-medium">{song.Gener}</span></p>
                                        {song.audio_url && (
                                            <div className="mb-3">
                                                <audio controls className="w-full">
                                                    <source src={`http://127.0.0.1:8002${song.audio_url}`} />
                                                    Your browser does not support the audio element.
                                                </audio>
                                            </div>
                                        )}
                                        <div className="mt-2 flex gap-2">
                                            <button
                                                onClick={() => handleEditSong(song)}
                                                className="flex-1 bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSong(song.Songs_id)}
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

                    {/* Other icons positioned below - These might need functionality */}
                    <div className="flex justify-end gap-10 mt-4">
                        {/* These could be global actions if needed */}
                        <img className="w-9 h-9 cursor-pointer" src={buttons.num3} alt="Update" title="Refresh Songs" onClick={fetchSongs}/>
                        <img className="w-9 h-9 cursor-pointer" src={buttons.num1} alt="Delete" title="Bulk Delete (not implemented)"/>
                    </div>
                </div>
            )}
        </div>
    )
}