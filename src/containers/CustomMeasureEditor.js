import React, { useState } from "react";
import { Modal, Form, Row, Col, Button, InputGroup } from "react-bootstrap";
import { Search } from "react-bootstrap-icons";

const CustomMeasureEditor = (props) => {
  const {
    columns,
    fieldName,
    fieldContent,
    clearField,
    saveField,
    showAggregationOptions,
    setFieldContent,
    setFieldName,
    close,
  } = props;

  const [name, setName] = useState(
    fieldName || (showAggregationOptions === true ? "COUNT" : "Custom Measure")
  );
  const [formula, setFormula] = useState(fieldContent || "Enter Formula Here");

  const [formulaMouseIndex, setFormulaMouseIndex] = useState(0);
  const [search, setSearch] = useState("");

  const handleNameFocus = () => {
    if (name === "Custom Measure") {
      setName("");
    }
  };

  const handleSearchFocus = () => {
    if (search === "Search") {
      setSearch("");
    }
  };

  const handleFormulaFocus = () => {
    if (formula === "Enter Formula Here") {
      setFormula("");
    }
  };

  const handleAddCase = () => {
    let s = "CASE(expr, {<matches>}, {<values>}, value_if_no_match)";
    if (formula === "Enter Formula Here") {
      setFormula(s);
    } else {
      setFormula(formula + s);
    }
  };

  const handleAddIf = () => {
    let s = "IF(expr, value_if_true, value_if_false)";
    if (formula === "Enter Formula Here") {
      setFormula(s);
    } else {
      setFormula(formula + s);
    }
  };

  const save = () => {
    if (formula.trim().length > 0) {
      if (setFieldName) {
        setFieldName(name);
      }
      if (setFieldContent) {
        let fieldContentValue = formula;
        if (showAggregationOptions === true) {
          let formulaWithoutAggregation = formula;
          const formulaLowerCased = formula.toLowerCase().trim();
          const funcs = ["count", "log", "sum", "avg", "mean", "min", "max"];
          for (let i = 0; i < funcs.length; i++) {
            const func = funcs[i];
            const funcIndex = formulaLowerCased.indexOf(func + "(");
            if (funcIndex > -1 && name !== "LOG") {
              formulaWithoutAggregation = formula.slice(
                funcIndex + func.length + 1,
                formula.length
              );
              const closeParenIndex = formulaWithoutAggregation.indexOf(")");
              if (closeParenIndex > -1) {
                formulaWithoutAggregation = formulaWithoutAggregation.slice(
                  0,
                  closeParenIndex
                );
              }
              break;
            }
          }
          fieldContentValue =
            name + "(" + formulaWithoutAggregation.trim() + ")";
        }
        setFieldContent(fieldContentValue);
      }
      saveField && saveField(name, formula);
    }
    close();
  };

  const clearAndExit = () => {
    clearField();
    close();
  };

  // render starts here

  // remove timestamp and datetime from columns
  let cols = columns.filter((column) => {
    const includesTimestamp = column?.properties.includes("timestamp");
    const includesDatetime = column?.properties.includes("datetime");
    //return includesTimestamp === false && includesDatetime === false;

    // TODO: eventually remove this whole block
    return true; // allow timestamp and datetime
  });

  //cols = columns.slice();
  cols.sort((a, b) => {
    if (a.label < b.label) return -1;
    if (a.label > b.label) return 1;
    return 0;
  });

  // handle search
  if (search.length > 2) {
    console.log(cols);
    cols = cols.filter((column) => {
      let a, b;
      if (typeof column.label === "string") {
        a = column.label.toLowerCase().includes(search.toLowerCase());
      }
      if (typeof column.type === "string") {
        b = column.type.toLowerCase().includes(search.toLowerCase());
      } else if (Array.isArray(column.type)) {
        b = column.type.join(" ").toLowerCase().includes(search.toLowerCase());
      }
      return a || b;
    });
  }

  // make cols to buttons
  cols = cols.map((column, index) => {
    let type = column.type;
    if (Array.isArray(type)) {
      type = type.filter(Boolean).join(", ");
    }

    return (
      <div style={{ width: "100%", marginBottom: "3px" }} key={index}>
        <Button
          key={index}
          size="sm"
          variant={"outline-secondary"}
          style={{ width: "100%" }}
          onClick={() => {
            console.log("clicked: ", column, index);
            if (formula === "Enter Formula Here") {
              // insert column name
              setFormula(column.name + " ");
            } else {
              // insert column name and a trailing space at mouse position
              let s = formula;
              let s1 = s.slice(0, formulaMouseIndex);
              let s2 = s.slice(formulaMouseIndex);
              setFormula(s1 + column.name + s2);
            }
          }}
        >
          <span
            style={{
              fontSize: "12px",
              textAlign: "left",
              marginTop: "3px",
              whiteSpace: "normal",
              wordWrap: "break-word",
              width: "100%",
            }}
          >
            {column.label} ({type})
          </span>
        </Button>
      </div>
    );
  });

  // strip out the aggregation function name from the formula
  let formulaWithoutAggregation = formula;
  if (showAggregationOptions === true) {
    const formulaLowerCased = formula.toLowerCase().trim();
    const funcs = ["count", "log", "sum", "avg", "mean", "min", "max"];
    for (let i = 0; i < funcs.length; i++) {
      const func = funcs[i];
      const funcIndex = formulaLowerCased.indexOf(func + "(");
      if (funcIndex > -1 && name !== "LOG") {
        formulaWithoutAggregation = formula.slice(
          funcIndex + func.length + 1,
          formula.length
        );
        const closeParenIndex = formulaWithoutAggregation.indexOf(")");
        if (closeParenIndex > -1) {
          formulaWithoutAggregation = formulaWithoutAggregation.slice(
            0,
            closeParenIndex
          );
        }
        break;
      }
    }
  }

  return (
    <Form.Group controlId={"customMeasureEditor"}>
      <div style={{ display: "flex", height: "100%" }}>
        {/* First Column */}
        <div
          style={{
            flex: 1,
            borderRight: "1px solid #dddddd",
          }}
        >
          <div style={{ marginRight: "-15%" }}>
            {!showAggregationOptions && (
              <Form.Group as={Row}>
                <Col sm="10">
                  <Form.Label
                    sm="2"
                    style={{ fontSize: "10px", textAlign: "left" }}
                  >
                    Name
                  </Form.Label>
                  <div style={{ padding: "0px 0px" }}>
                    <Form.Control
                      as="input"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onFocus={handleNameFocus}
                    />
                  </div>
                </Col>
              </Form.Group>
            )}

            {showAggregationOptions && (
              <Form.Group as={Row}>
                <Col sm="10">
                  <Form.Label
                    sm="2"
                    style={{ fontSize: "10px", textAlign: "left" }}
                  >
                    Aggregation
                  </Form.Label>
                  <div style={{ padding: "0px 0px" }}>
                    <Form.Control
                      as="select"
                      defaultValue={name}
                      onChange={(e) => setName(e.target.value)}
                    >
                      {/* <option value={name}>{name}</option> */}
                      <option value="COUNT">COUNT</option>
                      <option value="SUM">SUM</option>
                      <option value="AVG">AVG</option>
                      <option value="MEAN">MEAN</option>
                      <option value="MIN">MIN</option>
                      <option value="MAX">MAX</option>
                      <option value="LOG">LOG</option>
                    </Form.Control>
                  </div>
                </Col>
              </Form.Group>
            )}

            <Form.Group as={Row}>
              <Col sm="10">
                <Form.Label
                  sm="2"
                  style={{ fontSize: "10px", textAlign: "left" }}
                >
                  Formula
                </Form.Label>
                <div style={{ padding: "0px 0px" }}>
                  <Form.Control
                    id="formula"
                    as="textarea"
                    rows="5"
                    value={formulaWithoutAggregation}
                    style={{ border: "1px solid black", height: "200px" }}
                    onChange={(e) => {
                      setFormula(e.target.value);
                    }}
                    onFocus={handleFormulaFocus}
                    onMouseUp={(e) => {
                      setFormulaMouseIndex(e.target.selectionStart);
                    }}
                    onKeyUp={(e) => {
                      setFormulaMouseIndex(e.target.selectionStart);
                    }}
                  />
                </div>
                <h5
                  style={{
                    fontSize: "10px",
                    textAlign: "left",
                    marginTop: "5px",
                  }}
                >
                  <a
                    href={props.documentation.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {props.documentation.description}
                  </a>
                </h5>
              </Col>
            </Form.Group>
          </div>
        </div>

        {/* Second Column */}
        <div style={{ flex: 1 }}>
          <div style={{ marginLeft: "5%", marginRight: "-20%" }}>
            <Form.Group as={Row}>
              <Col sm={10}>
                <Form.Label
                  sm="2"
                  style={{ fontSize: "10px", textAlign: "left" }}
                >
                  Column Search
                </Form.Label>
                <InputGroup>
                  <InputGroup.Prepend>
                    <InputGroup.Text>
                      <Search />
                    </InputGroup.Text>
                  </InputGroup.Prepend>
                  <Form.Control
                    type="text"
                    placeholder="Search"
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={handleSearchFocus}
                  />
                </InputGroup>
              </Col>
            </Form.Group>

            <Form.Group as={Row}>
              <Col sm={10}>
                <Form.Label
                  sm="2"
                  style={{ fontSize: "10px", textAlign: "left" }}
                >
                  Columns
                </Form.Label>
                <div
                  style={{
                    height: "200px",
                    overflowY: "auto",
                  }}
                >
                  {cols}
                </div>
              </Col>
            </Form.Group>

            {!showAggregationOptions && (
              <>
                <Button onClick={handleAddCase} variant={"link"} size="sm">
                  <p>CASE</p>
                </Button>
                <Button onClick={handleAddIf} variant={"link"} size="sm">
                  <p>IF</p>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
      <Button
        style={{ backgroundColor: "#dc3545", marginTop: "7px" }}
        type="submit"
        onClick={clearAndExit}
        block
      >
        Clear & Exit
      </Button>
      <Button variant="primary" type="submit" onClick={save} block>
        Apply
      </Button>
    </Form.Group>
  );
};

export default CustomMeasureEditor;
