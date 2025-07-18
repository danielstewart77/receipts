import os
from dotenv import load_dotenv
load_dotenv()
import psycopg2
import logging
import atexit
from contextlib import contextmanager
from typing import Optional

class SparkDBConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SparkDBConnection, cls).__new__(cls)
            cls._instance._initialize()
            atexit.register(cls._instance.close_connection)  # Register close_connection to be called at exit
        return cls._instance

    def _initialize(self):
        self._connection = None
        self._connect()

    def _connect(self):
        try:
            self._connection = psycopg2.connect(
                dbname=os.getenv("DB_NAME"),
                user=os.getenv("SPARKDB_USER"),
                password=os.getenv("SPARKDB_PASSWORD"),
                host=os.getenv("DB_HOST"),
                port=os.getenv("PG_DB_PORT")
            )
            self._connection.autocommit = False  # Explicit transaction control
        except Exception as e:
            logging.exception("Failed to create database connection", exc_info=e)
            self._connection = None

    def get_connection(self):
        if self._connection is None or self._connection.closed != 0:
            self._connect()
        return self._connection

    def close_connection(self):
        if self._connection and self._connection.closed == 0:
            self._connection.close()
            logging.info("Database connection closed.")
    
    @contextmanager
    def get_db_transaction(self):
        """Context manager for database transactions"""
        conn = self.get_connection()
        if conn is None:
            raise Exception("Database connection failed")
        
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise e

    def test_connection(self) -> bool:
        """Test if database connection is working"""
        try:
            conn = self.get_connection()
            if conn is None:
                return False
            
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                return cursor.fetchone() is not None
        except Exception as e:
            logging.error(f"Database connection test failed: {e}")
            return False

# FastAPI dependency function
def get_database() -> Optional[psycopg2.extensions.connection]:
    """FastAPI dependency to get database connection"""
    db_instance = SparkDBConnection()
    return db_instance.get_connection()

# FastAPI dependency for transactions
def get_db_transaction():
    """FastAPI dependency for database transactions"""
    db_instance = SparkDBConnection()
    return db_instance.get_db_transaction()