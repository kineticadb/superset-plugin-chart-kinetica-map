// @ts-nocheck
import moment from "moment";
import { SUPERSET_AGGREGATIONS_LIST as excludeAggList } from "./constants";

export const CONSOLE_ENABLED = true;
export const getConsole = () => {
  return {
    log: (...args: any[]) => {
      if (CONSOLE_ENABLED) {
        window.console.log(...args);
      }
    },
    log2: (...args: any[]) => {
      window.console.log(...args);
    },
    error: (...args: any[]) => {
      if (CONSOLE_ENABLED) {
        window.console.error(...args);
      }
    },
    error2: (...args: any[]) => {
      window.console.error(...args);
    },
    info: (...args: any[]) => {
      if (CONSOLE_ENABLED) {
        window.console.info(...args);
      }
    },
    info2: (...args: any[]) => {
      window.console.info(...args);
    },
    dir: (...args: any[]) => {
      if (CONSOLE_ENABLED) {
        window.console.dir(...args);
      }
    },
    dir2: (...args: any[]) => {
      window.console.dir(...args);
    },
  };
};
const console = getConsole();

export const base64ArrayBuffer = (arrayBuffer) => {
  let base64 = "";
  const encodings =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const bytes = new Uint8Array(arrayBuffer);
  const byteLength = bytes.byteLength;
  const byteRemainder = byteLength % 5;
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
    base64 += encodings[a] + encodings[b] + "==";
  } else if (byteRemainder === 2) {
    chunk = (bytes[mainLength] << 8) | bytes[mainLength + 1];
    a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
    b = (chunk & 1008) >> 4; // 1008  = (2^6 - 1) << 4
    // Set the 2 least significant bits to zero
    c = (chunk & 15) << 2; // 15    = 2^4 - 1
    base64 += encodings[a] + encodings[b] + encodings[c] + "=";
  }
  return base64;
};

