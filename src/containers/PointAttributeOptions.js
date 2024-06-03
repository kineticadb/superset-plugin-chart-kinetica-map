import React, { useCallback, useState } from "react";
import {
  Modal,
  Form,
  Row,
  Col,
  Button,
  Container,
  Table,
} from "react-bootstrap";
import { X } from "react-bootstrap-icons";
import GPUdbHelper from "../vendor/GPUdbHelper";
import "react-datetime/css/react-datetime.css";
import Datetime from "react-datetime";
import { isDateOrTimeBased } from "../util";

function PointAttributeOptions(props) {
  const {
    getStringColumnValues,
    close,
    getColorRamp,
    handleStyleChange,
    gpudb,
    setError,
  } = props;

  const componentName = "PointAttributeOptions";
  const defaultBinCount = 4;
  const defaultSizeValue = 3;
  const defaultPointShape = "circle";

  const [stylingOptions, setStylingOptions] = useState({
    allStylePointAttributeBinCount:
      props.cbStyleOptions.allStylePointAttributeBinCount || defaultBinCount,
    allStylePointAttributeRanges:
      props.cbStyleOptions.allStylePointAttributeRanges || null,
    allStylePointAttributeSizes:
      props.cbStyleOptions.allStylePointAttributeSizes || defaultSizeValue,
    pointAttribute: props.cbStyleOptions.pointAttribute || null,
    pointAttributeValueOptions: props.cbStyleOptions
      .pointAttributeValueOptions || [""],
    selectedTheme: "Spectral",
  });

  const handleSaveStyles = () => {
    handleStyleChange(stylingOptions);
    setStylingOptions({
      ...stylingOptions,
      hasChanges: true,
    });
    close();
  };

  const handleDeleteStyles = () => {
    const newStyleOpts = {
      ...stylingOptions,
      hasChanges: true,
      pointAttribute: null,
      pointAttributeValueOptions: [""],
      allStylePointAttributeBinCount: defaultBinCount,
      allStylePointAttributeRanges: null,
      allStylePointAttributeSizes: defaultSizeValue,
    };
    setStylingOptions({newStyleOpts});
    handleStyleChange(newStyleOpts);
    close();
  };

  const isNumericColumn = useCallback(
    (column) => {
      const columnConfig = props.allColumns.find((c) => c.name === column);
      const pattern = /^char\d+/;
      return (
        columnConfig?.type !== "string" &&
        !columnConfig?.properties.some((item) => pattern.test(item))
      );
    },
    [props.allColumns]
  );

  const isTimestampColumn = useCallback(
    (column) => {
      const columnConfig = props.allColumns.find((c) => c.name === column);
      return (
        columnConfig?.properties.includes("timestamp") ||
        columnConfig?.properties.includes("datetime")
      );
    },
    [props.allColumns]
  );

  const getDefaultsColumn = useCallback(
    async (column, numBins, view, colorRamp) => {
      const aggColumns = [column, "count(*)"];

      try {
        console.log("isNumericColumn(column)", isNumericColumn(column));
        if (isNumericColumn(column)) {
          //TODO: Check if column min/max is already known/between 0-1
          const schema = view.split(".")[0];
          const table = view.split(".")[1];

          let newView = view;
          if (!isTimestampColumn(column)) {
            newView =
              schema +
              ".class_brk_" +
              table +
              "_" +
              Math.floor(Math.random() * 99999999);
            await gpudb.filter(view, newView, `ISNAN(${column}) = 0`, {
              ttl: "2",
            });
          }

          const resp = await gpudb.aggregate_statistics(
            newView,
            column,
            "mean,stdv,min,max",
            {}
          );

          let defaults;
          if (resp.stats.mean === "NaN" || resp.stats.stdv === "NaN") {
            defaults =
              GPUdbHelper.utils.createAutomaticEqualIntervalClassBreaks(
                resp.stats.min,
                resp.stats.max,
                numBins,
                colorRamp
              );
          } else {
            defaults =
              GPUdbHelper.utils.createAutomaticStdDevIntervalClassBreaks(
                resp.stats.min,
                resp.stats.max,
                resp.stats.mean,
                resp.stats.stdv,
                numBins,
                colorRamp
              );
          }
          const realBinCount = defaults.ranges.length || 1;
          defaults.shapes = new Array(Number(realBinCount)).fill(
            defaultPointShape
          );
          defaults.sizes = new Array(Number(realBinCount)).fill(
            defaultSizeValue
          );
          return defaults;

          // return await gpudb
          //   .aggregate_statistics(newView, column, "mean,stdv,min,max", {})
          //   .then((resp) => {
          //     let defaults;
          //     if (resp.stats.mean === "NaN" || resp.stats.stdv === "NaN") {
          //       defaults =
          //         GPUdbHelper.utils.createAutomaticEqualIntervalClassBreaks(
          //           resp.stats.min,
          //           resp.stats.max,
          //           numBins,
          //           colorRamp
          //         );
          //     } else {
          //       defaults =
          //         GPUdbHelper.utils.createAutomaticStdDevIntervalClassBreaks(
          //           resp.stats.min,
          //           resp.stats.max,
          //           resp.stats.mean,
          //           resp.stats.stdv,
          //           numBins,
          //           colorRamp
          //         );
          //     }
          //     const realBinCount = defaults.ranges.length || 1;
          //     defaults.shapes = new Array(Number(realBinCount)).fill(
          //       defaultPointShape
          //     );
          //     defaults.sizes = new Array(Number(realBinCount)).fill(
          //       defaultSizeValue
          //     );
          //     return defaults;
          //   });
        } else {
          const aggResults = await gpudb.aggregate_group_by(
            view,
            aggColumns,
            0,
            Number(numBins),
            {
              sort_order: "descending",
              sort_by: "value",
            }
          );

          let cbVals = aggResults.data.column_1
            .filter((value) => value != null)
            .sort();
          if (cbVals.length < 1) cbVals = [""];

          const realBinCount = cbVals.length || 1;
          const cbShapes = new Array(Number(realBinCount)).fill(
            defaultPointShape
          );
          const cbSizes = new Array(Number(realBinCount)).fill(
            defaultSizeValue
          );
          return {
            ranges: cbVals.join("|"),
            styles: cbVals
              .map((val, index) => {
                return colorRamp[index];
              })
              .join("|"),
            shapes: cbShapes.join("|"),
            sizes: cbSizes,
          };
        }
      } catch (e) {
        console.log("pkhunachak", e);
        setError(componentName, e.message);
        return {
          ranges: "",
          styles: "",
        };
      }
    },
    [isNumericColumn, isTimestampColumn, gpudb, setError]
  );

  const rangeReducer = (accumulator, currentValue, currentIndex) => {
    const splitValue = currentValue.length > 1;
    if (splitValue) {
      return accumulator === "" && currentIndex === 0
        ? `${currentValue[0]}:${currentValue[1]}`
        : accumulator + `|${currentValue[0]}:${currentValue[1]}`;
    } else {
      return accumulator === "" && currentIndex === 0
        ? `${currentValue[0]}`
        : accumulator + `|${currentValue[0]}`;
    }
  };

  const handleStyleChangedEvent = useCallback(
    async (
      column,
      binCount,
      cbRanges,
      cbSizes,
      columnValueOptions,
      initialSet
    ) => {
      let ranges = cbRanges;
      if (Array.isArray(ranges)) {
        ranges = cbRanges.reduce(rangeReducer, "");
      }
      console.log("Ranges: " + ranges + ", Sizes: " + cbSizes);
      let sizes = typeof cbSizes === "string" ? cbSizes : cbSizes.join("|");

      if (columnValueOptions != null) {
        setStylingOptions((s) => ({
          ...s,
          allStylePointAttributeBinCount: binCount,
          allStylePointAttributeRanges: ranges,
          allStylePointAttributeSizes: sizes,
          pointAttribute: column,
          pointAttributeValueOptions: columnValueOptions,
          hasChanges: initialSet ? false : true,
        }));
      } else {
        setStylingOptions((s) => ({
          ...s,
          allStylePointAttributeBinCount: binCount,
          allStylePointAttributeRanges: ranges,
          allStylePointAttributeSizes: sizes,
          pointAttribute: column,
          hasChanges: initialSet ? false : true,
        }));
      }
    },
    [setStylingOptions]
  );

  const handleChangeStyle = async (column, binCount, view) => {
    const { selectedTheme } = stylingOptions;

    const colorRamp = getColorRamp(binCount, selectedTheme);
    let { ranges, sizes } = await getDefaultsColumn(
      column,
      binCount,
      view,
      colorRamp
    );

    //column, binCount, cbRanges, cbSizes, columnValueOptions, initialSet
    console.log("Handling Change Style: ", column, binCount, ranges, sizes);
    handleStyleChangedEvent(column, binCount, ranges, sizes);
  };

  const handleBinChange = async (event) => {
    const binCount = event.target.value;

    handleChangeStyle(stylingOptions.pointAttribute, binCount, props.view);
  };

  const defaultStyleForColumn = async () => {
    const { pointAttribute, selectedTheme } = stylingOptions;
    //TODO: Update with view logic
    //const view = getViewFromProps(this.props);

    const colorRamp = getColorRamp(defaultBinCount, selectedTheme);
    const cbDefaults = await getDefaultsColumn(
      pointAttribute,
      defaultBinCount,
      props.view,
      colorRamp
    );

    let stringVals = null;
    if (isNumericColumn(pointAttribute) === false) {
      stringVals = await getStringColumnValues(pointAttribute, props.view);
    }

    handleStyleChangedEvent(
      pointAttribute,
      defaultBinCount,
      cbDefaults.ranges,
      cbDefaults.sizes,
      stringVals
    );
  };

  const handleSelectColumn = async (event) => {
    const { allStylePointAttributeBinCount } = stylingOptions;

    const column = event.target.value;
    console.log(`New Selected Column: ${column}`);
    setStylingOptions((s) => ({
      ...s,
      pointAttribute: column,
    }));

    let cbDefaults;
    const colorRamp = getColorRamp(
      allStylePointAttributeBinCount,
      stylingOptions.selectedTheme
    );
    cbDefaults = await getDefaultsColumn(
      column,
      allStylePointAttributeBinCount,
      props.view,
      colorRamp
    );
    console.log("cbDefaults", cbDefaults);

    let stringVals = null;
    if (isNumericColumn(column) === false) {
      stringVals = await getStringColumnValues(column, props.view);
    }

    //column, binCount, cbRanges, cbSizes, columnValueOptions, initialSet
    handleStyleChangedEvent(
      column,
      allStylePointAttributeBinCount,
      cbDefaults.ranges,
      cbDefaults.sizes,
      stringVals,
      false
    );
  };

  const changeStringValueAtIndex = async (newValue, classIndex) => {
    const {
      pointAttribute,
      allStylePointAttributeBinCount,
      allStylePointAttributeRanges,
      allStylePointAttributeSizes,
    } = stylingOptions;

    let allStylePointAttributeRangesArr;
    if (allStylePointAttributeRanges) {
      if (allStylePointAttributeRanges.length > 0) {
        allStylePointAttributeRangesArr =
          allStylePointAttributeRanges.split("|");
      } else {
        allStylePointAttributeRangesArr = [];
      }
    }

    allStylePointAttributeRangesArr[classIndex] = newValue;
    allStylePointAttributeRangesArr = allStylePointAttributeRangesArr.join("|");

    handleStyleChangedEvent(
      pointAttribute,
      allStylePointAttributeBinCount,
      allStylePointAttributeRangesArr,
      allStylePointAttributeSizes
    );
  };

  const changeNumericValueAtIndex = async (
    newValue,
    classIndex,
    rangeIndex
  ) => {
    const {
      pointAttribute,
      allStylePointAttributeBinCount,
      allStylePointAttributeRanges,
      allStylePointAttributeSizes,
    } = stylingOptions;

    let allStylePointAttributeRangesArr;
    if (
      allStylePointAttributeRanges &&
      allStylePointAttributeRanges.length > 0
    ) {
      allStylePointAttributeRangesArr = allStylePointAttributeRanges.split("|");
      allStylePointAttributeRangesArr = allStylePointAttributeRangesArr.map(
        (range) => range.split(":")
      );
    }

    allStylePointAttributeRangesArr[classIndex][rangeIndex] = newValue;
    if (rangeIndex === 0 && classIndex > 0) {
      allStylePointAttributeRangesArr[classIndex - 1][1] = newValue;
    } else if (
      rangeIndex === 1 &&
      classIndex < allStylePointAttributeRangesArr.length - 1
    ) {
      allStylePointAttributeRangesArr[classIndex + 1][0] = newValue;
    }

    handleStyleChangedEvent(
      pointAttribute,
      allStylePointAttributeBinCount,
      allStylePointAttributeRangesArr,
      allStylePointAttributeSizes
    );
  };

  const changeSizeAtIndex = (size, classIndex) => {
    const {
      pointAttribute,
      allStylePointAttributeBinCount,
      allStylePointAttributeRanges,
    } = stylingOptions;

    let allStylePointAttributeSizesArr = [];
    if (
      stylingOptions.allStylePointAttributeSizes &&
      stylingOptions.allStylePointAttributeSizes.length > 0
    ) {
      allStylePointAttributeSizesArr =
        stylingOptions.allStylePointAttributeSizes.split("|");
    }

    allStylePointAttributeSizesArr[classIndex] = size;

    handleStyleChangedEvent(
      pointAttribute,
      allStylePointAttributeBinCount,
      allStylePointAttributeRanges,
      allStylePointAttributeSizesArr
    );
  };

  const removeValueAtIndex = async (classIndex) => {
    const {
      pointAttribute,
      allStylePointAttributeBinCount,
      allStylePointAttributeRanges,
      allStylePointAttributeSizes,
    } = stylingOptions;

    let allStylePointAttributeRangesArr;
    if (
      allStylePointAttributeRanges &&
      allStylePointAttributeRanges.length > 0
    ) {
      allStylePointAttributeRangesArr = allStylePointAttributeRanges.split("|");
    }

    let allStylePointAttributeSizesArr = allStylePointAttributeSizes.split("|");
    allStylePointAttributeSizesArr.splice(classIndex, 1);

    allStylePointAttributeRangesArr = allStylePointAttributeRangesArr.map(
      (range) => range.split(":")
    );

    handleStyleChangedEvent(
      pointAttribute,
      allStylePointAttributeBinCount - 1,
      allStylePointAttributeRangesArr,
      allStylePointAttributeSizesArr
    );
  };

  // render starts here
  const {
    pointAttribute,
    pointAttributeValueOptions,
    allStylePointAttribute,
    allStylePointAttributeRanges,
    allStylePointAttributeSizes,
    allStylePointAttributeBinCount,
    hasChanges,
  } = stylingOptions;

  if (!pointAttribute && props.show) {
    let column = props.allColumns[0].name;
    console.log("default column set to: ", column);
    handleSelectColumn({ target: { value: column } });
  }

  let _pointAttribute = pointAttribute;
  if (pointAttribute && pointAttribute.match(/^long\((.*)\)$/)) {
    // remove the long() from the column name
    _pointAttribute = pointAttribute.match(/^long\((.*)\)$/)[1];
  }

  const hasRangesError = allStylePointAttributeRanges === "";

  let allStylePointAttributeRangesArr;
  if (allStylePointAttributeRanges && allStylePointAttributeRanges.length > 0) {
    allStylePointAttributeRangesArr = allStylePointAttributeRanges.split("|");
    allStylePointAttributeRangesArr = allStylePointAttributeRangesArr.map(
      (range) => range.split(":")
    );
  } else {
    if (_pointAttribute && isNumericColumn(_pointAttribute)) {
      allStylePointAttributeRangesArr = [[0, 1]];
    } else {
      allStylePointAttributeRangesArr = [[""]];
    }
  }

  //Build string column value options
  const valueRenderables =
    pointAttributeValueOptions != null
      ? pointAttributeValueOptions.map((columnValue, index) => {
          return <option value={columnValue}>{columnValue}</option>;
        })
      : null;

  let allStylePointAttributeSizesArr;
  let rowsRender = null;

  if (allStylePointAttributeSizes && allStylePointAttributeSizes.length > 0) {
    allStylePointAttributeSizesArr = allStylePointAttributeSizes.split("|");

    rowsRender = allStylePointAttributeSizesArr.map((size, sizeIndex) => {
      const range = allStylePointAttributeRangesArr[sizeIndex];

      let inputElement;
      if (range.length === 1) {
        inputElement = (
          <Form.Control
            as="select"
            key={"ptattr-string-inp-" + sizeIndex}
            value={allStylePointAttributeRangesArr[sizeIndex][0]}
            onChange={(evt) => {
              const value = evt.target.value;
              changeStringValueAtIndex(value, sizeIndex);
            }}
          >
            {valueRenderables}
          </Form.Control>
        );
      } else if (range.length === 2) {
        if (isDateOrTimeBased(_pointAttribute, props.allColumns)) {
          let a = new Date(
            parseInt(allStylePointAttributeRangesArr[sizeIndex][0])
          );
          let b = new Date(
            parseInt(allStylePointAttributeRangesArr[sizeIndex][1])
          );
          inputElement = [
            <div style={{ width: "150px" }}>
              <Datetime
                key={"pattr-string-min-" + sizeIndex}
                value={a}
                initialViewDate={a}
                onChange={(value) => {
                  const millisSinceEpoch = Date.parse(value);
                  changeNumericValueAtIndex(
                    millisSinceEpoch.toString(),
                    sizeIndex,
                    0
                  );
                }}
              />
            </div>,
            <div style={{ width: "150px" }}>
              <Datetime
                key={"pattr-string-max-" + sizeIndex}
                value={b}
                initialViewDate={b}
                onChange={(value) => {
                  const millisSinceEpoch = Date.parse(value);
                  changeNumericValueAtIndex(
                    millisSinceEpoch.toString(),
                    sizeIndex,
                    1
                  );
                }}
              />
            </div>,
          ];
        } else {
          inputElement = [
            <Form.Control
              as="input"
              style={{ width: "50%", display: "inline-block" }}
              key={"pattr-string-min-" + sizeIndex}
              value={allStylePointAttributeRangesArr[sizeIndex][0]}
              onChange={(evt) => {
                const value = evt.target.value;
                changeNumericValueAtIndex(value, sizeIndex, 0);
              }}
            />,
            <Form.Control
              as="input"
              key={"pattr-string-max-" + sizeIndex}
              style={{ width: "50%", display: "inline-block" }}
              value={allStylePointAttributeRangesArr[sizeIndex][1]}
              onChange={(evt) => {
                const value = evt.target.value;
                changeNumericValueAtIndex(value, sizeIndex, 1);
              }}
            />,
          ];
        }
      }

      const sizeInput = [
        <div
          style={{
            padding: "30px 0px",
            display: "inline",
            verticalAlign: "middle",
          }}
        >
          <Form.Control
            type="range"
            min="0"
            max="20"
            style={{ display: "inline", width: "70%" }}
            value={allStylePointAttributeSizesArr[sizeIndex]}
            onChange={(event) => {
              changeSizeAtIndex(event.target.value, sizeIndex);
            }}
          />
        </div>,
        <Form.Control
          as="input"
          min="0"
          max="20"
          size="sm"
          style={{ width: "30px", display: "inline" }}
          onChange={(event) => {
            changeSizeAtIndex(event.target.value, sizeIndex);
          }}
          value={allStylePointAttributeSizesArr[sizeIndex]}
        />,
      ];

      return (
        <tr key={"classbreak-legend-" + sizeIndex}>
          <td>{inputElement}</td>
          <td>{sizeInput}</td>
          <td>
            {allStylePointAttributeSizesArr.length > 1 && (
              <Button onClick={() => removeValueAtIndex(sizeIndex)}>
                <X />
              </Button>
            )}
          </td>
        </tr>
      );
    });
  }

  const kColumn = allStylePointAttribute;
  let columns = props.allColumns;

  let colOpts = columns.map((column, colIndex) => {
    return column.name === kColumn ? (
      <option key={column.name} selected value={column.name}>
        {column.label}
      </option>
    ) : (
      <option key={column.name} value={column.name}>
        {column.label}
      </option>
    );
  });

  return (
    <div style={{ padding: "10px" }}>
      <Form>
        <Form.Group as={Row}>
          <Form.Label sm="2" column>
            Column
          </Form.Label>
          <Col sm="10">
            <div style={{ padding: "6px 0px" }}>
              <Form.Control
                as="select"
                value={_pointAttribute}
                onChange={handleSelectColumn}
              >
                {colOpts}
              </Form.Control>
            </div>
          </Col>
        </Form.Group>

        <Form.Group as={Row} fluid>
          <Form.Label column sm="2">
            Bins
          </Form.Label>
          <Col xs="5">
            <div style={{ padding: "6px 0px" }}>
              <Form.Control
                type="range"
                min="1"
                max="10"
                value={allStylePointAttributeBinCount}
                onChange={handleBinChange}
              />
            </div>
          </Col>
          <Col xs="auto">
            <Form.Control
              as="input"
              min="1"
              max="10"
              size="sm"
              style={{ width: "30px", marginLeft: "-30px" }}
              value={allStylePointAttributeBinCount}
              disabled={true}
            />
          </Col>
          <Col xs="auto">
            <Button onClick={defaultStyleForColumn}>Generate</Button>
          </Col>
        </Form.Group>

        {rowsRender != null ? (
          <Table size="sm" layout="auto">
            <thead style={{ textAlign: "center", fontWeight: "bold" }}>
              <td>Value</td>
              <td>Size</td>
              <td>Delete</td>
            </thead>
            <tbody>{rowsRender}</tbody>
          </Table>
        ) : null}
      </Form>

      <span>
        <Button
          disabled={!hasChanges || hasRangesError}
          style={{
            backgroundColor:
              !hasChanges || hasRangesError ? "darkgray" : "#00b489",
            color: "white",
            margin: "15px",
            width: "43%",
          }}
          onClick={handleSaveStyles}
        >
          Save
        </Button>
        <Button
          style={{
            backgroundColor: "#dc3545",
            color: "white",
            margin: "15px",
            width: "43%",
          }}
          onClick={handleDeleteStyles}
        >
          Delete
        </Button>
      </span>
      <Container
        style={{ display: hasRangesError ? "" : "none", color: "red" }}
      >
        Please enter a valid value. If no data is available in the drop down,
        the selected column may not be populated for the time range. You can
        also try increasing the bin size.
      </Container>
    </div>
  );
}

export default PointAttributeOptions;
