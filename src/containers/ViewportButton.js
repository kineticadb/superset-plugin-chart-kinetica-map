import React from "react";
import { Button } from "react-bootstrap";
import { BoundingBox } from "react-bootstrap-icons";

export const ViewportButton = (props) => {
  return (
    <>
      <Button
        variant={!props.filterByViewportMode ? "light" : "dark"}
        onClick={() => {
          props.setFilterByViewportMode(!props.filterByViewportMode);
        }}
        style={{
          width: "50px",
        }}
      >
        <BoundingBox />
      </Button>
    </>
  );
};