export const buildExpression = (sourceFilter) => {
  console.log("buildExpression: sourceFilter:", sourceFilter);
  const conditions = Object.keys(sourceFilter).map((key) => {
    const numericTypes = [
      "int",
      "float",
      "currency",
      "percent",
      "date",
      "date-time",
      "duration",
    ];
    const dateTimeFunctions = [
      "YEAR",
      "QUARTER",
      "MONTH",
      "DAY",
      "HOUR",
      "MINUTE",
      "SECOND",
    ];

    const {
      exteriorExpression,
      include,
      exclude,
      type,
      binned,
      isCalculatedField,
    } = sourceFilter[key];
    if (
      exteriorExpression === undefined ||
      excludeAggList.indexOf(exteriorExpression) === -1
    ) {
      let keyVal = key;
      let values = include;

      const _exteriorExpression = exteriorExpression ? exteriorExpression : "";
      // range filter on date-time and number
      if (numericTypes.indexOf(type) > -1 && !isCalculatedField) {
        console.log(
          "buildExpression: range filter on date-time and number: ",
          sourceFilter[key]
        );

        // include
        if (include && include.length > 0) {
          if (typeof include[0] === "string" && type !== "date-time") {
            console.log(
              "buildExpression: string / not date-time: ",
              sourceFilter[key]
            );

            // values are formatted strings so the exterior expression needs to be applied
            keyVal =
              _exteriorExpression.length > 0
                ? `${_exteriorExpression}(${key})`
                : `${key}`;
            values = sourceFilter[key].include.map((value) => {
              return _exteriorExpression.length > 0
                ? `${exteriorExpression}('${value}')`
                : `${value}`;
            });

            const inExp = Array.from(new Set(values))
              .map((value) => {
                return (sourceFilter[key].type &&
                  sourceFilter[key].type === "string") ||
                  typeof value === "string"
                  ? `${value}`
                  : value;
              })
              .join(",");
            return `${keyVal} in (${inExp})`;
          } else if (typeof include[0] === "string" && type === "date-time") {
            console.log(
              "buildExpression: string / date-time: ",
              sourceFilter[key]
            );

            // apply the date times as a range
            const dateTimes = sourceFilter[key].include.map((value) => {
              return moment(value);
            });

            const minDateTime = moment.min(dateTimes);
            const maxDateTime = moment.max(dateTimes);
            const dateFormat = "YYYY-MM-DD HH:mm:ss";

            return `${key} >= '${minDateTime
              .utc()
              .format(dateFormat)}' and ${key} <= '${maxDateTime
              .utc()
              .format(dateFormat)}'`;
          } else if (dateTimeFunctions.indexOf(_exteriorExpression) > -1) {
            // has YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND
            console.log(
              "buildExpression: date-time function: ",
              sourceFilter[key]
            );
            const { YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND } =
              sourceFilter[key];
            let exp = "";
            if (YEAR) {
              exp += `YEAR(${key}) >= ${Math.min(
                ...YEAR
              )} and YEAR(${key}) <= ${Math.max(...YEAR)} and `;
            }
            if (QUARTER) {
              exp += `QUARTER(${key}) >= ${Math.min(
                ...QUARTER
              )} and QUARTER(${key}) <= ${Math.max(...QUARTER)} and `;
            }
            if (MONTH) {
              exp += `MONTH(${key}) >= ${Math.min(
                ...MONTH
              )} and MONTH(${key}) <= ${Math.max(...MONTH)} and `;
            }
            if (DAY) {
              exp += `DAY(${key}) >= ${Math.min(
                ...DAY
              )} and DAY(${key}) <= ${Math.max(...DAY)} and `;
            }
            if (HOUR) {
              exp += `HOUR(${key}) >= ${Math.min(
                ...HOUR
              )} and HOUR(${key}) <= ${Math.max(...HOUR)} and `;
            }
            if (MINUTE) {
              exp += `MINUTE(${key}) >= ${Math.min(
                ...MINUTE
              )} and MINUTE(${key}) <= ${Math.max(...MINUTE)} and `;
            }
            if (SECOND) {
              exp += `SECOND(${key}) >= ${Math.min(
                ...SECOND
              )} and SECOND(${key}) <= ${Math.max(...SECOND)} and `;
            }
            return exp.substring(0, exp.length - 4);
          } else if (numericTypes.indexOf(type) > -1) {
            console.log("buildExpression: number: ", sourceFilter[key]);
            if (
              !exteriorExpression ||
              excludeAggList.indexOf(exteriorExpression) === -1
            ) {
              if (binned && binned.length > 0) {
                let _expr = "";
                const range = Math.abs(
                  Math.abs(binned[1]) - Math.abs(binned[0])
                );
                _expr = `IF(${key}/${range} < 0 AND CAST(${key}/${range}, int) != ${key}/${range}, CAST(${key}/${range}, int) - 1, CAST(${key}/${range}, int) - 0 ) = ${binned[2]}`;
                return _expr;
              } else {
                // apply as a range (include is already in numeric order)
                const min = Math.min(...include);
                const max = Math.max(...include);
                return `${key} >= ${min} and ${key} <= ${max}`;
              }
            } else {
              console.log(
                "buildExpression: ignoring exteriorExpression for number type: ",
                sourceFilter[key]
              );
            }
          }
        }

        // exclude
        if (exclude && exclude.length > 0) {
          if (typeof exclude[0] === "string" && type !== "date-time") {
            // values are formatted strings so the exterior expression needs to be applied
            keyVal =
              _exteriorExpression.length > 0
                ? `${_exteriorExpression}(${key})`
                : `${key}`;
            values = sourceFilter[key].exclude.map((value) => {
              return _exteriorExpression.length > 0
                ? `${exteriorExpression}('${value}')`
                : `${value}`;
            });

            const inExp = Array.from(new Set(values))
              .map((value) => {
                return (sourceFilter[key].type &&
                  sourceFilter[key].type === "string") ||
                  typeof value === "string"
                  ? `${value}`
                  : value;
              })
              .join(",");
            return `${keyVal} not in (${inExp})`;
          } else if (typeof exclude[0] === "string" && type === "date-time") {
            // apply the date times as a range
            const dateTimes = sourceFilter[key].exclude.map((value) => {
              return moment(value);
            });

            const minDateTime = moment.min(dateTimes);
            const maxDateTime = moment.max(dateTimes);
            const dateFormat = "YYYY-MM-DD HH:mm:ss";

            return `${key} < '${minDateTime
              .utc()
              .format(dateFormat)}' and ${key} > '${maxDateTime
              .utc()
              .format(dateFormat)}'`;
          } else if (dateTimeFunctions.indexOf(_exteriorExpression) > -1) {
            // has YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND
            console.log(
              "buildExpression: date-time function: ",
              sourceFilter[key]
            );
            const { YEAR, QUARTER, MONTH, DAY, HOUR, MINUTE, SECOND } =
              sourceFilter[key];
            let exp = "";
            if (YEAR) {
              exp += `YEAR(${key}) < ${Math.min(
                ...YEAR
              )} and YEAR(${key}) > ${Math.max(...YEAR)} and `;
            }
            if (QUARTER) {
              exp += `QUARTER(${key}) < ${Math.min(
                ...QUARTER
              )} and QUARTER(${key}) > ${Math.max(...QUARTER)} and `;
            }
            if (MONTH) {
              exp += `MONTH(${key}) < ${Math.min(
                ...MONTH
              )} and MONTH(${key}) > ${Math.max(...MONTH)} and `;
            }
            if (DAY) {
              exp += `DAY(${key}) < ${Math.min(
                ...DAY
              )} and DAY(${key}) > ${Math.max(...DAY)} and `;
            }
            if (HOUR) {
              exp += `HOUR(${key}) < ${Math.min(
                ...HOUR
              )} and HOUR(${key}) > ${Math.max(...HOUR)} and `;
            }
            if (MINUTE) {
              exp += `MINUTE(${key}) < ${Math.min(
                ...MINUTE
              )} and MINUTE(${key}) > ${Math.max(...MINUTE)} and `;
            }
            if (SECOND) {
              exp += `SECOND(${key}) < ${Math.min(
                ...SECOND
              )} and SECOND(${key}) > ${Math.max(...SECOND)} and `;
            }
            return exp.substring(0, exp.length - 4);
          } else if (numericTypes.indexOf(type) > -1) {
            if (
              !exteriorExpression ||
              excludeAggList.indexOf(exteriorExpression) === -1
            ) {
              if (binned && binned.length > 0) {
                let _expr = "";
                const range = Math.abs(
                  Math.abs(binned[1]) - Math.abs(binned[0])
                );
                _expr = `IF(${key}/${range} < 0 AND CAST(${key}/${range}, int) != ${key}/${range}, CAST(${key}/${range}, int) - 1, CAST(${key}/${range}, int) - 0 ) != ${binned[2]}`;
                return _expr;
              } else {
                // apply as a range (include is already in numeric order)
                const min = Math.min(...include);
                const max = Math.max(...include);
                return `${key} < ${min} and ${key} >= ${max}`;
              }
            } else {
              console.log(
                "buildExpression: ignoring exteriorExpression for number type: ",
                sourceFilter[key]
              );
            }
          }
        }
      }

      // filter by value on all other types
      else {
        keyVal =
          _exteriorExpression.length > 0
            ? `${_exteriorExpression}(${key})`
            : `${key}`;

        // include
        if (include.length > 0) {
          if (isCalculatedField) {
            const inExp = Array.from(new Set(sourceFilter[key].include))
              .map((sqlKey) => {
                const f = sourceFilter[key];
                console.log("sqlKey: ", sqlKey, " f: ", f);
                let sqlEntries = [];
                f.sql.forEach((sqlEntry) => {
                  console.log(
                    "sqlEntry: ",
                    sqlEntry,
                    " sqlKey: ",
                    sqlKey,
                    Object.keys(sqlEntry)
                  );
                  if (sqlEntry[sqlKey]) {
                    sqlEntries.push(sqlEntry[sqlKey]);
                    console.log(
                      "pushing sqlEntry: ",
                      sqlEntry[sqlKey],
                      " sqlEntries: ",
                      sqlEntries
                    );
                  }
                });
                console.log("sqlEntries: ", sqlEntries);
                let _sql;
                if (sqlEntries.length > 1) {
                  _sql = sqlEntries.join(" OR ");
                } else if (sqlEntries.length === 1) {
                  _sql = sqlEntries[0];
                }
                console.log("returning _sql: ", _sql);
                return _sql;
              })
              .join(" OR ");
            console.log("returning inExp: ", inExp);
            return `(${inExp})`;
          } else {
            const inExp = Array.from(new Set(sourceFilter[key].include))
              .map((value) => {
                return (sourceFilter[key].type &&
                  sourceFilter[key].type === "string") ||
                  typeof value === "string"
                  ? `'${value}'`
                  : value;
              })
              .join(",");
            return `${keyVal} in (${inExp})`;
          }
        }

        // exclude
        if (exclude.length > 0) {
          if (isCalculatedField) {
            const exExp = Array.from(new Set(sourceFilter[key].exclude))
              .map((sqlKey) => {
                const f = sourceFilter[key];
                let sqlEntries = [];
                f.sql.forEach((sqlEntry) => {
                  if (sqlEntry[sqlKey]) {
                    sqlEntries.push(sqlEntry[sqlKey]);
                  }
                });
                let _sql;
                if (sqlEntries.length > 1) {
                  _sql = sqlEntries.join(" OR ");
                } else if (sqlEntries.length === 1) {
                  _sql = sqlEntries[0];
                }
                return _sql;
              })
              .join(" OR ");
            return `NOT (${exExp})`;
          } else {
            const exExp = Array.from(new Set(sourceFilter[key].exclude))
              .map((value) => {
                return (sourceFilter[key].type &&
                  sourceFilter[key].type === "string") ||
                  typeof value === "string"
                  ? `'${value}'`
                  : value;
              })
              .join(",");
            return `${key} not in (${exExp})`;
          }
        }
      }
    }
    return "";
  });
  return conditions.filter((cond) => cond !== "").join(" and ");
};

