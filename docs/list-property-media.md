# Listing photos & videos (wizard step 5)

## Card preview (YouTube-style, always playing)

Every property card on the site uses **ListingCardPreview**:

1. If you mark a **video** as **Card preview** → that MP4/WebM loops silently on all cards (best match for a stitched preview file).
2. Otherwise, if you uploaded **2+ photos** → cards show an automatic **flipbook** (crossfade every ~0.5s), similar to YouTube hover previews but always on.
3. Otherwise → single cover photo.

## Uploading many files (e.g. 50 photos + 2 videos)

1. Open **Dashboard → List a property → step5** (Photos & media).
2. Click **Choose photos & videos** and select all files at once (Ctrl/Cmd+click or Shift+range).
3. Files upload **one after another** (progress shown). Limits: **12MB per photo**, **80MB per video**.
4. Use **Cover** on one photo (detail page default).
5. Use **Card preview** on one video if you want that clip on cards; the second video stays as a **tour** on the listing.

Uploaded files are stored on the server (Vercel Blob when configured, otherwise local `.data` in development). URLs are saved in your browser draft until submit.

## Optional: one MP4 built from all photos (offline)

For a single smooth “filmstrip” clip, encode locally with ffmpeg, then upload only that MP4 and set **Card preview**:

```bash
# Example: 2 fps slideshow from numbered JPGs in ./photos/
ffmpeg -framerate 2 -pattern_type glob -i 'photos/*.jpg' \
  -vf "scale=1280:-2" -c:v libx264 -pix_fmt yuv420p -movflags +faststart listing-preview.mp4
```

Then upload `listing-preview.mp4` on step 5 and tap **Card preview**.
