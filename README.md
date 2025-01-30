# Jukebox Pro

Introducing Jukebox Pro, the successor to Jukebox! Users will now need to make an account and log in before they are able to manage their playlists.

## Database

![Visual representation of the database schema linked below](/docs/schema.svg)\
_[textual representation of the database schema in DBML](/docs/schema.dbml)_

1. Create a new Postgres database named `jukebox-pro`.
2. Initialize Prisma and connect it to the database.
3. Define the models according to the schema above.
   - The `username` of a User must be unique.
4. Seed the database with at least 20 tracks.

## API

Build an Express app that serves the following routes.

The 🔒 lock icon next to a route indicates that it must be a protected route. A user can only access that route by attaching a valid token to their request. If a valid token is not provided, immediately send a 401 Unauthorized error.

### Authentication Routes

- `POST /register` creates a new User with the provided credentials and sends a token
  - request body should include username and password
  - the password should be hashed in the database
- `POST /login` sends a token if the provided credentials are valid
  - request body should include username and password

### Playlist Routes

- 🔒 `GET /playlists` sends array of all playlists owned by the logged in user
- 🔒 `POST /playlists` creates a new playlist owned by the logged in user
  - the request body should include the name, description, and trackIds
- 🔒 `GET /playlists/:id` sends specific playlist, including all tracks
  - if the logged-in user does not own this playlist, send a 403 Forbidden error

### Track Routes

- `GET /tracks` sends array of all tracks
- `GET /tracks/:id` sends specific track
  - if user is logged in, then also include all playlists owned by the user that have this track
