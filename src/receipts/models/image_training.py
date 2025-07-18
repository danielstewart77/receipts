from sqlalchemy import JSON, Column, DateTime, Integer, Text, func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ImageTraining(Base):
    __tablename__ = 'image_training'

    id = Column(Integer, primary_key=True, autoincrement=True)
    image_path = Column(Text)
    response = Column(Text)
    training_metadata = Column(JSON)
    created = Column(DateTime, nullable=False, default=func.now())