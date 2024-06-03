import React, { useEffect, useState } from "react";
import DataGrid from "react-data-grid";
import { CaretLeftFill, CaretRightFill, X } from "react-bootstrap-icons";
import { Form } from "react-bootstrap";
import {
  INFO_MODAL_FETCH_LIMIT,
  INFO_MODAL_MAX_CONTENT_LENGTH,
  INFO_MODAL_MAX_COLUMNS_TO_SHOW,
} from "../constants";
import { getTextWidth } from "../util";

const Info = (props) => {
  const {
    id,
    gpudb,
    table,
    width,
    coordinate,
    columns,
    calculatedField,
    calculatedFieldName,
    close,
  } = props;

  const [pageNumber, setPageNumber] = useState(1);
  const [displayedPageNumber, setDisplayedPageNumber] = useState(1);
  const [records, setRecords] = useState(undefined);

  useEffect(
    (_) => {
      if (
        !isNaN(displayedPageNumber) &&
        displayedPageNumber >= 1 &&
        displayedPageNumber <=
          parseInt(records?.total_number_of_records / INFO_MODAL_FETCH_LIMIT) +
            1
      ) {
        setPageNumber(displayedPageNumber);
      }
    },
    [displayedPageNumber]
  );

  useEffect(
    (_) => {
      async function fetchData(table, calculatedField, columns) {
        // convert the data to be consumable by the DataGrid
        function transformData(data) {
          let newData = [];
          let maxRows = 0;
          if (data.column_1?.length > 0) {
            maxRows = data.column_1.length;
          }
          for (let i = 0; i < maxRows; i++) {
            let newRow = {};
            let column_names = data.column_headers;
            for (let j = 0; j < column_names.length; j++) {
              let colName = "column_" + (j + 1);
              newRow[column_names[j]] = data[colName][i];
            }
            newData.push(newRow);
          }
          return newData;
        }

        // trim records to N columns
        function keepToMaxColumns(records, maxCols) {
          return records.data.map((item) => {
            let newItem = {};
            let count = 0;
            for (let key in item) {
              if (count < maxCols) {
                newItem[key] = item[key];
              }
              count++;
            }
            return newItem;
          });
        }

        if (calculatedField === null) {
          const records = await gpudb.get_records(
            table,
            (pageNumber - 1) * INFO_MODAL_FETCH_LIMIT,
            INFO_MODAL_FETCH_LIMIT,
            {}
          );
          records.data = keepToMaxColumns(
            records,
            INFO_MODAL_MAX_COLUMNS_TO_SHOW
          );
          setRecords(records);
        } else {
          const column_names = columns.map((column) => column.name);

          // insert calculated field into column_names' first position
          column_names.unshift(calculatedField);

          const records = await gpudb.get_records_by_column(
            table,
            column_names,
            (pageNumber - 1) * INFO_MODAL_FETCH_LIMIT,
            INFO_MODAL_FETCH_LIMIT,
            {}
          );

          if (calculatedFieldName !== null) {
            // remove first item from records.column_headers
            records.data.column_headers.shift();
            // insert calculated field name into column_names' first position
            //records.data.column_headers.unshift(calculatedFieldName + ' (' + calculatedField + ')');
            records.data.column_headers.unshift(calculatedFieldName);
          }

          const newData = transformData(records.data);
          //console.log('Info newData', newData);

          records.data = newData;
          records.data = keepToMaxColumns(
            records,
            INFO_MODAL_MAX_COLUMNS_TO_SHOW
          );
          setRecords(records);
        }
      }

      if (gpudb && table) {
        fetchData(table, calculatedField, columns);
      } else {
        setRecords(undefined);
      }
    },
    [gpudb, table, calculatedField, columns, calculatedFieldName, pageNumber]
  );

  const truncateIfString = (value, length) => {
    return typeof value === "string" &&
      value.length > INFO_MODAL_MAX_CONTENT_LENGTH
      ? `${value.slice(0, length)}...`
      : value;
  };

  const convertIfTimestamp = (value) => {
    return typeof value === "number" && value.toString().length === 13
      ? new Date(value).toUTCString()
      : value;
  };

  const getMaxWidthRequired = (column, pad) => {
    const columnWidth = getTextWidth(
      truncateIfString(column, INFO_MODAL_MAX_CONTENT_LENGTH)
    );
    const maxTextWidth = records
      ? records.data.reduce((acc, cur) => {
          const textWidth = getTextWidth(
            convertIfTimestamp(
              truncateIfString(cur[column], INFO_MODAL_MAX_CONTENT_LENGTH)
            )
          );
          acc = Math.max(acc, textWidth);
          return acc;
        }, 50)
      : 50;
    return Math.max(columnWidth, maxTextWidth) + pad;
  };

  const decrementPageNumber = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
      setDisplayedPageNumber(pageNumber - 1);
    }
  };

  const incrementPageNumber = () => {
    if (
      pageNumber <
      parseInt(records?.total_number_of_records / INFO_MODAL_FETCH_LIMIT) + 1
    ) {
      setPageNumber(pageNumber + 1);
      setDisplayedPageNumber(pageNumber + 1);
    }
  };

  return (
    <div
      id={`info_${id}`}
      style={{
        height: "139px",
        width: `${width / 1.2 - 0}px`,
        backgroundColor: "#ffffff",
        border: "1px solid #cccccc",
        padding: "10px",
        fontSize: "11px",
        borderRadius: "5px",
      }}
    >
      {records && (
        <>
          <div style={{ marginBottom: "5px" }}>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <div id="displaying">
                Displaying{" "}
                <strong>
                  {pageNumber * INFO_MODAL_FETCH_LIMIT -
                    INFO_MODAL_FETCH_LIMIT +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    pageNumber * INFO_MODAL_FETCH_LIMIT,
                    records?.total_number_of_records
                  )}
                </strong>{" "}
                of <strong>{records?.total_number_of_records}</strong> records
              </div>

              <span style={{ float: "right" }}>
                <X
                  onClick={(_) => close()}
                  size={18}
                  style={{
                    position: "absolute",
                    top: "7px",
                    right: "5px",
                    color: "#ca2c92",
                    cursor: "pointer",
                  }}
                />
              </span>

              <div
                id="page_control"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                <CaretLeftFill
                  onClick={(_) => {
                    decrementPageNumber();
                  }}
                />
                <Form.Control
                  as="input"
                  min="1"
                  max={
                    parseInt(
                      records?.total_number_of_records / INFO_MODAL_FETCH_LIMIT
                    ) + 1
                  }
                  size="sm"
                  style={{ height: "14px", width: "60px", textAlign: "center" }}
                  value={displayedPageNumber}
                  onChange={(e) => {
                    setDisplayedPageNumber(e.target.value);
                  }}
                />
                <CaretRightFill
                  onClick={(_) => {
                    incrementPageNumber();
                  }}
                />
              </div>

              {coordinate && (
                <span style={{ float: "right", marginRight: "16px" }}>
                  Coordinate:{" "}
                  <strong>
                    {coordinate.map((val) => val.toPrecision(8)).join(", ")}
                  </strong>
                </span>
              )}
            </div>
          </div>
          <div className="info_grid">
            <DataGrid
              columns={Object.keys(records.data[0]).map((column) => ({
                key: column,
                name: column.toUpperCase(),
                width: getMaxWidthRequired(column, 60),
                formatter: (props) => {
                  return (
                    <>
                      {convertIfTimestamp(
                        truncateIfString(
                          props.row[column],
                          INFO_MODAL_MAX_CONTENT_LENGTH
                        )
                      )}
                    </>
                  );
                },
              }))}
              rows={records.data}
              //height={183}
              rowHeight={14}
              summaryRowHeight={183}
              style={{ fontSize: "11px" }}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Info;
