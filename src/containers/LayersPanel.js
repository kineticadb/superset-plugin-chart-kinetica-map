import React, { useState, useCallback, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import {
  Gear,
  Trash,
  CaretDownFill,
  CaretUpFill,
  CaretRightFill,
  EyeFill,
  EyeSlash,
  Eye,
  Funnel,
  FunnelFill,
} from "react-bootstrap-icons";
import { LayerLegend } from "./Legend";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { getConsole } from "../util";

const console = getConsole();

export const LayersPanel = (props) => {
  const {
    mapLayers,
    setMapLayers,
    setSelectedLayer,
    datasource,
    updateLayer,
    updateLayers,
    basemapUrl = "osm",
  } = props;

  const [selectedLayerToDelete, setSelectedLayerToDelete] = useState(0);
  const [items, setItems] = useState(mapLayers.slice().reverse());

  const reorder = (list, startIndex, endIndex) => {
    // if startIndex is the last index of list, ignore
    if (startIndex === list.length - 1) {
      console.log("cannot move base layer");
      return list;
    }

    // if an item is dragged to the base layer's position,
    // set it above as the base layer cannot be moved.
    let _endIndex = endIndex;
    if (endIndex === list.length - 1) {
      _endIndex = endIndex - 1;
    }

    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(_endIndex, 0, removed);
    return result;
  };

  const onDragEnd = useCallback(
    (result) => {
      console.log("result.source.index", result.source.index);
      console.log("result.destination.index", result.destination.index);
      if (
        !result.destination ||
        result.source.index === result.destination.index
      ) {
        return;
      }
      const newItems = reorder(
        items,
        result.source.index,
        result.destination.index
      );
      setItems(newItems);
      setMapLayers(newItems);
      // setMapLayers(newItems.reverse());
    },
    [items, setItems, setMapLayers]
  );

  useEffect(() => {
    console.log("LayersPanel: useEffect: mapLayers: ", mapLayers);
    setItems(mapLayers.slice().reverse());
  }, [mapLayers]);

  return (
    <div
      key="layers-panel"
      className={basemapUrl !== "osm" ? "layers-panel nopad" : "layers-panel"}
    >
      <div
        className="layers-panel-header"
        style={{ display: "flex", flexDirection: "row", overflow: "hidden" }}
      >
        <div style={{ marginTop: "6px", marginLeft: "15px" }}>
          <Eye
            onClick={() => {
              const mapLayers = [...items].reverse();
              const allVisible = mapLayers.every((lyr) => lyr.visible);
              const newMapLayers = mapLayers.map((lyr) => {
                if (lyr.id === "0000" && lyr.visible) {
                  // always show the base layer
                  return lyr;
                }

                return {
                  ...lyr,
                  visible: allVisible ? false : true,
                };
              });
              updateLayers(newMapLayers);
            }}
            style={{ marginTop: "-5px" }}
          />
          <Button
            variant="dark"
            style={{
              marginLeft: "15px",
              fontSize: "12px",
              padding: "0.0rem 1.5rem 0.1rem 1.5rem",
            }}
            onClick={() => {
              setSelectedLayer({ op: "add" });
            }}
          >
            Add New Layer
          </Button>
          {!items.every((lyr) => lyr.showLegend) && (
            <CaretUpFill
              style={{
                marginLeft: "10px",
                fontWeight: "bold",
                marginTop: "-5px",
              }}
              onClick={(evt) => {
                const mapLayers = [...items].reverse();
                const newMapLayers = mapLayers.map((lyr) => {
                  return {
                    ...lyr,
                    showLegend: true,
                  };
                });
                updateLayers(newMapLayers);
              }}
            />
          )}
          {items.every((lyr) => lyr.showLegend) && (
            <CaretDownFill
              style={{
                marginLeft: "10px",
                fontWeight: "bold",
                marginTop: "-5px",
              }}
              onClick={(evt) => {
                const mapLayers = [...items].reverse();
                const newMapLayers = mapLayers.map((lyr) => {
                  return {
                    ...lyr,
                    showLegend: false,
                  };
                });
                updateLayers(newMapLayers);
              }}
            />
          )}
        </div>
      </div>
      <div
        className="layers-panel-body"
        style={{
          marginTop: "15px",
          width: "100%",
          maxHeight: "450px",
          // overflowX: "hidden",
          // overflowY: "scroll",
          overflow: "auto",
        }}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="droppable">
            {(provided, snapshot) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {items.map((lyr, lyrIndex) => (
                  <Draggable key={lyr.id} draggableId={lyr.id} index={lyrIndex}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          // backgroundColor: snapshot.isDragging ? '#263B4A' : '#456C86',
                          // color: 'white',
                          ...provided.draggableProps.style,
                        }}
                      >
                        {/* // start layer body */}
                        <div
                          key={lyr.id + "-" + lyr.label + "-eye1"}
                          style={{
                            width: "96%",
                            paddingTop: "5px",
                            paddingBottom: "5px",
                            borderBottom: "1px solid #dddddd",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              height: "100%",
                            }}
                          >
                            <div
                              key={lyr.id + "-" + lyr.label + "-eye2"}
                              style={{
                                flex: "0 0 5%",
                                borderRight: "1px solid #cccccc",
                              }}
                            >
                              <div
                                key={lyr.id + "-" + lyr.label + "-eye3"}
                                style={{
                                  position: "relative",
                                  minHeight: "20px",
                                  minWidth: "20px",
                                  padding: "1px",
                                  marginTop: "-3px",
                                }}
                              >
                                {/* <div style={{ position: 'absolute', top: 0, right: 0, left: 0}}> */}
                                {/* Content of the child div goes here */}

                                {!lyr.visible && (
                                  <EyeSlash
                                    onClick={(evt) => {
                                      const mapLayersNew = [
                                        ...items.slice(0, lyrIndex),
                                        {
                                          ...items[lyrIndex],
                                          visible: true,
                                        },
                                        ...items.slice(lyrIndex + 1),
                                      ];
                                      setMapLayers(mapLayersNew.reverse());
                                    }}
                                  />
                                )}
                                {lyr.visible && (
                                  <EyeFill
                                    onClick={(evt) => {
                                      const mapLayersNew = [
                                        ...items.slice(0, lyrIndex),
                                        {
                                          ...items[lyrIndex],
                                          visible: false,
                                        },
                                        ...items.slice(lyrIndex + 1),
                                      ];
                                      setMapLayers(mapLayersNew.reverse());
                                    }}
                                  />
                                )}
                                {/* </div> */}
                              </div>
                            </div>
                            <div
                              key={lyr.id + "-" + lyr.label + "-layername1"}
                              style={{ flex: "1 1 95%" }}
                            >
                              {/* Content of the second div goes here */}
                              <div
                                key={lyr.id + "-" + lyr.label + "-layername2"}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  height: "100%",
                                  paddingLeft: "8px",
                                }}
                              >
                                {!lyr.showLegend && (
                                  <CaretRightFill
                                    style={{ marginRight: "5px" }}
                                    onClick={(evt) => {
                                      lyr.showLegend = true;
                                      updateLayer(lyr);
                                    }}
                                  />
                                )}
                                {lyr.showLegend && (
                                  <CaretDownFill
                                    style={{ marginRight: "5px" }}
                                    onClick={(evt) => {
                                      lyr.showLegend = false;
                                      updateLayer(lyr);
                                    }}
                                  />
                                )}
                                <h6
                                  style={{
                                    fontWeight: "bold",
                                    marginTop: "6px",
                                  }}
                                >
                                  {lyr.kineticaSettings?.filter?.text &&
                                    !lyr.kineticaSettings?.filter?.enabled && (
                                      <Funnel
                                        style={{
                                          marginLeft: "-5px",
                                          marginRight: "2px",
                                          marginTop: "-4px",
                                        }}
                                        onClick={(evt) => {
                                          lyr.kineticaSettings.filter.enabled = true;
                                          updateLayer(lyr);
                                        }}
                                      />
                                    )}
                                  {lyr.kineticaSettings?.filter?.text &&
                                    lyr.kineticaSettings?.filter?.enabled && (
                                      <FunnelFill
                                        style={{
                                          marginLeft: "-5px",
                                          marginRight: "2px",
                                          marginTop: "-4px",
                                        }}
                                        onClick={(evt) => {
                                          lyr.kineticaSettings.filter.enabled = false;
                                          updateLayer(lyr);
                                        }}
                                      />
                                    )}
                                  {lyr.label?.length > 16
                                    ? lyr.label.slice(0, 13) + "..."
                                    : lyr.label}
                                </h6>
                              </div>
                              <div
                                key={lyr.id + "-" + lyr.label + "-settings"}
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                  height: "20px",
                                  marginTop: "-20px",
                                }}
                              >
                                <Gear
                                  style={{
                                    marginRight: "5px",
                                    marginTop: "-1px",
                                  }}
                                  onClick={(evt) => {
                                    setSelectedLayer({
                                      op: "edit",
                                      index: items.length - lyrIndex - 1,
                                    });
                                  }}
                                />
                                {items.length - lyrIndex !== 1 && (
                                  <Trash
                                    style={{
                                      marginTop: "-1px",
                                    }}
                                    onClick={(evt) => {
                                      setSelectedLayerToDelete(
                                        items.length - lyrIndex
                                      );
                                    }}
                                  />
                                )}
                                {items.length - lyrIndex === 1 && (
                                  <div style={{ width: "13px" }} />
                                )}
                                <div id="deleteLayer">
                                  <Modal
                                    show={selectedLayerToDelete > 0}
                                    onHide={() => setSelectedLayerToDelete(0)}
                                    animation={false}
                                  >
                                    <Modal.Header closeButton>
                                      <Modal.Title>Delete Layer</Modal.Title>
                                    </Modal.Header>
                                    <Modal.Body>
                                      Are you sure you want to delete the layer{" "}
                                      {selectedLayerToDelete > 0
                                        ? mapLayers[selectedLayerToDelete - 1]
                                            .label
                                        : ""}
                                      ?
                                    </Modal.Body>
                                    <Modal.Footer>
                                      <Button
                                        variant="secondary"
                                        onClick={() =>
                                          setSelectedLayerToDelete(0)
                                        }
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        variant="primary"
                                        onClick={() => {
                                          const mapLayersNew = [
                                            ...mapLayers.slice(
                                              0,
                                              selectedLayerToDelete - 1
                                            ),
                                            ...mapLayers.slice(
                                              selectedLayerToDelete
                                            ),
                                          ];
                                          setMapLayers(mapLayersNew);
                                          setSelectedLayerToDelete(0);
                                        }}
                                      >
                                        Delete
                                      </Button>
                                    </Modal.Footer>
                                  </Modal>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              height: "100%",
                              marginTop: "-2px",
                            }}
                          >
                            <div
                              key={lyr.id + "-" + lyr.label + "-legend-empty"}
                              style={{
                                flex: "0 0 10%",
                                borderRight: "1px solid #cccccc",
                              }}
                            >
                              {/* space under the Eye */}
                            </div>
                            <div
                              key={lyr.id + "-" + lyr.label + "-legend1"}
                              style={{
                                flex: "1 1 90%",
                                borderLeft: "1px solid #cccccc",
                                paddingLeft: "8px",
                                fontSize: "12px",
                                lineHeight: "13px",
                              }}
                            >
                              {lyr.showLegend && (
                                <div
                                  key={lyr.id + "-" + lyr.label + "-legend2"}
                                  style={{ marginTop: "-10px" }}
                                >
                                  <LayerLegend
                                    id={lyr.id}
                                    key={lyr.id}
                                    allColumns={datasource?.table?.columns}
                                    kineticaSettings={lyr.kineticaSettings}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {/* // end layer body */}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};
