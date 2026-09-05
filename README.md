# OpenJS CAD site

This project is set up as a static GitHub Pages site.

## Files

- `index.html` — home page
- `styles.css` — styling
- `app.js` — loads and renders the drawing JSON
- `openjscad-project (2).json` — source CAD data
- `.github/workflows/deploy-pages.yml` — GitHub Pages deployment workflow

## Publish to GitHub Pages

1. Push this folder to a GitHub repository.
2. In GitHub, open the repository.
3. Go to Settings → Pages.
4. Choose the deployment source as either:
   - GitHub Actions, or
   - Deploy from a branch and select the `main` branch and `/ (root)` folder.
5. Your site will become available at:
   `https://YOUR-USERNAME.github.io/openjs-cad/`

If you are using the included GitHub Action, GitHub will deploy automatically on every push to `main`.
