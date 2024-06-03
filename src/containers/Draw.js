import React, { useState, useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import { Vector as VectorSource } from "ol/source.js";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer.js";
import Draw from "ol/interaction/Draw.js";
import { Style, Fill, Stroke } from "ol/style.js";
import { fromExtent } from "ol/geom/Polygon";

import {
  Pencil,
  BoundingBox,
  ArrowCounterclockwise,
  Brush,
} from "react-bootstrap-icons";
import {
  DRAW_TYPE_FREEHAND,
  DRAW_TYPE_POLYGON,
  DRAW_TYPE_UNDO,
} from "../constants";

let drawMap;

export const DrawButton = (props) => {
  // const [drawMode, setDrawMode] = useState(false);
  // const [drawType, setDrawType] = useState('');
  // const [drawUndo, setDrawUndo] = useState(false);
  const {
    drawMode,
    setDrawMode,
    drawType,
    setDrawType,
    drawUndo,
    setDrawUndo,
  } = props;

  drawMap = props.map;

  return (
    <>
      <Button
        variant={drawMode === true ? "dark" : "light"}
        onClick={() => {
          if (!drawMode) {
            setDrawMode(true);
            setDrawType(DRAW_TYPE_FREEHAND);
            // props.setDrawMode(true)
            // props.setDrawType('');
            // setDrawType('');
          }
          if (drawMode) {
            setDrawMode(false);
            setDrawType("");
            // props.setDrawMode(false);
            // props.setDrawType('');
            // setDrawType('');
          }
        }}
        style={{
          width: "50px",
        }}
      >
        <Pencil />
      </Button>
      {drawMode && (
        <div>
          {/* <Button
            variant={drawType === "polygon" && !drawUndo ? "dark" : "light"}
            onClick={() => {
              setDrawType(DRAW_TYPE_POLYGON);
              props.setDrawType(DRAW_TYPE_POLYGON);
            }}
            style={{ width: "50px", fontSize: "8px" }}
          >
            <BoundingBox />
          </Button>
          <br /> */}
          {/* <Button
            variant={drawType === "freehand" && !drawUndo ? "dark" : "light"}
            onClick={() => {
              setDrawType(DRAW_TYPE_FREEHAND);
              // props.setDrawType(DRAW_TYPE_FREEHAND);
            }}
            style={{
              width: "50px",
              fontSize: "8px",
            }}
          >
            <Brush />
          </Button>
          <br /> */}
          <Button
            variant="light"
            onClick={() => {
              setDrawUndo(true);
              // props.setDrawUndo(true);
            }}
            style={{ width: "50px", fontSize: "8px" }}
          >
            <ArrowCounterclockwise />
          </Button>
        </div>
      )}
    </>
  );
};

export const DrawLayer = new VectorLayer({
  source: new VectorSource({ wrapX: false }),
});

export const OlDrawer = (props) => {
  const { map, drawType, drawComplete } = props;
  const [olDraw, setOlDraw] = useState(null);

  // const replaceDrawInteraction = (map, oldDraw, newDraw) => {
  //   if (map && oldDraw) {
  //     map.removeInteraction(oldDraw);
  //   }
  //   map.addInteraction(newDraw);
  // };

  const addInteraction = (map, oldDraw, aDrawType, drawEvtHandler) => {
    if (map && oldDraw) {
      console.log("removing interaction");
      map.removeInteraction(oldDraw);
    }

    let newOlDraw = null;
    if (aDrawType == null || aDrawType === "") {
      setOlDraw(null);
      return;
    } else if (
      aDrawType === DRAW_TYPE_POLYGON ||
      aDrawType === DRAW_TYPE_FREEHAND
    ) {
      newOlDraw = new Draw({
        source: DrawLayer.getSource(),
        type: aDrawType === DRAW_TYPE_FREEHAND ? "Polygon" : aDrawType,
        freehand: aDrawType === DRAW_TYPE_FREEHAND,
        // style: new Style({
        //   fill: new Fill({
        //     color: '#e4e4e4',
        //     opacity: 0.2,
        //   }),
        //   stroke: new Stroke({
        //     color: '#ffcc33',
        //     width: 2,
        //   })
        // })
      });
    } else {
      newOlDraw = new Draw({
        source: DrawLayer.getSource(),
        type: aDrawType,
      });
    }
    if (drawEvtHandler) {
      newOlDraw.on("drawend", (evt) => drawEvtHandler(evt));
    }
    // replaceDrawInteraction(map, oldDraw, newOlDraw);
    map.addInteraction(newOlDraw);
    setOlDraw(newOlDraw);
  };

  useEffect(() => {
    addInteraction(map, olDraw, drawType, drawComplete);
  }, [map, drawType, drawComplete]);

  useEffect(() => {
    return () => {
      if (map && olDraw) {
        console.log("removing interaction");
        map.removeInteraction(olDraw);
        setOlDraw(null);
      }
    };
  }, []);

  return <></>;
};
