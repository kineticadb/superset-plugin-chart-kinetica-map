// @ts-nocheck

/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import { t, validateNonEmpty } from "@superset-ui/core";
import {
  ControlPanelConfig,
  sections,
  sharedControls,
} from "@superset-ui/chart-controls";
import {
  DEFAULT_COLORMAP,
  DEFAULT_FILL_COLOR,
  DEFAULT_BORDER_COLOR,
  DEFAULT_BLUR_RADIUS,
  DEFAULT_POINT_SIZE,
  DEFAULT_OPACITY,
} from "../constants";

const defaultLayers = [
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
      width: window.innerWidth,
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
];

const config: ControlPanelConfig = {
  /**
   * The control panel is split into two tabs: "Query" and
   * "Chart Options". The controls that define the inputs to
   * the chart data request, such as columns and metrics, usually
   * reside within "Query", while controls that affect the visual
   * appearance or functionality of the chart are under the
   * "Chart Options" section.
   *
   * There are several predefined controls that can be used.
   * Some examples:
   * - groupby: columns to group by (translated to GROUP BY statement)
   * - series: same as groupby, but single selection.
   * - metrics: multiple metrics (translated to aggregate expression)
   * - metric: sane as metrics, but single selection
   * - adhoc_filters: filters (translated to WHERE or HAVING
   *   depending on filter type)
   * - row_limit: maximum number of rows (translated to LIMIT statement)
   *
   * If a control panel has both a `series` and `groupby` control, and
   * the user has chosen `col1` as the value for the `series` control,
   * and `col2` and `col3` as values for the `groupby` control,
   * the resulting query will contain three `groupby` columns. This is because
   * we considered `series` control a `groupby` query field and its value
   * will automatically append the `groupby` field when the query is generated.
   *
   * It is also possible to define custom controls by importing the
   * necessary dependencies and overriding the default parameters, which
   * can then be placed in the `controlSetRows` section
   * of the `Query` section instead of a predefined control.
   *
   * import { validateNonEmpty } from '@superset-ui/core';
   * import {
   *   sharedControls,
   *   ControlConfig,
   *   ControlPanelConfig,
   * } from '@superset-ui/chart-controls';
   *
   * const myControl: ControlConfig<'SelectControl'> = {
   *   name: 'secondary_entity',
   *   config: {
   *     ...sharedControls.entity,
   *     type: 'SelectControl',
   *     label: t('Secondary Entity'),
   *     mapStateToProps: state => ({
   *       sharedControls.columnChoices(state.datasource)
   *       .columns.filter(c => c.groupby)
   *     })
   *     validators: [validateNonEmpty],
   *   },
   * }
   *
   * In addition to the basic drop down control, there are several predefined
   * control types (can be set via the `type` property) that can be used. Some
   * commonly used examples:
   * - SelectControl: Dropdown to select single or multiple values,
       usually columns
   * - MetricsControl: Dropdown to select metrics, triggering a modal
       to define Metric details
   * - AdhocFilterControl: Control to choose filters
   * - CheckboxControl: A checkbox for choosing true/false values
   * - SliderControl: A slider with min/max values
   * - TextControl: Control for text data
   *
   * For more control input types, check out the `incubator-superset` repo
   * and open this file: superset-frontend/src/explore/components/controls/index.js
   *
   * To ensure all controls have been filled out correctly, the following
   * validators are provided
   * by the `@superset-ui/core/lib/validator`:
   * - validateNonEmpty: must have at least one value
   * - validateInteger: must be an integer value
   * - validateNumber: must be an integer or decimal value
   */

  // For control input types, see: superset-frontend/src/explore/components/controls/index.js
  controlPanelSections: [
    {
      label: t("Query"),
      expanded: true,
      controlSetRows: [
        [
          {
            name: "metrics",
            config: {
              ...sharedControls.metrics,
              validators: [validateNonEmpty],
            },
          },
        ],
        ["adhoc_filters"],
      ],
    },
    {
      label: t("Server"),
      expanded: true,
      controlSetRows: [
        [
          {
            name: "endpoint",
            config: {
              type: "TextControl",
              default: "",
              renderTrigger: false,
              label: t("Endpoint URL"),
              description: t("The database endpoint URL"),
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: "username",
            config: {
              type: "TextControl",
              default: "",
              renderTrigger: false,
              label: t("Username"),
              description: t("The database account username"),
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: "password",
            config: {
              type: "TextControl",
              default: "",
              renderTrigger: false,
              label: t("Password"),
              description: t("The database account password"),
              isPassword: true,
              validators: [validateNonEmpty],
            },
          },
        ],
      ],
    },
    {
      label: t("Viewport"),
      expanded: true,
      controlSetRows: [
        [
          {
            name: "center",
            config: {
              type: "TextControl",
              default: "0,0",
              renderTrigger: false,
              label: t("Center Lon/Lat"),
              description: t("The viewport center"),
            },
          },
        ],
        [
          {
            name: "zoom",
            config: {
              type: "TextControl",
              default: "1",
              renderTrigger: false,
              label: t("Zoom Level"),
              description: t("The viewport zoom level"),
            },
          },
        ],
        [
          {
            name: "basemapUrl",
            config: {
              type: "SelectControl",
              default: "OSM",
              choices: [
                ["OSM", t("OpenStreetMap")],
                ["light-v10", t("Mapbox Light")],
                ["dark-v11", t("Mapbox Dark")],
                ["streets-v11", t("Mapbox Street")],
                ["satellite-streets-v11", t("Mapbox Satellite Street")],
                ["xyz-service", t("Custom Basemap URL")],
              ],
              renderTrigger: false,
              label: t("Basemap"),
              description: t("BasemapProvider"),
            },
          },
        ],
        [
          {
            name: "mapboxApiKey",
            config: {
              type: "TextControl",
              default: "",
              renderTrigger: false,
              label: t("Mapbox API Key"),
              description: t("Required for Mapbox Basemaps"),
            },
          },
        ],
        [
          {
            name: "xyzTileServiceTemplate",
            config: {
              type: "TextControl",
              default: "",
              renderTrigger: false,
              label: t("Custom Basemap URL"),
              description: t("Provide custom basemap provider tile service(XYZ format). Make sure to select 'Custom Basemap URL' from the Basemap dropdown"),
            },
          },
        ],
      ],
    },
    {
      label: t("WMS"),
      expanded: true,
      controlSetRows: [
        [
          {
            name: "layers",
            config: {
              type: "TextControl",
              // default: JSON.stringify(defaultLayers),
              default: "",
              renderTrigger: false,
              label: t("Layers"),
              description: t("WMS Layers Configuration JSON"),
              disabled: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
