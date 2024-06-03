export const EXTENSION_VERSION = "2.1.9";
export const ACCEPT_ONLY_HTTPS = true;

export const SUPERSET_AGGREGATIONS_LIST = [
  "CNT",
  "SUM",
  "AVG",
  "MEAN",
  "MIN",
  "MAX",
  "STDDEV",
  "COUNT",
  "STDDEV",
  "STDDEV_POP",
  "VARIANCE",
  "VAR",
  "VARIANCE_POP",
  "VAR_POP",
  "VAR_SAMP",
  "VARIANCE_SAMP",
  "COV",
  "COVAR",
  "COVARIANCE",
  "COVAR_POP",
  "COVAR_SAMP",
];

export const RENDER_TYPE_LABELS = {
  heatmap: "Heatmap",
  raster: "Feature",
  cb_raster: "Classbreak",
};

export const DATA_TYPE_LABELS = {
  point: "Point",
  geo: "Geometry",
};

export const SCHEMA_BLACKLIST = [
  "ki_catalog",
  "pg_catalog",
  "sys_sql_mv_members",
  "sys_security",
  "sys_sql_temp",
  "SYSTEM",
  "information_schema",
  "sys_temp",
];

export const CURSOR_FREEHAND_DRAW = "CURSOR_FREEHAND_DRAW";
export const CURSOR_INFO = "CURSOR_INFO";

export const DEMO_MODE_ENABLED = "enabled";
export const DEMO_MODE_DISABLED = "disabled";
export const DEMO_MODES = {
  [DEMO_MODE_ENABLED]: "Enabled",
  [DEMO_MODE_DISABLED]: "Disabled",
};
export const DRAW_TYPE_POLYGON = "polygon";
export const DRAW_TYPE_FREEHAND = "freehand";
export const DRAW_TYPE_UNDO = "undo";

export const FILTERING_MODE_FILTER = "filter";
export const FILTERING_MODE_SELECTION = "selection";
export const FILTERING_MODES = {
  [FILTERING_MODE_FILTER]: "Filter",
  [FILTERING_MODE_SELECTION]: "Selection",
};

export const DEFAULT_COLORMAP = "jet";
export const DEFAULT_FILL_COLOR = "4a00e0";
export const DEFAULT_BORDER_COLOR = "ca2c92";
export const DEFAULT_BLUR_RADIUS = "2";
export const DEFAULT_HEATMAP_ATTR = "";
export const DEFAULT_POINT_SIZE = "2";
export const DEFAULT_WIDTH = "1";
export const DEFAULT_OPACITY = 90;

export const OUTBOUND_RANGE_FILTER_ENABLED = false;

export const WMS_PARAMS = {
  SERVICE: "WMS",
  VERSION: "1.3.0",
  REQUEST: "GetMap",
  FORMAT: "image/png",
  TRANSPARENT: "true",
  DOPOINTS: "true",
  DOSHAPES: "true",
  DOTRACKS: "true",
  BLUR_RADIUS: DEFAULT_BLUR_RADIUS,
  POINTSIZES: DEFAULT_POINT_SIZE,
  POINTSHAPES: "circle",
  SRS: "EPSG:3857",
  CRS: "EPSG:3857",
  USE_POINT_RENDERER: "true",
  COLORMAP: DEFAULT_COLORMAP,
  POINTCOLORS: DEFAULT_FILL_COLOR,
  SHAPELINECOLORS: DEFAULT_BORDER_COLOR,
  SHAPEFILLCOLORS: DEFAULT_FILL_COLOR,
  SHAPELINEWIDTHS: DEFAULT_WIDTH,
  TRACKHEADCOLORS: DEFAULT_FILL_COLOR,
  TRACKHEADSIZES: "1",
  TRACKMARKERCOLORS: DEFAULT_FILL_COLOR,
  TRACKLINECOLORS: DEFAULT_BORDER_COLOR,
  TRACKLINEWIDTHS: DEFAULT_WIDTH,
  ANTIALIASING: "true",
  ORDER_LAYERS: "false",
  CB_DELIMITER: "|",
};

export const MAP_CLICK_PIXEL_RADIUS = 10;

export const INFO_MODAL_FETCH_LIMIT = 100;
export const INFO_MODAL_MAX_CONTENT_LENGTH = 64;
export const INFO_MODAL_MAX_COLUMNS_TO_SHOW = 70;

export const MAPBOX_ACCESS_TOKEN = "";

