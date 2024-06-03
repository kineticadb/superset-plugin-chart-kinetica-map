import React, { useState, useEffect, useRef } from "react";
import * as $ from "jquery";
import OlImage from "ol/layer/Image";
import OlImageWMS from "ol/source/ImageWMS";
import GPUdbHelper from "../vendor/GPUdbHelper";
import { base64ArrayBuffer, getConsole } from "../util";
import { WMS_PARAMS } from "../constants";
import { isDateOrTimeBased } from "../util";

// Declare this so our linter knows that superset is a global object
/* global superset */

const { WMS_STYLE_OPTS } = GPUdbHelper.wmsHelper;

const console = getConsole();

function usePrevious(value) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const genImageLoadFunction = (
  authUsername,
  authPassword,
  setError,
  componentName
) => {
  return (image, src) => {
    setError(componentName, "");
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", src, true);
    if (authUsername && authPassword) {
      xhttp.setRequestHeader(
        "Authorization",
        "Basic " + btoa(`${authUsername}:${authPassword}`)
      );
    }
    xhttp.responseType = "arraybuffer";
    xhttp.onreadystatechange = () => {
      if (xhttp.readyState === 4) {
        const arr = new Uint8Array(xhttp.response);
        const data = "data:image/png;base64," + base64ArrayBuffer(arr);
        image.getImage().src = data;
      }
    };
    xhttp.send();
  };
};

const genImageLoadErrorFunction = (
  wmsApiUrl,
  authUsername,
  authPassword,
  requestParams,
  setError,
  componentName
) => {
  return (event) => {
    const errorParams = {
      ...requestParams,
      HEIGHT: 100,
      WIDTH: 100,
      BBOX: "-10000,-10000,10000,10000",
    };

    // Make the same WMS request again to get the error message
    $.ajax({
      url: wmsApiUrl,
      type: "GET",
      data: errorParams,
      headers: {
        Authorization: "Basic " + btoa(`${authUsername}:${authPassword}`),
      },
      success: (data) => {
        // If error from endpoint, will be XML format
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, "text/xml");
        const node = xmlDoc.querySelectorAll("ServiceException");
        [].map.call(node, (exception) => {
          setError(componentName, exception.textContent);
          console.error(
            `imageloaderror (${componentName})`,
            exception.textContent
          );
        });
      },
      error: (error) => {
        // If error from map service, error is in response text
        if (error.responseText) {
          setError(componentName, error.responseText);
          console.error(
            `imageloaderror (${componentName})`,
            error.responseText
          );
        } else {
          setError(componentName, `WMS request error to ${wmsApiUrl}`);
        }
      },
    });
  };
};

const removeOther = (opts) => {
  const splitLast = (str, delimiter) => {
    const index = str.lastIndexOf(delimiter);
    if (index === -1) {
      return [str];
    }
    return str.substring(0, index);
  };

  return {
    ...opts,
    POINTSHAPES: splitLast(opts["POINTSHAPES"], ","),
    POINTCOLORS: splitLast(opts["POINTCOLORS"], ","),
    SHAPELINECOLORS: splitLast(opts["SHAPELINECOLORS"], ","),
    SHAPEFILLCOLORS: splitLast(opts["SHAPEFILLCOLORS"], ","),
    SHAPELINEWIDTHS: splitLast(opts["SHAPELINEWIDTHS"], ","),
    TRACKHEADCOLORS: splitLast(opts["TRACKHEADCOLORS"], ","),
    TRACKHEADSIZES: splitLast(opts["TRACKHEADSIZES"], ","),
    TRACKMARKERCOLORS: splitLast(opts["TRACKMARKERCOLORS"], ","),
    TRACKLINECOLORS: splitLast(opts["TRACKLINECOLORS"], ","),
    CB_VALS: splitLast(opts["CB_VALS"], "|"),
    CB_POINTCOLOR_VALS: splitLast(opts["CB_POINTCOLOR_VALS"], "|"),
    CB_POINTSIZE_VALS: splitLast(opts["CB_POINTSIZE_VALS"], "|"),
    CB_POINTSHAPE_VALS: splitLast(opts["CB_POINTSHAPE_VALS"], "|"),
    TRACKMARKERSHAPES: splitLast(opts["TRACKMARKERSHAPES"], ","),
    TRACKMARKERSIZES: splitLast(opts["TRACKMARKERSIZES"], ","),
  };
};

