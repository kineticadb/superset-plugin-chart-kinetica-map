import React, { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  Dropdown,
  DropdownButton,
} from "react-bootstrap";
import {
  ArrowCounterclockwise,
  Funnel,
  FunnelFill,
} from "react-bootstrap-icons";
import { ChromePicker } from "react-color";
import {
  RENDER_TYPE_LABELS,
  DATA_TYPE_LABELS,
  COLORMAPS,
  DEFAULT_COLORMAP,
  DEFAULT_FILL_COLOR,
  DEFAULT_BORDER_COLOR,
  DEFAULT_OPACITY,
  DEFAULT_BLUR_RADIUS,
  DEFAULT_HEATMAP_ATTR,
  DEFAULT_POINT_SIZE,
} from "../constants";
import ClassbreakStylingOptions from "./ClassbreakStylingOptions";
import CustomMeasureEditor from "./CustomMeasureEditor";
import FilterEditor from "./FilterEditor";
import { gradient } from "./ColorGradient";
import { getConsole } from "../util";

import "bootstrap/dist/css/bootstrap.min.css";

const console = getConsole();

function MapSettings(props) {
  const { datasources, sqlBase, close } = props;
  console.log("MapSettings: props: ", props);

  // Global
  const [datasource, setDatasource] = useState(props.selectedDatasource);
  const [showFillPicker, setShowFillPicker] = useState(false);
  const [showBorderPicker, setShowBorderPicker] = useState(false);
  const [isHeatmapBehaviorEditorOpen, setIsHeatmapBehaviorEditorOpen] =
    useState(false);
  const [isFilterEditorOpen, setIsFilterEditorOpen] = useState(false);

  const generateRandomAlphaNumeric = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 4; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    return result;
  };

  // Per Layer
  const [id] = useState(props.layer?.id || generateRandomAlphaNumeric());
  const [label, setLabel] = useState(props.layer?.label || "New Layer");
  const [visible, setVisible] = useState(
    props.layer?.visible === undefined ? true : props.layer?.visible
  );
  const [showLegend, setShowLegend] = useState(
    props.layer?.showLegend === undefined ? true : props.layer?.showLegend
  );
  const [opacity, setOpacity] = useState(
    parseInt(props.layer?.opacity) || DEFAULT_OPACITY
  );
  const [renderType, setRenderType] = useState(
    props.layer?.kineticaSettings?.renderType || "heatmap"
  );
  const [dataType, setDataType] = useState(
    props.layer?.kineticaSettings?.dataType || "point"
  );
  const [longitude, setLongitude] = useState(
    props.layer?.kineticaSettings?.longitude || ""
  );
  const [latitude, setLatitude] = useState(
    props.layer?.kineticaSettings?.latitude || ""
  );
  const [wkt, setWkt] = useState(props.layer?.kineticaSettings?.wkt || "");
  const [blurRadius, setBlurRadius] = useState(
    parseInt(props.layer?.kineticaSettings?.blurRadius) || DEFAULT_BLUR_RADIUS
  );
  const [heatmapAggregation, setHeatmapAggregation] = useState(
    props.layer?.kineticaSettings?.heatmapAggregation || "COUNT"
  );
  const [heatmapAttr, setHeatmapAttr] = useState(
    props.layer?.kineticaSettings?.heatmapAttr || DEFAULT_HEATMAP_ATTR
  );
  const [pointSize, setPointSize] = useState(
    parseInt(props.layer?.kineticaSettings?.pointSize) || DEFAULT_POINT_SIZE
  );
  const [colormap, setColormap] = useState(
    props.layer?.kineticaSettings?.colormap || DEFAULT_COLORMAP
  );
  const [fillColor, setFillColor] = useState(
    props.layer?.kineticaSettings?.fillColor || DEFAULT_FILL_COLOR
  );
  const [borderColor, setBorderColor] = useState(
    props.layer?.kineticaSettings?.borderColor || DEFAULT_BORDER_COLOR
  );
  const [width, setWidth] = useState(
    parseInt(props.layer?.kineticaSettings?.width) || 0
  );
  const [filter, setFilter] = useState(
    props.layer?.kineticaSettings?.filter || { enabled: false }
  );
  const [cbStyleOptions, setCBStyleOptions] = useState({
    column: datasource?.table?.columns[0]?.name || "",
    binCount: 4,
    allStyleColors: null,
    allStyleRanges: null,
    allStyleShapes: null,
    allStyleSizes: null,
    allStylePointAttributes: null,
    allStylePointAttributeSizes: null,
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
    columnValueOptions: [""],
    hasChanges: false,
    colorOpen: false,
    pickerActiveIndex: null,
    pickerColor: null,
    ...props.layer?.kineticaSettings?.cbStyleOptions,
  });
  const [cbColumnCache, setCBColumnCache] = useState({
    ...props.layer?.kineticaSettings?.cbColumnCache,
  });

  const handleStyleChanged = (stylingOptions) => {
    console.log("MapSettings.handleStyleChanged:");
    console.dir(stylingOptions);
    setCBStyleOptions({
      ...stylingOptions,
      hasChanges: false,
    });
  };

  const updateConfig = async () => {
    const newLayer = {};
    newLayer.id = id;
    newLayer.label = label;
    newLayer.visible = visible;
    newLayer.showLegend = showLegend;
    newLayer.opacity = parseInt(opacity);

    newLayer.kineticaSettings = {};
    if (datasource?.table?.schema && datasource?.table?.name) {
      newLayer.kineticaSettings.baseTable =
        props.layer?.kineticaSettings?.baseTable ||
        `${datasource.table.schema}.${datasource.table.name}`;
      newLayer.kineticaSettings.view =
        props.layer?.kineticaSettings?.view ||
        `${datasource.table.schema}.${datasource.table.name}`;
    }

    newLayer.kineticaSettings.renderType = renderType;
    newLayer.kineticaSettings.blurRadius = parseInt(blurRadius);
    newLayer.kineticaSettings.heatmapAggregation = heatmapAggregation;
    newLayer.kineticaSettings.heatmapAttr = heatmapAttr;
    newLayer.kineticaSettings.pointSize = parseInt(pointSize);
    newLayer.kineticaSettings.colormap = colormap;
    newLayer.kineticaSettings.fillColor = fillColor;
    newLayer.kineticaSettings.borderColor = borderColor;
    newLayer.kineticaSettings.width = parseInt(width);
    newLayer.kineticaSettings.filter = filter;

    newLayer.kineticaSettings.dataType = dataType;
    if (dataType === "point") {
      newLayer.kineticaSettings.longitude = longitude;
      newLayer.kineticaSettings.latitude = latitude;
      newLayer.kineticaSettings.wkt = "";
    } else if (dataType === "geo") {
      newLayer.kineticaSettings.longitude = "";
      newLayer.kineticaSettings.latitude = "";
      newLayer.kineticaSettings.wkt = wkt;
    }

    newLayer.kineticaSettings.cbStyleOptions = {};
    newLayer.kineticaSettings.cbStyleOptions = cbStyleOptions;
    newLayer.kineticaSettings.cbColumnCache = cbColumnCache;

    let settings = {
      wkt: wkt,
      longitude: longitude,
      latitude: latitude,
      dataType: dataType,
    };

    if (datasource) {
      props.setDatasource(datasource);
    } else {
      props.setDatasource(undefined);
    }

    props.saveSettings(settings);
    props.updateLayer(newLayer);
    close();
  };

  const findColumnMatch = (datasource, matches) => {
    return Object.keys(matches).reduce((acc, cur) => {
      if (acc === "") {
        let match;
        if (cur === "properties") {
          match = datasource.table.columns.find((column) => {
            return matches[cur].find((key) => column.properties?.includes(key));
          });
        } else if (cur === "includes") {
          match = datasource.table.columns.find((column) => {
            return matches[cur].find((key) =>
              column.name.toLowerCase().includes(key)
            );
          });
        } else if (cur === "startsWith") {
          match = datasource.table.columns.find((column) => {
            return matches[cur].find((key) =>
              column.name.toLowerCase().startsWith(key)
            );
          });
        }
        acc = match ? match.name : "";
      }
      return acc;
    }, "");
  };

  const resetDatasource = (datasource) => {
    setDatasource(datasource);

    // Intelligently preselect columns
    if (datasource?.table?.columns) {
      // Match WKT
      const wkt = findColumnMatch(datasource, {
        includes: ["wkt", "geometry", "geom"],
        startsWith: [],
        properties: ["wkt"],
      });
      console.log("resetDatasource wkt: ", wkt);
      setWkt(wkt);

      if (wkt !== "") {
        setDataType("geo");
        setLongitude("");
        setLatitude("");
      } else {
        setDataType("point");

        // Match longitude
        const longitude = findColumnMatch(datasource, {
          includes: ["longitude", "long", "lon"],
          startsWith: ["x"],
        });
        setLongitude(longitude);

        // Match latitude
        const latitude = findColumnMatch(datasource, {
          includes: ["latitude", "lat"],
          startsWith: ["y"],
        });
        setLatitude(latitude);
      }

      // Set initial cbStyling column
      const initialColumn = datasource.table.columns.find((column) => {
        return column.type !== "long";
      });

      if (initialColumn) {
        setCBStyleOptions((s) => ({
          ...s,
          hasChanges: true,
          binCount: 4,
          allStyleColors: null,
          allStyleRanges: null,
          allStyleShapes: null,
          column: initialColumn.name,
        }));
      }
    } else {
      setDataType("point");
      setRenderType("heatmap");
      setLongitude("");
      setLatitude("");
      setWkt("");
    }
  };

  useEffect(() => {
    if (latitude === "" && longitude === "" && wkt === "") {
      resetDatasource(props.selectedDatasource);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.selectedDatasource, latitude, longitude, wkt]);

  useEffect(() => {
    if (latitude !== "" || longitude !== "") {
      setWkt("");
    }
  }, [latitude, longitude]);

  useEffect(() => {
    if (wkt !== "") {
      setLatitude("");
      setLongitude("");
    }
  }, [wkt]);

  // update the default gradient shown based on current colormap selection
  // continues to show the gradient when switching renderTypes
  useEffect(() => {
    const svg = gradient(colormap, 1, true);
    const svgString = new XMLSerializer().serializeToString(svg);
    const el = document.getElementById("selected-colormap-gradient");
    if (el) {
      el.innerHTML = svgString;
    }
  }, [colormap, renderType]);

  const tables = [<option key={""}></option>].concat(
    datasources.map((datasource, idx) => {
      const { schema, name } = datasource?.table;

      let value = "";
      if (schema === "") {
        const tablePattern = /(.*)\s\((.*)\)/;
        const tableMatch = datasource?.name.match(tablePattern);
        if (tableMatch) {
          const table = tableMatch[1];
          const schema = tableMatch[2];
          value = `${schema}.${table}`;
        }
      } else {
        value = `${schema}.${name}`;
      }

      return (
        <option key={`${value}.${idx}`} value={datasource.name}>
          {value} - {datasource.name}
        </option>
      );
    })
  );

  const columns = datasource
    ? [<option key={""}></option>].concat(
        datasource.table.columns.map((column) => (
          <option key={column.name} value={column.name}>
            {column.name}
          </option>
        ))
      )
    : [<option key={""}></option>];

  const colormaps = COLORMAPS.map((color) => {
    const svg = gradient(color, 1, true);
    const svgString = new XMLSerializer().serializeToString(svg);
    return (
      <Dropdown.Item
        eventKey={color}
        key={color}
        onSelect={() => {
          setColormap(color);
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "row-reverse",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                width: "100%",
                height: "20px",
                marginBottom: "5px",
                paddingRight: "2px",
              }}
              dangerouslySetInnerHTML={{ __html: svgString }}
            ></span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              marginRight: "5px",
            }}
          >
            <span>{color}</span>
          </div>
        </div>
      </Dropdown.Item>
    );
  });

  const handleDatasourceChange = (e) => {
    const datasource = datasources.find(
      (datasource) => datasource.name === e.target.value
    );
    resetDatasource(datasource);
  };

  const handleToggleFillPicker = (e) => {
    setShowFillPicker(!showFillPicker);
  };
  const handleSelectFill = (color, e) => {
    setFillColor(color.hex.replace(/#/g, ""));
  };

  const handleToggleBorderPicker = (e) => {
    setShowBorderPicker(!showBorderPicker);
  };
  const handleSelectBorder = (color, e) => {
    setBorderColor(color.hex.replace(/#/g, ""));
  };

  const handleResetCustomColors = (e) => {
    setFillColor(DEFAULT_FILL_COLOR);
    setBorderColor(DEFAULT_BORDER_COLOR);
  };
  const handleResetColormap = (e) => {
    setColormap(DEFAULT_COLORMAP);
  };

  const popover = {
    position: "absolute",
    zIndex: "2",
  };
  const cover = {
    position: "fixed",
    top: "0px",
    right: "0px",
    bottom: "0px",
    left: "0px",
  };

  // render starts here

  // prevent ugly background panel from appearing on initial load
  // when endpoint and credentials are not yet set.
  // But, automatically pop-up the correct modal immediately when set.
  if (datasources.length === 0) {
    return <></>;
  }

  let title = "Map Settings";
  let showLayerSettings = false;
  if (props.layer) {
    title = "Map Settings";
    showLayerSettings = true;
  }
  return (
    <Modal
      dialogClassName="custom_dialog"
      show={true}
      onHide={close}
      backdrop={false}
      animation={false}
      size="lg"
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {!filter.enabled && (
            <Funnel onClick={() => setIsFilterEditorOpen(true)} />
          )}
          {filter.enabled && (
            <FunnelFill onClick={() => setIsFilterEditorOpen(true)} />
          )}
          {" " + title}
        </Modal.Title>
        {isFilterEditorOpen && (
          <div
            id="filter-editor"
            style={{
              position: "absolute",
              zIndex: 2000,
              top: "0px",
              left: "0px",
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <FilterEditor
              title={`Custom Filter: ${label}`}
              show={isFilterEditorOpen}
              filter={filter}
              setFilter={setFilter}
              close={() => setIsFilterEditorOpen(false)}
              sqlBase={sqlBase}
              gpudb={props.gpudb}
            />
          </div>
        )}
      </Modal.Header>
      <Modal.Body>
        <div style={{ padding: "10px", minHeight: "270px" }}>
          <Form>
            {!showLayerSettings && (
              <Form.Group as={Row} controlId="configTable">
                <Form.Label column sm="2">
                  Table
                </Form.Label>
                <Col sm="10">
                  <Form.Control
                    as="select"
                    onChange={handleDatasourceChange}
                    value={datasource ? datasource.name : ""}
                  >
                    {tables}
                  </Form.Control>
                </Col>
              </Form.Group>
            )}
            {datasource?.table?.columns && (
              <>
                {showLayerSettings && (
                  <Form.Group as={Row} controlId="layerLabel">
                    <Form.Label column sm="2">
                      Label<span style={{ color: "red" }}> *</span>
                    </Form.Label>
                    <Col sm="9">
                      <Form.Control
                        type="text"
                        value={label}
                        onChange={(e) => {
                          setLabel(e.target.value);
                        }}
                      />
                    </Col>
                  </Form.Group>
                )}
                {showLayerSettings && (
                  <Form.Group as={Row} controlId="configDataType">
                    <Form.Label column sm="2">
                      {props.layer.id === "0000" ? "Type/Style" : "Style"}
                    </Form.Label>
                    {props.layer.id === "0000" && (
                      <Col sm="4">
                        <ToggleButtonGroup
                          name="dataType"
                          style={{ width: "100%" }}
                          toggle
                        >
                          {Object.keys(DATA_TYPE_LABELS).map((type) => {
                            return (
                              <ToggleButton
                                key={type}
                                type="radio"
                                name="radio"
                                variant={
                                  dataType === type ? "primary" : "light"
                                }
                                value={type}
                                checked={dataType === type}
                                onChange={(e) => {
                                  setDataType((prev) => {
                                    if (
                                      prev === "point" &&
                                      e.target.value === "geo"
                                    ) {
                                      setHeatmapAggregation("COUNT");
                                      setHeatmapAttr("");
                                    }
                                    return e.target.value;
                                  });
                                }}
                              >
                                {DATA_TYPE_LABELS[type]}
                              </ToggleButton>
                            );
                          })}
                        </ToggleButtonGroup>
                      </Col>
                    )}
                    <Col sm="5">
                      <ToggleButtonGroup
                        name="renderType"
                        style={{ width: "100%" }}
                        toggle
                      >
                        {Object.keys(RENDER_TYPE_LABELS).map((type) => {
                          return (
                            <ToggleButton
                              key={type}
                              type="radio"
                              name="radio"
                              variant={
                                renderType === type ? "primary" : "light"
                              }
                              value={type}
                              checked={renderType === type}
                              onChange={(e) => setRenderType(e.target.value)}
                            >
                              {RENDER_TYPE_LABELS[type]}
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                    </Col>
                  </Form.Group>
                )}
                {showLayerSettings &&
                  dataType === "point" &&
                  props.layer.id === "0000" && (
                    <Form.Group as={Row} controlId="configColumnLonLat">
                      <Form.Label column sm="2">
                        Lon/Lat
                      </Form.Label>
                      <Col sm="4">
                        <Form.Control
                          as="select"
                          onChange={(e) => setLongitude(e.target.value)}
                          value={longitude}
                        >
                          {columns}
                        </Form.Control>
                      </Col>
                      <Col sm="4">
                        <Form.Control
                          as="select"
                          onChange={(e) => setLatitude(e.target.value)}
                          value={latitude}
                        >
                          {columns}
                        </Form.Control>
                      </Col>
                    </Form.Group>
                  )}
                {dataType === "geo" && (
                  <Form.Group as={Row} controlId="configColumnWkt">
                    <Form.Label column sm="2">
                      WKT
                    </Form.Label>
                    <Col sm="10">
                      <Form.Control
                        as="select"
                        onChange={(e) => {
                          setWkt(e.target.value);
                          //props.setWkt(e.target.value);
                        }}
                        value={wkt}
                      >
                        {columns}
                      </Form.Control>
                    </Col>
                  </Form.Group>
                )}
                {showLayerSettings && renderType === "heatmap" && (
                  <Form.Group as={Row} controlId="configColormap">
                    <Form.Label column sm="2">
                      Colormap
                    </Form.Label>
                    <Col sm="4">
                      <div style={{ width: "400px" }}>
                        <DropdownButton
                          style={{
                            width: "100%",
                            minWidth: "200px",
                            maxWidth: "400px",
                          }}
                          id="colormap-dropdown"
                          title={colormap}
                          variant="light"
                        >
                          <div
                            style={{
                              maxHeight: "300px",
                              overflowY: "scroll",
                            }}
                          >
                            {colormaps}
                          </div>
                        </DropdownButton>
                      </div>
                    </Col>
                    <Col sm="4">
                      <div id="selected-colormap-gradient"></div>
                    </Col>
                    <Col sm="2">
                      <Button
                        onClick={handleResetColormap}
                        variant="light"
                        block
                      >
                        <ArrowCounterclockwise size={16} />
                      </Button>
                    </Col>
                  </Form.Group>
                )}
                {showLayerSettings && renderType === "raster" && (
                  <Form.Group as={Row} controlId="configColors">
                    <Form.Label column sm="2">
                      Colors
                    </Form.Label>
                    <Col sm="4">
                      <Button
                        onClick={handleToggleFillPicker}
                        style={{
                          backgroundColor: `#${fillColor}`,
                          borderColor: `#${fillColor}`,
                        }}
                        block
                      >
                        Fill/Point
                      </Button>
                      {showFillPicker ? (
                        <div style={popover}>
                          <div style={cover} onClick={handleToggleFillPicker} />
                          <ChromePicker
                            color={`#${fillColor}`}
                            onChangeComplete={handleSelectFill}
                            disableAlpha={true}
                          />
                        </div>
                      ) : null}
                    </Col>
                    {dataType === "geo" ? (
                      <>
                        <Col sm="4">
                          <Button
                            onClick={handleToggleBorderPicker}
                            style={{
                              backgroundColor: `#${borderColor}`,
                              borderColor: `#${borderColor}`,
                            }}
                            block
                          >
                            Border/Line
                          </Button>
                          {showBorderPicker ? (
                            <div style={popover}>
                              <div
                                style={cover}
                                onClick={handleToggleBorderPicker}
                              />
                              <ChromePicker
                                color={`#${borderColor}`}
                                onChangeComplete={handleSelectBorder}
                                disableAlpha={true}
                              />
                            </div>
                          ) : null}
                        </Col>
                        <Col sm="2">
                          <Button
                            onClick={handleResetCustomColors}
                            variant="light"
                            block
                          >
                            <ArrowCounterclockwise size={16} />
                          </Button>
                        </Col>
                      </>
                    ) : (
                      <>
                        <Col sm="4">&nbsp;</Col>
                        <Col sm="2">
                          <Button
                            onClick={handleResetCustomColors}
                            variant="light"
                            block
                          >
                            <ArrowCounterclockwise size={16} />
                          </Button>
                        </Col>
                      </>
                    )}
                  </Form.Group>
                )}
                {showLayerSettings && renderType === "heatmap" && (
                  <div>
                    <Form.Group as={Row} controlId="configBlurRadius">
                      <Form.Label column sm="2">
                        Blur Size
                      </Form.Label>
                      <Col sm="8">
                        <div style={{ padding: "6px 0px" }}>
                          <Form.Control
                            type="range"
                            min="0"
                            max="20"
                            onChange={(e) => setBlurRadius(e.target.value)}
                            value={blurRadius}
                          />
                        </div>
                      </Col>
                      <Col sm="2">
                        {/* <Button
                          onClick={handleResetBlurRadius}
                          variant="light"
                          block
                        >
                          <ArrowCounterclockwise size={16} />
                        </Button> */}
                        <Form.Control
                          key={"blurRadiusText"}
                          as="input"
                          min="0"
                          max="20"
                          size="sm"
                          value={blurRadius}
                          style={{ width: "60px" }}
                          onChange={(e) => setBlurRadius(e.target.value)}
                        />
                      </Col>
                    </Form.Group>

                    {dataType === "point" && (
                      <Form.Group as={Row} controlId="configHeatmapAttr">
                        <Form.Label column sm="2">
                          Heatmap Behavior
                        </Form.Label>
                        <Col sm="8">
                          <div style={{ padding: "6px 0px" }}>
                            <Form.Control
                              type="text"
                              onChange={(e) =>
                                setHeatmapAttr(e.target.value.trim())
                              }
                              value={heatmapAttr}
                              disabled={true}
                            />
                            <h5
                              style={{
                                fontSize: "10px",
                                textAlign: "left",
                                marginTop: "5px",
                              }}
                            >
                              <a
                                href="https://docs.kinetica.com/7.1/api/rest/wms_rest/#wms-heatmap"
                                target="_blank"
                                rel="noreferrer"
                              >
                                Heatmap Behaviors(VAL_ATTR)
                              </a>
                            </h5>
                          </div>
                        </Col>

                        <div style={{ padding: "6px 0px", width: "15%" }}>
                          <Col xs="auto">
                            <Button
                              style={{
                                marginLeft: "0px",
                                marginBottom: "5px",
                              }}
                              onClick={() =>
                                setIsHeatmapBehaviorEditorOpen(true)
                              }
                            >
                              Edit
                            </Button>
                          </Col>
                        </div>
                      </Form.Group>
                    )}

                    {dataType === "point" && isHeatmapBehaviorEditorOpen && (
                      <Form.Group as={Row} controlId="configHeatmapAttr">
                        <Form.Label column sm="2">
                          Heatmap Behavior Editor
                        </Form.Label>
                        <Col sm="10">
                          <CustomMeasureEditor
                            show={isHeatmapBehaviorEditorOpen}
                            showAggregationOptions={true}
                            columns={datasource.table.columns}
                            fieldName={heatmapAggregation}
                            setFieldName={setHeatmapAggregation}
                            fieldContent={heatmapAttr}
                            setFieldContent={setHeatmapAttr}
                            clearField={() => {
                              setHeatmapAggregation("COUNT");
                              setHeatmapAttr("");
                            }}
                            documentation={{
                              description: "Reference Documentation",
                              url: "https://docs.kinetica.com/7.1/api/rest/wms_rest/#wms-heatmap",
                            }}
                            close={() => setIsHeatmapBehaviorEditorOpen(false)}
                          />
                        </Col>
                      </Form.Group>
                    )}
                  </div>
                )}
                {showLayerSettings && renderType === "raster" && (
                  <Form.Group as={Row} controlId="configPointSize">
                    <Form.Label column sm="2">
                      Point Size
                    </Form.Label>
                    <Col sm="8">
                      <div style={{ padding: "6px 0px" }}>
                        <Form.Control
                          type="range"
                          min="0"
                          max="20"
                          onChange={(e) =>
                            /*props.*/ setPointSize(e.target.value)
                          }
                          value={pointSize}
                        />
                      </div>
                    </Col>
                    <Col sm="2">
                      <Form.Control
                        key={"pointSizeText"}
                        as="input"
                        min="0"
                        max="20"
                        size="sm"
                        value={pointSize}
                        onChange={(e) =>
                          /*props.*/ setPointSize(e.target.value)
                        }
                      />
                    </Col>
                  </Form.Group>
                )}
                {showLayerSettings && (
                  <Form.Group as={Row} controlId="configOpacity">
                    <Form.Label column sm="2">
                      Opacity
                    </Form.Label>
                    <Col sm="8">
                      <div style={{ padding: "6px 0px" }}>
                        <Form.Control
                          type="range"
                          onChange={(e) => setOpacity(parseInt(e.target.value))}
                          value={opacity}
                        />
                      </div>
                    </Col>
                    <Col sm="2">
                      <Form.Control
                        key={"opacityText"}
                        as="input"
                        min="0"
                        max="20"
                        size="sm"
                        value={opacity}
                        onChange={(e) =>
                          setOpacity(parseInt(e.target.value) || "")
                        }
                      />
                    </Col>
                    {/* <Col sm="2">
                    <Button onClick={handleResetOpacity} variant="light" block>
                      <ArrowCounterclockwise size={16} />
                    </Button>
                  </Col> */}
                  </Form.Group>
                )}
                {showLayerSettings && renderType === "cb_raster" && (
                  // Add stuff here
                  <ClassbreakStylingOptions
                    cbStyleOptions={cbStyleOptions}
                    allColumns={datasource.table.columns}
                    gpudb={props.gpudb}
                    handleStyleChange={handleStyleChanged}
                    cbColumnCache={cbColumnCache}
                    setCBColumnCache={setCBColumnCache}
                    setError={props.setError}
                    //view={ props.layer?.kineticaSettings?.view || `${datasource.table.schema}.${datasource.table.name}`}
                    view={`${datasource.table.schema}.${datasource.table.name}`}
                  />
                )}
              </>
            )}
          </Form>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          type="submit"
          disabled={showLayerSettings && label.trim().length === 0}
          onClick={updateConfig}
          block
        >
          Update
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default MapSettings;
