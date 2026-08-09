# Research Image Uploads Tool

## Local setup

Create the local environment file from the checked-in template:

```bash
cp .env.example .env
npm install
```

Start the frontend and server in separate terminals:

```bash
npm run dev
npm run server
```

The frontend runs on the port in `VITE_PORT` and calls the server at
`VITE_API_URL`. The server listens on `PORT` and allows browser requests from
`CLIENT_ORIGIN`.