const parseStyles = (_styleOpts, datasource) => {
  let styleOpts = JSON.parse(JSON.stringify(_styleOpts));

  const staticStyles = {
    [WMS_STYLE_OPTS.SHAPELINEWIDTHS]: 2,

    [WMS_STYLE_OPTS.TRACKHEADSIZES]: 5,
    [WMS_STYLE_OPTS.TRACKHEADCOLORS]: "00ff00",

    [WMS_STYLE_OPTS.TRACKHEADSHAPES]: "diamond",
    [WMS_STYLE_OPTS.TRACKHEADSIZES]: 0,
  };

  const cbPointStyles = [
    WMS_STYLE_OPTS.CB_POINTCOLOR_VALS,
    WMS_STYLE_OPTS.CB_POINTSIZE_ATTR,
    WMS_STYLE_OPTS.CB_POINTSIZE_VALS,
    WMS_STYLE_OPTS.CB_POINTSHAPE_VALS,
    WMS_STYLE_OPTS.CB_POINTCOLOR_ATTR,
    WMS_STYLE_OPTS.CB_POINTSHAPE_ATTR,
  ];

  const colorStyles = [
    WMS_STYLE_OPTS.POINTCOLORS,
    WMS_STYLE_OPTS.TRACKLINECOLORS,
    WMS_STYLE_OPTS.TRACKMARKERCOLORS,
    WMS_STYLE_OPTS.SHAPELINECOLORS,
    WMS_STYLE_OPTS.SHAPEFILLCOLORS,
  ];

  const shapeStyles = [
    WMS_STYLE_OPTS.TRACKMARKERSHAPES,
    WMS_STYLE_OPTS.POINTSHAPES,
  ];

  const sizeStyles = [
    WMS_STYLE_OPTS.POINTSIZES,
    WMS_STYLE_OPTS.TRACKMARKERSIZES,
  ];

  const perfStyles = [WMS_STYLE_OPTS.ORDER_CLASSES];

  let colors = styleOpts.allStyleColors.replace(/\|/g, ",");
  let ranges = styleOpts.allStyleRanges;
  let shapes = styleOpts.allStyleShapes.replace(/\|/g, ",");
  let sizes = styleOpts.allStyleSizes;

  console.log("KWmsOlLayer: datasource: ", datasource);
  if (
    datasource &&
    isDateOrTimeBased(styleOpts.column, datasource?.table?.columns)
  ) {
    styleOpts.column = "long(" + styleOpts.column + ")";
  }
  if (
    datasource &&
    styleOpts.pointAttribute &&
    styleOpts.pointAttribute.length > 0 &&
    isDateOrTimeBased(styleOpts.pointAttribute, datasource?.table?.columns)
  ) {
    styleOpts.pointAttribute = "long(" + styleOpts.pointAttribute + ")";
  }

  let styleOptions = {
    [WMS_STYLE_OPTS["CB_VALS"]]: ranges,
    [WMS_STYLE_OPTS.CB_ATTR]: styleOpts.column,
  };

  cbPointStyles.forEach((key) => {
    if (key.endsWith("_VALS")) {
      if (styleOpts.pointAttribute && key === "CB_POINTSIZE_VALS") {
        styleOptions[key] = styleOpts.allStylePointAttributeRanges;
      } else {
        styleOptions[key] = ranges;
      }
    } else if (key.endsWith("_ATTR")) {
      if (styleOpts.pointAttribute && key === "CB_POINTSIZE_ATTR") {
        styleOptions[key] = styleOpts.pointAttribute;
      } else {
        styleOptions[key] = styleOpts.column;
      }
    }
  });

  let otherShape = "circle";
  shapes = shapes + `,${otherShape}`;
  shapeStyles.forEach((key) => {
    styleOptions[key] = shapes;
  });

  sizeStyles.forEach((key) => {
    if (styleOpts.pointAttribute && key === "TRACKMARKERSIZES") {
      styleOptions[key] = styleOpts.allStylePointAttributeSizes.replace(
        /\|/g,
        ","
      );
    } else if (styleOpts.pointAttribute && key === "POINTSIZES") {
      styleOptions[key] = styleOpts.allStylePointAttributeSizes.replace(
        /\|/g,
        ","
      );
    } else {
      styleOptions[key] = sizes.replace(/\|/g, ",");
    }
  });

  // Add 'other' color case
  styleOptions[WMS_STYLE_OPTS["CB_VALS"]] =
    styleOptions[[WMS_STYLE_OPTS["CB_VALS"]]] + "|<other>";

  if (styleOptions[WMS_STYLE_OPTS["CB_POINTCOLOR_VALS"]]) {
    styleOptions[WMS_STYLE_OPTS["CB_POINTCOLOR_VALS"]] =
      styleOptions[[WMS_STYLE_OPTS["CB_POINTCOLOR_VALS"]]] + "|<other>";
  }
  if (
    styleOptions[WMS_STYLE_OPTS["CB_POINTSIZE_VALS"]] &&
    !styleOpts.pointAttribute
  ) {
    styleOptions[WMS_STYLE_OPTS["CB_POINTSIZE_VALS"]] =
      styleOptions[[WMS_STYLE_OPTS["CB_POINTSIZE_VALS"]]] + "|<other>";
  }
  if (styleOptions[WMS_STYLE_OPTS["CB_POINTSHAPE_VALS"]]) {
    styleOptions[WMS_STYLE_OPTS["CB_POINTSHAPE_VALS"]] =
      styleOptions[[WMS_STYLE_OPTS["CB_POINTSHAPE_VALS"]]] + "|<other>";
  }

  colors = colors + `,${styleOpts.otherColor}`;
  colorStyles.forEach((key) => {
    styleOptions[key] = colors;
  });

  perfStyles.forEach((key) => {
    if (key === "ORDER_CLASSES") {
      styleOptions[key] = styleOpts.orderClasses;
    }
  });

  Object.keys(staticStyles).forEach((key) => {
    styleOptions[key] =
      staticStyles[key] + `,${staticStyles[key]}`.repeat(styleOpts.binCount);
  });

  if (_styleOpts.hideOther) {
    styleOptions = removeOther(styleOptions);
  }

  return styleOptions;
};

