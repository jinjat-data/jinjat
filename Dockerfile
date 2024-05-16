FROM python:3.10-slim-bullseye

RUN apt-get update && apt-get -y upgrade \
    && pip install --upgrade pip

# Set separate working directory for easier debugging.
WORKDIR /app

RUN pip install 'poetry==1.2.1'
COPY pyproject.toml ./
# Install the dependencies first, so that we can cache them.
RUN poetry install --with test

# Copy everything. (Note: If needed, we can use .dockerignore to limit what's copied.)
COPY . .

# Install again, now that we've copied the jinjat package files. Otherwise,
# Jinjat itself won't be installed.
RUN poetry install --with test

EXPOSE 8581
ENV JINJAT_HOST=0.0.0.0

ENTRYPOINT ["poetry", "run", "jinjat"]
