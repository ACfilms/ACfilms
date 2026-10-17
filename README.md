# ACfilms static website

Open `index.html` directly in a browser. The site uses HTML, CSS, and vanilla
JavaScript; it needs no PHP, XAMPP, database, backend, build step, or installation.

## Files and editing

- `index.html`: all current page content, navigation, video cards, packages,
  contact links, and footer. Edit content here.
- `assets/css/public.css`: the existing dark/gold design and responsive layouts.
- `assets/js/public.js`: navigation, reveal animations, Jewel visibility playback,
  Work Outputs filters, desktop muted previews, and the video modal.
- `assets/img/` and `assets/videos/`: the original images and the 20 compressed videos used
  by the page. Four unused videos, the Glenn & Eiven Wedding / Same Day Edit,
  and the Alizon at Eighteen / Same Day Edit were removed; existing unused images
  remain.

When changing a Work Outputs video, keep its card's `data-video` attribute and
the preview video's `<source src>` in sync. Keep paths relative to `index.html`.
The Jewel Showreel has its own inline video element and native controls.

Packages contain the current price lists; the previous site had no calculator.
Booking links go to `#contact`, which provides email, phone, and Facebook links.
There is no contact form or server submission. The booking FAQ now names these
available contact methods.

## Static hosting

Upload `index.html` and `assets/` together, preserving their folder structure.
The relative paths work at a domain root or inside a project subdirectory.
`.nojekyll` is included for plain static publishing on GitHub Pages.

