// http://ethanschoonover.com/solarized
const solarized = {
  base03: "#002b36",
  base02: "#073642",
  base01: "#586e75",
  base00: "#657b83",
  base0: "#839496",
  base1: "#93a1a1",
  base2: "#eee8d5",
  base3: "#fdf6e3",
  yellow: "#b58900",
  orange: "#cb4b16",
  red: "#dc322f",
  magenta: "#d33682",
  violet: "#6c71c4",
  blue: "#268bd2",
  cyan: "#2aa198",
  green: "#859900"
}

// Limit to 5 colors used in terminals.
const solzrizedAccents = {
  red: solarized.red,
  green: solarized.green,
  yellow: solarized.yellow,
  blue: solarized.blue,
  magenta: solarized.magenta,
  cyan: solarized.cyan
}

export default {
  solarizedLight: {
    backgroundColor: solarized.base3,
    backgroundHighlightColor: solarized.base2,
    primaryColor: solarized.base00,
    secondaryColor: solarized.base1,
    ...solzrizedAccents
  },
  solarizedDark: {
    backgroundColor: solarized.base03,
    backgroundHighlightColor: solarized.base02,
    primaryColor: solarized.base0,
    secondaryColor: solarized.base01,
    ...solzrizedAccents
  }
}
