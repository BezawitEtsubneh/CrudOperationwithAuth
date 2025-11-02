# main.py
from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
import shutil
import os
import logging
from fastapi import FastAPI, Depends, HTTPException, status
from jose import JWTError, jwt
import models
import database
import auth
import utils

from models import Album, Song, Artist, Base
from database import SessionLocal, engine

logger = logging.getLogger(__name__)

# ---------------- DATABASE SETUP ----------------
# Drop Artist table if it exists (for development)
try:
    Artist.__table__.drop(bind=engine)
    logger.info("Artist table dropped successfully")
except SQLAlchemyError:
    logger.info("Artist table does not exist or could not be dropped")

# Create all tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created/verified successfully")
except SQLAlchemyError as e:
    logger.warning(f"Could not create database tables: {e}")

# ---------------- APP SETUP ----------------
app = FastAPI(title="Music Library API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload folder
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Serve static files
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")

# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------------- HELPER FUNCTION ----------------
def save_file(file: UploadFile) -> str:
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return file_path

# ---------------- ALBUM ENDPOINTS ----------------
app.include_router(auth.router)

@app.get("/protected")
def protected_route(token: str):
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"message": f"Hello {email}, you accessed a protected route!"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
@app.get("/api/albums/all")
async def get_all_albums(db: Session = Depends(get_db)):
    albums = db.query(Album).all()
    return [
        {
            "Album_id": a.Album_id,
            "Album_title": a.Album_title,
            "Total_tracks": a.Total_tracks,
            "audio_url": f"/static/{os.path.basename(a.audio_file)}" if a.audio_file else None
        } for a in albums
    ]

@app.post("/api/albums/create")
async def create_album(
    Album_title: str = Form(...),
    Total_tracks: int = Form(...),
    audio: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    file_path = save_file(audio) if audio else None
    album = Album(Album_title=Album_title, Total_tracks=Total_tracks, audio_file=file_path)
    db.add(album)
    db.commit()
    db.refresh(album)
    return {
        "Album_id": album.Album_id,
        "Album_title": album.Album_title,
        "Total_tracks": album.Total_tracks,
        "audio_url": f"/static/{audio.filename}" if audio else None
    }

@app.put("/api/albums/{album_id}")
async def update_album(
    album_id: int,
    Album_title: str = Form(...),
    Total_tracks: int = Form(...),
    audio: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    album = db.query(Album).filter(Album.Album_id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    album.Album_title = Album_title
    album.Total_tracks = Total_tracks
    if audio:
        if album.audio_file and os.path.exists(album.audio_file):
            os.remove(album.audio_file)
        album.audio_file = save_file(audio)
    db.commit()
    db.refresh(album)
    return {
        "Album_id": album.Album_id,
        "Album_title": album.Album_title,
        "Total_tracks": album.Total_tracks,
        "audio_url": f"/static/{os.path.basename(album.audio_file)}" if album.audio_file else None
    }

@app.delete("/api/albums/{album_id}")
async def delete_album(album_id: int, db: Session = Depends(get_db)):
    album = db.query(Album).filter(Album.Album_id == album_id).first()
    if not album:
        raise HTTPException(status_code=404, detail="Album not found")
    if album.audio_file and os.path.exists(album.audio_file):
        os.remove(album.audio_file)
    db.delete(album)
    db.commit()
    return {"message": "Album deleted successfully"}

@app.get("/api/albums/search")
async def search_albums(query: str, db: Session = Depends(get_db)):
    albums = db.query(Album).filter(Album.Album_title.like(f"%{query}%")).all()
    return [
        {
            "Album_id": a.Album_id,
            "Album_title": a.Album_title,
            "Total_tracks": a.Total_tracks,
            "audio_url": f"/static/{os.path.basename(a.audio_file)}" if a.audio_file else None
        } for a in albums
    ]

# ---------------- SONG ENDPOINTS ----------------
@app.get("/api/songs/all")
async def get_all_songs(db: Session = Depends(get_db)):
    songs = db.query(Song).all()
    return [
        {
            "Songs_id": s.Songs_id,
            "Songs_name": s.Songs_name,
            "Gener": s.Gener,
            "audio_url": f"/static/{os.path.basename(s.audio_file)}" if s.audio_file else None
        } for s in songs
    ]

@app.post("/api/songs/create")
async def create_song(
    Songs_name: str = Form(...),
    Gener: str = Form(...),
    audio: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    file_path = save_file(audio) if audio else None
    song = Song(Songs_name=Songs_name, Gener=Gener, audio_file=file_path)
    db.add(song)
    db.commit()
    db.refresh(song)
    return {
        "Songs_id": song.Songs_id,
        "Songs_name": song.Songs_name,
        "Gener": song.Gener,
        "audio_url": f"/static/{audio.filename}" if audio else None
    }

@app.put("/api/songs/{song_id}")
async def update_song(
    song_id: int,
    Songs_name: str = Form(...),
    Gener: str = Form(...),
    audio: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    song = db.query(Song).filter(Song.Songs_id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    song.Songs_name = Songs_name
    song.Gener = Gener
    if audio:
        if song.audio_file and os.path.exists(song.audio_file):
            os.remove(song.audio_file)
        song.audio_file = save_file(audio)
    db.commit()
    db.refresh(song)
    return {
        "Songs_id": song.Songs_id,
        "Songs_name": song.Songs_name,
        "Gener": song.Gener,
        "audio_url": f"/static/{os.path.basename(song.audio_file)}" if song.audio_file else None
    }

@app.delete("/api/songs/{song_id}")
async def delete_song(song_id: int, db: Session = Depends(get_db)):
    song = db.query(Song).filter(Song.Songs_id == song_id).first()
    if not song:
        raise HTTPException(status_code=404, detail="Song not found")
    if song.audio_file and os.path.exists(song.audio_file):
        os.remove(song.audio_file)
    db.delete(song)
    db.commit()
    return {"message": "Song deleted successfully"}

@app.get("/api/songs/search")
async def search_songs(query: str, db: Session = Depends(get_db)):
    songs = db.query(Song).filter(Song.Songs_name.like(f"%{query}%")).all()
    return [
        {
            "Songs_id": s.Songs_id,
            "Songs_name": s.Songs_name,
            "Gener": s.Gener,
            "audio_url": f"/static/{os.path.basename(s.audio_file)}" if s.audio_file else None
        } for s in songs
    ]

# ---------------- ARTIST ENDPOINTS ----------------
@app.get("/api/artists/all")
async def get_all_artists(db: Session = Depends(get_db)):
    artists = db.query(Artist).all()
    return [
        {
            "Artist_id": a.Artist_id,
            "Artist_name": a.Artist_name,
            "Country": a.Country,
            "audio_url": f"/static/{os.path.basename(a.audio_file)}" if a.audio_file else None
        } for a in artists
    ]

@app.post("/api/artists/create")
async def create_artist(
    Artist_name: str = Form(...),
    Country: str = Form(...),
    audio: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    file_path = save_file(audio) if audio else None
    artist = Artist(Artist_name=Artist_name, Country=Country, audio_file=file_path)
    db.add(artist)
    db.commit()
    db.refresh(artist)
    return {
        "Artist_id": artist.Artist_id,
        "Artist_name": artist.Artist_name,
        "Country": artist.Country,
        "audio_url": f"/static/{audio.filename}" if audio else None
    }

@app.put("/api/artists/{artist_id}")
async def update_artist(
    artist_id: int,
    Artist_name: str = Form(...),
    Country: str = Form(...),
    audio: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    artist = db.query(Artist).filter(Artist.Artist_id == artist_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    artist.Artist_name = Artist_name
    artist.Country = Country
    if audio:
        if artist.audio_file and os.path.exists(artist.audio_file):
            os.remove(artist.audio_file)
        artist.audio_file = save_file(audio)
    db.commit()
    db.refresh(artist)
    return {
        "Artist_id": artist.Artist_id,
        "Artist_name": artist.Artist_name,
        "Country": artist.Country,
        "audio_url": f"/static/{os.path.basename(artist.audio_file)}" if artist.audio_file else None
    }

@app.delete("/api/artists/{artist_id}")
async def delete_artist(artist_id: int, db: Session = Depends(get_db)):
    artist = db.query(Artist).filter(Artist.Artist_id == artist_id).first()
    if not artist:
        raise HTTPException(status_code=404, detail="Artist not found")
    if artist.audio_file and os.path.exists(artist.audio_file):
        os.remove(artist.audio_file)
    db.delete(artist)
    db.commit()
    return {"message": "Artist deleted successfully"}

@app.get("/api/artists/search")
async def search_artists(query: str, db: Session = Depends(get_db)):
    artists = db.query(Artist).filter(Artist.Artist_name.like(f"%{query}%")).all()
    return [
        {
            "Artist_id": a.Artist_id,
            "Artist_name": a.Artist_name,
            "Country": a.Country,
            "audio_url": f"/static/{os.path.basename(a.audio_file)}" if a.audio_file else None
        } for a in artists
    ]
