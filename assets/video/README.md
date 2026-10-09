# Program walkthrough video

- `walkthrough.mp4` is the 31-second program walkthrough, 1080p with the voiceover.
- `walkthrough-poster.jpg` is the still frame shown before the video plays.

The walkthrough now plays from Wistia (media ID `n1mv2gt9yu`, set as `wistiaMediaId` in `config.js`). The MP4 here is only a backup: it plays if `wistiaMediaId` is cleared.

The video plays in the walkthrough pop-up from **"Watch the program walkthrough"** (home page) and **"Open the welcome walkthrough"** (welcome guide). Both are set in `config.js` (`overviewVideoUrl`, `welcomeVideoUrl`, `videoPoster`).

To replace it, upload a new MP4 with the same file name, or change the paths in `config.js`.
