import React, { useCallback, useEffect, useState } from "react";
import {
  Form,
  Row,
  Popover,
  Container,
  Button,
  Table,
  Col,
  OverlayTrigger,
  Dropdown,
  DropdownButton,
  Spinner,
} from "react-bootstrap";
import { X, Link, ArrowUp, ArrowDown } from "react-bootstrap-icons";
import GPUdbHelper from "../vendor/GPUdbHelper";
import { ChromePicker } from "react-color";
import { COLORMAPS } from "../constants";
import colorbrewer from "colorbrewer";
import PointAttributeOptions from "./PointAttributeOptions";
import CustomMeasureEditor from "./CustomMeasureEditor";
import "react-datetime/css/react-datetime.css";
import Datetime from "react-datetime";
import { gradient } from "./ColorGradient";
import { isDateOrTimeBased } from "../util";
import ComboBox from "./ComboBox";
import { parseFormula, getAllLiteralValues } from "./KineticaExpression";

const validColormaps = COLORMAPS.filter((c) => {
  const colorTheme = colorbrewer[c];
  const keys = colorTheme
    ? Object.keys(colorTheme).map((n) => Number(n))
    : null;
  return colorTheme != null && keys && Math.max(...keys) >= 10;
});

const ClassbreakStylingOptions = (props) => {
  const { gpudb, setError, cbColumnCache, setCBColumnCache } = props;
  const componentName = "ClassbreakStylingOptions";
  const defaultBinCount = 4;
  const defaultSizeValue = 3;
  const defaultPointShape = "circle";
  const shapeOptions = [
    "circle",
    "square",
    "diamond",
    "hollowcircle",
    "hollowsquare",
    "hollowdiamond",
  ];

  //TODO: Do all of these state members still make sense? These actually need to be translated to a singular stylingOptions object state.
  const [stylingOptions, setStylingOptions] = useState({
    binCount: defaultBinCount,
    allStyleColors: null,
    allStyleRanges: null,
    allStyleShapes: null,
    allStyleSizes: null,
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
    pointAttribute: null,
    orderClasses: false,
    calculatedField: null,
    cbDelimiter: "|",
    ...props.cbStyleOptions,
  });

  const [isPointAttributeOptionsOpen, setIsPointAttributeOptionsOpen] =
    useState(false);
  const [isCustomMeasureEditorOpen, setIsCustomMeasureEditorOpen] =
    useState(false);

  const [isOrderClassesChecked, setIsOrderClassesChecked] = useState(
    props.cbStyleOptions.orderClasses
  );
  const [calculatedFieldContent, setCalculatedFieldContent] = useState(
    props.cbStyleOptions.calculatedField
  );
  const [calculatedFieldName, setCalculatedFieldName] = useState(
    props.cbStyleOptions.calculatedFieldName || ""
  );
  const [savedColumn, setSavedColumn] = useState(null);
  const [cachedColumnStyles, setCachedColumnStyles] = useState(
    cbColumnCache || {}
  );
  const [showPopover, setShowPopover] = useState(-1);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const getColorRamp = (binCount, selectedTheme) => {
    const colorTheme = colorbrewer[selectedTheme];
    const colorArray = colorTheme[Math.max(binCount, 3)];
    const colorRamp = colorArray.map((colorHash) => colorHash.replace("#", ""));
    return colorRamp;
  };

  const changeSizeAtIndex = (size, classIndex) => {
    const {
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleShapes,
      selectedTheme,
    } = stylingOptions;

    let allStyleSizeArr = [];
    if (
      stylingOptions.allStyleSizes &&
      stylingOptions.allStyleSizes.length > 0
    ) {
      allStyleSizeArr = stylingOptions.allStyleSizes.split("|");
    }

    allStyleSizeArr[classIndex] = size;

    handleStyleChangedEvent(
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleShapes,
      allStyleSizeArr,
      selectedTheme
    );
  };

  const changeShapeAtIndex = (shape, classIndex) => {
    const {
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleSizes,
      selectedTheme,
    } = stylingOptions;

    let allStyleShapeArr = [];
    if (
      stylingOptions.allStyleShapes &&
      stylingOptions.allStyleShapes.length > 0
    ) {
      allStyleShapeArr = stylingOptions.allStyleShapes.split("|");
    }

    allStyleShapeArr[classIndex] = shape;

    handleStyleChangedEvent(
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleShapeArr,
      allStyleSizes,
      selectedTheme
    );
  };

  const buildShapeSelect = (classIndex, shape) => {
    const optList = shapeOptions.map((value, index) => {
      return (
        <option key={`shapeopt-${classIndex}${index}`} value={value}>
          {value}
        </option>
      );
    });
    return (
      <Form.Control
        as="select"
        style={{ display: "inline-block", marginLeft: "-10px", width: "80px" }}
        key={`shape-sel${classIndex}`}
        value={shape}
        onChange={(event) => {
          changeShapeAtIndex(event.target.value, classIndex);
        }}
      >
        {optList}
      </Form.Control>
    );
  };

  const getDefaultShape = () => {
    const defaultShape = defaultPointShape;
    return defaultShape;
  };

  const isNumericColumn = useCallback(
    (column) => {
      const columnConfig = props.allColumns.find((c) => c.name === column);
      const pattern = /^char\d+/;
      console.log(
        "columnConfig: ",
        columnConfig,
        columnConfig?.properties.some((item) => pattern.test(item))
      );

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
      console.log("isTimestampColumn: ", columnConfig);
      return (
        columnConfig?.properties.includes("timestamp") ||
        columnConfig?.properties.includes("datetime")
      );
    },
    [props.allColumns]
  );

  const simpleStringReducer = (accumulator, currentValue, currentIndex) => {
    return accumulator === "" && currentIndex === 0
      ? `${currentValue}`
      : accumulator + `|${currentValue}`;
  };

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

  const getStringColumnValues = useCallback(
    async (column, view) => {
      const aggColumns = [column, "count(*)"];

      try {
        const aggResults = await gpudb.aggregate_group_by(
          view,
          aggColumns,
          0,
          1000,
          {
            sort_order: "descending",
            sort_by: "value",
          }
        );

        let cbVals = aggResults.data.column_1
          .filter((value) => value != null)
          .sort();
        if (cbVals.length < 1) cbVals = [""];

        return cbVals;
      } catch (e) {
        console.log(e);
        setError(componentName, e.message);
        return null;
      }
    },
    [gpudb, setError]
  );

  const getDefaultsColumn = useCallback(
    async (column, numBins, view, colorRamp) => {
      const aggColumns = [column, "count(*)"];
      const defaultShape = getDefaultShape();
      // let isFormula = false;
      try {
        // if (isFormulaic(column)) {
        //     isFormula = true;
        //     const formula = await parseFormula(column);
        //     console.log('formula: ', formula);
        // }

        if (isFormulaic(column)) {
          // isFormula = true;
          const formula = await parseFormula(column);
          console.log("formula: ", formula);

          let cbVals;
          if (formula) {
            const options = {
              stripSingleQuotes: true,
            };
            cbVals = getAllLiteralValues(formula, options);
            const _formulaBins = cbVals.length;
            return {
              ranges: cbVals.join("|"),
              styles: cbVals
                .map((val, index) => {
                  return colorRamp[index];
                })
                .join("|"),
              shapes: new Array(Number(_formulaBins))
                .fill(defaultShape)
                .join("|"),
              sizes: new Array(Number(_formulaBins))
                .fill(defaultSizeValue)
                .join("|"),
            };
          }
        } else if (/*!isFormula && */ isNumericColumn(column)) {
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
            console.log("column: ", column, "newView: ", newView);
            await gpudb.filter(view, newView, `ISNAN(${column}) = 0`, {
              ttl: "2",
            });
            setError(componentName, "");
          }

          const respAgg = await gpudb
            .aggregate_statistics(newView, column, "mean,stdv,min,max", {});
          let defaults;
          if (respAgg.stats.mean === "NaN" || respAgg.stats.stdv === "NaN") {
            defaults =
              GPUdbHelper.utils.createAutomaticEqualIntervalClassBreaks(
                respAgg.stats.min,
                respAgg.stats.max,
                numBins,
                colorRamp
              );
          } else {
            defaults =
              GPUdbHelper.utils.createAutomaticStdDevIntervalClassBreaks(
                respAgg.stats.min,
                respAgg.stats.max,
                respAgg.stats.mean,
                respAgg.stats.stdv,
                numBins,
                colorRamp
              );
          }
          const realBinCount = defaults.ranges.length || 1;
          defaults.shapes = new Array(Number(realBinCount)).fill(
            defaultShape
          );
          defaults.sizes = new Array(Number(realBinCount)).fill(
            defaultSizeValue
          );
          return defaults;
        } else {
          // if string value is a datetime format, convert to a stringified epoch
          if (/*!isFormula && */ isTimestampColumn(column)) {
            const respAgg = await gpudb
              .aggregate_statistics(view, column, "mean,stdv,min,max", {})
            let defaults;
            if (respAgg.stats.mean === "NaN" || respAgg.stats.stdv === "NaN") {
              defaults =
                GPUdbHelper.utils.createAutomaticEqualIntervalClassBreaks(
                  respAgg.stats.min,
                  respAgg.stats.max,
                  numBins,
                  colorRamp
                );
            } else {
              defaults =
                GPUdbHelper.utils.createAutomaticStdDevIntervalClassBreaks(
                  respAgg.stats.min,
                  respAgg.stats.max,
                  respAgg.stats.mean,
                  respAgg.stats.stdv,
                  numBins,
                  colorRamp
                );
            }
            const realBinCount = defaults.ranges.length || 1;
            defaults.shapes = new Array(Number(realBinCount)).fill(
              defaultShape
            );
            defaults.sizes = new Array(Number(realBinCount)).fill(
              defaultSizeValue
            );
            return defaults;
          }

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
          const cbShapes = new Array(Number(realBinCount)).fill(defaultShape);
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
        console.log(e);
        setError(componentName, e.message);
        return {
          ranges: "",
          styles: "",
        };
      }
    },
    [isNumericColumn, isTimestampColumn, gpudb, setError]
  );

  const handleStyleChangedEvent = useCallback(
    async (
      column,
      binCount,
      cbRanges,
      cbColors,
      cbShapes,
      cbSizes,
      selectedTheme,
      columnValueOptions,
      colorOpen,
      initialSet
    ) => {
      let colors =
        typeof cbColors === "string"
          ? cbColors
          : cbColors.reduce(simpleStringReducer, "");
      let ranges = cbRanges;

      let shapes;
      if (cbShapes) {
        shapes = typeof cbShapes === "string" ? cbShapes : cbShapes.join("|");
      }

      if (Array.isArray(ranges)) {
        ranges = cbRanges.reduce(rangeReducer, "");
      }

      let sizes;
      if (cbSizes) {
        sizes = typeof cbSizes === "string" ? cbSizes : cbSizes.join("|");
      }

      if (columnValueOptions != null) {
        setStylingOptions((s) => ({
          ...s,
          column,
          binCount,
          allStyleColors: colors,
          allStyleRanges: ranges,
          allStyleShapes: shapes,
          allStyleSizes: sizes,
          hasChanges: initialSet ? false : true,
          selectedTheme,
          columnValueOptions,
          colorOpen,
        }));
      } else {
        setStylingOptions((s) => ({
          ...s,
          column,
          binCount,
          allStyleColors: colors,
          allStyleRanges: ranges,
          allStyleShapes: shapes,
          allStyleSizes: sizes,
          hasChanges: initialSet ? false : true,
          selectedTheme,
        }));
      }
    },
    [setStylingOptions]
  );

  const changeStringValueAtIndex = async (newValue, classIndex) => {
    const {
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleShapes,
      allStyleSizes,
      selectedTheme,
    } = stylingOptions;

    let allStyleRangesArr;
    if (allStyleRanges) {
      if (allStyleRanges.length > 0) {
        allStyleRangesArr = allStyleRanges.split("|");
      } else {
        allStyleRangesArr = [];
      }
    }

    allStyleRangesArr[classIndex] = newValue;
    allStyleRangesArr = allStyleRangesArr.join("|");

    handleStyleChangedEvent(
      column,
      binCount,
      allStyleRangesArr,
      allStyleColors,
      allStyleShapes,
      allStyleSizes,
      selectedTheme
    );
  };

  const changeNumericValueAtIndex = async (
    newValue,
    classIndex,
    rangeIndex
  ) => {
    const {
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleShapes,
      allStyleSizes,
      selectedTheme,
    } = stylingOptions;

    let allStyleRangesArr;
    if (allStyleRanges && allStyleRanges.length > 0) {
      allStyleRangesArr = allStyleRanges.split("|");
      allStyleRangesArr = allStyleRangesArr.map((range) => range.split(":"));
    }

    allStyleRangesArr[classIndex][rangeIndex] = newValue;
    if (rangeIndex === 0 && classIndex > 0) {
      allStyleRangesArr[classIndex - 1][1] = newValue;
    } else if (rangeIndex === 1 && classIndex < allStyleRangesArr.length - 1) {
      allStyleRangesArr[classIndex + 1][0] = newValue;
    }

    handleStyleChangedEvent(
      column,
      binCount,
      allStyleRangesArr,
      allStyleColors,
      allStyleShapes,
      allStyleSizes,
      selectedTheme
    );
  };

  const removeValueAtIndex = async (classIndex) => {
    const {
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleShapes,
      allStyleSizes,
      selectedTheme,
    } = stylingOptions;

    let allStyleRangesArr;
    if (allStyleRanges && allStyleRanges.length > 0) {
      allStyleRangesArr = allStyleRanges.split("|");
    }

    let allStyleColorsArr = allStyleColors.split("|");
    allStyleColorsArr.splice(classIndex, 1);
    allStyleRangesArr.splice(classIndex, 1);

    let allStyleShapesArr = allStyleShapes.split("|");
    allStyleShapesArr.splice(classIndex, 1);

    let allStyleSizesArr = allStyleSizes.split("|");
    allStyleSizesArr.splice(classIndex, 1);

    allStyleRangesArr = allStyleRangesArr.map((range) => range.split(":"));

    handleStyleChangedEvent(
      column,
      binCount - 1,
      allStyleRangesArr,
      allStyleColorsArr,
      allStyleShapesArr,
      allStyleSizesArr,
      selectedTheme
    );
  };

  const handleChangeStyleByStylingOptions = async (styleOpts) => {
    console.log(
      "ClassbreakStylingOptions.handleChangeStyleByStylingOptions styleOpts: ",
      styleOpts
    );

    const styleOptions = {
      ...stylingOptions,
      ...styleOpts,
    };

    console.log(
      "ClassbreakStylingOptions.handleChangeStyleByStylingOptions styleOptions: ",
      styleOptions,
      column
    );
    await handleChangeStyle(column, styleOptions.binCount, props.view);
    setStylingOptions(styleOptions);
  };

  const handleChangeStyle = async (column, binCount, view) => {
    const { selectedTheme } = stylingOptions;

    const colorRamp = getColorRamp(binCount, selectedTheme);
    let { ranges, styles, shapes, sizes } = await getDefaultsColumn(
      column,
      binCount,
      view,
      colorRamp
    );
    handleStyleChangedEvent(
      column,
      binCount,
      ranges,
      styles,
      shapes,
      sizes,
      selectedTheme
    );
  };

  const handleBinChange = async (event) => {
    const binCount = event.target.value;
    const {
      allStyleColors,
      allStyleRanges,
      allStyleShapes,
      allStyleSizes,
      selectedTheme,
    } = stylingOptions;
    const ramp = getColorRamp(binCount, selectedTheme);

    let { ranges, styles, shapes, sizes } = await getDefaultsColumn(
      column,
      binCount,
      props.view,
      ramp
    );
    let allStyleColorsNew = "";
    let allStyleRangesNew = "";
    let allStyleShapesNew = "";
    let allStyleSizesNew = "";

    const oldSplitRanges = allStyleRanges.split("|");
    const oldSplitColors = allStyleColors.split("|");
    const oldSplitShapes = allStyleShapes.split("|");
    const oldSplitSizes = allStyleSizes.split("|");
    const histStyleMap = {};
    oldSplitRanges.forEach((r, rIndex) => {
      histStyleMap[r.toString()] = {
        color: oldSplitColors[rIndex],
        shape: oldSplitShapes[rIndex],
        size: oldSplitSizes[rIndex],
      };
    });

    const splitRanges = typeof ranges !== "string" ? ranges : ranges.split("|");
    const splitColors = typeof styles !== "string" ? styles : styles.split("|");
    const splitShapes = typeof shapes !== "string" ? shapes : shapes.split("|");
    const splitSizes = sizes;

    for (let i = 0; i < splitRanges.length; i++) {
      let color, range, shape, size;
      const keyLookup =
        typeof splitRanges[i] !== "string"
          ? splitRanges[i].join(":")
          : splitRanges[i];
      console.log(
        "keylookup",
        keyLookup,
        histStyleMap,
        histStyleMap[keyLookup]
      );
      if (histStyleMap[keyLookup] != null) {
        const oldVals = histStyleMap[keyLookup];
        color = oldVals.color;
        range =
          typeof splitRanges[i] !== "string"
            ? splitRanges[i].join(":")
            : splitRanges[i];
        shape = oldVals.shape;
        size = oldVals.size;
      } else {
        // use the default values for the new bins
        color = splitColors[i];
        range =
          typeof splitRanges[i] !== "string"
            ? splitRanges[i].join(":")
            : splitRanges[i];
        shape = splitShapes[i];
        size = splitSizes[i];
      }
      if (i > 0) {
        allStyleColorsNew += "|";
        allStyleRangesNew += "|";
        allStyleShapesNew += "|";
        allStyleSizesNew += "|";
      }
      allStyleColorsNew += color;
      allStyleRangesNew += range;
      allStyleShapesNew += shape;
      allStyleSizesNew += size;
    }

    setStylingOptions((s) => ({
      ...s,
      binCount: splitRanges.length,
      allStyleColors: allStyleColorsNew,
      allStyleRanges: allStyleRangesNew,
      allStyleShapes: allStyleShapesNew,
      allStyleSizes: allStyleSizesNew,
      hasChanges: true,
      selectedTheme,
    }));

    //handleChangeStyle(stylingOptions.column, binCount, props.view);
  };

  const handleOrderClassesCheckBox = async (checked) => {
    setIsOrderClassesChecked(checked);
    setStylingOptions((s) => ({
      ...s,
      orderClasses: checked,
      hasChanges: true,
    }));
  };

  const handleSelectTheme = (event) => {
    const {
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleShapes,
      allStyleSizes,
    } = stylingOptions;

    setStylingOptions({
      ...stylingOptions,
      selectedTheme: event.target.value,
      colorOpen: false,
    });

    let allStyleColorsArr = allStyleColors.split("|");
    let newThemeColors = getColorRamp(
      allStyleColorsArr.length,
      event.target.value
    );
    allStyleColorsArr = allStyleColorsArr.map(
      (color, index) => newThemeColors[index]
    );
    allStyleColorsArr = allStyleColorsArr.join("|");

    handleStyleChangedEvent(
      column,
      binCount,
      allStyleRanges,
      allStyleColorsArr,
      allStyleShapes,
      allStyleSizes,
      event.target.value
    );
  };

  const handleChangeColor = (color, classIndex) => {
    const {
      column,
      binCount,
      allStyleRanges,
      allStyleColors,
      allStyleShapes,
      allStyleSizes,
      selectedTheme,
    } = stylingOptions;

    const newColor = color.hex.replace("#", "");
    let allStyleColorsArr = allStyleColors.split("|");
    allStyleColorsArr[classIndex] = newColor;
    allStyleColorsArr = allStyleColorsArr.join("|");

    setStylingOptions({
      ...stylingOptions,
      pickerColor: newColor,
    });
    handleStyleChangedEvent(
      column,
      binCount,
      allStyleRanges,
      allStyleColorsArr,
      allStyleShapes,
      allStyleSizes,
      selectedTheme
    );
  };

  const handleSelectColumn = async (event) => {
    const { binCount, selectedTheme } = stylingOptions;

    const column = event.target.value;
    console.log(`New Selected Column: ${column}`);
    let cacheHit = false;
    let cachedStyle;
    if (cachedColumnStyles[column]) {
      cachedStyle = cachedColumnStyles[column];
      setStylingOptions((s) => ({
        ...s,
        ...cachedStyle,
      }));
      cacheHit = true;
    } else {
      setStylingOptions((s) => ({
        ...s,
        allStyleColors: null,
        allStyleRanges: null,
        allStyleShapes: null,
        allStyleSizes: null,
        hideOther: false,
      }));
    }

    let cbDefaults;
    if (cacheHit === false) {
      const colorRamp = getColorRamp(binCount, selectedTheme);
      cbDefaults = await getDefaultsColumn(
        column,
        binCount,
        props.view,
        colorRamp
      );
    } else {
      cbDefaults = {
        ranges: cachedStyle.allStyleRanges,
        styles: cachedStyle.allStyleColors,
        shapes: cachedStyle.allStyleShapes,
        sizes: cachedStyle.allStyleSizes,
      };
    }

    let stringVals = null;
    if (isNumericColumn(column) === false) {
      stringVals = await getStringColumnValues(column, props.view);
    }

    handleStyleChangedEvent(
      column,
      binCount,
      cbDefaults.ranges,
      cbDefaults.styles,
      cbDefaults.shapes,
      cbDefaults.sizes,
      selectedTheme,
      stringVals,
      false
    );
  };

  const handleSaveStyles = () => {
    const _styles = {
      ...stylingOptions,
      hasChanges: false,
    };
    setStylingOptions(_styles);

    console.log("ClassbreakStylingOptions.handleSaveStyles: stylingOptions:");
    console.dir(stylingOptions);
    props.handleStyleChange(stylingOptions);

    setCBColumnCache({
      ...cachedColumnStyles,
      [_styles.column]: _styles,
    });
  };

  const defaultStyleForColumn = async () => {
    const { column, selectedTheme } = stylingOptions;
    //TODO: Update with view logic
    //const view = getViewFromProps(this.props);

    const colorRamp = getColorRamp(defaultBinCount, selectedTheme);
    const cbDefaults = await getDefaultsColumn(
      column,
      defaultBinCount,
      props.view,
      colorRamp
    );

    let stringVals = null;
    if (isNumericColumn(column) === false) {
      stringVals = await getStringColumnValues(column, props.view);
    }

    handleStyleChangedEvent(
      column,
      defaultBinCount,
      cbDefaults.ranges,
      cbDefaults.styles,
      cbDefaults.shapes,
      cbDefaults.sizes,
      selectedTheme,
      stringVals
    );
  };

  //TODO: Add component did mount logic here..
  useEffect(() => {
    if (!isFirstLoad) {
      return;
    }

    async function fetchData(column, binCount, view, colorRamp, hasChanges) {
      let cbDefaults;
      cbDefaults = await getDefaultsColumn(column, binCount, view, colorRamp);

      let stringVals = null;
      if (isNumericColumn(column) === false) {
        stringVals = await getStringColumnValues(column, view);
      }

      handleStyleChangedEvent(
        column,
        binCount,
        cbDefaults.ranges,
        cbDefaults.styles,
        cbDefaults.shapes,
        cbDefaults.sizes,
        selectedTheme,
        stringVals,
        false,
        hasChanges ? false : true
      );
    }
    const {
      binCount,
      selectedTheme,
      column,
      hasChanges,
      allStyleColors,
      allStyleRanges,
      allStyleShapes,
      allStyleSizes,
      columnValueOptions,
    } = props.cbStyleOptions;
    if (allStyleColors != null && allStyleColors !== "") {
      setIsFirstLoad(false)
      handleStyleChangedEvent(
        column,
        binCount,
        allStyleRanges,
        allStyleColors,
        allStyleShapes,
        allStyleSizes,
        selectedTheme,
        columnValueOptions,
        false,
        hasChanges ? false : true
      );
    } else if (column != null && column !== "") {
      setIsFirstLoad(false)
      const colorRamp = getColorRamp(binCount, selectedTheme);
      fetchData(column, binCount, props.view, colorRamp, hasChanges);
    }
  }, [
    isFirstLoad,
    getDefaultsColumn,
    getStringColumnValues,
    handleStyleChangedEvent,
    isNumericColumn,
    props.cbStyleOptions,
    props.view,
    isPointAttributeOptionsOpen,
    calculatedFieldContent,
  ]);

  const handleLinkClick = (event) => {
    console.log("handleLinkClick: ", event);
    console.dir(event);
    setIsPointAttributeOptionsOpen(true);
  };

  const moveElement = (str, moveFromIndex, moveToIndex, delim) => {
    let arr = str.split(delim ? delim : "|");
    let element = arr.splice(moveFromIndex, 1)[0];
    arr.splice(moveToIndex, 0, element);
    return arr.join(delim ? delim : "|");
  };

  const isFormulaic = (formula) => {
    if (
      formula.toUpperCase().startsWith("CASE") ||
      formula.toUpperCase().startsWith("IF")
    ) {
      return true;
    } else {
      return false;
    }
  };

  const parseColumnNameFromFormula = (formula) => {
    if (formula && isFormulaic(formula)) {
      const startIdx = formula.indexOf("(") + 1;
      const endIdx = formula.indexOf(",");
      if (startIdx > -1 && endIdx > -1) {
        const column = formula.substring(startIdx, endIdx).trim();
        console.log("parsed column name from formula: ", column);
        return column;
      }
    } else {
      return formula;
    }
  };

  const saveCalculatedField = async (name, formula) => {
    console.log("saveCalculatedField: ", name, formula);
    let calcFieldContent = calculatedFieldContent;
    let formulaAsSingleLine = formula.replace(/\n/g, " ");
    formulaAsSingleLine = formulaAsSingleLine.replace(/\r/g, " ");
    formulaAsSingleLine = formulaAsSingleLine.trim();
    if (name && formulaAsSingleLine) {
      if (name === "" && formulaAsSingleLine === "") {
        setCalculatedFieldName("");
        calcFieldContent = null;
      } else {
        calcFieldContent = formulaAsSingleLine;
        setCalculatedFieldName(name);
        setCalculatedFieldContent(formulaAsSingleLine);
      }
    }

    console.log("saveCalculatedField: ", calcFieldContent);
    if (!calcFieldContent || calcFieldContent === "") {
      return;
    }
    try {
      // extract the column name from CASE or IF in the formula, if it exists.
      let column = calcFieldContent;

      handleSelectColumn({ target: { value: column } });
      setStylingOptions({
        ...stylingOptions,
        calculatedField: calcFieldContent,
        calculatedFieldName: name,
        hasChanges: true,
      });
    } catch (error) {
      console.error("saveCalculatedField: ", error);
    }
  };

  const handleCalculatedFieldChange = async (event) => {
    setCalculatedFieldContent(event?.target?.value);
  };

  const clearCalculatedField = () => {
    console.log("clearCalculatedField: ", calculatedFieldContent, column);
    setCalculatedFieldContent("");
    setCalculatedFieldName("");
    handleSelectColumn({ target: { value: savedColumn } });
    setSavedColumn(null);
    setStylingOptions({
      ...stylingOptions,
      calculatedField: null,
      calculatedFieldName: null,
      column: savedColumn,
    });
  };

  const handleUpArrow = (event, colorIndex) => {
    console.log("handleUpArrow: ", event, colorIndex);
    const { allStyleRanges, allStyleColors, allStyleShapes, allStyleSizes } =
      stylingOptions;

    if (colorIndex === 0) {
      return;
    }

    let newStyles = {};

    // allStyleRanges
    if (allStyleRanges && allStyleRanges.length > 0) {
      const newRanges = moveElement(allStyleRanges, colorIndex, colorIndex - 1);
      newStyles = {
        ...newStyles,
        allStyleRanges: newRanges,
      };
    }

    // allStyleColors
    if (allStyleColors && allStyleColors.length > 0) {
      const newColors = moveElement(allStyleColors, colorIndex, colorIndex - 1);
      newStyles = {
        ...newStyles,
        allStyleColors: newColors,
      };
    }

    // allStyleShapes
    if (allStyleShapes && allStyleShapes.length > 0) {
      const newShapes = moveElement(allStyleShapes, colorIndex, colorIndex - 1);
      newStyles = {
        ...newStyles,
        allStyleShapes: newShapes,
      };
    }

    // allStyleSizes
    if (allStyleSizes && allStyleSizes.length > 0) {
      const newSizes = moveElement(allStyleSizes, colorIndex, colorIndex - 1);
      newStyles = {
        ...newStyles,
        allStyleSizes: newSizes,
      };
    }

    setStylingOptions({
      ...stylingOptions,
      ...newStyles,
      hasChanges: true,
    });
  };

  const handleDownArrow = (event, colorIndex) => {
    console.log("handleDownArrow: ", event, colorIndex);
    const { allStyleRanges, allStyleColors, allStyleShapes, allStyleSizes } =
      stylingOptions;

    if (colorIndex === allStyleColors.length - 1) {
      return;
    }

    let newStyles = {};

    // allStyleRanges
    if (allStyleRanges && allStyleRanges.length > 0) {
      const newRanges = moveElement(allStyleRanges, colorIndex, colorIndex + 1);
      newStyles = {
        ...newStyles,
        allStyleRanges: newRanges,
      };
    }

    // allStyleColors
    if (allStyleColors && allStyleColors.length > 0) {
      const newColors = moveElement(allStyleColors, colorIndex, colorIndex + 1);
      newStyles = {
        ...newStyles,
        allStyleColors: newColors,
      };
    }

    // allStyleShapes
    if (allStyleShapes && allStyleShapes.length > 0) {
      const newShapes = moveElement(allStyleShapes, colorIndex, colorIndex + 1);
      newStyles = {
        ...newStyles,
        allStyleShapes: newShapes,
      };
    }

    // allStyleSizes
    if (allStyleSizes && allStyleSizes.length > 0) {
      const newSizes = moveElement(allStyleSizes, colorIndex, colorIndex + 1);
      newStyles = {
        ...newStyles,
        allStyleSizes: newSizes,
      };
    }

    setStylingOptions({
      ...stylingOptions,
      ...newStyles,
      hasChanges: true,
    });
  };

  const handleGradientDisplayChange = (theme) => {
    const svg = gradient(theme, 1, true);
    const svgString = new XMLSerializer().serializeToString(svg);
    const el = document.getElementById("selected-colormap-gradient-cb");
    if (el) {
      el.innerHTML = svgString;
    }
  };

  useEffect(() => {
    handleGradientDisplayChange(stylingOptions.selectedTheme);
  }, [stylingOptions.selectedTheme]);

  // Render starts here
  const {
    column,
    binCount,
    allStyleRanges,
    allStyleColors,
    allStyleShapes,
    allStyleSizes,
    selectedTheme,
    otherColor,
    columnValueOptions,
    hasChanges,
    orderClasses,
    hideOther,
  } = stylingOptions;
  const { pointAttribute } = stylingOptions;

  let col = column;
  if (calculatedFieldContent && calculatedFieldContent !== "") {
    col = calculatedFieldContent;
  }
  if (col === "") {
    for (let i = 0; i < props.allColumns.length; i++) {
      col = props.allColumns[i].name;
      if (!isTimestampColumn(col)) {
        break;
      }
    }
    if (props.gpudb) {
      handleSelectColumn({ target: { value: col } });
    }
  } else if (col && col.match(/^long\((.*)\)$/)) {
    // remove the long() from the column name
    col = col.match(/^long\((.*)\)$/)[1];
  }

  const hasRangesError = allStyleRanges === "";
  let allStyleRangesArr;
  if (allStyleRanges && allStyleRanges.length > 0) {
    allStyleRangesArr = allStyleRanges.split("|");
    allStyleRangesArr = allStyleRangesArr.map((range) => range.split(":"));
  } else {
    if (col && isNumericColumn(col)) {
      allStyleRangesArr = [[0, 1]];
    } else {
      allStyleRangesArr = [[""]];
    }
  }

  let allStyleShapesArr;
  if (allStyleShapes && allStyleShapes.length > 0) {
    allStyleShapesArr = allStyleShapes.split("|");
  }

  let allStyleSizesArr;
  if (allStyleSizes && allStyleSizes.length > 0) {
    allStyleSizesArr = allStyleSizes.split("|");
  }

  let allStyleColorsArr;
  let rowsRender = null;

  //Build string column value options
  const valueRenderables =
    columnValueOptions != null
      ? columnValueOptions.map((columnValue, index) => {
          return (
            <option key={"valueRenderables-" + index} value={columnValue}>
              {columnValue}
            </option>
          );
        })
      : null;

  if (allStyleColors && allStyleColors.length > 0) {
    allStyleColorsArr = allStyleColors.split("|");

    rowsRender = allStyleColorsArr.map((color, colorIndex) => {
      const range = allStyleRangesArr[colorIndex];
      const shape = allStyleShapesArr[colorIndex];
      const size = allStyleSizesArr[colorIndex];

      let inputElement;
      if (range.length === 1) {
        inputElement = (
          <ComboBox
            id={"string-inp-" + colorIndex}
            key={"string-inp-" + colorIndex}
            placeholder={`Option ${colorIndex + 1}...`}
            options={columnValueOptions.map((c) => ({ label: c, value: c }))}
            onSelect={(evt) => {
              const value = evt.target.value;
              changeStringValueAtIndex(value, colorIndex);
            }}
            optionsMaxHeight={200}
            initialValue={allStyleRangesArr[colorIndex][0]}
          />
        );
      } else if (range.length === 2) {
        if (isDateOrTimeBased(col, props.allColumns)) {
          let a = new Date(parseInt(allStyleRangesArr[colorIndex][0]));
          let b = new Date(parseInt(allStyleRangesArr[colorIndex][1]));
          inputElement = [
            <div style={{ width: "150px" }}>
              <Datetime
                key={"string-min-" + colorIndex}
                value={a}
                initialViewDate={a}
                onChange={(value) => {
                  const millisSinceEpoch = Date.parse(value);
                  changeNumericValueAtIndex(
                    millisSinceEpoch.toString(),
                    colorIndex,
                    0
                  );
                }}
              />
            </div>,
            <div style={{ width: "150px" }}>
              <Datetime
                key={"string-max-" + colorIndex}
                value={b}
                initialViewDate={b}
                onChange={(value) => {
                  const millisSinceEpoch = Date.parse(value);
                  changeNumericValueAtIndex(
                    millisSinceEpoch.toString(),
                    colorIndex,
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
              key={"string-min-" + colorIndex}
              value={allStyleRangesArr[colorIndex][0]}
              onChange={(evt) => {
                const value = evt.target.value;
                changeNumericValueAtIndex(value, colorIndex, 0);
              }}
            />,
            <Form.Control
              as="input"
              key={"string-max-" + colorIndex}
              style={{ width: "50%", display: "inline-block" }}
              value={allStyleRangesArr[colorIndex][1]}
              onChange={(evt) => {
                const value = evt.target.value;
                changeNumericValueAtIndex(value, colorIndex, 1);
              }}
            />,
          ];
        }
      }

      const shapeSelect = buildShapeSelect(colorIndex, shape);

      const sizeInput = [
        <div
          key={"sizeRange-" + colorIndex}
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
            style={{ display: "inline", width: "75%", marginRight: "5%" }}
            disabled={pointAttribute ? true : false}
            value={size}
            onChange={(event) => {
              changeSizeAtIndex(event.target.value, colorIndex);
            }}
          />
        </div>,
        <Form.Control
          key={"sizeText-" + colorIndex}
          as="input"
          min="0"
          max="20"
          size="sm"
          style={{ width: "20%", display: "inline" }}
          disabled={pointAttribute ? true : false}
          onChange={(event) => {
            changeSizeAtIndex(event.target.value, colorIndex);
          }}
          value={size}
        />,
      ];

      return (
        <tr key={"classbreak-legend-" + colorIndex}>
          <td>
            <div style={{ display: "flex", float: "left" }}>
              <ArrowUp
                size={15}
                onClick={(evt) => {
                  handleUpArrow(evt, colorIndex);
                }}
              />
              <ArrowDown
                size={15}
                onClick={(evt) => {
                  handleDownArrow(evt, colorIndex);
                }}
              />
            </div>
          </td>
          <td>
            <OverlayTrigger
              trigger="click"
              placement="right"
              show={showPopover === colorIndex}
              overlay={
                <Popover placement="left">
                  <ChromePicker
                    className={"cb-config-colorpicker" + colorIndex}
                    color={"#" + color}
                    disableAlpha={true}
                    onChangeComplete={(color) => {
                      handleChangeColor(color, colorIndex);
                    }}
                  />
                </Popover>
              }
            >
              <Button
                block
                key={"classbreak-legend-color" + colorIndex}
                style={{
                  backgroundColor: "#" + color,
                  display: "inline-block",
                  borderStyle: "none",
                  height: "32px",
                  width: "32px",
                }}
                onClick={(c) => {
                  if (showPopover === colorIndex) {
                    setShowPopover(-1);
                  } else {
                    setShowPopover(colorIndex);
                  }
                }}
              />
            </OverlayTrigger>
          </td>
          <td>{inputElement}</td>
          <td>{sizeInput}</td>
          <td>{shapeSelect}</td>
          <td>
            {allStyleColorsArr.length > 1 && (
              <Button onClick={() => removeValueAtIndex(colorIndex)}>
                <X />
              </Button>
            )}
          </td>
        </tr>
      );
    });
  }

  let columns = props.allColumns;

  let colOpts;
  if (calculatedFieldContent && calculatedFieldContent.length > 0) {
    // remove column options when using a calculated field.
    colOpts = [];
  } else {
    colOpts = columns
      .filter((column) => {
        const includesTimestamp = column?.properties.includes("timestamp");
        const includesDatetime = column?.properties.includes("datetime");
        return true;
      })
      .map((column, colIndex) => {
        return (
          <option key={column.name} value={column.name}>
            {column.label}
          </option>
        );
      });
  }

  const colorThemes = validColormaps.map((theme) => {
    const svg = gradient(theme, 1, true);
    const svgString = new XMLSerializer().serializeToString(svg);
    return (
      <Dropdown.Item
        eventKey={theme}
        key={theme}
        onSelect={() => {
          handleSelectTheme({ target: { value: theme } });
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
            <span>{theme}</span>
          </div>
        </div>
      </Dropdown.Item>
    );
  });

  let calculatedFieldText = "";
  if (calculatedFieldName && calculatedFieldName.length > 0) {
    calculatedFieldText = calculatedFieldName + ":  ";
  }
  if (calculatedFieldContent && calculatedFieldContent.length > 0) {
    calculatedFieldText += calculatedFieldContent;
  }

  return (
    <div id="classBreakStylingParent">
      <Form.Group controlId={"classBreakOptions"}>
        <Form.Group as={Row}>
          <Form.Label sm="2" column>
            Column
          </Form.Label>
          <Col sm="10">
            <ComboBox
              placeholder="Type to filter..."
              options={columns.map((c) => ({ label: c.name, value: c.name }))}
              onSelect={(e) => {
                setCachedColumnStyles({
                  ...cachedColumnStyles,
                  [col]: stylingOptions,
                });
                handleSelectColumn(e);
              }}
              optionsMaxHeight={450}
              initialValue={col}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Label sm="2" column>
            Calculated Field
          </Form.Label>
          <div style={{ padding: "3px 0px", width: "72%" }}>
            <Col sm="auto">
              <Form.Control
                id="calculatedFieldText"
                type="text"
                value={calculatedFieldText}
                disabled={true}
                onChange={(evt) => handleCalculatedFieldChange(evt)}
              />

              <h5
                style={{
                  fontSize: "10px",
                  textAlign: "left",
                  marginTop: "5px",
                }}
              >
                <a
                  href="https://docs.kinetica.com/7.1/concepts/expressions/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Expression Documentation
                </a>
              </h5>
            </Col>
          </div>
          <div style={{ padding: "3px 0px", width: "10%" }}>
            <Col xs="auto">
              <Button
                style={{ marginLeft: "-20px", marginBottom: "5px" }}
                onClick={() => {
                  handleSaveStyles();
                  setSavedColumn(col);
                  setIsCustomMeasureEditorOpen(true);
                }}
              >
                Edit
              </Button>
            </Col>
          </div>
        </Form.Group>

        {isCustomMeasureEditorOpen && (
          <div id="customMeasureEditor">
            <Form.Group as={Row}>
              <Form.Label sm="2" column>
                Custom Measure Editor
              </Form.Label>
              <Col sm="10">
                <CustomMeasureEditor
                  show={isCustomMeasureEditorOpen}
                  columns={props.allColumns}
                  fieldName={calculatedFieldName}
                  fieldContent={calculatedFieldContent}
                  setFieldName={setCalculatedFieldName}
                  setFieldContent={setCalculatedFieldContent}
                  saveField={saveCalculatedField}
                  clearField={clearCalculatedField}
                  documentation={{
                    description: "Expression Documentation",
                    url: "https://docs.kinetica.com/7.1/concepts/expressions/",
                  }}
                  close={() => setIsCustomMeasureEditorOpen(false)}
                />
              </Col>
            </Form.Group>
          </div>
        )}

        <Form.Group as={Row}>
          <Form.Label column sm="2">
            Theme
          </Form.Label>
          <Col sm="4">
            <div style={{ width: "400px" }}>
              <DropdownButton
                style={{ width: "100%", minWidth: "200px", maxWidth: "400px" }}
                id="colormap-dropdown"
                title={
                  stylingOptions.selectedTheme &&
                  stylingOptions.selectedTheme.length > 0
                    ? stylingOptions.selectedTheme
                    : "Select a theme"
                }
                variant="light"
              >
                <div style={{ maxHeight: "300px", overflowY: "scroll" }}>
                  {colorThemes}
                </div>
              </DropdownButton>
            </div>
          </Col>
          <Col sm="4">
            <div id="selected-colormap-gradient-cb"></div>
          </Col>
        </Form.Group>

        <Form.Group as={Row} fluid="true">
          <Form.Label column sm="2">
            Bins
          </Form.Label>
          <Col xs="5">
            <div style={{ padding: "6px 0px", marginRight: "10px" }}>
              <Form.Control
                type="range"
                min="1"
                max="10"
                value={binCount}
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
              value={binCount}
              disabled={true}
            />
          </Col>
          <Col xs="auto">
            <Button
              style={{ marginLeft: "-20px", marginBottom: "5px" }}
              onClick={defaultStyleForColumn}
            >
              Reset
            </Button>
          </Col>
          <Col xs="auto">
            <Form.Check
              id="orderclasses"
              type="checkbox"
              checked={orderClasses}
              onChange={() => {
                handleOrderClassesCheckBox(!isOrderClassesChecked);
              }}
              style={{
                marginLeft: "-25px",
                marginTop: "5px",
                display: "inline-block",
              }}
            />
            <Form.Label htmlFor="orderclasses" style={{ marginLeft: 5 }}>
              Order Classes
            </Form.Label>
          </Col>
        </Form.Group>
        {rowsRender === null && (
          <div style={{ textAlign: "center" }}>
            <Spinner animation="border" role="status">
              <span className="sr-only">Loading...</span>
            </Spinner>
          </div>
        )}
        {rowsRender != null ? (
          <Table size="sm" layout="auto">
            <thead style={{ textAlign: "center", fontWeight: "bold" }}>
              <tr>
                <th>Layer</th>
                <th>Color</th>
                <th>Value</th>
                <th>
                  Size{" "}
                  {pointAttribute ? (
                    <Link
                      className="rotate-45 big-bold grey"
                      onClick={handleLinkClick}
                    />
                  ) : (
                    <Link
                      className="rotate-45 big-bold blue"
                      onClick={handleLinkClick}
                    />
                  )}
                </th>
                <th>Shape</th>
                <th>Delete</th>
              </tr>
            </thead>
            <tbody>
              {rowsRender}
              {
                <tr>
                  <td></td>
                  <td>
                    <Button
                      block
                      key={"classbreak-legend-color-other"}
                      style={{
                        backgroundColor: "#" + otherColor,
                        display: "inline-block",
                        borderStyle: "none",
                        height: "32px",
                      }}
                      disabled={true}
                    />
                  </td>
                  <td>
                    <Form.Control
                      as="input"
                      value="<other>"
                      disabled={true}
                      style={{ width: "100%", display: "inline-block" }}
                    />
                  </td>
                  <td>
                    <Form.Check
                      id="hide"
                      type="checkbox"
                      checked={hideOther}
                      style={{
                        marginTop: "5px",
                        display: "inline-block",
                      }}
                      onChange={() => {
                        setStylingOptions((s) => {
                          return {
                            ...s,
                            hideOther: !hideOther,
                            hasChanges: true,
                          };
                        });
                      }}
                    />
                    <Form.Label htmlFor="hide" style={{ marginLeft: 5 }}>
                      Hide
                    </Form.Label>
                  </td>
                </tr>
              }
            </tbody>
          </Table>
        ) : null}

        {isPointAttributeOptionsOpen && (
          <div id="pointAttributeOptions">
            <Form.Group as={Row}>
              <Form.Label sm="2" column>
                Point Attribute Settings
              </Form.Label>
              <Col sm="10">
                <PointAttributeOptions
                  cbStyleOptions={props.cbStyleOptions}
                  allColumns={props.allColumns}
                  gpudb={props.gpudb}
                  getColorRamp={getColorRamp}
                  getStringColumnValues={getStringColumnValues}
                  handleStyleChange={handleChangeStyleByStylingOptions}
                  view={props.view}
                  setError={props.setError}
                  close={() => setIsPointAttributeOptionsOpen(false)}
                />
              </Col>
            </Form.Group>
          </div>
        )}

        <Button
          disabled={!hasChanges || hasRangesError}
          style={{
            backgroundColor:
              !hasChanges || hasRangesError ? "darkgray" : "#00b489",
            color: "white",
            marginTop: "10px",
            width: "100%",
          }}
          onClick={handleSaveStyles}
        >
          Save Styles
        </Button>
        <Container
          style={{ display: hasRangesError ? "" : "none", color: "red" }}
        >
          Please enter a valid value. If no data is available in the drop down,
          the selected column may not be populated for the time range. You can
          also try increasing the bin size.
        </Container>
      </Form.Group>
    </div>
  );
};

export default ClassbreakStylingOptions;
