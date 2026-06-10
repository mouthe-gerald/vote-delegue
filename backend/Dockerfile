FROM python:3.10-slim

# Dépendances système pour face_recognition + dlib
RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    libopenblas-dev \
    liblapack-dev \
    libx11-dev \
    libgtk-3-dev \
    python3-dev \
    libboost-python-dev \
    libboost-thread-dev \
    libssl-dev \
    libffi-dev \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements_docker.txt .
RUN pip install --no-cache-dir --timeout=300 --no-deps \
    Django==4.2 \
    djangorestframework==3.14.0 \
    djangorestframework-simplejwt==5.3.0 \
    django-cors-headers==4.3.0 \
    psycopg2-binary==2.9.9 \
    Pillow \
    face-recognition==1.3.0 \
    gunicorn==21.2.0 \
    python-dotenv==1.0.1 \
    PyJWT==2.8.0 && \
    pip install --no-cache-dir --timeout=300 \
    asgiref sqlparse pytz typing_extensions cryptography

COPY . .

RUN python manage.py collectstatic --noinput || true

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "120"]