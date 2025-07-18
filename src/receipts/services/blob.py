"""
Blob service for handling file storage
"""
import os
import uuid
from typing import Optional
import base64

class BlobService:
    """Service for handling blob storage operations"""
    
    def __init__(self):
        # Create a local storage directory if it doesn't exist
        self.storage_dir = "uploads"
        if not os.path.exists(self.storage_dir):
            os.makedirs(self.storage_dir)
    
    def save_blob(self, filename: str, base64_content: str) -> str:
        """
        Save a base64 encoded file to local storage
        
        Args:
            filename: Original filename
            base64_content: Base64 encoded file content
            
        Returns:
            str: URL or path to the saved file
        """
        try:
            # Generate unique filename
            file_extension = filename.split('.')[-1] if '.' in filename else 'jpg'
            unique_filename = f"{uuid.uuid4()}.{file_extension}"
            file_path = os.path.join(self.storage_dir, unique_filename)
            
            # Decode base64 and save to file
            file_data = base64.b64decode(base64_content)
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            # Return relative path or URL
            return f"/{self.storage_dir}/{unique_filename}"
            
        except Exception as e:
            print(f"Error saving blob: {e}")
            return ""
    
    def get_blob(self, blob_path: str) -> Optional[bytes]:
        """
        Retrieve a blob from storage
        
        Args:
            blob_path: Path to the blob
            
        Returns:
            bytes: File content or None if not found
        """
        try:
            # Remove leading slash if present
            if blob_path.startswith('/'):
                blob_path = blob_path[1:]
            
            if os.path.exists(blob_path):
                with open(blob_path, 'rb') as f:
                    return f.read()
            return None
            
        except Exception as e:
            print(f"Error retrieving blob: {e}")
            return None
    
    def delete_blob(self, blob_path: str) -> bool:
        """
        Delete a blob from storage
        
        Args:
            blob_path: Path to the blob
            
        Returns:
            bool: True if deleted successfully
        """
        try:
            # Remove leading slash if present
            if blob_path.startswith('/'):
                blob_path = blob_path[1:]
            
            if os.path.exists(blob_path):
                os.remove(blob_path)
                return True
            return False
            
        except Exception as e:
            print(f"Error deleting blob: {e}")
            return False
