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

export interface SupersetPluginChartKineticaMapStylesProps {
  height: number;
  width: number;
}

interface SupersetPluginChartKineticaMapCustomizeProps {
  endpoint: string;
  username: string;
  password: string;
  center: string;
  zoom: number;
  basemapUrl: string;
  mapboxApiKey: string;
  xyzTileServiceTemplate: string,
  layers: string;
}

export type SupersetPluginChartKineticaMapQueryFormData =
  SupersetPluginChartKineticaMapStylesProps &
    SupersetPluginChartKineticaMapCustomizeProps;

export type SupersetPluginChartKineticaMapProps =
  SupersetPluginChartKineticaMapStylesProps &
    SupersetPluginChartKineticaMapCustomizeProps & {
      datasource: any;
      emitCrossFilters: any;
      dataMask: any;
      extraFormData: any;
      onAddFilter: any;
      setDataMask: any;
      onContextMenu: any;
      filterState: any;
      sliceId: number;
    };
