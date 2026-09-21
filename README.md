# DualSense — an object study

An independent, scroll-driven study of the PlayStation 5 DualSense controller. The page separates the exterior, changes the light, and lets you turn the object yourself.

This project is not affiliated with, endorsed by, or sponsored by Sony Interactive Entertainment. PlayStation, DualSense, and the button symbols are trademarks of Sony Interactive Entertainment.

## Run it

```bash
npm install
npm run dev
```

The dev server prints a local URL. `npm run build` writes a static site to `dist/`. `npm run preview` serves that build.

## Pages

| Route | What it is |
| --- | --- |
| `/` | The interactive study |
| `/progress/` | Build log: what is still being matched to the photographs |
| `/credits/` | Sources, licenses, and the trademark notice |

## Stack

[Vite](https://vite.dev/) serves the pages. [Three.js](https://threejs.org/) renders `public/models/dualsense.glb`.

## Credits

The controller geometry is **PS5 Controller** by **Taohid Animation**, [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), prepared by [Safa Elmali / dualsense-studio](https://github.com/SafaElmali/dualsense-studio). The photographs in `public/references/` are by **iFixit**, [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/). That photo license is noncommercial.

Full names, links, and the model checksum are in [ASSET-CREDITS.md](ASSET-CREDITS.md). Notes on how the model is grouped are in [docs/model.md](docs/model.md).

## Layout

```
index.html          study
progress/           build log
credits/            credits page
src/                scene, materials, interaction
public/models/      the GLB used by the viewer
public/references/  iFixit reference photographs
```
