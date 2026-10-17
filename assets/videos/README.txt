The static website uses the current MP4 files in this folder.

Edit video cards directly in index.html. Each Work Outputs card has a
data-video="assets/videos/filename.mp4" attribute for the full video modal
and a matching <source src="assets/videos/filename.mp4"> for its preview.
Keep both paths in sync when changing a video.

The Jewel Showreel uses its own inline <video> element in index.html.
Navigation, filters, hover previews, and modal playback use assets/js/public.js.
No PHP, database, build step, or backend is required.

This folder contains only the 20 videos currently used by index.html:
19 Work Outputs videos and the Jewel Showreel.
Four unused video files were removed after verifying that the page does not
reference them. The Glenn & Eiven Wedding / Same Day Edit video and card were
also removed at the user's request. Glenn & Eiven Pre-Wedding remains.
The Alizon at Eighteen / Same Day Edit video and card were also removed at the
user's request. Lizon @18 Pre-Debut remains.
The 20 compressed MP4s total 893,634,420 bytes (about 893.63 MB).
All videos retain their original dimensions, frame rate, and complete frame
counts. Original AAC audio packets were copied unchanged; MP4 faststart is
enabled for prompt browser playback. Lossy video compression can slightly
soften detail. Full-file decoding and desktop/mobile browser checks passed.
Uncompressed originals and verification reports are backed up outside the
website at C:\xampp\ACFilms-original-videos\2026-10-09-204415\.
Do not upload that backup folder.
Existing images in assets/img/ remain unchanged.
