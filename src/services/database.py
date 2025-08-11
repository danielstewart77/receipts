from datetime import datetime
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.exc import SQLAlchemyError

from src.models.image_training import ImageTraining

load_dotenv(dotenv_path='local_secrets.env')

Base = declarative_base()

class DatabaseService:
    _instance = None
    _session_factory = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super().__new__(cls, *args, **kwargs)
            cls._instance._init_engine()
        return cls._instance

    def _init_engine(self):
        try:
             # Fetch environment variables
            db_user = os.getenv('SPARKDB_USER')
            db_password = os.getenv('SPARKDB_PASSWORD')
            db_host = os.getenv('DB_HOST')
            db_port = os.getenv('DB_PORT')
            db_name = os.getenv('TRAINING_DB_NAME')
            
            # Construct the connection string
            connection_string = f'postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}'
            self.engine = create_engine(connection_string)
            Base.metadata.create_all(self.engine)
            self._session_factory = sessionmaker(bind=self.engine)
        except SQLAlchemyError as e:
            print(f"Error initializing the database engine: {e}")

    def get_session(self):
        if not self._session_factory:
            self._init_engine()
        return scoped_session(self._session_factory)

    def add_image_traing_set(self, image_path, response, metadata):
        # Example method to get whitelist from the database
        session = self.get_session()
        try:
            # add image training set
            image_training = ImageTraining(image_path=image_path, response=response, metadata=metadata, created=datetime.now())
            session.add(image_training)
            session.commit()
        except SQLAlchemyError as e:
            print(f"Error adding image training set: {e}")
            session.rollback()
        finally:
            session.remove()