The site now fits the [1 GB published GitHub Pages size limit](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
The 20 compressed MP4s total 893,634,420 bytes (about 893.63 MB).
`index.html`, `assets/`, and `.nojekyll` together total
899,253,736 bytes (about 899.25 MB), leaving about
100.75 MB below a conservative 1,000,000,000-byte budget.
All 20 videos remain at their original paths and dimensions. Their original
frame rates, complete frame counts, and AAC audio packets are preserved.
Video compression is lossy and can slightly soften detail; MP4 faststart is
enabled for browser playback.

Use Git or GitHub Desktop to upload the media: some videos exceed GitHub's
[25 MiB browser upload limit](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github),
while every video is below the 100 MiB regular Git per-file limit.

The uncompressed originals, compression scripts, and validation reports are
backed up outside the website at
`C:\xampp\ACFilms-original-videos\2026-10-09-204415\`.
Keep that backup outside the repository and upload only the website files.

The existing Google Fonts links remain; browsers use the stylesheet's fallback
fonts when those fonts are unavailable.

## Verification

During the initial static conversion, browser checks passed in desktop Chrome
and a touch/mobile viewport, opening
`index.html` using `file://` and serving it beneath `/ACFilms/` on a plain static
HTTP host. Checks covered:

- Content parity with the PHP output at conversion, the original 21 Work Outputs
  videos plus the Jewel Showreel, real images, package inclusions/prices, and
  contact links. After the requested removals below, the page has 19 Work Outputs
  videos plus the Jewel Showreel.
- Jewel visibility playback, manual pause/volume, and stopping/resetting its
  playback and audio when scrolled offscreen.
- Forced rejection of audible autoplay on desktop and mobile, native muted
  fallback, click/tap to enable sound, and preserving manual mute and volume
  settings after scrolling away and returning.
- Category filters, keyboard selection, single muted desktop hover previews,
  and preview reset on pointer leave.
- Modal playback, pause, seek, volume, mute, fullscreen, and shutdown through
  the close button, Escape, and outside click.
- Hamburger/section navigation, active navigation, reveals, mobile tap playback,
  and no horizontal scrolling at 320, 375, 390, 430, 768, 900, 1024, and 1440 px.
- No browser console errors or JavaScript exceptions.

The removed wedding videos and photography gallery were not restored. Four
unused videos were deleted after checking that the page does not reference them:
`jell-laur-wedding-same-day-edit.mp4`, `renz-frances-wedding-same-day-edit.mp4`,
`summers-7th-birthday-same-day-edit.mp4`, and `summers-pre-birthday-film.mp4`.
This freed 232.42 MB.

At the user's request, the Glenn & Eiven Wedding / Same Day Edit card and
`glenn-eiven-wedding-same-day-edit.mp4` were removed, freeing another
103,675,439 bytes (103.68 MB). The Glenn & Eiven Pre-Wedding card and
`glenn-eiven-pre-wedding.mp4` remain. At that point, all 21 referenced videos and
existing images remained.

After the Glenn & Eiven Same Day Edit removal, desktop and touch/mobile browser checks passed
for all 21 remaining videos, every filter, and the retained Glenn & Eiven
Pre-Wedding modal. Featured Film and Jewel remain; no horizontal overflow,
console errors, or JavaScript exceptions were found.

At the user's request, the Alizon at Eighteen / Same Day Edit card and
`alizon-at-eighteen-same-day-edit.mp4` were removed, freeing another
65,805,333 bytes (65.81 MB). The Lizon @18 Pre-Debut card and
`lizon-18-pre-debut.mp4` remain. The page now has 19 Work Outputs videos plus
the Jewel Showreel. Static checks confirmed that the removed video has no page
references and all remaining video paths exist with matching card and preview
URLs.


On 2026-10-10, all 20 referenced MP4s were compressed with two-pass H.264
encoding, retaining their dimensions, frame rates, complete frame counts, and
original AAC audio packets. The videos decreased from 1,214,696,546 bytes to
893,634,420 bytes, saving 321,062,126 bytes
(321.06 MB). Full-file decoding, audio packet checksums, and
MP4 faststart checks passed for every video. Desktop Chrome and an emulated
touch/mobile viewport passed playback and seeking for all 20 videos, all
filters, modal shutdown, Jewel visibility playback, muted desktop previews,
and horizontal overflow checks. No browser console or JavaScript errors were
found. The page, CSS, JavaScript, and existing images retain their pre-compression
checksums. Native fullscreen UI and physical-device audio output were not
verified by the headless browser checks.

The editorial navigation update on 2026-10-10 adds one moving desktop gold
indicator with 300 ms transitions, a brief gold sweep, and a restrained dark
handoff inside the header. Navigation scrolling takes 650-850 ms according to
distance, with gentle acceleration/deceleration and fixed-header clearance.
Headings reveal over 600 ms with 20 px upward movement and a subtle 3 px
blur-to-clear effect. Supporting content and Work Outputs/package cards enter
once with short, capped 70 ms staggers. Returning through navbar links can
reveal the heading again; category filters never replay previously revealed
cards. Video surfaces are never blurred, and Jewel has no animated ancestor.

Mobile uses 12 px movement, 1 px text blur, 60 ms staggers, and only the light
gold header sweep. The menu closes before scrolling. Reduced motion uses
instant navigation, an immediate indicator, and visible content without
entrance or header effects. Existing HTML content, video files, and
Jewel/preview/filter/modal/package behavior code are unchanged. Navigation
keeps URL fragments, browser history, and keyboard access to the mobile menu;
content remains visible without JavaScript or if the main script cannot load.

Desktop Chrome and an emulated touch/mobile viewport passed all six navigation
links, manual-scroll active states, indicator alignment after fonts/resize,
header clearance, browser history, once-only filtered card reveals, reduced
motion, and horizontal overflow checks. JavaScript-disabled desktop/mobile,
a blocked main script, and file:// checks also passed without console errors
or JavaScript exceptions.
Additional desktop/mobile checks passed rapid replacement navigation,
heading return animations, and live reduced-motion changes. Jewel playback
and offscreen reset, keyboard menu/navigation/filter controls, modal playback
and seeking, and muted desktop hover previews passed. No horizontal overflow
was found at 320, 375, 390, 430, 768, 900, 1024, or 1440 px.

The luxury UI refinement on 2026-10-10 adds an inset floating navbar with a
14 px glass blur, rounded corners, and a restrained scrolled surface. Header
dimensions stay constant between scroll states. Major headings use system
Palatino/Georgia serif fallbacks with the existing sans-serif body/navigation
fonts; no additional font downloads, libraries, or dependencies were added.
Five aria-hidden section numbers and thin gold dividers add visual hierarchy.
Dividers use once-only 750 ms scale animations through the existing reveal
observer, with full visible lines when JavaScript or motion is unavailable.

Above 1100 px, All view gives the first card in each group of six regular Work
Outputs cards a two-column, two-row footprint, preserving source and keyboard
order. Category views use uniform cards; tablet uses two columns and mobile one.
The separate Featured
Film retains its layout. Desktop regular-card hover rises 5 px with a 1.025
preview scale and restrained gold border; touch layouts have no hover motion.
Existing MP4 paths, muted preview playback, 3-second preview poster/reset,
Jewel audio behavior, filters, and modal behavior are unchanged.

The existing Premium and On The Day packages sit side by side above 1000 px
with aligned pricing and booking buttons. They stack below that width, with
full-width booking buttons and responsive inclusion lists. All package names,
prices, inclusions, custom services, and #contact booking links are preserved.
Visible content, What We Film images/order, contact links, and footer text
were compared against the previous site without changes.

Desktop Chrome and emulated tablet/touch-mobile checks passed at 320, 375,
390, 430, 768, 1024, and 1440 px. Checks covered the glass navbar, all navigation
links, keyboard controls, active/hover indicators, header clearance, dividers,
every filter and grid order, unique videos, package prices, and booking/contact
links. Jewel playback, volume/mute preferences and offscreen reset, muted
single hover previews and reset, modal playback/seeking and all three close
methods also passed. Reduced-motion keyboard focus stays still; disabled
JavaScript, a blocked main script, and file:// retained visible content.
No horizontal overflow, console errors, or JavaScript exceptions were found.
These checks used headless Chrome; physical-device audio output and native
fullscreen UI were not verified during this UI refinement.
