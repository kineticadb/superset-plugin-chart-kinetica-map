import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

import { getConsole } from "../util";

const console = getConsole();

const createColorInterpolator = (colors) => {
  const n = colors.length;

  // Define the color stops and their positions along the scale
  const stops = colors.map((color, i) => {
    return { color: d3.rgb(color), position: i / (n - 1) };
  });

  // Return the interpolation function
  return (t) => {
    // Interpolate between the color stops based on the input value (t)
    const i =
      d3.bisect(
        stops.map((s) => s.position),
        t
      ) - 1;
    if (i === stops.length - 1) {
      return stops[i].color.toString();
    }
    const color = d3.interpolate(
      stops[i].color,
      stops[i + 1].color
    )((t - stops[i].position) / (stops[i + 1].position - stops[i].position));
    return color.toString();
  };
};

// https://matplotlib.org/stable/tutorials/colors/colormaps.html
const scale = {
  viridis: d3.scaleSequential(d3.interpolateViridis),
  inferno: d3.scaleSequential(d3.interpolateInferno),
  plasma: d3.scaleSequential(d3.interpolatePlasma),
  magma: d3.scaleSequential(d3.interpolateMagma),
  Blues: d3.scaleSequential(d3.interpolateBlues),
  BuGn: d3.scaleSequential(d3.interpolateBuGn),
  BuPu: d3.scaleSequential(d3.interpolateBuPu),
  GnBu: d3.scaleSequential(d3.interpolateGnBu),
  Greens: d3.scaleSequential(d3.interpolateGreens),
  Greys: d3.scaleSequential(d3.interpolateGreys),
  Oranges: d3.scaleSequential(d3.interpolateOranges),
  OrRd: d3.scaleSequential(d3.interpolateOrRd),
  PuBu: d3.scaleSequential(d3.interpolatePuBu),
  PuBuGn: d3.scaleSequential(d3.interpolatePuBuGn),
  PuRd: d3.scaleSequential(d3.interpolatePuRd),
  Purples: d3.scaleSequential(d3.interpolatePurples),
  RdPu: d3.scaleSequential(d3.interpolateRdPu),
  Reds: d3.scaleSequential(d3.interpolateReds),
  YlGn: d3.scaleSequential(d3.interpolateYlGn),
  YlGnBu: d3.scaleSequential(d3.interpolateYlGnBu),
  YlOrBr: d3.scaleSequential(d3.interpolateYlOrBr),
  YlOrRd: d3.scaleSequential(d3.interpolateYlOrRd),
  afmhot: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#0f0000",
      "#390000",
      "#610000",
      "#8a0f00",
      "#b13700",
      "#db6100",
      "#db8a10",
      "#dbb237",
      "#dbdb62",
      "#dbdb8b",
      "#dbdbb2",
    ])
  ),
  autumn: d3.scaleSequential(
    createColorInterpolator([
      "#db0000",
      "#db0000",
      "#db1000",
      "#db2400",
      "#db3800",
      "#db4b00",
      "#db6100",
      "#db7600",
      "#db8a00",
      "#db9f00",
      "#dbb300",
      "#dbc700",
    ])
  ),
  bone: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#000000",
      "#090917",
      "#1b1b2f",
      "#2e2e49",
      "#3f435e",
      "#515c6f",
      "#627481",
      "#748c92",
      "#87a6a5",
      "#a3b7b7",
      "#bec8c8",
    ])
  ),
  cool: d3.scaleSequential(d3.interpolateCool),
  copper: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#000000",
      "#190600",
      "#321604",
      "#4a260f",
      "#633518",
      "#7e4623",
      "#97562e",
      "#af6537",
      "#ca7642",
      "#db864b",
      "#db9556",
    ])
  ),
  gist_heat: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#030000",
      "#230000",
      "#410000",
      "#5f0000",
      "#7d0000",
      "#9c0000",
      "#bb0d00",
      "#d93500",
      "#db5f00",
      "#db8631",
      "#dbaf83",
    ])
  ),
  gray: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#000000",
      "#0f0f0f",
      "#232323",
      "#383838",
      "#4b4b4b",
      "#616161",
      "#767676",
      "#8b8b8b",
      "#9f9f9f",
      "#b3b3b3",
      "#c8c8c8",
    ])
  ),
  gist_gray: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#0d0d0d",
      "#1a1a1a",
      "#262626",
      "#333333",
      "#404040",
      "#4d4d4d",
      "#595959",
      "#666666",
      "#737373",
      "#808080",
      "#8c8c8c",
      "#999999",
      "#a6a6a6",
      "#b2b2b2",
      "#bfbfbf",
      "#cccccc",
      "#d9d9d9",
      "#e5e5e5",
      "#f2f2f2",
      "#ffffff",
    ])
  ),
  gist_yarg: d3.scaleSequential(
    createColorInterpolator([
      "#dbdbdb",
      "#c7c7c7",
      "#b3b3b3",
      "#9f9f9f",
      "#8a8a8a",
      "#767676",
      "#606060",
      "#4b4b4b",
      "#383838",
      "#232323",
      "#0e0e0e",
      "#000000",
    ])
  ),
  binary: d3.scaleSequential(
    createColorInterpolator([
      "#dbdbdb",
      "#c7c7c7",
      "#b3b3b3",
      "#9f9f9f",
      "#8a8a8a",
      "#767676",
      "#606060",
      "#4b4b4b",
      "#383838",
      "#232323",
      "#0e0e0e",
      "#000000",
    ])
  ),
  hot: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#250000",
      "#5a0000",
      "#8f0000",
      "#c60000",
      "#db0600",
      "#db3c00",
      "#db7300",
      "#dba700",
      "#dbdb00",
      "#dbdb38",
      "#dbdb8c",
    ])
  ),
  pink: d3.scaleSequential(
    createColorInterpolator([
      "#030000",
      "#421f1f",
      "#643737",
      "#804949",
      "#985a5a",
      "#a67167",
      "#ae8a73",
      "#b6a17f",
      "#beb48a",
      "#c5c593",
      "#cdcdae",
      "#d4d4c6",
    ])
  ),
  spring: d3.scaleSequential(
    createColorInterpolator([
      "#db00da",
      "#db00c6",
      "#db10b1",
      "#db249e",
      "#db388a",
      "#db4b76",
      "#db6061",
      "#db744d",
      "#db8939",
      "#db9d25",
      "#dbb111",
      "#dbc500",
    ])
  ),
  summer: d3.scaleSequential(
    createColorInterpolator([
      "#006148",
      "#006b48",
      "#107648",
      "#247f48",
      "#388a48",
      "#4b9348",
      "#619e48",
      "#76a848",
      "#8ab248",
      "#9ebd48",
      "#b1c648",
      "#c6d048",
    ])
  ),
  winter: d3.scaleSequential(
    createColorInterpolator([
      "#0000db",
      "#0000d1",
      "#0010c6",
      "#0024bd",
      "#0038b2",
      "#004ba8",
      "#00619e",
      "#007693",
      "#008a8a",
      "#009f7f",
      "#00b375",
      "#00c76b",
    ])
  ),
  BrBG: d3.scaleSequential(d3.interpolateBrBG),
  bwr: d3.scaleSequential(
    createColorInterpolator([
      "#0000db",
      "#1111db",
      "#3939db",
      "#6161db",
      "#8a8adb",
      "#b1b1db",
      "#dadadb",
      "#dbb4b4",
      "#db8c8c",
      "#db6363",
      "#db3b3b",
      "#db1313",
    ])
  ),
  coolwarm: d3.scaleSequential(
    createColorInterpolator([
      "#1e2f9f",
      "#3652bb",
      "#5172cf",
      "#6c8ed9",
      "#8aa5d9",
      "#a4b3cf",
      "#bababb",
      "#ccac9b",
      "#d3967c",
      "#d17a5d",
      "#c4573f",
      "#af2d22",
    ])
  ),
  PiYG: d3.scaleSequential(d3.interpolatePiYG),
  PRGn: d3.scaleSequential(d3.interpolatePRGn),
  PuOr: d3.scaleSequential(d3.interpolatePuOr),
  RdBu: d3.scaleSequential(d3.interpolateRdBu),
  RdGy: d3.scaleSequential(d3.interpolateRdGy),
  RdYlBu: d3.scaleSequential(d3.interpolateRdYlBu),
  RdYlGn: d3.scaleSequential(d3.interpolateRdYlGn),
  Spectral: d3.scaleSequential(d3.interpolateSpectral),
  seismic: d3.scaleSequential(
    createColorInterpolator([
      "#00002f",
      "#000068",
      "#0000a3",
      "#0000db",
      "#3838db",
      "#8888db",
      "#dbd9d9",
      "#db8989",
      "#db3838",
      "#db0000",
      "#b30000",
      "#890000",
    ])
  ),
  Accent: d3.scaleSequential(
    createColorInterpolator([
      "#60a760",
      "#60a760",
      "#9d8eb2",
      "#9d8eb2",
      "#d99f67",
      "#dbdb79",
      "#dbdb79",
      "#1c4e8f",
      "#cd0060",
      "#cd0060",
      "#9e3e00",
      "#484848",
    ])
  ),
  Dark2: d3.scaleSequential(
    createColorInterpolator([
      "#007e59",
      "#007e59",
      "#b74200",
      "#b74200",
      "#575292",
      "#c40e6b",
      "#c40e6b",
      "#488603",
      "#c38b00",
      "#c38b00",
      "#865802",
      "#484848",
    ])
  ),
  Paired: d3.scaleSequential(
    createColorInterpolator([
      "#86acc0",
      "#045a93",
      "#045a93",
      "#91bd6b",
      "#178011",
      "#d77a79",
      "#c00001",
      "#d99e51",
      "#db6000",
      "#a891b4",
      "#4c217a",
      "#dbdb79",
    ])
  ),
  Pastel1: d3.scaleSequential(
    createColorInterpolator([
      "#d7938e",
      "#d7938e",
      "#92abc0",
      "#aac8a4",
      "#aac8a4",
      "#bca9c1",
      "#dab786",
      "#dbdbaa",
      "#dbdbaa",
      "#c2b69c",
      "#d9b8c9",
      "#cfcfcf",
    ])
  ),
  Pastel2: d3.scaleSequential(
    createColorInterpolator([
      "#92bfab",
      "#92bfab",
      "#d9ab8c",
      "#a9b3c5",
      "#a9b3c5",
      "#d1a8c1",
      "#d1a8c1",
      "#c3d2a7",
      "#dbcf8e",
      "#dbcf8e",
      "#cebfaa",
      "#aaaaaa",
    ])
  ),
  Set1: d3.scaleSequential(
    createColorInterpolator([
      "#c10001",
      "#c10001",
      "#1b5f97",
      "#308f2e",
      "#308f2e",
      "#783183",
      "#db6000",
      "#dbdb17",
      "#dbdb17",
      "#86390d",
      "#d4629e",
      "#797979",
    ])
  ),
  Set2: d3.scaleSequential(
    createColorInterpolator([
      "#48a185",
      "#48a185",
      "#d86e45",
      "#6e80a9",
      "#6e80a9",
      "#c46ba2",
      "#c46ba2",
      "#86b637",
      "#dbb714",
      "#dbb714",
      "#c2a375",
      "#929292",
    ])
  ),
  Set3: d3.scaleSequential(
    createColorInterpolator([
      "#6eb1a6",
      "#6eb1a6",
      "#dbdb92",
      "#9d99b8",
      "#d76154",
      "#6190b1",
      "#d99345",
      "#92bc4b",
      "#d8abc2",
      "#b7b7b7",
      "#9b619c",
      "#aac8a4",
    ])
  ),

  gist_earth: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#0e2276",
      "#1d517a",
      "#2b747e",
      "#37886d",
      "#419552",
      "#64a14d",
      "#8dab56",
      "#b0b55c",
      "#bea763",
      "#d3af91",
      "#ecd3cd",
    ])
  ),

  terrain: d3.scaleSequential(
    createColorInterpolator([
      "#31359b",
      "#1470d6",
      "#00a4dc",
      "#08cd67",
      "#5dde78",
      "#b5f08a",
      "#faf896",
      "#cec07e",
      "#a38a67",
      "#87655e",
      "#b39d99",
      "#ddd3d1",
    ])
  ),

  ocean: d3.scaleSequential(
    createColorInterpolator([
      "#007f00",
      "#005e16",
      "#003d2c",
      "#001e41",
      "#000257",
      "#00226c",
      "#004382",
      "#006498",
      "#0883ad",
      "#4aa4c3",
      "#8cc5d9",
      "#cbe5ee",
    ])
  ),
  gist_stern: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#ed0c1a",
      "#c31933",
      "#83274e",
      "#41346a",
      "#414082",
      "#504f9f",
      "#5c5bb8",
      "#6869d3",
      "#7676ee",
      "#8283ed",
      "#9191b7",
      "#9e9e7c",
      "#adab44",
      "#bab80b",
      "#c6c62a",
      "#d3d35b",
      "#e1e08e",
      "#eeedbf",
    ])
  ),
  brg: d3.scaleSequential(
    createColorInterpolator([
      "#0000ff",
      "#2a00d5",
      "#5600a9",
      "#80007f",
      "#aa0055",
      "#d3002b",
      "#fe0100",
      "#d32b00",
      "#aa5500",
      "#7e8100",
      "#54ab00",
      "#29d500",
    ])
  ),
  CMRmap: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#191954",
      "#332695",
      "#4d26be",
      "#812f92",
      "#bd375f",
      "#fd4224",
      "#ed6c0b",
      "#e5980a",
      "#e5c11f",
      "#e5db65",
      "#efefb3",
    ])
  ),
  cubehelix: d3.scaleSequential(d3.interpolateCubehelixDefault),
  gnuplot: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#49007e",
      "#6801de",
      "#7f04fe",
      "#9309dc",
      "#a41280",
      "#b42000",
      "#c33300",
      "#d04c00",
      "#dd6c00",
      "#e99400",
      "#f4c700",
    ])
  ),
  gnuplot2: d3.scaleSequential(
    createColorInterpolator([
      "#000004",
      "#000058",
      "#0000b0",
      "#0300ff",
      "#4800ff",
      "#8a01fd",
      "#cb2bd3",
      "#ff57a7",
      "#ff817d",
      "#ffad51",
      "#ffd727",
      "#ffff11",
    ])
  ),
  gist_ncar: d3.scaleSequential(
    createColorInterpolator([
      "#000080",
      "#00288a",
      "#00caff",
      "#00fab0",
      "#2cec00",
      "#7df803",
      "#dfff1b",
      "#ffd203",
      "#ff5f03",
      "#ff006a",
      "#a52cfe",
      "#f1a4f3",
    ])
  ),
  spectral: d3.scaleSequential(d3.interpolateSpectral),
  nipy_spectral: d3.scaleSequential(
    createColorInterpolator([
      "#000000",
      "#810092",
      "#0000bd",
      "#0077dd",
      "#00a5b7",
      "#00a352",
      "#00be00",
      "#00f700",
      "#d3f600",
      "#ffc500",
      "#ff1400",
      "#d40000",
    ])
  ),
  jet: d3.scaleSequential(
    createColorInterpolator([
      "#00007F",
      "#0000FF",
      "#007FFF",
      "#00FFFF",
      "#FFFF00",
      "#FF0000",
      "#7F0000",
    ])
  ),
  rainbow: d3.scaleSequential(d3.interpolateRainbow),
  gist_rainbow: d3.scaleSequential(
    createColorInterpolator([
      "#ff0028",
      "#ff4800",
      "#ffbf00",
      "#cdff00",
      "#5bff00",
      "#00ff15",
      "#00ff8b",
      "#00fffc",
      "#008fff",
      "#0017ff",
      "#5a00ff",
      "#cc00ff",
    ])
  ),
  hsv: d3.scaleSequential(
    createColorInterpolator([
      "#db0000",
      "#db6200",
      "#d7d600",
      "#64db00",
      "#00db00",
      "#00db56",
      "#00dbcd",
      "#006cdb",
      "#0000db",
      "#4e00db",
      "#bf00db",
      "#db0079",
    ])
  ),
  flag: d3.scaleSequential(
    createColorInterpolator(["#000080", "#800000", "#ffffff"])
  ),
  prism: d3.scaleSequential(
    createColorInterpolator([
      "#ff0000",
      "#9900d7",
      "#2e00ff",
      "#0056c3",
      "#10c52a",
      "#9eff00",
      "#fff600",
      "#ff9d00",
      "#ff0000",
      "#ff0056",
      "#8f00e1",
      "#0700ff",
    ])
  ),
};

