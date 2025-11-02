# main.py
from fastapi import FastAPI, Form, File, UploadFile, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import Column, Integer, String, Boolean, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from typing import Optional
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
import os
import shutil
import hashlib

# ---------- CONFIG ----------
SECRET_KEY = "your_very_secure_secret_key_here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 1 week

# ---------- DATABASE ----------
DATABASE_URL = "sqlite:///./app.db"
Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

# ---------- MODELS ----------
class User(Base):
    __tablename__ = "User"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    disabled = Column(Boolean, default=False)

class Album(Base):
    __tablename__ = "Album"
    Album_id = Column(Integer, primary_key=True, index=True)
    Album_title = Column(String, index=True)
    Total_tracks = Column(Integer)
    audio_file = Column(String, nullable=True)

class Song(Base):
    __tablename__ = "Song"
    Songs_id = Column(Integer, primary_key=True, index=True)
    Songs_name = Column(String, index=True)
    Gener = Column(String)
    audio_file = Column(String, nullable=True)

class Artist(Base):
    __tablename__ = "Artist"
    Artist_id = Column(Integer, primary_key=True, index=True)
    Artist_name = Column(String, nullable=False)
    Country = Column(String, nullable=False)
    audio_file = Column(String, nullable=True)

# Create all tables
Base.metadata.create_all(bind=engine)

# ---------- Pydantic Schemas ----------
class UserSchema(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(UserSchema):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

# ---------- APP ----------
app = FastAPI()

# Allow CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ---------- UTILS ----------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_password_hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return get_password_hash(plain_password) == hashed_password

def get_user(db: Session, username: str) -> Optional[UserInDB]:
    user = db.query(User).filter(User.username == username).first()
    if user:
        return UserInDB(**user.__dict__)
    return None

def authenticate_user(db: Session, username: str, password: str) -> Optional[UserInDB]:
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = get_user(db, username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: UserInDB = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# File upload utility
UPLOAD_DIR = "static"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_file(file: UploadFile) -> str:
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path

# ---------- AUTH ENDPOINTS ----------
@app.post("/signup", response_model=UserSchema)
def signup(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    full_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if db.query(User).filter((User.username == username) | (User.email == email)).first():
        raise HTTPException(status_code=400, detail="Username or email already registered")
    hashed_password = get_password_hash(password)
    new_user = User(username=username, email=email, full_name=full_name, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=Token)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.username}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=UserSchema)
async def read_users_me(current_user: UserInDB = Depends(get_current_active_user)):
    return current_user

# ---------- ALBUM ENDPOINTS ----------
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
async def create_album(Album_title: str = Form(...), Total_tracks: int = Form(...), audio: UploadFile = File(None), db: Session = Depends(get_db)):
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
async def update_album(album_id: int, Album_title: str = Form(...), Total_tracks: int = Form(...), audio: UploadFile = File(None), db: Session = Depends(get_db)):
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

# ---------- SONG ENDPOINTS ----------
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
async def create_song(Songs_name: str = Form(...), Gener: str = Form(...), audio: UploadFile = File(None), db: Session = Depends(get_db)):
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
async def update_song(song_id: int, Songs_name: str = Form(...), Gener: str = Form(...), audio: UploadFile = File(None), db: Session = Depends(get_db)):
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

# ---------- ARTIST ENDPOINTS ----------
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
async def create_artist(Artist_name: str = Form(...), Country: str = Form(...), audio: UploadFile = File(None), db: Session = Depends(get_db)):
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
async def update_artist(artist_id: int, Artist_name: str = Form(...), Country: str = Form(...), audio: UploadFile = File(None), db: Session = Depends(get_db)):
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
