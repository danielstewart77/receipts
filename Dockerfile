FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements in stages for better caching and timeout handling
COPY requirements-base.txt .
RUN pip install --no-cache-dir --timeout 1000 --retries 5 -r requirements-base.txt

COPY requirements-auth.txt .
RUN pip install --no-cache-dir --timeout 1000 --retries 5 -r requirements-auth.txt

COPY requirements-db.txt .
RUN pip install --no-cache-dir --timeout 1000 --retries 5 -r requirements-db.txt

COPY requirements-utils.txt .
RUN pip install --no-cache-dir --timeout 1000 --retries 5 -r requirements-utils.txt

COPY requirements-ml.txt .
RUN pip install --no-cache-dir --timeout 1000 --retries 5 -r requirements-ml.txt

# Copy application code
COPY . .

# Expose port for FastAPI only
EXPOSE 8000

# Run the FastAPI application (production mode - no reload)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