export const gradient = (colormap, id, returnSVGOnly = false) => {
  if (!(colormap in scale)) {
    console.log("Colormap " + colormap + " not found. Skipping.");
    return;
  }

  let colorScale = scale[colormap].domain([0, 1]);

  let svg;
  if (returnSVGOnly) {
    svg = d3.create("svg").attr("width", 150).attr("height", 17);
  } else {
    d3.select("#gradient-" + id)
      .selectAll("svg")
      .remove();
    svg = d3
      .select("#gradient-" + id)
      .append("svg")
      .attr("width", 150)
      .attr("height", 17);
  }

  let x = d3.scaleLinear().range([0, 150]).domain([0, 1]);

  svg
    .append("g")
    .selectAll("rect")
    .data(d3.range(0, 1.01, 0.01))
    .enter()
    .append("rect")
    .attr("x", function (d) {
      return x(d);
    })
    .attr("y", 5)
    .attr("width", 4)
    .attr("height", 20)
    .style("fill", function (d) {
      return colorScale(d);
    });

  if (returnSVGOnly) {
    return svg.node();
  }
};

export const ColorGradient = (props) => {
  const [divExists, setDivExists] = useState(false);
  const divRef = useRef(null);
  const { colormap, id } = props;

  useEffect(() => {
    if (divRef.current) {
      setDivExists(true);
    }
  }, [divRef.current]);

  useEffect(() => {
    if (divExists) {
      console.log("ColorGradient: useEffect: divExists:", props);
      gradient(colormap, id);
    }
  }, [divExists, colormap]);

  // render starts here
  return (
    <>
      <div id={`gradient-${id}`} ref={divRef}></div>
    </>
  );
};
