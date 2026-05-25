# Voice Search Guide (ASR + Elasticsearch)

This guide explains how to enable voice search using an ASR (speech-to-text) model hosted on Hugging Face and your existing Elasticsearch search.

## Overview
- Frontend records voice and sends audio to the backend.
- Backend proxies audio to ASR service and returns transcript.
- Frontend uses transcript to navigate to `/products?search=...` and your existing Elasticsearch search returns products.

## Backend Setup (UTEShop_BE)
1) Configure the ASR service in `.env`:

```
ASR_SERVICE_URL=https://<your-hf-space>.hf.space
ASR_SERVICE_PATH=/transcribe
ASR_TIMEOUT_MS=60000
HF_TOKEN=<your-hf-token>
```

Notes:
- `ASR_SERVICE_URL` must be your Hugging Face Space base URL.
- `ASR_SERVICE_PATH` must match the Space endpoint (default `/transcribe`).
- `HF_TOKEN` is optional if your Space is public.

2) Start the backend server (same as before).

## Frontend Setup (UTEShop_FE)
- The microphone icon is next to the camera icon in the search bar.
- Click the mic to start recording, click again to stop.
- After stop, it navigates to `/products?search=<transcript>`.

## API Endpoint
- Backend: `POST /api/asr/transcribe`
- Multipart form field: `audio` (webm/opus recommended)
- Optional field: `language` (default `vi`)

## Behavior
- While recording: status shows "Dang ghi am..."
- While transcribing: status shows "Dang nhan dang..."
- Errors show a red status message.

## Troubleshooting
- If mic permission fails: browser will block recording.
- If ASR returns empty text: check your Space endpoint and logs.
- If you see 502: backend could not parse transcript from ASR response.

## Files Updated
- Frontend mic UI and recording: `UTEShop_FE/src/components/ui/navbar.jsx`
- Frontend ASR client: `UTEShop_FE/src/api/asrApi.js`
- Backend ASR route: `UTEShop_BE/src/routes/asrRoutes.js`
- Backend ASR controller: `UTEShop_BE/src/controllers/asrController.js`
- Backend ASR service: `UTEShop_BE/src/services/asrService.js`
