from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base

class Album(Base):
    __tablename__ = 'Album'
    Album_id = Column(Integer, primary_key=True, index=True)
    Album_title = Column(String, index=True)
    Total_tracks = Column(Integer)
    audio_file = Column(String, nullable=True)

class Song(Base):
    __tablename__ = 'Song'
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

    