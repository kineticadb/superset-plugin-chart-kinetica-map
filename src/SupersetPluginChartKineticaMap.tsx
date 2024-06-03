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
import React, {
  createRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SupersetPluginChartKineticaMapProps } from "./types";

import { fromLonLat } from "ol/proj";
import Map from "./containers/Map";
import { ChartStyles, MapStyles } from "./styles";
import { FILTERING_MODE_FILTER } from "./constants";
import PubSub from "./pubsub";
import shortid from "shortid";

/**
 * ******************* WHAT YOU CAN BUILD HERE *******************
 *  In essence, a chart is given a few key ingredients to work with:
 *  * Data: provided via `props.data`
 *  * A DOM element
 *  * FormData (your controls!) provided as props by transformProps.ts
 */

const SupersetEventType = {
  FilterChanged: "filter_changed",
  MarkSelectionChanged: "mark_selection_changed",
  ParameterChanged: "parameter_changed",
};

export default function SupersetPluginChartKineticaMap(
  props: SupersetPluginChartKineticaMapProps
) {
  const mapId = useMemo(() => {
    return shortid.generate();
  }, []);

  const { height, width } = props;
  const { datasource, extraFormData, filterState, dataMask, setDataMask } = props;
  const { endpoint, username, password, center, zoom, basemapUrl, mapboxApiKey, xyzTileServiceTemplate, layers } = props;
  const { schema, tableName } = datasource;

  const rootElem = createRef<HTMLDivElement>();

  const pubsub = useMemo(() => {
    return {
      [SupersetEventType.FilterChanged]: new PubSub(),
      [SupersetEventType.MarkSelectionChanged]: new PubSub(),
      [SupersetEventType.ParameterChanged]: new PubSub(),
    };
  }, []);

  const [reloadConfig, setReloadConfig] = React.useState(true);
  const [settings, setSettings] = useState({
    endpoint,
    username,
    password,
    basemapUrl: basemapUrl || "OSM",
    mapboxApiKey: mapboxApiKey || "",
    xyzTileServiceTemplate: xyzTileServiceTemplate || "",
    demoMode: "false",
    filteringMode: FILTERING_MODE_FILTER,
    filterByViewportMode: false,
    updateParameterDelay: 1000,
    center: JSON.stringify(fromLonLat(center.split(",") as any)),
    zoom,
    mapLayers: layers,
  }) as any;

  const superset = useMemo(() => {
    return {
      SupersetEventType,
      extensions: {
        settings: {
          set: (key: string, value: string) => {
            setSettings({
              ...settings,
              [key]: value,
            });
            return;
          },
          get: (key: string) => {
            return settings[key];
          },
          erase: (key: string) => {
            setSettings({
              ...settings,
              [key]: undefined,
            });
            return;
          },
          saveAsync: async () => {
            return Promise.resolve(null);
          },
        },
        dashboardContent: {
          dashboard: {
            worksheets: [
              {
                getFiltersAsync: async () => {
                  const { extraFormData } = props;
                  const { filters = [] } = extraFormData;
                  return filters;
                },
                addEventListener: (
                  eventType: string,
                  cb: (filters: any) => void
                ) => {
                  pubsub[eventType].subscribe((filters: any) => {
                    cb(filters);
                  });
                  return () => {
                    pubsub[eventType].unsubscribe((filters: any) => {
                      cb(filters);
                    });
                  };
                },
                findParameterAsync: async (paramName: string) => {
                  return null;
                },
                getSelectedMarksAsync: async () => {
                  return {
                    data: [],
                  };
                },
              },
            ],
            findParameterAsync: async () => {
              return null;
            },
          },
        },
        workbook: {
          getAllDataSourcesAsync: async () => {
            return Promise.resolve([
              {
                getActiveTablesAsync: async () => {
                  return Promise.resolve([
                    {
                      id: `"${schema}"."${tableName}"`,
                      customSQL: `select * from ${schema}.${tableName}`,
                    },
                  ]);
                },
              },
            ]);
          },
        },
        ui: {
          displayDialogAsync: async () => {
            return Promise.resolve(null);
          },
        },
        initializeAsync: async () => {
          return Promise.resolve(null);
        },
      },
    };
  }, [props, settings]);

  useEffect(() => {
      setSettings({
        ...settings,
        endpoint,
        username,
        password,
        center: JSON.stringify(fromLonLat(center.split(",") as any)),
        zoom,
        basemapUrl,
        mapboxApiKey,
        xyzTileServiceTemplate,
        mapLayers: layers,
      });
    setReloadConfig(false);
    setTimeout(() => {
      setReloadConfig(true);
    }, 100);
  }, [props]);

  useEffect(() => {
    const { filters = [] } = extraFormData;
    pubsub[SupersetEventType.FilterChanged].publish(filters);
  }, [dataMask, extraFormData]);

  const resetDataMask = useCallback(
    (longitude: string, latitude: string) => {
      setDataMask({
        extraFormData: {
          filters: [],
        }
      });
    },
    [extraFormData, filterState]
  );

  const handleDataMask = useCallback(
    ({ longitude, latitude, wkt, wktgeom }: any) => {
      if (longitude && latitude) {
        setDataMask({
          extraFormData: {
            adhoc_filters: [
              {
                expressionType: 'SQL',
                sqlExpression: `${longitude} IN ('${`KI_ST_INTERSECT_X(${wktgeom})`}') AND ${latitude} IN ('${`KI_ST_INTERSECT_Y(${wktgeom})`}')`,
                clause: 'WHERE',
              },
            ],
          },
        });
      } else if (wkt) {
        setDataMask({
          extraFormData: {
            adhoc_filters: [
              {
                expressionType: 'SQL',
                sqlExpression: `${wkt} IN ('${`KI_ST_INTERSECT(${wktgeom})`}')`,
                clause: 'WHERE',
              },
            ],
          },
        });
      }
    },
    [extraFormData, filterState]
  );

  const updateFieldValue = (ariaLabel, value) => {
    const elem = document.querySelector(`[aria-label="${ariaLabel}"]`) as any;
    if (elem) {
      const lastValue = elem.value;
      elem.value = value;
      const event = new Event("input", { target: elem, bubbles: true } as any);
      const tracker = elem._valueTracker;
      if (tracker) {
        tracker.setValue(lastValue);
      }
      elem.dispatchEvent(event);
      return true;
    }
    return false;
  }

  const updateControlPanel = updates => {
    Object.keys(updates).forEach(ariaLabel => {
      updateFieldValue(ariaLabel, updates[ariaLabel]);
    })
  };

  return (
    <ChartStyles ref={rootElem} height={height} width={width}>
      <MapStyles height={height} width={width}>
        <Map
          mapId={mapId}
          superset={superset}
          handleDataMask={handleDataMask}
          resetDataMask={resetDataMask}
          reloadConfig={reloadConfig}
          updateControlPanel={updateControlPanel}
          width={width}
          height={height}
        />
      </MapStyles>
    </ChartStyles>
  );
}
