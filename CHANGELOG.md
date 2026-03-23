# Changelog - OmniMark

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-03-23

### ✨ New Features
- **Smart YouTube Widget**: Integration of a recent videos feed directly on the home page.
- **Cloudflare Worker Relay**: Use of a personal worker for ultra-fast video retrieval via RSS, with KV cache and Queues support for regular updates.
- **Anti-Shorts Filtering**: The widget automatically ignores YouTube Shorts to keep only long-form content.
- **Watched Videos Management**: Ability to hide already watched videos with one click (local storage up to 200 videos).
- **ID Search Tool**: Built-in system to find a YouTube channel ID simply from its handle (e.g., @YouTube).
- **Segmented Import/Export**: Ability to save and restore bookmarks/search engines and YouTube configuration separately.
- **Integrated Installation Guide**: Added a full help tab in the options including the Worker source code and Cloudflare configuration steps.

### 🎨 Interface Improvements
- **Compact Layout**: YouTube widget changed to a single horizontal row with scrolling for minimal clutter.
- **Flexible Positioning**: Option to place the widget at the top or bottom of bookmarks (bottom by default for seamless footer integration).
- **"Neon Night" Design**: Adjusted styles, fonts, and margins for perfect visual consistency.
- **Tab Optimization**: Shortened names and CSS adjustments to avoid wrapping to two lines in options.
- **Flexbox Structure**: Overhaul of the main layout to ensure the widget "sticks" to the footer without parasitic white space.

### 🔧 Technical Improvements
- Migrated YouTube channel configuration from raw text to a list of structured objects (ID + Name).
- Used `insertAdjacentElement` for robust and dynamic DOM positioning.
- Reduced total thumbnail weight and optimized network requests.
- Improved cache management in the Cloudflare Worker.

---

## [1.0.7] - Initial Consolidated Version
- Bookmark management by categories.
- Customizable search shortcuts.
- Synchronization via `browser.storage.sync`.
- Automatic icon support (Favicon, Simple Icons, Logo.dev).
