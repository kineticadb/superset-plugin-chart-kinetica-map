import React, { useState } from "react";
import GPUdb from "../vendor/GPUdb";
import { Modal, Form, Row, Button } from "react-bootstrap";

const FilterEditor = (props) => {
  const { title, show, filter, setFilter, close, sqlBase, gpudb } = props;

  const [enabled, setEnabled] = useState(filter?.enabled || false);
  const [text, setText] = useState(filter?.text || "");
  const [error, setError] = useState(null);

  const testFilter = () => {
    if (text.endsWith(";")) {
      setError("Filter cannot end with a semicolon");
      return false;
    }
    if (text.trim().length === 0) {
      if (enabled) {
        setError("Filter cannot be empty");
        return false;
      } else {
        return true;
      }
    }

    const tblName = sqlBase
      .substring(sqlBase.toUpperCase().indexOf("FROM"))
      .split(" ")[1];
    const viewName = `${tblName}_${new Date().getTime()}`;
    const offset = 0;
    const limit = 1;
    const request_schema_str = null;
    const data = [];
    const options = null;
    return new Promise((resolve, reject) => {
      gpudb.execute_sql(
        `create temp materialized view ${viewName} as (${sqlBase} WHERE ${text}) using table properties (ttl=1)`,
        offset,
        limit,
        request_schema_str,
        data,
        options,
        (err, data) => {
          console.log("testFilter: ", data, err);
          if (err) {
            setError(err.message);
            reject(false);
          } else {
            setError(null);
            resolve(true);
          }
        }
      );
    });
  };

  const save = async () => {
    let isValidFilter = await testFilter();
    if (isValidFilter) {
      setFilter({
        enabled,
        text,
      });
      close();
    }
  };

  // render starts here
  return (
    <>
      <Modal
        dialogClassName="filter_editor"
        show={show}
        onHide={close}
        style={{ width: "800px" }}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group controlId={"FilterEditor"} as={Row}>
            <Form.Control
              as="textarea"
              rows="5"
              value={text}
              style={{
                border: "1px solid black",
                margin: "15px",
                marginBottom: "0px",
                width: "100%",
              }}
              onChange={(e) => {
                setText(e.target.value);
              }}
            />
          </Form.Group>
          <Form.Group controlId={"Enable"} as={Row}>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                width: "100%",
                marginRight: "15px",
                marginLeft: "15px",
              }}
              className="d-flex align-items-center justify-content-end"
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-start",
                }}
              >
                {error && <p className="ml-2 mb-0 text-danger">{error}</p>}
              </div>
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <Form.Check.Label htmlFor="enabled-checkbox" className="ml-2">
                    {"Enabled"}
                  </Form.Check.Label>
                  <Form.Check
                    type="checkbox"
                    checked={enabled}
                    onChange={() => setEnabled(!enabled)}
                    className="ml-2"
                  />
                </div>
              </div>
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" type="submit" onClick={save} block>
            Save & Exit
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FilterEditor;
