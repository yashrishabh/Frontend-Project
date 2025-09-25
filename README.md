# Interactive Recipe Finder — Documentation

## Overview
Interactive Recipe Finder is a frontend-only project that:
- Lets users search recipes by ingredients (comma-separated)
- Shows recipe results as cards with images, ready-time, and quick actions
- Provides a modal for detailed view (ingredients + instructions)
- Allows saving favorites via LocalStorage
- Uses Bootstrap + Tailwind for styling, FontAwesome for icons, and AOS for animations

## Files
- `index.html` — HTML layout & structure
- `style.css` — custom styling
- `script.js` — interactivity & API handling
- `README.md` — this file

## How to run
1. Put files into a folder (e.g., `recipe-finder/`).
2. (Optional) Add `assets/logo.png` if you want a logo visible.
3. If you want live API results:
   - Get Spoonacular API key at https://spoonacular.com/food-api
   - Open `script.js` and set `SPOONACULAR_KEY = "YOUR_KEY"`
4. Open `index.html` in your browser.

## Notes for Presentation
- Default `demoMode` is enabled so the project works without any external key — great for offline demos and PPT screenshots.
- For real production, secure the API key on a server-side proxy instead of using it from client-side.
- Add more pages (user auth, saved recipes server) to expand the project.

## Features to highlight in PPT
- Search by ingredients
- Filters (veg/vegan/cuisine)
- Save favorites (LocalStorage)
- Responsive UI (Bootstrap + Tailwind)
- Smooth animations (AOS)
