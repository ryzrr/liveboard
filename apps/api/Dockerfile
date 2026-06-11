FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Default: run the ingest API.
# Override with CMD in docker-compose for the worker service.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