export const KWmsOlLayer = (props) => {
  const {
    id,
    label,
    map,
    kineticaSettings,
    visible,
    opacity,
    wmsApiUrl,
    authUsername,
    authPassword,
    setError,
    index,
  } = props;
  const prevProps = usePrevious({
    id,
    label,
    map,
    kineticaSettings,
    visible,
    opacity,
    wmsApiUrl,
    authUsername,
    authPassword,
  });
  const [olLayer, setOlLayer] = useState(null);
  const componentName = label ? `KWmsOlLayer-${label}` : "KWmsOlLayer";

  useEffect(() => {
    console.log(
      "KWmsOlLayer changes",
      kineticaSettings?.view,
      map,
      kineticaSettings,
      visible,
      opacity,
      wmsApiUrl,
      authUsername,
      authPassword
    );

    // Check if kineticaSettings is valid
    if (!kineticaSettings) {
      return;
    }

    // Create layer
    const {
      renderType,
      view,
      baseTable,
      colormap,
      blurRadius,
      pointSize,
      fillColor,
      borderColor,
      heatmapAttr,
      cbStyleOptions,
      wkt,
      longitude,
      latitude,
    } = kineticaSettings;
    let requestParams = {
      ...WMS_PARAMS,
      STYLES: renderType,
      LAYERS: view || baseTable,
      COLORMAP: colormap,
      POINTCOLORS: fillColor,
      BLUR_RADIUS: blurRadius,
      POINTSIZES: pointSize,
      SHAPEFILLCOLORS: fillColor,
      TRACKHEADCOLORS: fillColor,
      TRACKMARKERCOLORS: fillColor,
      SHAPELINECOLORS: borderColor,
      TRACKLINECOLORS: borderColor,
      TRACKMARKERSIZES: pointSize < 5 ? Math.min(3, pointSize) : pointSize - 2,
    };

    console.log("requestParams: ", requestParams);
    console.log("heatmapAttr: ", heatmapAttr);
    if (renderType === "heatmap" && heatmapAttr != null) {
      requestParams = {
        ...requestParams,
        VAL_ATTR: heatmapAttr,
      };
    }
    if (renderType === "cb_raster") {
      const cbStyleParams = parseStyles(cbStyleOptions, props.datasource);
      requestParams = {
        ...requestParams,
        ...cbStyleParams,
      };
    }

    if (wkt !== "") {
      requestParams.GEO_ATTR = wkt;
      // remove X_ATTR and Y_ATTR
      delete requestParams.X_ATTR;
      delete requestParams.Y_ATTR;
    } else {
      requestParams.X_ATTR = longitude;
      requestParams.Y_ATTR = latitude;
      // remove GEO_ATTR
      delete requestParams.GEO_ATTR;
    }

    if (!(baseTable || view)) {
      return;
    }

    if (map == null) {
      // Do nothing when map object does not exist
    } else if (
      kineticaSettings == null ||
      wmsApiUrl == null ||
      authUsername == null ||
      authPassword == null
    ) {
      // Handle case of invalid data
      if (olLayer) {
        map.getLayers().remove(olLayer);
      }
    } else if (olLayer) {
      // Update
      if (prevProps.kineticaSettings != kineticaSettings) {
        // Todo: update WMS params
        console.log(
          `${componentName} useEffect: update: WMS params:`,
          requestParams
        );

        // get GEO_ATTR
        const geoAttr = requestParams.GEO_ATTR;
        if (requestParams.GEO_ATTR && requestParams.GEO_ATTR.length > 0) {
          delete requestParams.X_ATTR;
          delete requestParams.Y_ATTR;
        } else {
          delete requestParams.GEO_ATTR;
        }

        olLayer.getSource().updateParams(requestParams);
      }
      if (
        prevProps.wmsApiUrl != wmsApiUrl ||
        prevProps.authPassword != authPassword ||
        prevProps.authUsername != authUsername
      ) {
        // Todo: update function
        olLayer
          .getSource()
          .setImageLoadFunction(
            genImageLoadFunction(
              authUsername,
              authPassword,
              setError,
              componentName
            )
          );
        olLayer
          .getSource()
          .on(
            "imageloaderror",
            genImageLoadErrorFunction(
              wmsApiUrl,
              authUsername,
              authPassword,
              requestParams,
              setError,
              componentName
            )
          );
      }
      if (olLayer.getOpacity() != opacity / 100) {
        olLayer.setOpacity(opacity / 100);
      }
      if (olLayer.getVisible() != visible) {
        olLayer.setVisible(visible);
      }
    } else {
      const wmsSource = new OlImageWMS({
        url: wmsApiUrl,
        params: requestParams,
        serverType: "geoserver",
        crossOrigin: "anonymous",
        imageLoadFunction: (image, src) => {
          setError(componentName, "");
          const xhttp = new XMLHttpRequest();
          xhttp.open("GET", src, true);
          if (authUsername && authPassword) {
            xhttp.setRequestHeader(
              "Authorization",
              "Basic " + btoa(`${authUsername}:${authPassword}`)
            );
          }
          xhttp.responseType = "arraybuffer";
          xhttp.onreadystatechange = () => {
            if (xhttp.readyState === 4) {
              const arr = new Uint8Array(xhttp.response);
              const data = "data:image/png;base64," + base64ArrayBuffer(arr);
              image.getImage().src = data;
            }
          };
          xhttp.send();
        },
      });
      wmsSource.on(
        "imageloaderror",
        genImageLoadErrorFunction(
          wmsApiUrl,
          authUsername,
          authPassword,
          requestParams,
          setError,
          componentName
        )
      );

      const newOlLayer = new OlImage({
        source: wmsSource,
        opacity: opacity / 100,
      });

      newOlLayer.id = id;

      console.log("KWmsOlLayer useEffect: insertAt:", index + 1, label);
      map.getLayers().insertAt(index + 1, newOlLayer);
      setOlLayer(newOlLayer);
    }
  }, [
    map,
    kineticaSettings,
    visible,
    opacity,
    wmsApiUrl,
    authUsername,
    authPassword,
  ]);

  // Remove the map layer when this component is umounted
  useEffect(() => {
    return () => {
      setError(componentName, "");
      if (map && olLayer) {
        map.getLayers().remove(olLayer);
      }
    };
  }, []);

  return <></>;
};
