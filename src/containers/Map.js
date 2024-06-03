// @ts-nocheck
import { fromExtent } from "ol/geom/Polygon";
import { unByKey } from "ol/Observable";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { Button, Badge } from "react-bootstrap";
import { Stack } from "react-bootstrap-icons";
import { debounce } from "debounce";
import OlMap from "ol/Map";
import OlView from "ol/View";
import { defaults as DefaultControls, ZoomSlider, ScaleLine } from "ol/control";
import OlLayerTile from "ol/layer/Tile";
import Group from "ol/layer/Group";
import OlSourceOSM from "ol/source/OSM";
import OlSourceXYZ from "ol/source/XYZ";
import OlOverlay from "ol/Overlay";
import { transform, transformExtent } from "ol/proj";
import { fromLonLat } from "ol/proj";
import { WKT } from "ol/format";
import GPUdb from "../vendor/GPUdb";
import Info from "./Info";
import MapSettings from "./MapSettings";
import { DrawButton, DrawLayer, OlDrawer } from "./Draw";
import { ViewportButton } from "./ViewportButton";
import MissingParameters from "./MissingParameters";
import { KWmsOlLayer } from "./KWmsOlLayer";
import {
  buildExpression,
  thousands_separators,
  handleFilters,
  getConsole,
} from "../util";
import {
  DEFAULT_COLORMAP,
  DEFAULT_FILL_COLOR,
  DEFAULT_BORDER_COLOR,
  DEFAULT_BLUR_RADIUS,
  DEFAULT_POINT_SIZE,
  DEFAULT_OPACITY,
  MAP_CLICK_PIXEL_RADIUS,
  DEMO_MODE_DISABLED,
  DEMO_MODE_ENABLED,
  DEMO_DATASOURCES,
  FILTERING_MODE_SELECTION,
  FILTERING_MODE_FILTER,
  OUTBOUND_RANGE_FILTER_ENABLED,
  MAPBOX_ACCESS_TOKEN,
  CURSOR_INFO,
  CURSOR_FREEHAND_DRAW,
  SUPERSET_AGGREGATIONS_LIST,
} from "../constants";
import Geocoder from "ol-geocoder";
import { LayersPanel } from "./LayersPanel";
import { TwbContext } from "./TwbContext";
import "ol/ol.css";

let unregisterHandlerFunctions = [];
let multimapUnregisterHandlerFunctions = [];
let savedWktValue = "";
let ignoreResetCount = 0;
const cachedSettings = [];
let globalView = "";

const console = getConsole();

