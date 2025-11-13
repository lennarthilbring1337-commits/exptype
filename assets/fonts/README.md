# fonts/README.md

Place variable fonts in this directory and update `css/typography.css` to point to them.

Recommendations (open-source variable fonts):
- Recursive Variable: https://github.com/arrowtype/recursive
- Obviously Variable: https://github.com/connorjburke/obviously

How to install a variable font for this project:
1. Download a `.woff2` variable font file.
2. Put it in `/Experimental/assets/fonts/` (e.g. `Recursive-VF.woff2`).
3. Edit `css/typography.css` and update the `@font-face` `src` url to point at `../assets/fonts/YourFont.woff2`.
4. Optionally adjust axis names (wght, wdth, slnt, opsz) in `typography.css` to match your font's axes.

Notes:
- The `font-variation-settings` and CSS variables `--vf-wght`, `--vf-wdth`, `--vf-slnt`, `--vf-opsz` are used by scripts to drive animation.
- If you don't have a variable font installed, the site will fall back to the system UI font stack.
