import type { FontFamily } from "./types";

/**
 * A curated slice of the Google Fonts library.
 *
 * The live Google Fonts Developer API requires an API key, and Typematch is a
 * static, zero-backend, zero-secret app — so the catalog is vendored instead.
 * Every family here is served by the keyless CSS2 endpoint, which is all the
 * app actually needs to render a pairing. The list covers the families people
 * realistically reach for when picking a product type system, across all five
 * Google Fonts categories.
 */
export const FONT_CATALOG: readonly FontFamily[] = Object.freeze([
  // --- Sans-serif ---
  { family: "Inter", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Roboto", category: "sans-serif", weights: [300, 400, 500, 700, 900] },
  { family: "Open Sans", category: "sans-serif", weights: [400, 500, 600, 700, 800] },
  { family: "Lato", category: "sans-serif", weights: [300, 400, 700, 900] },
  { family: "Montserrat", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Poppins", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Nunito", category: "sans-serif", weights: [300, 400, 600, 700, 800] },
  { family: "Nunito Sans", category: "sans-serif", weights: [300, 400, 600, 700, 800] },
  { family: "Work Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Rubik", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Karla", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Manrope", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "DM Sans", category: "sans-serif", weights: [400, 500, 700] },
  { family: "Public Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Source Sans 3", category: "sans-serif", weights: [300, 400, 600, 700, 900] },
  { family: "Figtree", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Outfit", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Plus Jakarta Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Raleway", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Mulish", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Barlow", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Cabin", category: "sans-serif", weights: [400, 500, 600, 700] },
  { family: "Assistant", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Heebo", category: "sans-serif", weights: [300, 400, 500, 700, 900] },
  { family: "Oswald", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Fira Sans", category: "sans-serif", weights: [300, 400, 500, 700, 900] },
  { family: "PT Sans", category: "sans-serif", weights: [400, 700] },
  { family: "Noto Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700, 900] },
  { family: "Ubuntu", category: "sans-serif", weights: [300, 400, 500, 700] },
  { family: "Quicksand", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Josefin Sans", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Archivo", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Space Grotesk", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Sora", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Lexend", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Urbanist", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Chivo", category: "sans-serif", weights: [300, 400, 500, 600, 700, 900] },
  { family: "Hanken Grotesk", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Red Hat Display", category: "sans-serif", weights: [400, 500, 600, 700, 900] },
  { family: "Titillium Web", category: "sans-serif", weights: [300, 400, 600, 700, 900] },
  { family: "Overpass", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Asap", category: "sans-serif", weights: [400, 500, 600, 700] },
  { family: "Exo 2", category: "sans-serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Kanit", category: "sans-serif", weights: [300, 400, 500, 600, 700] },
  { family: "Anton", category: "sans-serif", weights: [400] },

  // --- Serif ---
  { family: "Fraunces", category: "serif", weights: [300, 400, 500, 600, 700, 900] },
  { family: "Playfair Display", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  { family: "Merriweather", category: "serif", weights: [300, 400, 700, 900] },
  { family: "Lora", category: "serif", weights: [400, 500, 600, 700] },
  { family: "Source Serif 4", category: "serif", weights: [300, 400, 600, 700, 900] },
  { family: "Libre Baskerville", category: "serif", weights: [400, 700] },
  { family: "EB Garamond", category: "serif", weights: [400, 500, 600, 700, 800] },
  { family: "Crimson Text", category: "serif", weights: [400, 600, 700] },
  { family: "Cormorant Garamond", category: "serif", weights: [300, 400, 500, 600, 700] },
  { family: "PT Serif", category: "serif", weights: [400, 700] },
  { family: "Noto Serif", category: "serif", weights: [300, 400, 500, 600, 700, 900] },
  { family: "Bitter", category: "serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Arvo", category: "serif", weights: [400, 700] },
  { family: "Zilla Slab", category: "serif", weights: [300, 400, 500, 600, 700] },
  { family: "Roboto Slab", category: "serif", weights: [300, 400, 500, 700, 900] },
  { family: "Domine", category: "serif", weights: [400, 500, 600, 700] },
  { family: "Spectral", category: "serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Cardo", category: "serif", weights: [400, 700] },
  { family: "Vollkorn", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  { family: "Bodoni Moda", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  { family: "DM Serif Display", category: "serif", weights: [400] },
  { family: "Instrument Serif", category: "serif", weights: [400] },
  { family: "Newsreader", category: "serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Literata", category: "serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Petrona", category: "serif", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Faustina", category: "serif", weights: [400, 500, 600, 700, 800] },
  { family: "Alegreya", category: "serif", weights: [400, 500, 600, 700, 800, 900] },
  { family: "Libre Caslon Text", category: "serif", weights: [400, 700] },
  { family: "Frank Ruhl Libre", category: "serif", weights: [300, 400, 500, 700, 900] },
  { family: "Rokkitt", category: "serif", weights: [300, 400, 500, 600, 700, 800] },

  // --- Display ---
  { family: "Abril Fatface", category: "display", weights: [400] },
  { family: "Alfa Slab One", category: "display", weights: [400] },
  { family: "Righteous", category: "display", weights: [400] },
  { family: "Lobster", category: "display", weights: [400] },
  { family: "Fredoka", category: "display", weights: [300, 400, 500, 600, 700] },
  { family: "Comfortaa", category: "display", weights: [300, 400, 500, 600, 700] },
  { family: "Bungee", category: "display", weights: [400] },
  { family: "Chewy", category: "display", weights: [400] },
  { family: "Bowlby One", category: "display", weights: [400] },
  { family: "Titan One", category: "display", weights: [400] },
  { family: "Baloo 2", category: "display", weights: [400, 500, 600, 700, 800] },
  { family: "Archivo Black", category: "display", weights: [400] },
  { family: "Ultra", category: "display", weights: [400] },
  { family: "Staatliches", category: "display", weights: [400] },
  { family: "Monoton", category: "display", weights: [400] },
  { family: "Silkscreen", category: "display", weights: [400, 700] },
  { family: "Bebas Neue", category: "display", weights: [400] },

  // --- Handwriting ---
  { family: "Caveat", category: "handwriting", weights: [400, 500, 600, 700] },
  { family: "Dancing Script", category: "handwriting", weights: [400, 500, 600, 700] },
  { family: "Pacifico", category: "handwriting", weights: [400] },
  { family: "Shadows Into Light", category: "handwriting", weights: [400] },
  { family: "Indie Flower", category: "handwriting", weights: [400] },
  { family: "Satisfy", category: "handwriting", weights: [400] },
  { family: "Kalam", category: "handwriting", weights: [300, 400, 700] },
  { family: "Patrick Hand", category: "handwriting", weights: [400] },
  { family: "Permanent Marker", category: "handwriting", weights: [400] },
  { family: "Gloria Hallelujah", category: "handwriting", weights: [400] },

  // --- Monospace ---
  { family: "JetBrains Mono", category: "monospace", weights: [300, 400, 500, 600, 700, 800] },
  { family: "Fira Code", category: "monospace", weights: [300, 400, 500, 600, 700] },
  { family: "IBM Plex Mono", category: "monospace", weights: [300, 400, 500, 600, 700] },
  { family: "Source Code Pro", category: "monospace", weights: [300, 400, 500, 600, 700, 900] },
  { family: "Space Mono", category: "monospace", weights: [400, 700] },
  { family: "Roboto Mono", category: "monospace", weights: [300, 400, 500, 600, 700] },
  { family: "Inconsolata", category: "monospace", weights: [300, 400, 500, 600, 700, 800] },
  { family: "DM Mono", category: "monospace", weights: [300, 400, 500] },
  { family: "Courier Prime", category: "monospace", weights: [400, 700] },
  { family: "Azeret Mono", category: "monospace", weights: [300, 400, 500, 600, 700, 800] },
]);

/** Case-insensitive family lookup. Returns undefined for unknown families. */
export function findFamily(name: string): FontFamily | undefined {
  const needle = name.trim().toLowerCase();
  return FONT_CATALOG.find((f) => f.family.toLowerCase() === needle);
}