export const thousands_separators = (num) => {
  const num_parts = num.toString().split(".");
  num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return num_parts.join(".");
};

export const handleFilters = (updates) => {
  return updates
    .filter((update) => {
      if (update.col && update.op === "IN") {
        return true;
      }
      return update.appliedValues
        ? update.appliedValues.length > 0 ||
            (update.appliedValues.length === 0 && !update.isAllSelected)
        : false;
    })
    .map((update) => {
      if (update.col) {
        return {
          column: update.col,
          include: update.val,
        };
      }
      return update.isExcludeMode
        ? {
            column: update.fieldName,
            exclude:
              update.appliedValues.length > 0
                ? update.appliedValues.map((item) => {
                    return item.value;
                  })
                : [],
          }
        : {
            column: update.fieldName,
            include:
              update.appliedValues.length > 0
                ? update.appliedValues.map((item) => {
                    return item.value;
                  })
                : [],
          };
    });
};

export const getTextWidth = (text, style) => {
  var canvas = document.createElement("canvas");
  var context = canvas.getContext("2d");
  context.font = style || '11px "Roboto", Arial, sans-serif';
  var metrics = context.measureText(text);
  return metrics.width;
};

export const isDateOrTimeBased = (column, allColumns) => {
  const columnConfig = allColumns.find((c) => c.name === column);
  if (typeof columnConfig?.type === "string") {
    if (
      columnConfig?.type === "timestamp" ||
      columnConfig?.type === "date" ||
      columnConfig?.type === "time" ||
      columnConfig?.type === "datetime" ||
      (columnConfig?.type === "long" &&
        columnConfig?.properties.includes("timestamp")) ||
      (columnConfig?.type === "string" &&
        columnConfig?.properties.includes("date")) ||
      (columnConfig?.type === "string" &&
        columnConfig?.properties.includes("time")) ||
      (columnConfig?.type === "string" &&
        columnConfig?.properties.includes("datetime"))
    ) {
      return true;
    }
  } else if (
    Array.isArray(columnConfig?.type) &&
    columnConfig?.type.length > 0
  ) {
    if (
      columnConfig?.type.includes("timestamp") ||
      columnConfig?.type === "date" ||
      columnConfig?.type.includes("time") ||
      columnConfig?.type === "datetime" ||
      (columnConfig?.type.includes("long") &&
        columnConfig?.properties.includes("timestamp")) ||
      (columnConfig?.type.includes("string") &&
        columnConfig?.properties.includes("date")) ||
      (columnConfig?.type.includes("string") &&
        columnConfig?.properties.includes("time")) ||
      (columnConfig?.type.includes("string") &&
        columnConfig?.properties.includes("datetime"))
    ) {
      return true;
    }
  }
  return false;
};
