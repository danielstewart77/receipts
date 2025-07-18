import os
from dotenv import load_dotenv
load_dotenv()
import asyncio
import logging
import atexit
from contextlib import asynccontextmanager
from typing import Optional, AsyncGenerator
import asyncpg
from asyncpg import Connection, Pool

class AsyncSparkDBConnection:
    """Async database connection manager for FastAPI"""
    _instance = None
    _pool: Optional[Pool] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AsyncSparkDBConnection, cls).__new__(cls)
        return cls._instance

    async def initialize(self):
        """Initialize the connection pool"""
        if self._pool is None:
            try:
                self._pool = await asyncpg.create_pool(
                    database=os.getenv("DB_NAME"),
                    user=os.getenv("SPARKDB_USER"),
                    password=os.getenv("SPARKDB_PASSWORD"),
                    host=os.getenv("DB_HOST"),
                    port=os.getenv("PG_DB_PORT"),
                    min_size=1,
                    max_size=10,
                    command_timeout=60
                )
                logging.info("Async database pool created successfully")
            except Exception as e:
                logging.exception("Failed to create async database pool", exc_info=e)
                self._pool = None

    async def get_connection(self) -> Optional[Connection]:
        """Get a connection from the pool"""
        if self._pool is None:
            await self.initialize()
        
        if self._pool is None:
            return None
        
        try:
            return await self._pool.acquire()
        except Exception as e:
            logging.error(f"Failed to acquire connection: {e}")
            return None

    async def release_connection(self, connection: Connection):
        """Release a connection back to the pool"""
        if self._pool and connection:
            try:
                await self._pool.release(connection)
            except Exception as e:
                logging.error(f"Failed to release connection: {e}")

    @asynccontextmanager
    async def get_db_transaction(self) -> AsyncGenerator[Connection, None]:
        """Context manager for database transactions"""
        connection = await self.get_connection()
        if connection is None:
            raise Exception("Database connection failed")
        
        async with connection.transaction():
            try:
                yield connection
            finally:
                await self.release_connection(connection)

    async def close_pool(self):
        """Close the connection pool"""
        if self._pool:
            await self._pool.close()
            self._pool = None
            logging.info("Async database pool closed")

    async def test_connection(self) -> bool:
        """Test if database connection is working"""
        try:
            connection = await self.get_connection()
            if connection is None:
                return False
            
            result = await connection.fetchval("SELECT 1")
            await self.release_connection(connection)
            return result == 1
        except Exception as e:
            logging.error(f"Async database connection test failed: {e}")
            return False

# Global async database instance
async_db = AsyncSparkDBConnection()

# FastAPI startup/shutdown events
async def startup_database():
    """Initialize database on FastAPI startup"""
    await async_db.initialize()

async def shutdown_database():
    """Close database on FastAPI shutdown"""
    await async_db.close_pool()

# FastAPI dependency functions
async def get_async_database() -> Optional[Connection]:
    """FastAPI dependency to get async database connection"""
    return await async_db.get_connection()

def get_async_db_transaction():
    """FastAPI dependency for async database transactions"""
    return async_db.get_db_transaction()