export const COLORMAPS = [
  "viridis",
  "inferno",
  "plasma",
  "magma",
  "Blues",
  "BuGn",
  "BuPu",
  "GnBu",
  "Greens",
  "Greys",
  "Oranges",
  "OrRd",
  "PuBu",
  "PuBuGn",
  "PuRd",
  "Purples",
  "RdPu",
  "Reds",
  "YlGn",
  "YlGnBu",
  "YlOrBr",
  "YlOrRd",
  "afmhot",
  "autumn",
  "bone",
  "cool",
  "copper",
  "gist_heat",
  "gray",
  "gist_gray",
  "gist_yarg",
  "binary",
  "hot",
  "pink",
  "spring",
  "summer",
  "winter",
  "BrBG",
  "bwr",
  "coolwarm",
  "PiYG",
  "PRGn",
  "PuOr",
  "RdBu",
  "RdGy",
  "RdYlBu",
  "RdYlGn",
  "Spectral",
  "seismic",
  "Accent",
  "Dark2",
  "Paired",
  "Pastel1",
  "Pastel2",
  "Set1",
  "Set2",
  "Set3",
  "gist_earth",
  "terrain",
  "ocean",
  "gist_stern",
  "brg",
  "CMRmap",
  "cubehelix",
  "gnuplot",
  "gnuplot2",
  "gist_ncar",
  "spectral",
  "nipy_spectral",
  "jet",
  "rainbow",
  "gist_rainbow",
  "hsv",
  "flag",
  "prism",
].sort(function (a, b) {
  return a.toLowerCase().localeCompare(b.toLowerCase());
});

const DEMO_API_USERNAME = "";
const DEMO_API_PASSWORD = "";

export const DEMO_DATASOURCES = [
  {
    name: "nyctaxi [DEMO]",
    table: {
      name: "nyctaxi",
      schema: "tableau_ext",
      columns: [
        { name: "vendor_id", label: "Vendor Id", type: "string" },
        { name: "pickup_datetime", label: "Pickup Datetime", type: "date" },
        { name: "dropoff_datetime", label: "Dropoff Datetime", type: "date" },
        { name: "passenger_count", label: "Passenger Count", type: "number" },
        { name: "trip_distance", label: "Trip Distance", type: "number" },
        { name: "pickup_longitude", label: "Pickup Longitude", type: "number" },
        { name: "pickup_latitude", label: "Pickup Latitude", type: "number" },
        { name: "rate_code_id", label: "Rate Code Id", type: "string" },
        {
          name: "store_and_fwd_flag",
          label: "Store And Fwd Flag",
          type: "string",
        },
        {
          name: "dropoff_longitude",
          label: "Dropoff Longitude",
          type: "number",
        },
        { name: "dropoff_latitude", label: "Dropoff Latitude", type: "number" },
        { name: "payment_type", label: "Payment Type", type: "string" },
        { name: "fare_amount", label: "Fare Amount", type: "number" },
        { name: "surcharge", label: "Surcharge", type: "number" },
        { name: "mta_tax", label: "Mta Tax", type: "number" },
        { name: "tip_amount", label: "Tip Amount", type: "number" },
        { name: "tolls_amount", label: "Tolls Amount", type: "number" },
        { name: "total_amount", label: "Total Amount", type: "number" },
        { name: "cab_type", label: "Cab Type", type: "string" },
      ],
    },
    apiUrl: "https://demo.kinetica.com/tableaumap",
    username: DEMO_API_USERNAME,
    password: DEMO_API_PASSWORD,
  },
  {
    name: "counties [DEMO]",
    table: {
      name: "counties",
      schema: "tableau_ext",
      columns: [
        { name: "WKT", label: "WKT" },
        { name: "STATEFP", label: "Statefp" },
        { name: "COUNTYFP", label: "Countyfp" },
        { name: "COUNTYNS", label: "Countyns" },
        { name: "GEOID", label: "Geoid" },
        { name: "NAME", label: "Name" },
        { name: "NAMELSAD", label: "Namelsad" },
        { name: "LSAD", label: "Lsad" },
        { name: "CLASSFP", label: "Classfp" },
        { name: "MTFCC", label: "Mtfcc" },
        { name: "CSAFP", label: "Csafp" },
        { name: "CBSAFP", label: "Cbsafp" },
        { name: "METDIVFP", label: "Metdivfp" },
        { name: "FUNCSTAT", label: "Funcstat" },
        { name: "ALAND", label: "Aland" },
        { name: "AWATER", label: "Awater" },
        { name: "INTPTLAT", label: "Intptlat" },
        { name: "INTPTLON", label: "Intptlon" },
      ],
    },
    apiUrl: "https://demo.kinetica.com/tableaumap",
    username: DEMO_API_USERNAME,
    password: DEMO_API_PASSWORD,
  },
  {
    name: "flights [DEMO]",
    table: {
      name: "flights",
      schema: "tableau_ext",
      columns: [
        { name: "TRACKID", label: "Trackid", type: "string" },
        { name: "heading", label: "Heading", type: "number" },
        { name: "from", label: "From", type: "string" },
        { name: "to", label: "To", type: "string" },
        { name: "type", label: "Type", type: "string" },
        { name: "altitude", label: "Altitude", type: "number" },
        { name: "speed", label: "Speed", type: "number" },
        { name: "departed", label: "Departed", type: "string" },
        { name: "eta_time", label: "Eta Time", type: "string" },
        { name: "eta_mins", label: "Eta Mins", type: "number" },
        { name: "route", label: "Route", type: "string" },
        { name: "x", label: "X", type: "number" },
        { name: "y", label: "Y", type: "number" },
        { name: "TIMESTAMP", label: "Timestamp", type: "number" },
      ],
    },
    apiUrl: "https://demo.kinetica.com/tableaumap",
    username: DEMO_API_USERNAME,
    password: DEMO_API_PASSWORD,
  },
];
