import GPUdb from './GPUdb';

const GPUdbHelper = (function () {
  function exec_gpudb_method(gpudbApi, method, methodParams) {
    return new Promise((resolve, reject) => {
        if (methodParams.length + 1 !== gpudbApi[method].length) {
            reject(`Invalid number of paramaters for ${method}. Expecting ${gpudbApi[method].length}. First parameter needs to be GPUdb object followed by all parameters for ${method}`);
        }

        gpudbApi[method].apply(gpudbApi, methodParams.concat((respError, respData) => { 
            if (respError) {
              reject(respError);
            } else {
              resolve(respData);
            }
        }));
    });
  };

  // Create a Kinetica API that uses promises instead of callbacks
  let promiseApi = {};
  Object.keys(GPUdb.prototype)
      .filter((key) => key.endsWith('_request') && key !== 'submit_request')
      .map((key) => key.replace('_request', ''))
      .forEach((methodKey) => { 
        promiseApi[methodKey] = function (gpudbApi) {
          return exec_gpudb_method(gpudbApi, methodKey, [...arguments].slice(1));
        };
      });

  const kineticaTypes = {
    FEATURE_TYPE: {
      TRACK: 'TRACK',
      LINE: 'LINE',
      POLYGON: 'POLYGON',
      POINT: 'POINT',
      LABEL: 'LABEL',
    }
  };

  // Create a WMS helper
  let wmsHelper = {
    WMS_STYLE_OPTS: {
      REQUEST: 'REQUEST',
      SRS: 'SRS',
      LAYERS: 'LAYERS',
      BBOX: 'BBOX',
      WIDTH: 'WIDTH',
      HEIGHT: 'HEIGHT',
      VERSIONL: 'VERSION',
      STYLES: 'STYLES',
      FORMAT: 'FORMAT',
      TRANSPARENT: 'TRANSPARENT',
      X_ATTR: 'X_ATTR',
      Y_ATTR: 'Y_ATTR',
      GEO_ATTR: 'GEO_ATTR',
      SYMBOL_ATTR: 'SYMBOL_ATTR',

      ANTIALIASING: 'ANTIALIASING',
      ORDER_LAYERS: 'ORDER_LAYERS',

      POINTSHAPES: 'POINTSHAPES',
      POINTCOLORS: 'POINTCOLORS',
      POINTSIZES: 'POINTSIZES',
      POINTOFFSET_X: 'POINTOFFSET_X',
      POINTOFFSET_Y: 'POINTOFFSET_Y',
      SYMBOLROTATIONS: 'SYMBOLROTATIONS',

      SHAPEFILLCOLORS: 'SHAPEFILLCOLORS',
      SHAPELINECOLORS: 'SHAPELINECOLORS',
      SHAPELINEWIDTHS: 'SHAPELINEWIDTHS',
      SHAPELINEPATTERNLENS: 'SHAPELINEPATTERNLENS',
      SHAPELINEPATTERNS: 'SHAPELINEPATTERNS',
      HASHLINEANGLES: 'HASHLINEANGLES',
      HASHLINECOLORS: 'HASHLINECOLORS',
      HASHLINEINTERVALS: 'HASHLINEINTERVALS',
      HASHLINELENS: 'HASHLINELENS',
      HASHLINEWIDTHS: 'HASHLINEWIDTHS',


      TRACKHEADSHAPES: 'TRACKHEADSHAPES',
      TRACKHEADCOLORS: 'TRACKHEADCOLORS',
      TRACKHEADSIZES: 'TRACKHEADSIZES',

      TRACKMARKERSHAPES: 'TRACKMARKERSHAPES',
      TRACKMARKERCOLORS: 'TRACKMARKERCOLORS',
      TRACKMARKERSIZES: 'TRACKMARKERSIZES',

      TRACKLINECOLORS: 'TRACKLINECOLORS',
      TRACKLINEWIDTHS: 'TRACKLINEWIDTHS',

      CB_DELIMITER: 'CB_DELIMITER',
      ORDER_CLASSES: 'ORDER_CLASSES',
      USE_POINT_RENDERER: 'USE_POINT_RENDERER',
      CB_VALS: 'CB_VALS',
      CB_ATTR: 'CB_ATTR',
      CB_POINTCOLOR_ATTR: 'CB_POINTCOLOR_ATTR',
      CB_POINTCOLOR_VALS: 'CB_POINTCOLOR_VALS',
      CB_POINTSIZE_ATTR: 'CB_POINTSIZE_ATTR',
      CB_POINTSIZE_VALS: 'CB_POINTSIZE_VALS',
      CB_POINTSHAPE_ATTR: 'CB_POINTSHAPE_ATTR',
      CB_POINTSHAPE_VALS: 'CB_POINTSHAPE_VALS',
      ALPHA_BLENDING: 'ALPHA_BLENDING',

      BLUR_RADIUS: 'BLUR_RADIUS',
      COLORMAP: 'COLORMAP',
      GRADIENT_START_COLOR: 'GRADIENT_START_COLOR',
      GRADIENT_END_COLOR: 'GRADIENT_END_COLOR',
      VAL_ATTR: 'VAL_ATTR',

      COLOR: 'COLOR',
      BG_COLOR: 'BG_COLOR',
      TEXT_COLOR: 'TEXT_COLOR',
      MIN_LEVEL: 'MIN_LEVEL',
      MAX_LEVEL: 'MAX_LEVEL',
      NUM_LEVELS: 'NUM_LEVELS',
      ADJUST_LEVEL: 'ADJUST_LEVEL',
      SEARCH_RADIUS: 'SEARCH_RADIUS',
      GRIDDING_METHOD: 'GRIDDING_METHOD',
      SMOOTHING_FACTOR: 'SMOOTHING_FACTOR',
      MAX_SEARCH_CELLS: 'MAX_SEARCH_CELLS',
      RENDER_OUTPUT_GRID: 'RENDER_OUTPUT_GRID',
      GRID_SIZE: 'GRID_SIZE',
      ADJUST_GRID: 'ADJUST_GRID',
      ADJUST_GRID_NEIGH: 'ADJUST_GRID_NEIGH',
      ADJUST_GRID_SIZE: 'ADJUST_GRID_SIZE',
      MIN_GRID_SIZE: 'MIN_GRID_SIZE',
      MAX_GRID_SIZE: 'MAX_GRID_SIZE',
      ADD_LABELS: 'ADD_LABELS',
      LABELS_FONT_SIZE: 'LABELS_FONT_SIZE',
      LABELS_FONT_FAMILY: 'LABELS_FONT_FAMILY',
      LABELS_SEARCH_WINDOW: 'LABELS_SEARCH_WINDOW',
      LABELS_INTRALEVEL_SEPARATION: 'LABELS_INTRALEVEL_SEPARATION',
      LABELS_INTERLEVEL_SEPARATION: 'LABELS_INTERLEVEL_SEPARATION',
      LABELS_MAX_ANGLE: 'LABELS_MAX_ANGLE',


      DOPOINTS: 'DOPOINTS',
      DOSHAPES: 'DOSHAPES',
      DOTRACKS: 'DOTRACKS',
      DOSYMBOLOGY: 'DOSYMBOLOGY',
    },
    createAuthHeader: function(kUser, kPass) { return 'Basic ' + btoa(kUser + ':' + kPass); },
    base64ArrayBuffer: function(arrayBuffer) {
        let base64 = '';
        const encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
        const bytes = new Uint8Array(arrayBuffer);
        const byteLength = bytes.byteLength;
        const byteRemainder = byteLength % 3;
        const mainLength = byteLength - byteRemainder;

        let a;
        let b;
        let c;
        let d;
        let chunk;

        // Main loop deals with bytes in chunks of 3
        for (let i = 0; i < mainLength; i = i + 3) {
            // Combine the three bytes into a single integer
            chunk = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];

            // Use bitmasks to extract 6-bit segments from the triplet
            a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
            b = (chunk & 258048) >> 12; // 258048   = (2^6 - 1) << 12
            c = (chunk & 4032) >> 6; // 4032     = (2^6 - 1) << 6
            d = chunk & 63; // 63       = 2^6 - 1

            // Convert the raw binary segments to the appropriate ASCII encoding
            base64 += encodings[a] + encodings[b] + encodings[c] + encodings[d];
        }

        // Deal with the remaining bytes and padding
        if (byteRemainder === 1) {
            chunk = bytes[mainLength];

            a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

            // Set the 4 least significant bits to zero
            b = (chunk & 3) << 4; // 3   = 2^2 - 1

            base64 += encodings[a] + encodings[b] + '==';
        } else if (byteRemainder === 2) {
            chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];

            a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
            b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4

            // Set the 2 least significant bits to zero
            c = (chunk & 15) << 2; // 15    = 2^4 - 1

            base64 += encodings[a] + encodings[b] + encodings[c] + '=';
        }

        return base64;
    },
    requestImageWithAuth: function(kUser, kPass, url, w1, h1) {
      return new Promise((resolve, reject) => {      
          let client = new XMLHttpRequest();
          client.open('GET', url, true);
          client.setRequestHeader('Authorization', wmsHelper.createAuthHeader(kUser, kPass));
          client.responseType = 'arraybuffer';

          client.onreadystatechange = function () {
            if (this.readyState === 4) {
              if (this.status === 200) {
                const arr = new Uint8Array(this.response);
                const data = 'data:image/png;base64,' + wmsHelper.base64ArrayBuffer(arr);

                let canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');

                // set its dimension to target size
                canvas.width = w1;
                canvas.height = h1;

                let img1 = document.createElement('img');
                img1.onload = function(){
                  ctx.drawImage(img1,0,0,w1,h1);
                  resolve(canvas.toDataURL());
                };
                img1.onerror = function(){
                  console.log('WMS Error', this.response);
                  reject(this.response);
                };
                img1.src = data;
              }
            }
          };
          client.send();
      });
    },
  };

  let utils = {
    createAutomaticEqualIntervalClassBreaks(min, max, numberBins, styleRamp) {
      // TODO: Handle case when colorRamp has less colors than number of bins
      // if (colorRamp.length < numberBins)
      let actualMax = Math.ceil(max);
      let actualMin = Math.floor(min);
      let powerRound = 0;
      if (actualMax <= 1) {
        powerRound = 1;
        if (numberBins > 5) {
          powerRound = 2;
        }
      }
      let interval = Math.ceil(Math.abs((actualMax - actualMin) / numberBins), powerRound);
      let currentInt = Math.floor(actualMin);
      let ranges = [];
      let styles = [];
      for (let breakIndex = 0; breakIndex < numberBins; breakIndex++) {
        let min = (breakIndex === 0 && actualMin < currentInt) ? actualMin : currentInt;
        let max = (breakIndex === (numberBins - 1)) ? actualMax : currentInt + interval;
        styles.push(styleRamp[breakIndex]);
        ranges.push([min, max]);

        currentInt = currentInt + interval;
      }

      return {
        ranges,
        styles,
      };
    },

    createAutomaticStdDevIntervalClassBreaks(min, max, mean, stdeviation, numberBins, styleRamp) {
      let actualMax = max;
      let actualMin = min;
      max = mean + stdeviation;
      max = max > actualMax ? actualMax : max;
      min = mean - stdeviation;
      min = min < actualMin ? actualMin : min;

      let interval = Math.abs((max - min) / numberBins);
      if (1 < (max - min))
        interval = Math.ceil(interval);

      if (interval >= 1) {
        actualMax = Math.ceil(actualMax);
        max = Math.ceil(max);
        actualMin = Math.floor(actualMin);
        min = Math.floor(min);
      }

      let currentInt = min;
      let ranges = [];
      let styles = [];
      for (let breakIndex = 0; breakIndex < numberBins; breakIndex++) {
          let r1 = breakIndex === 0 ? actualMin : currentInt;
          let r2 = breakIndex === (numberBins -1) ? actualMax : currentInt + interval;
          styles.push(styleRamp[breakIndex]);


          if (breakIndex === numberBins -1) {
            ranges.push([r1, r2 + 1]);
          } else {
            ranges.push([r1, r2]);
          }

          currentInt = currentInt + interval;
      }
      return {
        ranges,
        styles,
      };
    },

    fitlerByFilteredTable: function(gpudbApi, tableName, viewName, columnName, sourceTable, sourceTableColumnName, additionalSourceTableExpression, options, sourceFilterOptions) {
      return new Promise((result, reject) => {
        const sourceTableView = sourceTable + viewName;
        promiseApi
          .filter(gpudbApi, sourceTable, sourceTableView, additionalSourceTableExpression, sourceFilterOptions)
          .then((data1) => {
            if (data1) {
              promiseApi
                .filter_by_table(gpudbApi, tableName, viewName, columnName, sourceTableView, sourceTableColumnName, options)
                .then(kResults => {
                  result(kResults);
                });
            } else {
              reject("Error getting results");
            }
          }).catch(err => {
            reject(err);
          });  
      });
    },

    getPagedDataInSingleAsyncCall: async function(gpudbApi, view, options, pageSize) {
        let recordOffset = 0;
        const firstResp = await promiseApi.get_records(
          gpudbApi,
          view,
          recordOffset,
          pageSize,
          options
        );

        const totalRecords = firstResp.total_number_of_records;
        const hasMoreRecords = firstResp.has_more_records;
        let allPromises = [];
        let allResponses = [firstResp];
        if (hasMoreRecords === true) {
            recordOffset += pageSize;
            let recordsRemaining = totalRecords - recordOffset;
            while (recordsRemaining > 0) {
                let step = pageSize;
                if (recordsRemaining < pageSize) {
                    step = recordsRemaining;
                }
                allPromises.push(promiseApi.get_records(gpudbApi, view, recordOffset, step, options));
                recordsRemaining -= step;
            }
            allResponses = await Promise.all([firstResp, ...allPromises]);
        }

        return allResponses;
    },

    getPagedDataByColumnInSingleAsyncCall: async function(gpudbApi, view, columns, options, pageSize) {
      let recordOffset = 0;
      const firstResp = await promiseApi.get_records_by_column(
        gpudbApi,
        view,
        columns,
        recordOffset,
        pageSize,
        options
      );

      const totalRecords = firstResp.total_number_of_records;
      const hasMoreRecords = firstResp.has_more_records;
      let allPromises = [];
      let allResponses = [firstResp];
      if (hasMoreRecords === true) {
          recordOffset += pageSize;
          let recordsRemaining = totalRecords - recordOffset;
          while (recordsRemaining > 0) {
              let step = pageSize;
              if (recordsRemaining < pageSize) {
                  step = recordsRemaining;
              }
              allPromises.push(promiseApi.get_records_by_column(gpudbApi, view, columns, recordOffset, step, options));
              recordsRemaining -= step;
          }
          allResponses = await Promise.all([firstResp, ...allPromises]);
      }
      return allResponses;
    },

    getPagedDataByColumnInSingleQuery: function(gpudbApi, view, columns, totalSize, options, pageSize) {
      return new Promise((result, reject) => {
        let allResults = {};
        let fetchData = (page = 0) => {
          promiseApi.get_records_by_column(
            gpudbApi,
            view,
            columns,
            pageSize * page,
            pageSize,
            options
          ).then((res, err) => {
            Object.keys(res.data).forEach(key => {
              if (key === 'column_datatypes' || key === 'column_headers') {
                if (allResults[key] === undefined) {
                  allResults[key] = res.data[key];
                }
              } else if (allResults[key] === undefined) {
                allResults[key] = res.data[key];
              } else {
                allResults[key] = allResults[key].concat(res.data[key])
              }
            });
            if (res.has_more_records && allResults['column_1'].length < totalSize) {
              fetchData(page + 1);
            } else {
              allResults.has_more_records = res.has_more_records;
              result(allResults);
            }
          });
        }
        fetchData();
      });
    },
    getPagedDataByColumnWithPerPageCallback: function(gpudbApi, view, columns, totalSize, options, pageSize, pageDataCallback) {
      return new Promise((result, reject) => {
        let allResults = {};
        let fetchData = (page = 0) => {
          promiseApi.get_records_by_column(
            gpudbApi,
            view,
            columns,
            pageSize * page,
            pageSize,
            options
          ).then((res, err) => {
            Object.keys(res.data).forEach(key => {
              if (key === 'column_datatypes' || key === 'column_headers') {
                if (allResults[key] === undefined) {
                  allResults[key] = res.data[key];
                }
              } else if (allResults[key] === undefined) {
                allResults[key] = res.data[key];
              } else {
                allResults[key] = allResults[key].concat(res.data[key])
              }
            });
            if (res.has_more_records && allResults['column_1'].length < totalSize) {
              fetchData(page + 1);
              pageDataCallback(res.data);
            } else {
              allResults.has_more_records = res.has_more_records;
              pageDataCallback(res.data);
              result(allResults);
            }
          });
        }
        fetchData();
      });
    },
    safeCheckClearTables: function (gpudbApi, prefix, tables, authorization, options) {
      if (prefix == null || prefix === '') {
        return new Promise((resolve, reject) => {
          reject('No prefix provided.');
        });
      }

      if (tables == null || tables.length < 1) {
        return new Promise((resolve, reject) => {
          reject('No tables provided to clear');
        });
      }

      if (gpudbApi == null) {
        return new Promise((resolve, reject) => {
          reject('GPUdb api is not defined:' + gpudbApi);
        });
      }

      let missingPrefixes = tables.filter((table) => !table.startsWith(prefix));
      if (missingPrefixes != null && missingPrefixes.length > 0) {
        return new Promise((resolve, reject) => {
          reject(`Tables missing prefix(${prefix})` + missingPrefixes);
        });
      }

      let allPromises = [];
      tables.forEach((table, tIndex) => {
        console.log('clearing table', table);
        allPromises.push(promiseApi.clear_table(gpudbApi, table, authorization, options));
      });
      return Promise.all(allPromises);
    },
    convertGetRecordsResponseToKeyValueRecords: function(kResponse) {
      const { column_headers, column_1 } = kResponse;

      if (column_headers === undefined) {
        return null;
      }

    let records = [];
      let headerValuesMapping = {};
      column_headers.forEach((columnHeader, colIndex) => {
        headerValuesMapping[columnHeader] = kResponse['column_' + (colIndex + 1)];
      });

      for (let arrIndex = 0; arrIndex < column_1.length; arrIndex++) {
          let record = {};
          for(let headerIndex = 0; headerIndex < column_headers.length; headerIndex++) {
            const colHeader = column_headers[headerIndex];
            record[colHeader] = headerValuesMapping[colHeader][arrIndex];
          }
          records.push(record);
      }

      return records;
    }
  };

  return {
    promiseApi,
    wmsHelper,
    utils,
    kineticaTypes,
  };
}());

export default GPUdbHelper;
