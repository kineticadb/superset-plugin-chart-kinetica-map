import React from "react";
import { Modal, Button } from "react-bootstrap";

function MissingParameters(props) {
  const { close } = props;

  return (
    <Modal
      dialogClassName="custom_dialog"
      show={props.show}
      onHide={close}
      centered
    >
      <Modal.Header closeButton>
        <Modal.Title>Missing Parameters Detected!</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ padding: "10px", minHeight: "270px" }}>
          <p>
            Geospatial filtering requires two parameters to be set in the custom
            SQL query of the datasource. Please add the following:
          </p>
          <ul>
            <li>
              Step 1. Open the 'Edit Custom SQL' window in the Data Source tab.
            </li>
            <li>Step 2. Click 'Insert Parameter'</li>
            <li>Step 3. Name the parameter 'wkt' with DataType=string</li>
            <li>
              Step 4. Set the default value to POLYGON((-180 -90, 180 -90, 180
              90, -180 90, -180 -90))
            </li>
            <li>
              Step 5. Repeat Steps 2-4 for a parameter named 'wktviewport'
            </li>
            <li>
              <b>If filtering by latitude/longitude, the Custom SQL is: </b>
              <br />
              select * from your_schema.your_table where
              <br />
              STXY_INTERSECTS(your_longitude_column,your_latitude_column,
              <br />
              GEOMETRY(&lt;Parameters.wkt&gt;)) = 1 <br />
              and <br />
              STXY_INTERSECTS(your_longitude_column,your_latitude_column,
              <br />
              GEOMETRY(&lt;Parameters.wktviewport&gt;)) = 1
            </li>
            <li>
              <b>If filtering by WKT, the Custom SQL is: </b>
              <br />
              select * from your_schema.your_table where
              <br />
              ST_INTERSECTS(your_wkt_column, &lt;Parameters.wkt&gt;) = 1 <br />
              and <br />
              ST_INTERSECTS(your_wkt_column, &lt;Parameters.wktviewport&gt;) = 1
            </li>
          </ul>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" type="submit" onClick={props.close} block>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default MissingParameters;