function Map(props) {
  const {
    mapId = "map",
    reloadConfig,
    handleDataMask,
    resetDataMask,
    updateControlPanel,
    superset,
    width: chartWidth,
    height: chartHeight,
  } = props;
  const reloadConfigRef = useRef(reloadConfig);

  const [areParametersMissing, setAreParametersMissing] = useState(false);
  const [selectedDatasource, setSelectedDatasource] = useState(undefined);
  const [datasources, setDatasources] = useState([]);
  const [endpoint, setEndpoint] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [cursorMode, setCursorMode] = useState(CURSOR_INFO);

  // index: -1 => no layer - only show table. 0 => base layer. 1 => first layer
  const [selectedLayer, setSelectedLayer] = useState({ op: "none", index: 0 });

  const [mapLayers, setMapLayers] = useState([
    {
      id: "0000",
      label: "Base Layer",
      visible: true,
      opacity: DEFAULT_OPACITY,
      kineticaSettings: {
        baseTable: "",
        view: "",
        renderType: "heatmap",
        dataType: "point",
        longitude: "",
        latitude: "",
        wkt: "",
        blurRadius: DEFAULT_BLUR_RADIUS,
        heatmapAttr: null,
        pointSize: DEFAULT_POINT_SIZE,
        colormap: DEFAULT_COLORMAP,
        fillColor: DEFAULT_FILL_COLOR,
        borderColor: DEFAULT_BORDER_COLOR,
        width: chartWidth,
        cbStyleOptions: {
          column: "",
          binCount: 4,
          allStyleColors: null,
          allStyleRanges: null,
          allStyleShapes: null,
          allStyleSizes: null,
          colorRamp: [
            "fd191f",
            "e06100",
            "bc8500",
            "949e00",
            "6aaf35",
            "34b36a",
            "029496",
            "00b0b2",
            "00a2d0",
            "008ef5",
          ],
          otherColor: "888888",
          selectedTheme: "Spectral",
          orderClasses: null,
        },
      },
    },
  ]);

  const [width, setWidth] = useState(chartWidth);
  const [height, setHeight] = useState(chartHeight);

  // TODO: Remove drawLayer state as the state never changes
  const [drawLayer, setDrawLayer] = useState(DrawLayer);
  const [drawType, setDrawType] = useState("");
  const [drawUndo, setDrawUndo] = useState(false);
  const [drawnFeatures, setDrawnFeatures] = useState([]);

  const [filterByViewportMode, setFilterByViewportMode] = useState(false);
  const [viewportKey, setViewportKey] = useState(null);
  const [handleMapClickKey, setHandleMapClickKey] = useState(null);

  const [gpudb, setGpudb] = useState(undefined);
  const [filters, setFilters] = useState([]);
  const [basemapUrl, setBasemapUrl] = useState("");
  const [demoMode, setDemoMode] = useState(DEMO_MODE_DISABLED);
  const [center, setCenter] = useState(fromLonLat([0, 0]));
  const [zoom, setZoom] = useState(2);
  const [count, setCount] = useState(-1);

  const [infoCoordinate, setInfoCoordinate] = useState(undefined);
  const [infoTable, setInfoTable] = useState(undefined);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState({});
  const [showLayersPanel, setShowLayersPanel] = useState(true);
  const [mapboxApiKey, setMapboxApiKey] = useState("");
  const [xyzTileServiceTemplate, setXyzTileServiceTemplate] = useState("");
  const [isConfigLoaded, setIsConfigLoaded] = useState(false);
  const [binRanges, setBinRanges] = useState({});
  const [calculatedFields, setCalculatedFields] = useState({});
  const [twbFile, setTwbFile] = useState(null);
  const inputFile = useRef(null);
  const [sqlBase, setSqlBase] = useState(undefined);
  const [layersFilterText, setLayersFilterText] = useState("");
  const [hasRegisteredForMultimap, setHasRegisteredForMultimap] =
    useState(false);
  const [setResetCount, setSetResetCount] = useState(0);
  const updateParameterDelay = useRef();

  const componentName = `map_${mapId}`;

  const [map] = useState(
    new OlMap({
      zoomControl: false,
      target: undefined,
      layers: [
        new OlLayerTile({
          name: "OSM",
          source: new OlSourceOSM({
            crossOrigin: "anonymous",
            wrapX: true,
            noWrap: false,
          }),
        }),
        drawLayer,
      ],
      overlays: [],
      controls: DefaultControls().extend([
        // new Geocoder("nominatim", {
        //   provider: "osm",
        //   lang: "en-US",
        //   placeholder: "Search for location",
        //   limit: 5,
        //   debug: false,
        //   autoComplete: true,
        //   keepOpen: false,
        // }),
        new ZoomSlider(),
        new ScaleLine(),
      ]),
      pixelRatio: 1.0,
      view: new OlView({
        center,
        zoom,
      }),
    })
  );

  const updateDimension = (width, height) => {
    setWidth(width);
    setHeight(height);
    setTimeout(() => {
      map.updateSize();
    }, 25);
  };

  window.onresize = useCallback(
    _ => {
      updateDimension(chartWidth, chartHeight);
    },
    [chartWidth, chartHeight],
  );

  useEffect(() => {
    updateDimension(chartWidth, chartHeight);
  }, [chartWidth, chartHeight]);

  const asyncSaveSettings = (callback) => {
    if (!saving && superset.extensions.settings) {
      setSaving(true);
      const now = new Date().getTime();

      // copy the cached settings and clear the cache
      const cachedSettingsCopy = cachedSettings.slice();
      const numSettings = cachedSettings.length;
      cachedSettings.length = 0;

      while (cachedSettingsCopy.length > 0) {
        const setting = cachedSettingsCopy.shift();
        const name = setting.name;
        const value = setting.value;
        const op = setting.op;

        console.log("name: " + name + ", value: " + value + ", op: " + op);
        if (op === "set") {
          superset.extensions.settings.set(name, value);
        } else if (op === "erase") {
          superset.extensions.settings.erase(name);
        }
      }

      superset.extensions.settings
        .saveAsync()
        .then(() => {
          console.log(
            "saved settings: " +
              numSettings +
              " in " +
              (new Date().getTime() - now) +
              "ms"
          );
          setSaving(false);
          // if callback is defined, call it
          if (callback) {
            callback();
          }
        })
        .catch((error) => {
          console.error(error);
        });
    }
  };

  const asyncSaveViewport = debounce((center, zoom) => {
    cachedSettings.push({
      name: "center",
      value: JSON.stringify(center),
      op: "set",
    });
    cachedSettings.push({
      name: "zoom",
      value: zoom,
      op: "set",
    });
    console.log("asyncSaveViewport --> center: " + center + ", zoom: " + zoom);
  }, 1000);

  const asyncSaveFilterByViewportMode = debounce((mode) => {
    cachedSettings.push({
      name: "filterByViewportMode",
      value: mode,
      op: "set",
    });
    console.log("asyncSaveFilterByViewportMode --> mode: " + mode);
  }, 1000);

  const setError = (componentName, errorMessage, func) => {
    if (errorMessage === "") {
      delete errorMsg[componentName];
      console.log("setError --> " + componentName + ": CLEARED");
    } else {
      console.error("setError --> " + componentName + ": " + errorMessage);
      if (func) {
        setErrorMsg((prevState) => ({
          ...prevState,
          [componentName]: { text: errorMessage },
          ["func"]: func,
        }));
      } else {
        setErrorMsg((prevState) => ({
          ...prevState,
          [componentName]: { text: errorMessage },
        }));
      }
    }
  };

  const filterByViewportCallback = debounce((viewExtent) => {
    const { longitude, latitude, wkt, view } = mapLayers[0].kineticaSettings;
    if (
      !selectedDatasource ||
      ((longitude === "" || latitude === "") && !wkt)
    ) {
      return;
    }
    console.log("updateMapFeatures --> filterByViewPortcallback", view);
    updateMapFeatures(viewExtent, globalView); // change this from global view???(RP)
  }, 300);

  const updateParameters = debounce(async (parameterValues) => {
    const { worksheets } = superset.extensions.dashboardContent.dashboard;
    for (const [parameterName, parameterValue] of Object.entries(
      parameterValues
    )) {
      worksheets.forEach(async (worksheet) => {
        const param = await worksheet.findParameterAsync(parameterName);
        if (param) {
          console.log(
            "updateParameters --> parameter found: " +
              parameterName +
              ", value: " +
              parameterValue
          );
          param.changeValueAsync(parameterValue);
        } else {
          if (parameterName !== "multimap") {
            console.error(
              "updateParameters --> parameter not found: " + parameterName
            );
          }
        }
      });
    }

    // This may be able to help us get rid of using Custom SQL
    // const dataSources = await superset.extensions?.workbook?.getAllDataSourcesAsync()
    // if (dataSources) {
    //   dataSources.forEach(async dataSource => {
    //     dataSource.refreshAsync();
    //   });
    // }
  }, updateParameterDelay.current);

  const mapMoveHandler = useCallback(
    (evt) => {
      const map = evt.map;
      const viewExtent = transformExtent(
        map.getView().calculateExtent(map.getSize()),
        "EPSG:3857",
        "EPSG:4326"
      );
      filterByViewportCallback(viewExtent);
    },
    [filterByViewportCallback]
  );

  const saveSettings = (settings) => {
    Object.keys(settings).forEach((key) => {
      if (settings[key]) {
        cachedSettings.push({
          name: key,
          value: settings[key],
          op: "set",
        });
      } else {
        cachedSettings.push({
          name: key,
          value: "",
          op: "erase",
        });
      }
    });

    asyncSaveSettings();
  };

  const getClickRadius = useCallback(
    (extent) => {
      const mapWidth = extent[2] - extent[0];
      return mapWidth * (MAP_CLICK_PIXEL_RADIUS / width);
    },
    [width]
  );

  const buildGeoDistExpr = (lon, lat, lonCol, latCol, radius) => {
    return `GEODIST(${lon}, ${lat}, ${lonCol}, ${latCol}) <= ${radius}`;
  };

  const buildSTXYDWithinExpr = (lon, lat, wktCol, radius) => {
    return `STXY_DWITHIN(${lon}, ${lat}, ${wktCol}, ${radius}, 1) = 1`;
  };

  const geoFilter = useCallback(
    async function geoFilter(table, expression) {
      return await gpudb.filter(table, "", expression, {
        ttl: "20",
        create_temp_table: "true",
      });
    },
    [gpudb]
  );

  const openInfo = useCallback(
    (coordinate) => {
      if (map && map.getOverlayById(`info_${mapId}`)) {
        const mapExtent = map.getView().calculateExtent(map.getSize());
        const center = map.getView().getCenter();
        const x = center[0];
        const y = (mapExtent[3] - mapExtent[1]) * 0.5 + mapExtent[1];
        map.getOverlayById(`info_${mapId}`).setPosition([x, y]);
      }
    },
    [map]
  );

  const closeInfo = useCallback(
    (_) => {
      if (map && map.getOverlayById(`info_${mapId}`)) {
        map.getOverlayById(`info_${mapId}`).setPosition(null);
      }
    },
    [map]
  );

  // TODO(Multilayer): handle click for multiple layers
  const handleMapClick = useCallback(
    async function (evt) {
      if (cursorMode === CURSOR_FREEHAND_DRAW) {
        console.log("IN handleDrawMapClick2: ", evt);
        console.log("drawcomplete handler should handle this instead");
        return;
      }
      const { longitude, latitude, wkt, dataType, view, baseTable } =
        mapLayers[0].kineticaSettings;

      if (gpudb && selectedDatasource && map && (baseTable || view)) {
        // Determine coordinate of click and compute relative radius
        const extent = evt.map.getView().calculateExtent(evt.map.getSize());
        const coords = transform(evt.coordinate, "EPSG:3857", "EPSG:4326");
        const lon = coords[0];
        const lat = coords[1];
        const radius = getClickRadius(extent);

        // Build filter expression based on column info
        let expression = "";
        if (dataType === "point") {
          expression = buildGeoDistExpr(lon, lat, longitude, latitude, radius);
        } else if (dataType === "geo") {
          expression = buildSTXYDWithinExpr(lon, lat, wkt, radius);
        }

        // Use click to determine area to filter for recods
        const { table } = selectedDatasource;
        // const baseTable = `${table.schema}.${table.name}`;

        try {
          setError(componentName, "");
          const data = await geoFilter(view || baseTable, expression);
          if (data) {
            const { qualified_view_name } = data?.info;

            // Clean up results if no data to display
            if (data.count === 0) {
              await gpudb.clear_table(qualified_view_name, "", {
                no_error_if_not_exists: "true",
              });
            }

            // Manage display of info overlay
            if (data.count === 0) {
              closeInfo();
            } else {
              openInfo(evt.coordinate);
              setInfoCoordinate(coords);
              setInfoTable(qualified_view_name);
            }
          } else {
            closeInfo();
          }
        } catch (error) {
          setError(componentName, error);
          closeInfo();
        }
      }
    },
    [
      gpudb,
      selectedDatasource,
      map,
      cursorMode,
      drawType,
      mapLayers,
      getClickRadius,
      geoFilter,
      openInfo,
      closeInfo,
    ]
  );
  useEffect(() => {
    if (map) {
      if (handleMapClickKey) {
        unByKey(handleMapClickKey);
      }
      setHandleMapClickKey(map.on("singleclick", handleMapClick));
    }
  }, [map, handleMapClick]);

  // TODO(multilayer): seems like no changes needed
  const updateCount = useCallback(
    (layer) => {
      if (endpoint && username && password) {
        if (selectedDatasource === undefined) {
          setCount(-1);
          return;
        }
        const options = {
          timeout: 60000,
          username: username,
          password: password,
        };

        const { apiUrl } = selectedDatasource;
        const gpudb = new GPUdb(apiUrl ?? endpoint, options);
        const { table } = selectedDatasource;
        const fullTable = layer || `${table.schema}.${table.name}`;

        setError(componentName, "");
        gpudb.show_table(fullTable, { get_sizes: "true" }, (err, data) => {
          if (!err) {
            setCount(data.sizes);
          } else {
            setError(componentName, err);
            setCount(-1);
          }
        });
      } else {
        setError(componentName, "No endpoint, username, or password");
        setCount(-1);
      }
    },
    [selectedDatasource, endpoint, username, password]
  );

  // when filterByViewportMode changes
  useEffect(() => {
    asyncSaveFilterByViewportMode(filterByViewportMode);
  }, [filterByViewportMode]);

  const saveSqlBase = (stmt) => {
    const stopIndex = stmt.toUpperCase().indexOf("WHERE");
    const base =
      stopIndex > 0
        ? stmt.substring(0, stopIndex).replace(/\r?\n|\r/g, "")
        : stmt;
    console.log("setSqlBase: ", base);
    setSqlBase(base);
  };

  const registerMultimapParameterListener = () => {
    const { latitude, longitude, wkt } = mapLayers[0].kineticaSettings;

    if (!(gpudb && ((longitude !== "" && latitude !== "") || wkt !== ""))) {
      console.error(
        "registerMultimapParameterListener (incomplete data): ",
        gpudb,
        longitude,
        latitude,
        wkt
      );
      return;
    }

    superset.extensions.dashboardContent.dashboard
      .findParameterAsync("wkt")
      .then((param) => {
        if (param) {
          console.log("registerMultimapParameterListener: ", param);
          const unregisterFunction = param.addEventListener(
            superset.SupersetEventType.ParameterChanged,
            (event) => {
              console.log(
                "multimap parameter changed: ",
                param,
                globalView,
                event
              );
              superset.extensions.dashboardContent.dashboard
                .getParametersAsync()
                .then((params) => {
                  // iterate through parameters and set the current value
                  params.forEach((param) => {
                    if (
                      param.name === "wkt" &&
                      param.currentValue.value !== savedWktValue
                    ) {
                      console.log("multimap(wkt) parameter found: ", param);

                      if (
                        param.currentValue.value ===
                        "POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))"
                      ) {
                        console.log(
                          "RESET encountered -- ignoreResetCount: ",
                          ignoreResetCount
                        );
                        if (ignoreResetCount > 0) {
                          console.log("ignoring reset");
                          ignoreResetCount--;
                          return;
                        } else {
                          console.log("reset back to zero");
                          ignoreResetCount = 0;
                        }
                      }

                      const { latitude, longitude, wkt } =
                        mapLayers[0].kineticaSettings;

                      if (
                        gpudb &&
                        selectedDatasource &&
                        ((longitude !== "" && latitude !== "") || wkt !== "")
                      ) {
                        let multimapGeom = param.currentValue.value;
                        let multimapExpr = "";
                        if (longitude !== "" && latitude !== "") {
                          multimapExpr = `STXY_INTERSECTS(${longitude},${latitude},GEOMETRY('${multimapGeom}')) = 1;`;
                          handleDataMask({
                            longitude,
                            latitude,
                            wktgeom: multimapGeom,
                          });
                        } else if (wkt !== "") {
                          multimapExpr = `ST_INTERSECTS(${wkt}, GEOMETRY('${multimapGeom}')) = 1;`;
                          handleDataMask({ wkt, wktgeom: multimapGeom });
                        }

                        if (filterByViewportMode) {
                          const viewExtent = transformExtent(
                            map.getView().calculateExtent(map.getSize()),
                            "EPSG:3857",
                            "EPSG:4326"
                          );
                          buildView(viewExtent, filters, multimapExpr);
                        } else {
                          buildView(null, filters, multimapExpr);
                        }
                        //savedWktValue = multimapGeom;
                      }
                    }
                  });
                });
            }
          );
          multimapUnregisterHandlerFunctions.push(unregisterFunction);
        } else {
          console.log("multimap parameter not found... skipping");
        }
      });
  };

  // Load Datasources
  useEffect(() => {
    const { longitude, latitude, wkt } = mapLayers[0].kineticaSettings;
    let dsources = [];
    if (endpoint !== "") {
      console.log("Load Datasources Endpoint: ", endpoint);
      const options = {
        timeout: 60000,
        username: username,
        password: password,
      };
      if (username == "" || password == "") {
        console.log("no username/password detected yet... skipping");
        return;
      }
      const gpudb = new GPUdb(endpoint, options);

      if (selectedDatasource) {
        setGpudb(gpudb);
        setDatasources([selectedDatasource]);
        setSelectedDatasource(selectedDatasource);
        updateFilteringMode(FILTERING_MODE_SELECTION);
        return;
      }

      console.log("No selected datasource.  Loading datasources");

      superset.extensions?.workbook
        ?.getAllDataSourcesAsync()
        .then((datasources) => {
          console.log("DATASOURCES: ", datasources);
          const tablePromises = datasources.map((ds) => {
            console.log("data: ", ds);
            return ds.getActiveTablesAsync();
          });
          Promise.all(tablePromises).then((tables) => {
            console.log("TABLE");
            // console.dir(tables[0][0]);
            if (tables && tables.length > 0 && tables[0].length > 0) {
              const tableSummary = tables[0][0];
              console.log("tableSummary: ", tableSummary);

              let schema = "";
              let table = "";
              if (tableSummary.customSQL === undefined) {
                // expect tableSummary.id to be in the form of '[schema].[table]'
                [schema, table] = tableSummary.id.split(".");

                // remove brackets from schema and table
                schema = schema.substring(1, schema.length - 1);
                table = table.substring(1, table.length - 1);
              }

              if (tableSummary.customSQL && tableSummary.customSQL.length > 0) {
                // extract schema and table from customSQL lowercased
                let customSQL = tableSummary.customSQL;
                saveSqlBase(customSQL);
                let match = customSQL.match(/from\s+([a-zA-Z0-9_\.]+)/i);
                if (match) {
                  console.log("match: ", match);
                  [schema, table] = match[1].split(".");
                } else {
                  console.error("Unable to parse customSQL: ", customSQL);
                }
              }

              const dsName = `${schema}.${table}`;
              let columns = [];
              gpudb.show_table(
                dsName,
                { get_column_info: "true" },
                (err, data) => {
                  if (!err) {
                    let foundTrackId = false;
                    let foundX = false;
                    let foundY = false;
                    let foundTimestamp = false;

                    console.log(
                      "loadDatasources: Found columns: ",
                      data["type_schemas"][0]
                    );
                    let record = JSON.parse(data["type_schemas"][0]);
                    record.fields.forEach((field) => {
                      if (
                        field.name === "TRACKID" &&
                        data["properties"][0][field.name].includes("shard_key")
                      ) {
                        foundTrackId = true;
                      } else if (
                        field.name === "x" &&
                        data["properties"][0][field.name].includes("data")
                      ) {
                        foundX = true;
                      } else if (
                        field.name === "y" &&
                        data["properties"][0][field.name].includes("data")
                      ) {
                        foundY = true;
                      } else if (
                        field.name === "TIMESTAMP" &&
                        data["properties"][0][field.name].includes("timestamp")
                      ) {
                        foundTimestamp = true;
                      }
                      columns.push({
                        name: field.name,
                        label: field.name.replace(/_/g, " "),
                        type: field.type,
                        properties: data["properties"][0][field.name] || [],
                      });
                    });
                    dsources.push({
                      name: dsName,
                      table: {
                        schema: schema,
                        name: table,
                        apiUrl: endpoint,
                        username: username,
                        password: password,
                        columns: columns,
                        hasTracks:
                          foundTrackId && foundX && foundY && foundTimestamp,
                      },
                    });
                    console.log("loadDatasources: dsources:", dsources);
                    setDatasources(dsources);
                    setSelectedDatasource(dsources[0]);
                    setGpudb(gpudb);
                    setError(componentName, "");
                    console.log("UPDATE FILTERING MODE FROM LOAD DATASOURCES");
                    updateFilteringMode(FILTERING_MODE_SELECTION);
                    if ((latitude && longitude) || wkt) {
                      console.log(
                        "calling initial buildView after loadingDatasources"
                      );
                      buildView(null, filters);
                    }
                  } else {
                    const msg = `loadDatasources: No columns found for table: : ${table}`;
                    console.error(msg);
                    setError(componentName, msg);
                    return;
                  }
                }
              );
            } else {
              const msg = "No tables found";
              console.error(msg);
              setError(componentName, msg);
              return;
            }
          });
        });
    }
  }, [endpoint, username, password]);

  const handleDrawMapClick = useCallback((event) => {
    console.log("IN handleDrawMapClick2: ", event);
    // Remove the last feature drawn since only one features is used for the filter
    if (DrawLayer.getSource().getFeatures().length > 0) {
      DrawLayer.getSource().removeFeature(
        DrawLayer.getSource().getFeatures()[0]
      );
    }
    setDrawnFeatures([event]);
    setSetResetCount(event);
  }, []);

  useEffect(() => {
    mapLayers.forEach((layer) => {
      ignoreResetCount++;
    });
    if (!filterByViewportMode) {
      ignoreResetCount++;
    }
    console.log("setResetCount - ignoreResetCount: ", ignoreResetCount);
  }, [setResetCount]);

  useEffect(() => {
    const { longitude, latitude, wkt } = mapLayers[0].kineticaSettings;

    if (!superset.extensions.dashboardContent) {
      return;
    }

    if (!filterByViewportMode) {
      const { worksheets } = superset.extensions.dashboardContent.dashboard;
      worksheets.forEach((worksheet) => {
        try {
          if (latitude && longitude && OUTBOUND_RANGE_FILTER_ENABLED) {
            worksheet.clearFilterAsync(transformString(latitude), {
              suppressCallback: true,
            });
            worksheet.clearFilterAsync(transformString(longitude), {
              suppressCallback: true,
            });
          }
        } catch (error) {
          console.error("Error clearing filters: ", error);
        }
      });
      console.log("removing key");

      if (map && viewportKey) {
        unByKey(viewportKey);
        setViewportKey(null);
      }
    } else if (filterByViewportMode && viewportKey == null) {
      console.log("setting key1");

      setViewportKey(
        map.on("moveend", (evt) => {
          console.log("updateMapFeatures --> moveend1", evt);
          mapMoveHandler(evt);
        })
      );
    } else if (filterByViewportMode && viewportKey != null) {
      console.log("setting key2");

      unByKey(viewportKey);
      setViewportKey(
        map.on("moveend", (evt) => {
          console.log("updateMapFeatures --> moveend12", evt);
          mapMoveHandler(evt);
        })
      );
    }
  }, [filterByViewportMode, selectedDatasource, map]);

  function transformString(str) {
    // Split the string on the underscore character
    var tokens = str.split("_");

    // Loop through the tokens and transform each one
    var transformedTokens = tokens.map(function (token) {
      // Capitalize the first letter of the token
      var capitalizedToken = token.charAt(0).toUpperCase() + token.slice(1);

      return capitalizedToken;
    });

    // Join the transformed tokens with a space character
    var transformedString = transformedTokens.join(" ");

    return transformedString;
  }

  const createLayerFiltersStmt = (expression, newViewName) => {
    let _expr = expression;
    if (_expr.endsWith(";")) {
      _expr = _expr.substring(0, _expr.length - 1);
    }
    let stmt = sqlBase;
    if (_expr.length > 0) {
      stmt += " WHERE ";
    }
    if (_expr.length > 0) {
      stmt += _expr;
    }

    stmt = `create temp materialized view ${newViewName} as (${stmt}) using table properties (ttl=20)`;
    console.log("createLayerFiltersStmt: ", stmt);
    return stmt;
  };

  const buildView = async (viewExtent, inboundFilters, multimapExpr) => {
    console.log(">>>buildView");
    console.dir(viewExtent, inboundFilters);

    const { latitude, longitude, wkt } = mapLayers[0].kineticaSettings;

    let viewName = undefined;
    let outboundFilterCoords = [];
    let wktGeoms = [];

    if (
      !(
        gpudb &&
        selectedDatasource &&
        ((longitude !== "" && latitude !== "") || wkt !== "")
      )
    ) {
      console.log("<<<buildView (incomplete data)");
      if (gpudb && selectedDatasource) {
        console.log("buildView opening up map settings");
        setSelectedLayer({ op: "edit", index: -1 });
      }
      return;
    }

    console.log("inboundFilters: ", inboundFilters);
    const validFilters = await Promise.all(
      inboundFilters.map(async (cur) => {
        const columns = selectedDatasource.table.columns;

        const dateTimeFunctions = [
          "YEAR",
          "QUARTER",
          "MONTH",
          "DAY",
          "HOUR",
          "MINUTE",
          "SECOND",
        ];
        let validFilter = null;
        let curFound = false;

        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];

          let nameNoParen = cur.column;
          let functionName;
          let isBinned = false;

          // remove any RAWSQL prefixes
          const rawsqlPrefixes = [
            "RAWSQL_BOOL",
            "RAWSQL_DATE",
            "RAWSQL_DATETIME",
            "RAWSQL_INT",
            "RAWSQL_REAL",
            "RAWSQL_SPATIAL",
            "RAWSQL_STR",
            "RAWSQLAGG_DATE",
            "RAWSQLAGG_DATETIME",
            "RAWSQLAGG_INT",
            "RAWSQLAGG_REAL",
            "RAWSQLAGG_STR",
          ];
          for (let i = 0; i < rawsqlPrefixes.length; i++) {
            const prefix = rawsqlPrefixes[i];
            if (nameNoParen.startsWith(prefix)) {
              // there could be more than 1 column value here, but for now only process the first one
              const regex = /\[([^]*)\]/gm;
              const values = [];
              let match;
              while ((match = regex.exec(nameNoParen)) !== null) {
                values.push(match[1]);
              }
              console.log(
                "rawsqlPrefix: extracted columns: using first value of array: ",
                values
              );
              nameNoParen = values[0].trim();
              break;
            }
          }

          // remove any superset suffixes
          const supersetSuffixes = [
            "(bin)",
            "(aggregated)",
            "(copy)",
            "(generated)",
            "(measure)",
          ];
          supersetSuffixes.forEach((suffix) => {
            if (nameNoParen.includes(suffix)) {
              if (suffix == "(bin)") {
                isBinned = true;
              }
              nameNoParen = nameNoParen.replace(suffix, "");
              nameNoParen = nameNoParen.trim();
            }
          });

          if (nameNoParen.match(/^[A-Z]+\(/)) {
            nameNoParen = nameNoParen
              .substring(nameNoParen.indexOf("(") + 1, nameNoParen.indexOf(")"))
              .toLowerCase();
            functionName = cur.column.substring(0, cur.column.indexOf("("));
            if (SUPERSET_AGGREGATIONS_LIST.includes(functionName)) {
              continue;
            }
          } else {
            nameNoParen = nameNoParen.toLowerCase();
          }

          // remove any additional name in parenthesis
          if (nameNoParen.toLowerCase().includes("(")) {
            nameNoParen = nameNoParen
              .toLowerCase()
              .substring(0, nameNoParen.toLowerCase().indexOf("("));
            nameNoParen = nameNoParen.trim();
          }

          if (
            column.label.toLowerCase() === nameNoParen ||
            column.name.toLowerCase() === nameNoParen
          ) {
            curFound = true;
            if (!validFilter) {
              validFilter = {
                [column.name]: {
                  include: cur.include,
                  exclude: cur.exclude,
                  type: cur.dataType,
                  exteriorExpression: functionName,
                },
              };
            }

            if (dateTimeFunctions.includes(functionName)) {
              validFilter[column.name][functionName] = cur.include;
            }

            if (isBinned) {
              const binRangesRet = await getColumnBinRange(column.name);
              console.log("binRangesRet: ", binRangesRet);
              const _binRanges = binRangesRet
                ? binRangesRet
                : binRanges && binRanges[`${column.name} (bin)`]
                ? binRanges
                : null;

              if (_binRanges && _binRanges[`${column.name} (bin)`]) {
                validFilter[column.name]["binned"] =
                  _binRanges[`${column.name} (bin)`];
              } else {
                setError(
                  "Warning",
                  `Unable to find bin ranges for ${column.name} (bin).  Please add a discrete filter.`
                );
              }
            }
          }
        }

        if (!curFound) {
          // check to see if this is a calculated column
          const datasources =
            await superset.extensions?.workbook?.getAllDataSourcesAsync();
          datasources.forEach((datasource) => {
            const calcFields = datasource.fields
              ?.filter((field) => field.isCalculatedField === true)
              .map((field) => field.name);
            console.log("calcFields: ", calcFields);
            if (calcFields && calcFields.includes(cur.column)) {
              console.log("found calc field: ", cur);
              if (calculatedFields?.[cur.column]) {
                console.log(
                  "found calc field in calculatedFields: ",
                  calculatedFields[cur.column]
                );
                validFilter = {
                  [cur.column]: {
                    include: cur.include,
                    exclude: cur.exclude,
                    type: cur.dataType,
                    isCalculatedField: true,
                    sql: calculatedFields[cur.column].sql,
                  },
                };
              } else {
                const msg = `You're using a calculated field as a filter that this extension doesn't know about.  Click HERE to link your .twb file necessary for this filter.</p>`;
                setError("Warning", `${msg}`, () => {
                  console.log("pop up the file uploader");
                  setErrorMsg({});
                  inputFile.current.click();
                });
                setTwbFile(null);
              }
            }
          });
        }

        return validFilter;
      })
    );

    // convert validFilters to an object buildExpression can use
    const validFiltersObj = validFilters.reduce((acc, cur) => {
      if (cur !== null) {
        const [key, value] = Object.entries(cur)[0];
        acc[key] = value;
      }
      return acc;
    }, {});

    // determine filter expression
    let filterExpression = "";
    if (Object.keys(validFiltersObj).length > 0) {
      filterExpression = buildExpression(validFiltersObj);
      console.info("FILTER EXPRESSION", filterExpression);
    }

    console.log("filterExpression: ", filterExpression);
    if (layersFilterText.length > 0) {
      if (filterExpression.length > 0) {
        filterExpression = `${filterExpression} AND ${layersFilterText}`;
      } else {
        filterExpression = layersFilterText;
      }
      console.log(
        "filterExpression including layersFilterText: ",
        filterExpression
      );
    }

    // determine stxy_intesect expression based on drawn geometry
    let drawnGeometryExpression = "";
    if (multimapExpr) {
      drawnGeometryExpression = multimapExpr;
    } else {
      if (drawLayer.getSource().getFeatures().length > 0) {
        const extent = map.getView().calculateExtent(map.getSize());
        const features = drawLayer.getSource().getFeaturesInExtent(extent);

        for (let i = 0; i < features.length; i++) {
          const feature = features[i];
          const [minx, miny, maxx, maxy] = feature.getGeometry().getExtent();
          console.log(
            "GEOMETRY: ",
            feature.getGeometry(),
            minx,
            miny,
            maxx,
            maxy
          );
          const wktFormatter = new WKT();
          const cloneGeom = feature
            .getGeometry()
            .clone()
            .transform("EPSG:3857", "EPSG:4326");
          const wktgeom = wktFormatter.writeGeometry(cloneGeom);
          console.log("wkt: " + wktgeom);
          wktGeoms.push(wktgeom);

          const min = transform([minx, miny], "EPSG:3857", "EPSG:4326");
          const max = transform([maxx, maxy], "EPSG:3857", "EPSG:4326");

          if (
            outboundFilterCoords.find(
              (coord) => coord[0] === min && coord[1] === max
            )
          ) {
            continue;
          } else {
            outboundFilterCoords.push([min, max]);
          }

          if (longitude !== "" && latitude !== "") {
            drawnGeometryExpression = `STXY_INTERSECTS(${longitude},${latitude},GEOMETRY('${wktgeom}')) = 1;`;
            handleDataMask({ longitude, latitude, wktgeom });
            console.log("drawnGeometryExpression: " + drawnGeometryExpression);
          } else if (wkt !== "") {
            drawnGeometryExpression = `ST_INTERSECTS(${wkt}, GEOMETRY('${wktgeom}')) = 1;`;
            handleDataMask({ wkt, wktgeom });
            console.log("drawnGeometryExpression: " + drawnGeometryExpression);
          }
        }
      }
    }

    console.log("drawnGeometryExpression: ", drawnGeometryExpression);

    // if filter by viewport is enabled, then ensure that all filters
    // intersect with the current viewport
    let viewExtentWktExpression = "";
    if (viewExtent && filterByViewportMode) {
      const [minx, miny, maxx, maxy] = viewExtent;
      const format = new WKT();

      var wktgeom = format.writeGeometry(fromExtent(viewExtent));
      if (longitude !== "" && latitude !== "") {
        viewExtentWktExpression = `STXY_INTERSECTS(${longitude},${latitude},GEOMETRY('${wktgeom}')) = 1;`;
        handleDataMask({ longitude, latitude, wktgeom });
        console.log("viewExtentWktExpression: " + viewExtentWktExpression);
      } else if (wkt !== "") {
        viewExtentWktExpression = `ST_INTERSECTS(${wkt}, GEOMETRY('${wktgeom}')) = 1;`;
        handleDataMask({ wkt, wktgeom });
        console.log("viewExtentWktExpression: " + viewExtentWktExpression);
      }
    }

    // combine filter, drawn geometry, and viewport expressions
    let expression = "";
    let expressionWithoutViewExtent = "";
    if (
      filterExpression !== "" &&
      drawnGeometryExpression !== "" &&
      viewExtentWktExpression !== ""
    ) {
      expression = `${filterExpression} AND ${drawnGeometryExpression} AND ${viewExtentWktExpression}`;
      expressionWithoutViewExtent = `${filterExpression} AND ${drawnGeometryExpression}`;
    } else if (filterExpression !== "" && drawnGeometryExpression !== "") {
      expression = `${filterExpression} AND ${drawnGeometryExpression}`;
      expressionWithoutViewExtent = `${filterExpression} AND ${drawnGeometryExpression}`;
    } else if (filterExpression !== "" && viewExtentWktExpression !== "") {
      expression = `${filterExpression} AND ${viewExtentWktExpression}`;
      expressionWithoutViewExtent = `${filterExpression}`;
    } else if (
      drawnGeometryExpression !== "" &&
      viewExtentWktExpression !== ""
    ) {
      expression = `${drawnGeometryExpression} AND ${viewExtentWktExpression}`;
      expressionWithoutViewExtent = `${drawnGeometryExpression}`;
    } else if (filterExpression !== "") {
      expression = filterExpression;
      expressionWithoutViewExtent = filterExpression;
    } else if (drawnGeometryExpression !== "") {
      expression = drawnGeometryExpression;
      expressionWithoutViewExtent = drawnGeometryExpression;
    } else if (viewExtentWktExpression !== "") {
      expression = viewExtentWktExpression;
    }

    console.log("expression: ", expression);
    console.log("expressionWithoutViewExtent: ", expressionWithoutViewExtent);

    // set up geoms for outbound filter
    let wktValue;
    if (outboundFilterCoords.length === 0) {
      // When no wkt filter is applied revert back to the entire world
      wktValue = "POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))";
    } else {
      // apply geographic filter outbound to worksheets
      wktValue = wktGeoms[wktGeoms.length - 1];
    }

    let wktviewportValue;
    if (viewExtent) {
      wktviewportValue = wktgeom;
    } else {
      wktviewportValue =
        "POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))";
    }

    // call gpudb filter
    setError(componentName, "");

    const { table } = selectedDatasource;
    const baseTable = `${table.schema}.${table.name}`;

    if (expressionWithoutViewExtent !== "") {
      // create a view for each layer
      const layerViewMap = {};
      const executeSqlPromises = [];

      for (let i = 0; i < mapLayers.length; i++) {
        const layer = mapLayers[i];
        const randomNumber = Math.floor(Math.random() * 1000000000) + 1;
        const viewName = `${baseTable}_view_${layer.id}_${randomNumber}`;

        const offset = 0;
        const limit = -9999;
        const options = {};
        gpudb.execute_sql(
          createLayerFiltersStmt(expressionWithoutViewExtent, viewName),
          offset,
          limit,
          null,
          [],
          options,
          (err, data) => {
            if (data) {
              console.info("DATA2: ", data);
              if (layer.id === "0000") {
                globalView = viewName;
                if (viewExtent) {
                  updateMapFeatures(viewExtent, viewName, wktValue);
                } else {
                  setCount(data.count_affected);

                  updateParameters({ wkt: wktValue });
                  savedWktValue = wktValue;
                }
              }
              updateLayerView(layer, viewName);
              layerViewMap[layer.id] = viewName;
            } else {
              console.log("setting updateMapFeatures view", baseTable);
              if (layer.id === "0000") {
                globalView = baseTable;
                if (viewExtent) {
                  updateMapFeatures(viewExtent, baseTable, wktValue);
                } else {
                  updateCount(baseTable);

                  updateParameters({ wkt: wktValue });
                  savedWktValue = wktValue;
                }
              }
            }
          }
        );
      }
    } else {
      console.log(
        "buildView: no expressionWithoutViewExtent... calling updateMapFeatures with baseTable: ",
        baseTable
      );
      globalView = baseTable;
      const newMapLayers = mapLayers.map((lyr) => {
        return {
          ...lyr,
          kineticaSettings: {
            ...lyr.kineticaSettings,
            view: lyr.baseTable,
          },
        };
      });
      setMapLayers(newMapLayers);
      if (viewExtent) {
        updateMapFeatures(viewExtent, baseTable, wktValue);
      } else {
        updateCount(baseTable);

        updateParameters({ wkt: wktValue });
        savedWktValue = wktValue;
      }
    }
  };

  // const updateSheetsByLayerFilters = debounce(async() => {
  //   // if we need to update sheet filters, do it here
  // }, 1000);

  const updateMapFeatures = async (extent, viewName, wktValue) => {
    const { latitude, longitude, wkt, view } = mapLayers[0].kineticaSettings;

    let viewExtent = extent;
    if (!extent) {
      viewExtent = transformExtent(
        map.getView().calculateExtent(map.getSize()),
        "EPSG:3857",
        "EPSG:4326"
      );
    }
    console.log("the view for updateMapFeatures is view", view);
    console.log("the name for updateMapFeatures is view", viewName);
    let _view = viewName ? viewName : view;

    console.log("datasources: ", datasources);
    console.log("selectedDatasource: ", selectedDatasource);

    const { table } = selectedDatasource;
    const format = new WKT();
    let wktgeom = format.writeGeometry(fromExtent(viewExtent));
    let viewExtentWktExpression = "";
    if (longitude !== "" && latitude !== "") {
      viewExtentWktExpression = `STXY_INTERSECTS(${longitude},${latitude},GEOMETRY('${wktgeom}')) = 1;`;
      handleDataMask({ longitude, latitude, wktgeom });
    } else if (wkt !== "") {
      viewExtentWktExpression = `ST_INTERSECTS(${wkt}, GEOMETRY('${wktgeom}')) = 1;`;
      handleDataMask({ wkt, wktgeom });
    }

    console.log("updateMapFeatures: ", _view);
    if (_view && _view !== "") {
      gpudb.filter(
        _view,
        "",
        viewExtentWktExpression,
        { ttl: "20" },
        (err, data) => {
          if (data) {
            console.info("DATA: ", data);
            setCount(data.count);
            updateParameters({
              wktviewport: wktgeom,
            });

            if (wktValue) {
              console.log("wktValue: ", wktValue);

              if (wktValue !== savedWktValue) {
                updateParameters({
                  wkt: wktValue,
                });
                savedWktValue = wktValue;
              }
            }
          }
        }
      );
    } else {
      console.warn("No view selected");
    }
  };

  // Calls buildView
  useEffect(() => {
    const { latitude, longitude, wkt } = mapLayers[0].kineticaSettings;

    if (
      gpudb &&
      selectedDatasource &&
      ((longitude !== "" && latitude !== "") || wkt !== "")
    ) {
      if (filterByViewportMode) {
        const viewExtent = transformExtent(
          map.getView().calculateExtent(map.getSize()),
          "EPSG:3857",
          "EPSG:4326"
        );
        buildView(viewExtent, filters);
      } else {
        buildView(null, filters);
      }
    }
  }, [
    gpudb,
    selectedDatasource,
    filterByViewportMode,
    map,
    filters,
    drawnFeatures,
    layersFilterText,
  ]);

  const loadConfig = async () => {
    if (updateParameterDelay.current === undefined) {
      updateParameterDelay.current = 1000;
    }
    const { longitude, latitude, wkt } = mapLayers[0].kineticaSettings;

    if (reloadConfigRef.current && superset.extensions.settings) {
      reloadConfigRef.current = false;
      const { worksheets } = superset.extensions.dashboardContent.dashboard;
      const currentFilteringMode =
        superset.extensions.settings.get("filteringMode");

      console.log("loadConfig: currentFilteringMode: ", currentFilteringMode);

      Promise.all(
        worksheets.map(async (worksheet) => {
          if (currentFilteringMode === FILTERING_MODE_FILTER) {
            worksheet.getFiltersAsync().then((data) => {
              const filters = handleFilters(data);
              console.info(FILTERING_MODE_FILTER, filters);
              setFilters(filters);
            });
          } else if (currentFilteringMode === FILTERING_MODE_SELECTION) {
            // See if we can get all filters
            const filters = await worksheets.reduce(async (acc, worksheet) => {
              const marks = await worksheet.getSelectedMarksAsync();
              if (marks.data.length > 0) {
                const { data, columns } = marks.data[marks.data.length - 1];
                if (columns.length > 0) {
                  const regex = /([a-zA-Z_\ \(\d\)]+)/gi;
                  const filters = columns
                    .map((column, idx) => {
                      const values = data.reduce((acc, cur) => {
                        if (cur.length > 0) {
                          acc.push(cur[idx].value);
                        }
                        return acc;
                      }, []);
                      return {
                        column: column.fieldName,
                        dataType: column.dataType,
                        include: values,
                      };
                    })
                    .filter((item) => {
                      return !item.column.match(regex);
                    });
                  const arr = await acc;
                  return arr.concat(filters);
                }
              }
              return await acc;
            }, []);
            console.info(FILTERING_MODE_SELECTION, filters);
          }
        })
      );

      // Check for saved datasource
      let selectedDatasource = superset.extensions.settings.get("datasource");
      console.log("loadConfig: selectedDatasource: ", selectedDatasource);
      if (selectedDatasource != null) {
        selectedDatasource = JSON.parse(selectedDatasource);
        setSelectedDatasource(selectedDatasource);
        setDatasources([selectedDatasource]);
        setError(componentName, "");
      }

      // Check for saved endpoint
      let endpoint = superset.extensions.settings.get("endpoint");
      console.log("loadConfig: endpoint: ", endpoint);
      if (endpoint != null) {
        setEndpoint(endpoint);
      }

      // Check for saved username
      let username = superset.extensions.settings.get("username");
      console.log("loadConfig: username: ", username);
      if (username != null) {
        setUsername(username);
      }

      // Check for saved password
      let password = superset.extensions.settings.get("password");
      console.log("loadConfig: password: ", password);
      if (password != null) {
        setPassword(password);
      }

      // Check for saved mapLayers
      let mapLayers = superset.extensions.settings.get("mapLayers");
      console.log("loadConfig: mapLayers: ", mapLayers);
      if (mapLayers != null) {
        // update any previously saved twb file that contained the
        // old wms classbreak delimiter ',' and change it to use '|'.
        let mapLayersParsed = JSON.parse(mapLayers);
        let updatedAllStyleRanges;
        let updatedAllStyleColors;
        let updatedAllStyleShapes;
        let updatedAllStyleSizes;
        mapLayersParsed = mapLayersParsed.map((lyr) => {
          let cbStyleOpts = lyr.kineticaSettings?.cbStyleOptions;
          if (
            cbStyleOpts?.allStyleRanges?.split("|").length === 1 &&
            cbStyleOpts?.allStyleRanges?.includes(",")
          ) {
            updatedAllStyleRanges = cbStyleOpts.allStyleRanges
              .split(",")
              .join("|");
          } else {
            updatedAllStyleRanges = cbStyleOpts.allStyleRanges;
          }
          if (
            cbStyleOpts?.allStyleColors?.split("|").length === 1 &&
            cbStyleOpts?.allStyleColors?.includes(",")
          ) {
            updatedAllStyleColors = cbStyleOpts.allStyleColors
              .split(",")
              .join("|");
          } else {
            updatedAllStyleColors = cbStyleOpts.allStyleColors;
          }
          if (
            cbStyleOpts?.allStyleShapes?.split("|").length === 1 &&
            cbStyleOpts?.allStyleShapes?.includes(",")
          ) {
            updatedAllStyleShapes = cbStyleOpts.allStyleShapes
              .split(",")
              .join("|");
          } else {
            updatedAllStyleShapes = cbStyleOpts.allStyleShapes;
          }
          if (
            cbStyleOpts?.allStyleSizes?.split("|").length === 1 &&
            cbStyleOpts?.allStyleSizes?.includes(",")
          ) {
            updatedAllStyleSizes = cbStyleOpts.allStyleSizes
              .split(",")
              .join("|");
          } else {
            updatedAllStyleSizes = cbStyleOpts.allStyleSizes;
          }
          return {
            ...lyr,
            kineticaSettings: {
              ...lyr.kineticaSettings,
              cbStyleOptions: {
                ...cbStyleOpts,
                allStyleRanges: updatedAllStyleRanges,
                allStyleColors: updatedAllStyleColors,
                allStyleShapes: updatedAllStyleShapes,
                allStyleSizes: updatedAllStyleSizes,
              },
            },
          };
        });
        setMapLayers(mapLayersParsed);
      }

      // Check for saved basemap url
      let basemapUrl = superset.extensions.settings.get("basemapUrl");
      console.log("loadConfig: basemapUrl: ", basemapUrl);
      if (basemapUrl != null) {
        setBasemapUrl(basemapUrl);
      }

      // Check for mapboxApiKey
      let mapboxApiKey = superset.extensions.settings.get("mapboxApiKey");
      console.log("loadConfig: mapboxApiKey: ", mapboxApiKey);
      if (mapboxApiKey && mapboxApiKey.trim() !== "") {
        console.log("using user-defined mapboxApiKey: ", mapboxApiKey);
        setMapboxApiKey(mapboxApiKey);
      }

      // Check for xyz tile service template
      let xyzTileServiceTemplate = superset.extensions.settings.get("xyzTileServiceTemplate");
      console.log("loadConfig: xyzTileServiceTemplate: ", xyzTileServiceTemplate);
      if (xyzTileServiceTemplate && xyzTileServiceTemplate.trim() !== "") {
        console.log("using user-defined xyzTileServiceTemplate: ", xyzTileServiceTemplate);
        setXyzTileServiceTemplate(xyzTileServiceTemplate);
      }

      // Check for saved center
      let center = superset.extensions.settings.get("center");
      console.log("loadConfig: center: ", center);
      if (center != null) {
        center = JSON.parse(center);
        setCenter(center);
      }

      // Check for saved zoom
      let zoom = superset.extensions.settings.get("zoom");
      console.log("loadConfig: zoom: ", zoom);
      if (zoom != null) {
        setZoom(zoom);
      }

      // Check filterByViewportMode
      let filterByViewportMode = superset.extensions.settings.get(
        "filterByViewportMode"
      );
      console.log("loadConfig: filterByViewportMode: ", filterByViewportMode);
      if (filterByViewportMode != null) {
        setFilterByViewportMode(filterByViewportMode);
      }

      // Check for saved filtering mode
      let filteringMode = superset.extensions.settings.get("filteringMode");
      console.log("loadConfig: filteringMode: ", filteringMode);
      updateFilteringMode(filteringMode);

      // Check for saved updateParameterDelay
      let _updateParameterDelay = superset.extensions.settings.get(
        "updateParameterDelay"
      );
      console.log("loadConfig: updateParameterDelay: ", _updateParameterDelay);
      updateParameterDelay.current = _updateParameterDelay;

      // instantiate the gpudb
      if (!gpudb && endpoint && username && password) {
        setGpudb(
          new GPUdb(endpoint, {
            username: username,
            password: password,
            timeout: 60000,
          })
        );
      } else if (!endpoint || !username || !password) {
        // let msg = 'Please connect to your database using the "Configure" menu.';
        let msg =
          "Please configure your database endpoint url, username, and password.";
        setError(componentName, msg);
      }

      // update the center and zoom values if they are set
      if (center && map && map.getView()) {
        map.getView().setCenter(center);
      }
      if (zoom && map && map.getView()) {
        map.getView().setZoom(zoom);
      }

      // add a map move handler to save the center and zoom values periodically
      if (map) {
        map.on("moveend", (evt) => {
          const view = evt.map.getView();
          const center = view.getCenter();
          const zoom = view.getZoom();
          setCenter(center);
          setZoom(zoom);
          asyncSaveViewport(center, zoom);

          // Update control panel viewport config values
          updateControlPanel({
            "Center Lon/Lat": transform(center, "EPSG:3857", "EPSG:4326")
              .map((val) => Math.round(val * 100000) / 100000)
              .join(","),
            "Zoom Level": Math.round(zoom * 10000) / 10000,
          });
        });
      }

      // check if there are filters saved on the worksheets
      if (superset.extensions.dashboardContent.dashboard && selectedDatasource) {
        const { worksheets } = superset.extensions.dashboardContent.dashboard;
        worksheets.forEach((worksheet) => {
          worksheet.getFiltersAsync().then((filters) => {
            let translatedFilters = [];
            console.log("loadConfig: filters: ", filters);
            const f = handleFilters(filters);

            // parse the filters and add them to the filters array
            for (let i = 0; i < f.length; i++) {
              let filt = f[i];
              console.log("loadConfig: filt: ", filt);
              if (!filt.column) {
                continue;
              }

              // extract the name within the parenthesis
              const name = filt.column.match(/\(([^)]+)\)/)?.[1];
              console.log("loadConfig: name: ", name);

              if (!name) {
                console.log("loadConfig: name not found");
                continue;
              }

              /////////////////////////////////
              // the name could still have parenthesis in it, so we need to remove them
              // extract the name within the parenthesis
              let name2 = name.match(/\(([^)]+)\)/);
              if (name2) {
                name2 = name2[1];
              }
              console.log("loadConfig: name2: ", name2);
              console.log("name || name2: ", name || name2);

              // Note: Testing this with date_dropoff from demo.nyctaxi..
              //  Superset does not save this filter, so I cannot test properly
              //  during startup / reload.
              /////////////////////////////////

              filt.column = name; // if the above block works, then add ' || name2' to the value.

              // get the column's datatype from selectedDatasource
              const col = selectedDatasource.table.columns.find(
                (c) => c.name === name
              );
              if (!col) {
                console.log("loadConfig: column not found");
                continue;
              }

              filt.dataType = col.type;
              translatedFilters.push(filt);
            }

            console.log("loadConfig: translatedFilters: ", translatedFilters);
            setFilters(translatedFilters);
          });
        });
      }

      setIsConfigLoaded(true);
    }
  };

  useEffect(() => {
    if (reloadConfig) {
      const elem = document.querySelector(`[aria-label="Layers"]`);
      if (elem) {
        reloadConfigRef.current = true;
        loadConfig();
      }
    }
  }, [reloadConfig]);

  // When basemapUrl changes, update base layer
  useEffect(() => {
    const basemapLayer = map.getLayers().getArray()[0];
    console.log2("BASEMAP", basemapUrl, mapboxApiKey);
    if (basemapUrl === "OSM") {
      const source = new OlSourceOSM({
        crossOrigin: "anonymous",
        wrapX: true,
        noWrap: false,
      });
      basemapLayer.setSource(source);
    } else if (
      basemapUrl === "satellite-streets-v11" ||
      basemapUrl === "dark-v11" ||
      basemapUrl === "light-v10" ||
      basemapUrl === "streets-v11"
    ) {
      const mapboxStyleName = basemapUrl;
      const source = new OlSourceXYZ({
        url: `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyleName}/tiles/256/{z}/{x}/{y}?access_token=${mapboxApiKey}`,
        crossOrigin: "anonymous",
        wrapX: true,
        noWrap: false,
      });
      basemapLayer.setSource(source);
    } else if (basemapUrl === "xyz-service") {
      const source = new OlSourceXYZ({
        url: xyzTileServiceTemplate,
        crossOrigin: "anonymous",
        wrapX: true,
        noWrap: false,
      });
      basemapLayer.setSource(source);
    } else if (basemapUrl !== "") {
      const source = new OlSourceXYZ({
        url: basemapUrl,
        crossOrigin: "anonymous",
        wrapX: true,
        noWrap: false,
      });
      basemapLayer.setSource(source);
    } else {
      const mapboxStyleName = "dark-v11";
      const source = new OlSourceXYZ({
        url: `https://api.mapbox.com/styles/v1/mapbox/${mapboxStyleName}/tiles/256/{z}/{x}/{y}?access_token=${mapboxApiKey}`,
        crossOrigin: "anonymous",
        wrapX: true,
        noWrap: false,
      });
      basemapLayer.setSource(source);
    }

    // if( selectedDatasource && selectedDatasource.table ) {
    //   setWmsLayer(createWmsLayer(globalView));
    // }
  }, [basemapUrl, mapboxApiKey, map, xyzTileServiceTemplate]);

  const updateFilteringMode = useCallback((filteringMode) => {
    const { worksheets } = superset.extensions.dashboardContent.dashboard;

    unregisterHandlerFunctions.forEach((unregisterHandlerFunction) => {
      console.log("UNREGISTERING EVENT LISTENERS");
      unregisterHandlerFunction();
    });
    unregisterHandlerFunctions = [];

    // Add filter listeners
    worksheets.forEach((worksheet) => {
      console.log("ADDING EVENT LISTENERS");
      const unregisterFilterHandlerFunction = worksheet.addEventListener(
        superset.SupersetEventType.FilterChanged,
        (changes) => {
          if (filteringMode === FILTERING_MODE_FILTER) {
            // worksheet.getFiltersAsync().then((data) => {
            //   const _filters = handleFilters(data);
            //   console.info(FILTERING_MODE_FILTER, _filters);
            //   setFilters(_filters);
            // });
            const _filters = handleFilters(changes);
            console.info(FILTERING_MODE_FILTER, _filters);
            setFilters(_filters);
          }
        }
      );
      unregisterHandlerFunctions.push(unregisterFilterHandlerFunction);

      const unregisterHighlightHandlerFunction = worksheet.addEventListener(
        superset.SupersetEventType.MarkSelectionChanged,
        async (changes) => {
          if (filteringMode === FILTERING_MODE_SELECTION) {
            // See if we can get all filters
            const _filters = await worksheets.reduce(async (acc, worksheet) => {
              const marks = await worksheet.getSelectedMarksAsync();
              //console.log('MARKS: ', marks);
              if (marks.data.length > 0) {
                const { data, columns } = marks.data[marks.data.length - 1];
                if (columns.length > 0) {
                  //const regex = /\w*\((.*)\)/gi;
                  const regex = /([a-zA-Z_\ \(\d\)]+)/gi;
                  const filters = columns
                    .map((column, idx) => {
                      const values = data.reduce((acc, cur) => {
                        if (cur.length > 0) {
                          acc.push(cur[idx].value);
                        }
                        return acc;
                      }, []);
                      return {
                        column: column.fieldName,
                        dataType: column.dataType,
                        include: values,
                      };
                    })
                    .filter((item) => {
                      //return !item.column.match(regex);
                      return item.column.match(regex);
                    });
                  const arr = await acc;
                  return arr.concat(filters);
                }
              }
              return await acc;
            }, []);
            console.info(FILTERING_MODE_SELECTION, _filters);

            setFilters(_filters);
          }
        }
      );
      unregisterHandlerFunctions.push(unregisterHighlightHandlerFunction);
    });

    map.getControls().forEach(function (control) {
      if (control instanceof Geocoder) {
        console.dir(control);
        console.log("ADDING GEOCODER EVENT LISTENERS");
        control.on("addresschosen", function (evt) {
          control.getSource().clear();
        });
      }
    });
  }, []);

  // Initilize everything on load
  useEffect(() => {
    // Use API to get datasource tables and connection info
    const configure = () => {
      superset.extensions.ui
        .displayDialogAsync(`${window.location.href}configure`, "", {
          height: 550,
          width: 420,
        })
        .then((closePayload) => {
          // Check for saved endpoint
          let endpoint = superset.extensions.settings.get("endpoint");
          if (endpoint != null) {
            setEndpoint(endpoint);
          }

          // Check for saved username
          let username = superset.extensions.settings.get("username");
          if (username != null) {
            setUsername(username);
          }

          // Check for saved password
          let password = superset.extensions.settings.get("password");
          if (password != null) {
            setPassword(password);
          }

          // Check for saved basemap url
          let basemapUrl = superset.extensions.settings.get("basemapUrl");
          if (basemapUrl != null) {
            setBasemapUrl(basemapUrl);
          }

          // Check for saved mapbox api url
          let mapboxApiKey = superset.extensions.settings.get("mapboxApiKey");
          if (mapboxApiKey != null) {
            setMapboxApiKey(mapboxApiKey);
          }

          // Check for saved xyzTileServiceTemplate
          let xyzTileServiceTemplate = superset.extensions.settings.get("xyzTileServiceTemplate");
          if (xyzTileServiceTemplate != null) {
            setXyzTileServiceTemplate(xyzTileServiceTemplate);
          }          

          // Check for saved demo mode
          let demoMode = superset.extensions.settings.get("demoMode");
          if (demoMode != null) {
            setDemoMode(demoMode);
          }

          // Check for saved filtering mode
          let filteringMode = superset.extensions.settings.get("filteringMode");
          updateFilteringMode(filteringMode);
        })
        .catch((error) => {
          console.error("error", error);
        });
    };

    superset.extensions.initializeAsync({ configure: configure }).then(() => {
      let endpoint = superset.extensions?.settings?.get("endpoint") || null;
      console.log("initializing with endpoint: " + endpoint);
      if (!endpoint) {
        configure();
      }
      reloadConfigRef.current = true;

      // ensure that spatial parameters are reset to default values
      updateParameters({
        wkt: "POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))",
        wktviewport: "POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))",
      });
      savedWktValue = "POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90))";

      loadConfig();

      map.addOverlay(
        new OlOverlay({
          id: `info_${mapId}`,
          element: document.getElementById(`info_${mapId}`),
          autoPan: true,
          autoPanAnimation: {
            duration: 250,
          },
          positioning: "center-center",
          autoPanMargin: 70,
        })
      );
    });

    map.setTarget(`map_${mapId}`);
    return () => map.setTarget(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mergedDatasources = useMemo(
    (_) => {
      let mergedSources = [];
      if (demoMode === DEMO_MODE_ENABLED) {
        console.log("datasources: ", datasources);
        mergedSources = [...DEMO_DATASOURCES, ...datasources];
        return mergedSources;
      }
      return datasources;
    },
    [demoMode, datasources]
  );

  const updateLayerView = (layer, viewName) => {
    let newLayers = [...mapLayers];
    // find layer with matching id
    const index = newLayers.findIndex((item) => item.id === layer.id);
    if (index == -1) {
      console.error("Could not find layer with id: ", layer.id, layer.label);
      return;
    }
    const newLayer = {
      ...newLayers[index],
      kineticaSettings: {
        ...newLayers[index].kineticaSettings,
        view: viewName,
      },
    };
    setMapLayers((oldLayers) => {
      const newLayers = [...oldLayers];
      newLayers[index] = newLayer;
      return newLayers;
    });
  };

  const updateLayer = (layer) => {
    console.log(
      "updating layer: ",
      layer,
      selectedLayer.op,
      selectedLayer.index
    );
    let newLayers = [...mapLayers];
    const origLayer = mapLayers[selectedLayer.index];

    if (layer?.id !== "0000") {
      layer.kineticaSettings = {
        ...layer.kineticaSettings,
      };
      // Make sure all other layers use the baseLayers baseTable and view
      layer.kineticaSettings.baseTable =
        mapLayers[0].kineticaSettings.baseTable;
      layer.kineticaSettings.view = mapLayers[0].kineticaSettings.view;
      layer.kineticaSettings.longitude =
        mapLayers[0].kineticaSettings.longitude;
      layer.kineticaSettings.latitude = mapLayers[0].kineticaSettings.latitude;
      layer.kineticaSettings.wkt = mapLayers[0].kineticaSettings.wkt;
      layer.kineticaSettings.dataType = mapLayers[0].kineticaSettings.dataType;
    }

    // layer settings
    if (selectedLayer.op === "edit") {
      newLayers[selectedLayer.index] = layer;
    } else if (selectedLayer.op === "add") {
      newLayers.push(layer);
    }

    if (origLayer?.id === "0000") {
      // If there are spatial column changes, we need to sync the spatial changes to all other layers for now
      if (
        origLayer.kineticaSettings.longitude !=
          layer.kineticaSettings.longitude ||
        origLayer.kineticaSettings.latitude !=
          layer.kineticaSettings.latitude ||
        origLayer.kineticaSettings.wkt != layer.kineticaSettings.wkt
      ) {
        newLayers = newLayers.map((newLayer) => {
          return {
            ...newLayer,
            kineticaSettings: {
              ...newLayer.kineticaSettings,
              latitude: layer.kineticaSettings.latitude,
              longitude: layer.kineticaSettings.longitude,
              wkt: layer.kineticaSettings.wkt,
              dataType: layer.kineticaSettings.dataType,
            },
          };
        });
      }
    }

    // update layersFilterText
    const layerIds = newLayers.map((layer) => layer.id);
    layerIds.sort();
    let newLayersFilterText = "";
    layerIds.forEach((id) => {
      const kineticaSettings = newLayers.find(
        (layer) => layer.id === id
      ).kineticaSettings;
      if (kineticaSettings?.filter?.enabled) {
        if (newLayersFilterText.length > 0) {
          newLayersFilterText += " AND ";
        }
        newLayersFilterText += `${kineticaSettings.filter.text}`;
      }
    });
    setLayersFilterText(newLayersFilterText);

    // Update control panel form field
    updateControlPanel({ Layers: JSON.stringify(newLayers) });

    // finally... update the map layers
    setMapLayers(newLayers);
    cachedSettings.push({
      name: "mapLayers",
      value: JSON.stringify(newLayers),
      op: "set",
    });
  };

  const updateLayers = (newLayers) => {
    setMapLayers(newLayers);
    cachedSettings.push({
      name: "mapLayers",
      value: JSON.stringify(newLayers),
      op: "set",
    });
  };

  useEffect(() => {
    if (isConfigLoaded) {
      // base layer must have lng/lat/wkt/baseTable/view at a minimum
      const baseLayer = mapLayers.find((layer) => layer.id === "0000");
      if (
        !(
          (baseLayer?.kineticaSettings?.longitude &&
            baseLayer?.kineticaSettings?.latitude) ||
          baseLayer?.kineticaSettings?.wkt
        )
      ) {
        setSelectedLayer({ op: "edit", index: 0 });
      }
    }
  }, [isConfigLoaded]);

  useEffect(() => {
    console.log("mapLayers changed: ", map.getLayers());

    // Get a reference to the OpenLayers vector tiles layer
    const vectorTilesLayer = map.getLayers().getArray()[0];

    // Get the map layer IDs in the desired order
    const orderedLayerIds = mapLayers.map((layer) => layer.id);
    console.log("orderedLayerIds: ", orderedLayerIds);

    // Create a new array to hold the layers in the correct order
    const orderedLayers = [vectorTilesLayer];

    // Loop through the ordered layer IDs and find the matching layer in the OpenLayers map
    orderedLayerIds.forEach((layerId) => {
      const layer = map
        .getLayers()
        .getArray()
        .find((layer) => layer["id"] === layerId);
      if (layer) {
        orderedLayers.push(layer);
      }
    });
    console.log("orderedLayers: ", orderedLayers);

    // remove all layers from map
    map.getLayers().clear();

    // Set the OpenLayers map layers to the ordered array
    map.setLayerGroup(
      new Group({
        layers: orderedLayers,
      })
    );

    // reregister for multimap when mapLayers change
    multimapUnregisterHandlerFunctions.forEach((unregisterHandlerFunction) => {
      unregisterHandlerFunction();
    });
    multimapUnregisterHandlerFunctions = [];
    registerMultimapParameterListener();
  }, [mapLayers]);

  useEffect(() => {
    if (!hasRegisteredForMultimap) {
      const { latitude, longitude, wkt } = mapLayers[0].kineticaSettings;
      if (
        !(
          gpudb &&
          selectedDatasource &&
          ((longitude !== "" && latitude !== "") || wkt !== "")
        )
      ) {
        return;
      }

      registerMultimapParameterListener();
      setHasRegisteredForMultimap(true);
    }
  }, [gpudb, selectedDatasource, mapLayers[0].kineticaSettings]);

  // get column bin range
  const getColumnBinRange = async (fieldName) => {
    if (selectedDatasource) {
      const { worksheets } = superset.extensions.dashboardContent.dashboard;
      for (const worksheet of worksheets) {
        const summaryData = await worksheet.getSummaryDataAsync();
        console.log(
          "getColumnBinRange: summaryData: ",
          worksheet.name,
          summaryData
        );

        // find index of summaryData.columns that contains 'fieldName (bin)'
        const binIndex = summaryData.columns.findIndex((obj) =>
          obj.fieldName.includes(fieldName)
        );
        console.log("binIndex: ", binIndex);

        if (binIndex === -1) {
          continue;
        }

        let range;
        const dataValue = summaryData.data[0][binIndex];
        console.log("dataValue: ", dataValue);
        const formattedValue = parseFloat(dataValue.formattedValue);
        const nativeValue = parseFloat(dataValue.nativeValue);
        if (isNaN(formattedValue) || isNaN(nativeValue)) {
          continue;
        }

        range = async () => {
          if (nativeValue === 0) {
            return await findColumnBinRangeByFilter(fieldName);
          } else {
            return Math.abs(formattedValue / nativeValue);
          }
        };
        const _range = await range();
        console.log("range: ", _range);

        // add [filter.fieldName]: bins to binRanges
        const newBinRanges = { ...binRanges };
        newBinRanges[`${fieldName} (bin)`] = [0, _range, nativeValue];
        setBinRanges(newBinRanges);
        return newBinRanges;
      }
    }
  };

  const findColumnBinRangeByFilter = async (fieldName) => {
    if (selectedDatasource) {
      const { worksheets } = superset.extensions.dashboardContent.dashboard;
      for (const worksheet of worksheets) {
        const filters = await worksheet.getFiltersAsync();
        console.log(
          "findColumnBinRangeByFilter: filters: ",
          worksheet.name,
          filters
        );

        // find index of filters that contains 'fieldName (bin)'
        const binIndex = filters.findIndex((obj) =>
          obj.fieldName.includes(fieldName)
        );
        console.log("binIndex: ", binIndex);

        if (binIndex === -1) {
          continue;
        }

        let range;
        const dataValue = filters[binIndex];
        console.log("dataValue: ", dataValue);
        if (!dataValue?.appliedValues?.[0]) {
          continue;
        }
        const formattedValue = parseFloat(
          dataValue.appliedValues[0].formattedValue
        );
        const nativeValue = parseFloat(dataValue.appliedValues[0].nativeValue);
        if (isNaN(formattedValue) || isNaN(nativeValue)) {
          continue;
        }

        if (nativeValue === 0) {
          console.log("binRanges: ", binRanges);
          if (binRanges?.[`${fieldName} (bin)`]) {
            range = Math.abs(
              binRanges[`${fieldName} (bin)`][1] -
                binRanges[`${fieldName} (bin)`][0]
            );
          } else {
            setError(
              "Warning",
              `Unable to find bin ranges for ${fieldName} (bin).  Please select a different bin, before reselecting this one.`
            );
            return;
          }
        } else {
          range = Math.abs(formattedValue / nativeValue);
        }

        console.log("range: ", range);
        return range;
      }
    }
  };

  const handleErrorMsgClick = (func) => {
    try {
      func();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileUpload = (event) => {
    console.log("handleFileUpload: ", event.target.files[0], twbFile);
    const file = event.target.files[0];
    inputFile.current.value = null; // clear the input field
    setTwbFile(file);
  };

  // render starts here
  console.log("RENDER: selectedLayer: ", selectedLayer);
  console.log("RENDER: mapLayers: ", mapLayers);
  console.log("RENDER: showLayersPanel: ", showLayersPanel);

  if (cachedSettings.length > 0) {
    asyncSaveSettings();
  }

  // Render all kinetica wms layers
  const wmsApiUrl = selectedDatasource?.apiUrl ?? endpoint + "/wms";
  const layersRender =
    map && wmsApiUrl && selectedDatasource && username && password && mapLayers
      ? mapLayers.map((lyr, index) => (
          <KWmsOlLayer
            key={lyr.id}
            index={index}
            label={lyr.label}
            id={lyr.id}
            map={map}
            kineticaSettings={lyr.kineticaSettings}
            visible={lyr.visible}
            opacity={lyr.opacity}
            wmsApiUrl={wmsApiUrl}
            authUsername={username}
            authPassword={password}
            setError={setError}
            datasource={selectedDatasource}
          />
        ))
      : null;

  // format error message
  const formatErrorMessage = (error) => {
    let lines = [];
    for (const key in error) {
      if (error[key] && error[key].customHtml) {
        lines.push(error[key].customHtml);
      } else if (error[key] && error[key].text && error[key].text.length > 0) {
        lines.push(
          <div key={key} style={{ width: "95%" }}>
            {key}: {error[key].text}
          </div>
        );
      }
    }
    return lines;
  };

  return (
    <div>
      <div className="config_header">
        <Button
          variant="light"
          onClick={() => {
            setShowLayersPanel(!showLayersPanel);
            closeInfo();
          }}
          style={{ width: "150px" }}
        >
          <Stack /> {showLayersPanel ? "  Hide " : "  Show "} Layers
        </Button>
        {count >= 0 && (
          <>
            <br />
            <Badge
              variant="secondary"
              style={{ width: "150px", padding: "5px", fontSize: "11px" }}
            >
              Records: {thousands_separators(count)}
            </Badge>
          </>
        )}
        <br />
        <Badge
          style={{
            width: "150px",
            padding: "5px",
            fontSize: "11px",
            color: "#999999",
            backgroundColor: "transparent",
          }}
        >
          Powered by{" "}
          <a
            href="https://www.kinetica.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Kinetica
          </a>
        </Badge>
      </div>
      {!document.querySelector(`[aria-label="Layers"]`) && (
        <div className="draw">
          <DrawButton
            map={map}
            drawMode={cursorMode === CURSOR_FREEHAND_DRAW}
            drawType={drawType}
            drawUndo={drawUndo}
            setDrawMode={(isDrawMode) => {
              if (isDrawMode) {
                setFilterByViewportMode(!isDrawMode);
                setCursorMode(CURSOR_FREEHAND_DRAW);
              } else {
                setCursorMode(CURSOR_INFO);
              }
            }}
            setDrawType={(dType) => {
              setDrawType(dType);
            }}
            setDrawUndo={(drawUndoRet) => {
              if (drawUndoRet) {
                DrawLayer.getSource().clear();
                setDrawnFeatures([]);

                updateParameters({
                  wkt: "POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90)) ",
                });
                setDrawUndo(true);

                const { longitude, latitude } = mapLayers[0].kineticaSettings;
                resetDataMask(longitude, latitude);
                return;
              }
            }}
          />
        </div>
      )}
      {!document.querySelector(`[aria-label="Layers"]`) && (
        <div className="viewport">
          <ViewportButton
            filterByViewportMode={filterByViewportMode}
            setFilterByViewportMode={(value) => {
              if (value) {
                DrawLayer.getSource().clear();
                setDrawnFeatures([]);

                updateParameters({
                  wkt: "POLYGON((-180 -90, 180 -90, 180 90, -180 90, -180 -90)) ",
                });
                setDrawUndo(true);

                const { longitude, latitude } = mapLayers[0].kineticaSettings;
                resetDataMask(longitude, latitude);

                setCursorMode(CURSOR_INFO);
                setDrawType("");
              } else {
                const { longitude, latitude } = mapLayers[0].kineticaSettings;
                resetDataMask(longitude, latitude);
              }
              setFilterByViewportMode(value);
            }}
          />
        </div>
      )}
      {/* TODO: Info can come from a layer's datasource and calculated fields. Pass in a context object instead? */}
      <Info
        id={mapId}
        gpudb={gpudb}
        table={infoTable}
        columns={selectedDatasource?.table?.columns || []}
        calculatedField={
          mapLayers?.[0].kineticaSettings?.cbStyleOptions?.calculatedField ||
          null
        }
        calculatedFieldName={
          mapLayers?.[0].kineticaSettings?.cbStyleOptions
            ?.calculatedFieldName || null
        }
        width={width}
        coordinate={infoCoordinate}
        close={closeInfo}
      />
      <div id={`map_${mapId}`} className="map" style={{width, height}}></div>
      {layersRender}
      <OlDrawer
        map={map}
        drawType={drawType}
        drawComplete={handleDrawMapClick}
      />
      {showLayersPanel && (
        <LayersPanel
          mapLayers={mapLayers}
          setMapLayers={setMapLayers}
          setSelectedLayer={setSelectedLayer}
          selectedLayer={selectedLayer}
          datasource={selectedDatasource}
          updateLayer={updateLayer}
          updateLayers={updateLayers}
          basemapUrl={basemapUrl}
        />
      )}
      {selectedLayer.op === "edit" && selectedLayer.index >= 0 && (
        <MapSettings
          // Global
          gpudb={gpudb}
          selectedDatasource={selectedDatasource}
          datasources={mergedDatasources}
          setDatasource={setSelectedDatasource}
          saveSettings={saveSettings}
          setError={setError}
          layer={mapLayers[selectedLayer.index]}
          updateLayer={updateLayer}
          sqlBase={sqlBase}
          close={() => {
            setSelectedLayer({ op: "none", index: 0 });
            closeInfo();
          }}
        />
      )}
      {selectedLayer.op === "add" && (
        <MapSettings
          // Global
          gpudb={gpudb}
          selectedDatasource={selectedDatasource}
          datasources={mergedDatasources}
          setDatasource={setSelectedDatasource}
          saveSettings={saveSettings}
          setError={setError}
          layer={{}}
          updateLayer={updateLayer}
          sqlBase={sqlBase}
          close={() => {
            setSelectedLayer({ op: "none", index: 0 });
            closeInfo();
          }}
        />
      )}
      {selectedLayer.op === "edit" && selectedLayer.index === -1 && (
        <MapSettings
          // Global
          gpudb={gpudb}
          selectedDatasource={selectedDatasource}
          datasources={mergedDatasources}
          setDatasource={setSelectedDatasource}
          saveSettings={saveSettings}
          setError={setError}
          updateLayer={updateLayer}
          sqlBase={sqlBase}
          close={() => {
            setSelectedLayer({ op: "none", index: 0 });
            closeInfo();
          }}
        />
      )}
      <MissingParameters
        show={areParametersMissing}
        close={() => {
          setAreParametersMissing(false);
        }}
      />
      {errorMsg && formatErrorMessage(errorMsg).length > 0 && (
        <div
          style={{
            backgroundColor: errorMsg["Warning"] ? "#d8a723" : "#ff000099",
            color: "#ffffff",
            position: "absolute",
            margin: "11px 150px 20px 75px",
            padding: "7px 10px",
            top: 0,
            borderRadius: 3,
            width: "calc(100% - 250px)",
          }}
          onClick={() => {
            console.log("error msg click", errorMsg);
            handleErrorMsgClick(errorMsg.func);
          }}
        >
          <button
            style={{
              backgroundColor: "transparent",
              border: "none",
              color: "#ffffff",
              position: "absolute",
              top: "5px",
              right: "5px",
              cursor: "pointer",
            }}
            onClick={() => {
              setErrorMsg({}); // clear all errors
            }}
          >
            X
          </button>
          {formatErrorMessage(errorMsg)}
        </div>
      )}
      <div hidden>
        <a href="#" onClick={() => inputFile.current.click()}>
          Sync Metadata
        </a>
        <input type="file" ref={inputFile} onChange={handleFileUpload} />
      </div>
      {twbFile && (
        <TwbContext
          twb={twbFile}
          setError={setError}
          setCalculatedFields={setCalculatedFields}
        />
      )}
    </div>
  );
}

export default Map;
