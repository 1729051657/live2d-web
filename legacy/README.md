# Legacy static site

This folder holds the **old browser demo** that predates the `live2d-web-widget` npm package:

- `index.html` — loads jQuery, Font Awesome, `autoload.js`, and the global `waifu-tips.js` stack
- `js/`, `css/` — original scripts and styles
- `fontawesome/` — vendored Font Awesome bundle (large)
- `model/` — full local model mirror used by the old layout (very large; not shipped on npm)
- `model_list.json` — list used by the old CDN-style loader

The **maintained** npm package sources live at the repository root (`src/`, `assets/`, `scripts/`).  
Demo models that are **published inside the package** are under `assets/demo/models/` and copied to `dist/demo/` at build time.

You can delete this folder if you only need the npm library and no historical reference.
