import React from "react";
import { ColorGradient } from "./ColorGradient";
import { getConsole, isDateOrTimeBased } from "../util";

const console = getConsole();

export const LayerLegend = (props) => {
  const { id, kineticaSettings, allColumns } = props;

  if (!kineticaSettings) return null;

  const {
    dataType,
    renderType,
    colormap,
    fillColor,
    borderColor,
    heatmapAttr,
    cbStyleOptions,
  } = kineticaSettings;
  const {
    column,
    calculatedFieldName,
    allStyleColors,
    allStyleRanges,
    allStyleShapes,
    allStyleSizes,
    allStylePointAttributeRanges,
    allStylePointAttributeSizes,
  } = cbStyleOptions;

  // render starts here
  console.log("LayerLegend: ", id, kineticaSettings);

  let allStyleRangesArr;
  if (allStyleRanges) {
    if (allStyleRanges.length > 0) {
      allStyleRangesArr = allStyleRanges.split("|");
    } else {
      allStyleRangesArr = [];
    }
  }
  let allStyleColorsArr = allStyleColors?.split("|") || [];
  let allStyleShapesArr = allStyleShapes?.split("|") || [];
  let allStyleSizesArr = allStyleSizes?.split("|") || [];

  // convert allStyleSizesArr to numbers
  for (let i = 0; i < allStyleSizesArr.length; i++) {
    allStyleSizesArr[i] = parseInt(allStyleSizesArr[i]);
  }

  console.log("allStyleSizesArr: ", allStyleSizesArr);
  // get max size in allStyleSizesArr
  let max = 0;
  for (let i = 0; i < allStyleSizesArr.length; i++) {
    if (allStyleSizesArr[i] > max) {
      max = allStyleSizesArr[i];
    }
  }
  max = max * 2 + 2;
  if (max < 14 || cbStyleOptions?.pointAttribute?.length > 0) max = 14;
  console.log("max size: ", max);

  let rows = [];
  if (renderType === "cb_raster") {
    for (let index = 0; index < allStyleRangesArr.length; index++) {
      const text = allStyleRangesArr[index];
      const color = allStyleColorsArr[index];
      const shape = allStyleShapesArr[index];
      const size =
        cbStyleOptions?.pointAttribute?.length > 0
          ? 7
          : allStyleSizesArr[index];
      console.log("building rows: ", text, color, shape, size);

      // transform long integer to timestamp or datetime as necessary
      // TODO: need to test for 'date' and 'time' types
      let displayText = text;
      if (
        allColumns &&
        column &&
        isDateOrTimeBased(column, allColumns) &&
        text.includes(":")
      ) {
        let startDt = new Date(parseInt(text.split(":")[0]));
        let endDt = new Date(parseInt(text.split(":")[1]));
        displayText = `${startDt.toLocaleString()} - ${endDt.toLocaleString()}`;
      }

      const centerX = max / 2;
      const centerY = max / 2;
      const diamondPath = `M${centerX} ${centerY - size} L${
        centerX + size
      } ${centerY} L${centerX} ${centerY + size} L${
        centerX - size
      } ${centerY} Z`;
      console.log("diamondPath: ", diamondPath);

      const marginTopValue = max / 2 - 8 > 1 ? max / 2 - 8 : 1;

      rows.push(
        <>
          <div
            key={index}
            style={{
              display: "flex",
              flexDirection: "row",
              marginBottom: "3px",
              wordBreak: "break-all",
            }}
          >
            <div style={{ marginRight: "3px" }}>
              <div style={{ width: max + "px", height: max + "px" }}>
                <svg viewBox={`0 0 ${max} ${max}`}>
                  {shape === "circle" && (
                    <circle
                      cx={max / 2}
                      cy={max / 2}
                      r={size}
                      fill={`#${color}`}
                    />
                  )}
                  {shape === "square" && (
                    <rect
                      x={max / 2 - size}
                      y={max / 2 - size}
                      width={size * 2}
                      height={size * 2}
                      fill={`#${color}`}
                    />
                  )}
                  {shape === "diamond" && (
                    <path d={diamondPath} fill={`#${color}`} />
                  )}
                  {shape === "hollowcircle" && (
                    <circle
                      cx={max / 2}
                      cy={max / 2}
                      r={size}
                      fill="none"
                      stroke={`#${color}`}
                      strokeWidth="2"
                    />
                  )}
                  {shape === "hollowsquare" && (
                    <rect
                      x={max / 2 - size}
                      y={max / 2 - size}
                      width={size * 2}
                      height={size * 2}
                      fill="none"
                      stroke={`#${color}`}
                      strokeWidth="2"
                    />
                  )}
                  {shape === "hollowdiamond" && (
                    <path
                      d={diamondPath}
                      fill="none"
                      stroke={`#${color}`}
                      strokeWidth="2"
                    />
                  )}
                </svg>
              </div>
            </div>
            <div style={{ marginTop: `${marginTopValue}px` }}>
              {displayText}
            </div>
          </div>
        </>
      );
    }
  }

  let pointAttributeRows = [];
  if (
    renderType === "cb_raster" &&
    cbStyleOptions?.pointAttribute?.length > 0
  ) {
    let allStyleRangesArr;
    if (allStylePointAttributeRanges) {
      if (allStylePointAttributeRanges.length > 0) {
        allStyleRangesArr = allStylePointAttributeRanges.split("|");
      } else {
        allStyleRangesArr = [];
      }
    }
    let allStyleSizesArr = allStylePointAttributeSizes?.split("|") || [];

    // convert allStyleSizesArr to numbers
    for (let i = 0; i < allStyleSizesArr.length; i++) {
      allStyleSizesArr[i] = parseInt(allStyleSizesArr[i]);
    }

    console.log("allStyleSizesArr: ", allStyleSizesArr);
    // get max size in allStyleSizesArr
    let max = 0;
    for (let i = 0; i < allStyleSizesArr.length; i++) {
      if (allStyleSizesArr[i] > max) {
        max = allStyleSizesArr[i];
      }
    }
    max = max * 2 + 2;
    if (max < 14) max = 14;
    console.log("point attribute max size: ", max);

    for (let index = 0; index < allStyleRangesArr.length; index++) {
      const text = allStyleRangesArr[index];
      const size = allStyleSizesArr[index];
      console.log("building point attribute rows: ", text, size);

      // transform long integer to timestamp or datetime as necessary
      // TODO: need to test for 'date' and 'time' types
      let displayText = text;
      console.log("Legend cbStyleOptions: ", cbStyleOptions, props);
      if (
        allColumns &&
        cbStyleOptions?.pointAttribute &&
        isDateOrTimeBased(cbStyleOptions?.pointAttribute, allColumns) &&
        text.includes(":")
      ) {
        let startDt = new Date(parseInt(text.split(":")[0]));
        let endDt = new Date(parseInt(text.split(":")[1]));
        displayText = `${startDt.toLocaleString()} - ${endDt.toLocaleString()}`;
      }

      const marginTopValue = max / 2 - 8 > 1 ? max / 2 - 8 : 1;

      pointAttributeRows.push(
        <>
          <div
            key="{index}-point-attribute"
            style={{
              display: "flex",
              flexDirection: "row",
              marginBottom: "3px",
              wordBreak: "break-all",
            }}
          >
            <div style={{ marginRight: "3px" }}>
              <div style={{ width: max + "px", height: max + "px" }}>
                <svg viewBox={`0 0 ${max} ${max}`}>
                  <circle
                    cx={max / 2}
                    cy={max / 2}
                    r={size}
                    fill="none"
                    stroke="black"
                    strokeWidth="2"
                  />
                </svg>
              </div>
            </div>
            <div style={{ marginTop: `${marginTopValue}px` }}>
              {displayText}
            </div>
          </div>
        </>
      );
    }
  }

  let legend = (
    <>
      <div
        id="cb-raster-legend"
        style={{
          marginLeft: "2px",
          marginTop: "10px",
          display: "flex",
          flexDirection: "column",
          width: "95%",
        }}
      >
        {renderType === "cb_raster" && (
          <>
            <div
              style={{ fontSize: "12px", marginBottom: "3px", fontWeight: 550 }}
            >
              {calculatedFieldName
                ? calculatedFieldName
                : column.match(/^long\((.*)\)$/)
                ? column.match(/^long\((.*)\)$/)[1]
                : column}
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {rows}
            </div>
            {cbStyleOptions?.pointAttribute?.length > 0 && (
              <>
                <div
                  style={{
                    marginBottom: "3px",
                    marginTop: "5px",
                    fontWeight: 550,
                  }}
                >
                  {cbStyleOptions.pointAttribute}
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {pointAttributeRows}
                </div>
              </>
            )}
          </>
        )}
        {renderType === "raster" && dataType === "point" && (
          <div
            style={{
              width: "150px",
              height: "12px",
              marginTop: "5px",
              backgroundColor: `#${fillColor}`,
            }}
          ></div>
        )}
        {renderType === "raster" && dataType === "geo" && (
          <div
            style={{
              width: "150px",
              height: "12px",
              marginTop: "5px",
              backgroundColor: `#${fillColor}`,
              border: `2px solid #${borderColor}`,
            }}
          ></div>
        )}
        {renderType === "heatmap" && (
          <>
            <div style={{ width: "150px" }}>
              <ColorGradient id={id} colormap={colormap} />
            </div>
            {heatmapAttr && (
              <div
                id={`heatmap-gradient-${id}-text`}
                style={{ fontSize: "11px", marginTop: "3px" }}
              >
                {heatmapAttr}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <>
      <div key={`legend-layer-${id}`} className="legend-layer">
        {legend}
      </div>
    </>
  );
};
