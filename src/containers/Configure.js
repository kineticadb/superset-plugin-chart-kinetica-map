import React, { useEffect, useState, useRef } from "react";
import { debounce } from "debounce";
import {
  Form,
  Container,
  Row,
  Col,
  Button,
  Modal,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import { QuestionCircle } from "react-bootstrap-icons";
import {
  DEMO_MODE_DISABLED,
  FILTERING_MODE_SELECTION,
  EXTENSION_VERSION,
  ACCEPT_ONLY_HTTPS,
  SCHEMA_BLACKLIST,
} from "../constants";
import GPUdb from "../vendor/GPUdb";
import { twbTemplate } from "./StarterTemplate";
import SearchFieldModal from "./SearchFieldModal";
import ComboBox from "./ComboBox";

// Declare this so our linter knows that superset is a global object
/* global superset */

const Configure = (props) => {
  const { setShouldReload } = props;

  const [endpoint, setEndpoint] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [basemapUrl, setBasemapUrl] = useState("");
  const [demoMode, setDemoMode] = useState(DEMO_MODE_DISABLED);
  const [filteringMode, setFilteringMode] = useState(FILTERING_MODE_SELECTION);
  const [mapboxApiKey, setMapboxApiKey] = useState("");
  const [xyzTileServiceTemplate, setXyzTileServiceTemplate] = useState("");
  const [twbContext, setTwbContext] = useState(null);
  const [hideTestConnectionMsg, setHideTestConnectionMsg] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedConfig, setAdvancedConfig] = useState([
    {
      key: "updateParameterDelay",
      displayName: "Update Parameter Delay (ms)",
      value: 1000,
    },
  ]);
  const inputFile = useRef(null);

  const asyncSaveSettings = debounce((callback) => {
    return superset.extensions.settings
      .saveAsync()
      .then(callback)
      .catch((error) => {
        console.error(error);
      });
  }, 400);

  const saveSettings = (settings) => {
    Object.keys(settings).forEach((key) => {
      if (settings[key]) {
        superset.extensions.settings.set(key, settings[key]);
      } else {
        superset.extensions.settings.erase(key);
      }
    });
    asyncSaveSettings((_) => {
      // Saved settings
      superset.extensions.ui.closeDialog("");
    });
  };

  const saveConfig = async () => {
    let tc = await testConnection();
    console.log("tc: " + tc);
    if (tc) {
      const settings = {
        endpoint,
        username,
        password,
        basemapUrl,
        xyzTileServiceTemplate,
        demoMode,
        filteringMode,
        mapboxApiKey,
      };
      advancedConfig.forEach((item) => {
        settings[item.key] = item.value;
      });
      saveSettings(settings);
      setShouldReload(true);
    }
  };

  const testConnection = async () => {
    console.log("Testing connection to " + endpoint);
    if (
      endpoint &&
      username &&
      password &&
      endpoint.length > 0 &&
      username.length > 0 &&
      password.length > 0
    ) {
      if (ACCEPT_ONLY_HTTPS && endpoint.startsWith("http://")) {
        document.getElementById("testConnectionMsg").innerHTML =
          "Connection failed: HTTPS is required";
        return false;
      }

      const options = {
        timeout: 60000,
        username: username,
        password: password,
      };
      let msg = "";
      let success = false;
      try {
        const gpudb = new GPUdb(endpoint, options);
        await gpudb
          .show_schema()
          .then(async (response) => {
            msg = "Connection successful";
            console.log(msg);

            // check mapbox api key if present
            if (mapboxApiKey && mapboxApiKey.length > 0) {
              let mapboxUrl =
                "https://api.mapbox.com/geocoding/v5/mapbox.places/" +
                "San%20Francisco.json?access_token=" +
                mapboxApiKey;
              await fetch(mapboxUrl).then(async (response) => {
                if (response.ok) {
                  msg = "Connection successful";
                  console.log(msg);
                  if (document.getElementById("testConnectionMsgSuccess")) {
                    document.getElementById(
                      "testConnectionMsgSuccess"
                    ).innerHTML = msg;
                  }
                  success = true;
                } else {
                  msg = "Connection failed: Invalid Mapbox API key";
                  console.error(msg);
                  if (document.getElementById("testConnectionMsg")) {
                    document.getElementById("testConnectionMsg").innerHTML =
                      msg;
                  }
                }
              });
            } else {
              if (document.getElementById("testConnectionMsgSuccess")) {
                document.getElementById("testConnectionMsgSuccess").innerHTML =
                  msg;
              }
              success = true;
            }
          })
          .catch((error) => {
            msg = "Connection failed: " + error.message;
            console.error(msg);
            if (document.getElementById("testConnectionMsg")) {
              document.getElementById("testConnectionMsg").innerHTML = msg;
            }
          });
      } catch (error) {
        msg = "Connection failed: " + error.message;
        console.error(msg);
        if (document.getElementById("testConnectionMsg")) {
          document.getElementById("testConnectionMsg").innerHTML = msg;
        }
      }
      return success;
    }
  };

  // Initilize everything on load
  useEffect(() => {
    superset.extensions.initializeDialogAsync().then((openPayload) => {
      // Check for saved endpoint
      let endpoint = superset.extensions.settings.get("endpoint");
      if (endpoint != null) {
        setEndpoint(endpoint);
      }

      // Check for saved username
      let username = superset.extensions.settings.get("username");
      if (username != null) {
        setUsername(username);
      }

      // Check for saved password
      let password = superset.extensions.settings.get("password");
      if (password != null) {
        setPassword(password);
      }

      // Check for saved basemap url
      let basemapUrl = superset.extensions.settings.get("basemapUrl");
      if (basemapUrl != null) {
        setBasemapUrl(basemapUrl);
      }

      // Check for saved mapbox api key
      let mapboxApiKey = superset.extensions.settings.get("mapboxApiKey");
      if (mapboxApiKey != null) {
        setMapboxApiKey(mapboxApiKey);
      }

      let xyzTileServiceTemplate = superset.extensions.settings.get("xyzTileServiceTemplate");
      if (xyzTileServiceTemplate != null) {
        setXyzTileServiceTemplate(xyzTileServiceTemplate);
      }

      // Check for saved demo mode
      let demoMode = superset.extensions.settings.get("demoMode");
      if (demoMode != null) {
        setDemoMode(demoMode);
      }

      // Check for saved filtering mode
      let filteringMode = superset.extensions.settings.get("filteringMode");
      if (filteringMode != null) {
        setFilteringMode(filteringMode);
      }

      // Check for update parameter delay
      let updateParameterDelay = superset.extensions.settings.get(
        "updateParameterDelay"
      );
      if (updateParameterDelay != null) {
        setAdvancedConfig((prevState) => {
          return prevState.map((item) => {
            if (item.key === "updateParameterDelay") {
              item.value = updateParameterDelay;
            }
            return item;
          });
        });
      }

      superset.extensions?.workbook
        ?.getAllDataSourcesAsync()
        .then((dataSources) => {
          // determine if twbGenerator is required:
          // 1. if no data sources are present
          // 2. if data sources are present, but no custom sql query.
          console.log("dataSources: ", dataSources);
          if (dataSources.length == 0) {
            console.log("no data sources present");
            setTwbContext({ needsConnection: true });
          } else {
            const tablePromises = dataSources.map((ds) => {
              return ds.getActiveTablesAsync();
            });
            Promise.all(tablePromises)
              .then((tables) => {
                if (tables && tables.length > 0 && tables[0].length > 0) {
                  const tableSummary = tables[0][0];
                  console.log("tableSummary: ", tableSummary);
                  if (
                    !(
                      tableSummary.customSQL &&
                      tableSummary.customSQL.length > 0
                    )
                  ) {
                    console.log("no custom sql query present");
                    setTwbContext({ needsConnection: true });
                  }
                } else {
                  console.log("no tables found");
                  setTwbContext({ needsConnection: true });
                }
              })
              .catch((error) => {
                console.log("error: ", error);
                setTwbContext({ needsConnection: true });
              });
          }
        });
    });
  }, []);

  const handleEndpointChange = (e) => {
    if (document.getElementById("testConnectionMsg")) {
      document.getElementById("testConnectionMsg").innerHTML = "";
    }
    setEndpoint(e.target.value);
  };

  const handleUsernameChange = (e) => {
    if (document.getElementById("testConnectionMsg")) {
      document.getElementById("testConnectionMsg").innerHTML = "";
    }
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e) => {
    if (document.getElementById("testConnectionMsg")) {
      document.getElementById("testConnectionMsg").innerHTML = "";
    }
    setPassword(e.target.value);
  };

  const handleBasemapUrlChange = (e) => {
    setBasemapUrl(e.target.value);
  };

  const handleXyzTileServiceTemplateChange = (e) => {
    setXyzTileServiceTemplate(e.target.value);
  };

  const handleMapboxApiKeyChange = (e) => {
    document.getElementById("testConnectionMsg").innerHTML = "";
    setMapboxApiKey(e.target.value);
  };

  const handleKeypress = (e) => {
    if (e.charCode === 13) {
      saveConfig();
    }
  };

  const downloadWorkbookFile = async () => {
    console.log("Downloading workbook file");
    let twbContent = twbTemplate;
    // replace all the placeholders
    console.log("schema: ", twbContext.selectedSchema);
    twbContent = twbContent.replace(/___SCHEMA___/g, twbContext.selectedSchema);

    // parse the table name from twbContext.table
    const table = twbContext.selectedTable.split(".")[1];
    console.log("table: ", table);
    twbContent = twbContent.replace(/___TABLE___/g, table);

    // parse the endpoint into scheme, host, and port
    const url = new URL(endpoint);
    const scheme = url.protocol;
    const host = url.hostname;
    const port = url.port || "9191";
    console.log("url: ", scheme, host, port);

    twbContent = twbContent.replace(/___ENDPOINT___/g, endpoint);
    twbContent = twbContent.replace(/___DB_HOST___/g, host);
    twbContent = twbContent.replace(/___DB_PORT___/g, port);
    twbContent = twbContent.replace(/___DB_USER___/g, username);

    if (twbContext.selectedDataType === "point") {
      const query = `select * from ${twbContext.selectedTable} where stxy_intersects(${twbContext.selectedLongitude}, ${twbContext.selectedLatitude}, geometry(<[Parameters].[Parameter 1]>)) = 1 and stxy_intersects(${twbContext.selectedLongitude}, ${twbContext.selectedLatitude}, geometry(<[Parameters].[Parameter 2]>)) = 1`;
      twbContent = twbContent.replace(/___CUSTOM_SQL_QUERY___/g, query);
    } else if (twbContext.selectedDataType === "geo") {
      const query = `select * from ${twbContext.selectedTable} where st_intersects(${twbContext.selectedWkt}, <[Parameters].[Parameter 1]>) = 1 and st_intersects(${twbContext.selectedWkt}, <[Parameters].[Parameter 2]>) = 1`;
      twbContent = twbContent.replace(/___CUSTOM_SQL_QUERY___/g, query);
    }
    console.log("Template file loaded: ", twbContent);
    const blob = new Blob([twbContent], { type: "text/xml" });
    const _url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = _url;
    link.download = `${twbContext.selectedTable}-starter.twb`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(_url);
    alert("Load the downloaded workbook file to continue.");
  };

  useEffect(() => {
    console.log("twbContext changed: ", twbContext);

    // needs connection
    if (twbContext?.needsConnection) {
      if (!(endpoint && username && password)) {
        if (document.getElementById("testConnectionMsg")) {
          document.getElementById("testConnectionMsg").innerHTML =
            "Set url, username and password to generate a sample workbook";
        }
      }
    }

    // needs schemas and tables
    else if (
      twbContext &&
      twbContext.display &&
      twbContext.schemas === undefined &&
      twbContext.tables === undefined
    ) {
      if (!hideTestConnectionMsg) {
        setHideTestConnectionMsg(true);
      }
      const gpudb = new GPUdb(endpoint, {
        username: username,
        password: password,
      });
      let schemaNames = [];
      let tables = {};
      gpudb
        .show_schema()
        .then((response) => {
          let schemasWithTables = response.schema_tables.filter((value) => {
            return value.length > 0;
          });

          for (let i = 0; i < schemasWithTables.length; i++) {
            let schemaName = schemasWithTables[i][0].substring(
              0,
              schemasWithTables[i][0].indexOf(".")
            );
            if (!SCHEMA_BLACKLIST.includes(schemaName)) {
              schemaNames.push(schemaName);
              tables[schemaName] = schemasWithTables[i];
            }
          }

          const newTwbContext = {
            display: true,
            schemas: schemaNames,
            tables: tables,
          };
          setTwbContext(newTwbContext);
        })
        .catch((error) => {
          console.log("Error: ", error);
        });
    } else if (
      twbContext &&
      twbContext.display &&
      twbContext.schemas &&
      twbContext.tables
    ) {
      // get columns for selected table
      if (
        twbContext?.selectedTable &&
        !twbContext.columns?.[twbContext.selectedTable]
      ) {
        let columns = [];
        const gpudb = new GPUdb(endpoint, {
          username: username,
          password: password,
        });
        gpudb
          .show_table(twbContext.selectedTable)
          .then((response) => {
            console.log("response: ", response);
            columns = Object.keys(response.properties?.[0]);
            const newTwbContext = {
              ...twbContext,
              columns: {
                ...twbContext.columns,
                [twbContext.selectedTable]: columns,
              },
            };
            console.log("newTwbContext: ", newTwbContext);
            setTwbContext(newTwbContext);
          })
          .catch((error) => {
            console.error(error);
          });
      }
    } else {
      console.log("twbContext: useEffect: doing nothing: ", twbContext);
    }
  }, [twbContext]);

  // render starts here
  console.log("hideTestConnectionMsg: ", hideTestConnectionMsg);
  if (twbContext && twbContext.needsConnection) {
    testConnection().then((connected) => {
      console.log("connected: ", connected);
      if (connected === true) {
        setTwbContext({ display: true });
      } else {
        if (
          document.getElementById("testConnectionMsg") &&
          password.length === 0
        ) {
          document.getElementById("testConnectionMsg").innerHTML =
            "Set url, username and password to generate a sample workbook";
        }
      }
    });
  }

  let schemaOptions;
  let tableOptions;
  let spatialColumnOptions;
  if (twbContext && twbContext.display) {
    // create schema and table dropdowns
    schemaOptions = twbContext?.schemas?.map((schema, index) => {
      return (
        <option key={index} value={schema}>
          {schema}
        </option>
      );
    });
    schemaOptions?.unshift(
      <option key={-1} value={""}>
        Select a schema
      </option>
    );

    if (twbContext.selectedSchema) {
      tableOptions = twbContext.tables[twbContext.selectedSchema].map(
        (table, index) => {
          return (
            <option key={index} value={table}>
              {table}
            </option>
          );
        }
      );
      tableOptions?.unshift(
        <option key={-1} value={""}>
          Select a table
        </option>
      );
    }

    if (twbContext.selectedTable) {
      spatialColumnOptions = twbContext.columns?.[
        twbContext.selectedTable
      ]?.map((column, index) => {
        return (
          <option key={index} value={column}>
            {column}
          </option>
        );
      });
      spatialColumnOptions?.unshift(
        <option key={-1} value={""}>
          Select field
        </option>
      );
    }
  }

  const handleConfigItem = (key, value) => {
    const advCfgItem = advancedConfig.find((item) => item.key === key);
    advCfgItem.value = value;
    setAdvancedConfig([...advancedConfig]);
  };

  return (
    <>
      <Modal.Header>
        {twbContext?.display && (
          <Modal.Title style={{ marginLeft: "90px" }}>
            Create Initial Workbook
          </Modal.Title>
        )}
        {!twbContext?.display && (
          <Modal.Title style={{ marginLeft: "90px" }}>
            Extension Configuration
          </Modal.Title>
        )}
      </Modal.Header>
      <Modal.Body>
        <div style={{ padding: "10px", height: "380px" }}>
          {!showAdvanced && (
            <Form>
              <h5>API Endpoint</h5>
              <Form.Group as={Row} controlId="configEndpoint">
                <Form.Label column sm="2">
                  URL
                </Form.Label>
                <Col sm="4">
                  <Form.Control
                    type="text"
                    placeholder="API Endpoint URL"
                    value={endpoint}
                    onChange={handleEndpointChange}
                    onKeyPress={handleKeypress}
                  />
                </Col>
              </Form.Group>
              <Form.Group as={Row} controlId="configCredentials">
                <Container>
                  <Row>
                    <Col>
                      <Form.Label sm="2">Username</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={handleUsernameChange}
                        onKeyPress={handleKeypress}
                      />
                    </Col>
                    <Col>
                      <Form.Label sm="2">Password</Form.Label>
                      <Form.Control
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={handlePasswordChange}
                        onKeyPress={handleKeypress}
                      />
                    </Col>
                  </Row>
                </Container>
              </Form.Group>
              <h5
                id="testConnectionMsg"
                hidden={hideTestConnectionMsg}
                style={{
                  textAlign: "center",
                  color: "red",
                  fontWeight: "bold",
                  padding: "10px",
                }}
              ></h5>
              <h5
                id="testConnectionMsgSuccess"
                hidden={hideTestConnectionMsg}
                style={{
                  textAlign: "center",
                  color: "green",
                  fontWeight: "bold",
                  padding: "10px",
                }}
              ></h5>

              {twbContext?.searchFieldModal === "schema" && (
                <SearchFieldModal
                  showModal={true}
                  options={twbContext.schemas}
                  onSelect={(l) => {
                    const newTwbContext = {
                      ...twbContext,
                      selectedSchema: l,
                      searchFieldModal: null,
                    };
                    setTwbContext(newTwbContext);
                  }}
                  onClose={() => {
                    setTwbContext({
                      ...twbContext,
                      searchFieldModal: null,
                    });
                  }}
                />
              )}

              {twbContext?.searchFieldModal === "table" &&
                twbContext.selectedSchema && (
                  <SearchFieldModal
                    showModal={true}
                    options={twbContext.tables[twbContext.selectedSchema]}
                    onSelect={(l) => {
                      const newTwbContext = {
                        ...twbContext,
                        selectedTable: l,
                        searchFieldModal: null,
                      };
                      setTwbContext(newTwbContext);
                    }}
                    onClose={() => {
                      setTwbContext({
                        ...twbContext,
                        searchFieldModal: null,
                      });
                    }}
                  />
                )}

              {twbContext?.searchFieldModal === "latitude" && (
                <SearchFieldModal
                  showModal={true}
                  options={twbContext.columns?.[twbContext.selectedTable]}
                  onSelect={(l) => {
                    const newTwbContext = {
                      ...twbContext,
                      selectedLatitude: l,
                      searchFieldModal: null,
                    };
                    setTwbContext(newTwbContext);
                  }}
                  onClose={() => {
                    setTwbContext({
                      ...twbContext,
                      searchFieldModal: null,
                    });
                  }}
                />
              )}

              {twbContext?.searchFieldModal === "longitude" && (
                <SearchFieldModal
                  showModal={true}
                  options={twbContext.columns?.[twbContext.selectedTable]}
                  onSelect={(l) => {
                    const newTwbContext = {
                      ...twbContext,
                      selectedLongitude: l,
                      searchFieldModal: null,
                    };
                    setTwbContext(newTwbContext);
                  }}
                  onClose={() => {
                    setTwbContext({
                      ...twbContext,
                      searchFieldModal: null,
                    });
                  }}
                />
              )}

              {twbContext?.searchFieldModal === "wkt" && (
                <SearchFieldModal
                  showModal={true}
                  options={twbContext.columns?.[twbContext.selectedTable]}
                  onSelect={(l) => {
                    const newTwbContext = {
                      ...twbContext,
                      selectedWkt: l,
                      searchFieldModal: null,
                    };
                    setTwbContext(newTwbContext);
                  }}
                  onClose={() => {
                    setTwbContext({
                      ...twbContext,
                      searchFieldModal: null,
                    });
                  }}
                />
              )}

              {twbContext && twbContext.display && twbContext.schemas && (
                <>
                  <Form.Group as={Row} controlId="twbConfiguration">
                    <Container>
                      <Row>
                        <Col>
                          <Form.Label sm="2">Schema</Form.Label>
                          <ComboBox
                            id="schemaComboBox"
                            placeholder="Select a schema"
                            optionsMaxHeight={350}
                            initialValue={
                              twbContext.selectedSchema ||
                              twbContext.schemas[-1]
                            }
                            options={twbContext.schemas.map((s) => ({
                              value: s,
                              label: s,
                            }))}
                            onSelect={(event) => {
                              const selectedValue = event.target.value;
                              console.log("selectedSchema: ", selectedValue);
                              setTwbContext({
                                ...twbContext,
                                selectedSchema: selectedValue,
                              });
                            }}
                          />
                        </Col>
                        <Col>
                          <Form.Label sm="2">Table</Form.Label>
                          <ComboBox
                            id="tableComboBox"
                            placeholder="Select a table"
                            optionsMaxHeight={350}
                            initialValue={null}
                            options={
                              twbContext.selectedSchema
                                ? twbContext.tables[
                                    `${twbContext.selectedSchema}`
                                  ].map((s) => ({ value: s, label: s }))
                                : []
                            }
                            onSelect={(event) => {
                              const selectedValue = event.target.value;
                              setTwbContext({
                                ...twbContext,
                                selectedTable: selectedValue,
                              });
                            }}
                          />
                        </Col>
                      </Row>
                      <Row style={{ marginTop: "5px" }}>
                        <Col>
                          <Form.Label sm="2">Data Type</Form.Label>
                          <Form.Control
                            as="select"
                            value={twbContext.selectedDataType || ""}
                            onChange={(event) => {
                              const selectedValue = event.target.value;
                              console.log("selectedDataType: ", selectedValue);
                              setTwbContext({
                                ...twbContext,
                                selectedDataType: selectedValue,
                              });
                            }}
                          >
                            <option key={-1} value={""}>
                              Select data type
                            </option>
                            <option key={0} value={"point"}>
                              {"point"}
                            </option>
                            <option key={1} value={"geo"}>
                              {"geo"}
                            </option>
                          </Form.Control>
                        </Col>
                      </Row>
                      <Row style={{ marginTop: "5px" }}>
                        {twbContext.selectedDataType === "point" && (
                          <>
                            <Col>
                              <Form.Label sm="2">Latitude</Form.Label>
                              <ComboBox
                                id="latitudeComboBox"
                                placeholder="Select latitude column..."
                                optionsMaxHeight={130}
                                initialValue={null}
                                options={
                                  twbContext.selectedDataType === "point" &&
                                  twbContext.selectedTable
                                    ? twbContext.columns?.[
                                        `${twbContext.selectedTable}`
                                      ]
                                        ?.map((s) => ({ value: s, label: s }))
                                        .filter(
                                          (s) =>
                                            s.value !==
                                            twbContext.selectedLongitude
                                        )
                                    : []
                                }
                                onSelect={(event) => {
                                  const selectedValue = event.target.value;
                                  console.log(
                                    "selectedLatitude: ",
                                    selectedValue
                                  );
                                  setTwbContext({
                                    ...twbContext,
                                    selectedLatitude: selectedValue,
                                  });
                                }}
                              />
                            </Col>
                            <Col>
                              <Form.Label sm="2">Longitude</Form.Label>
                              <ComboBox
                                id="longitudeComboBox"
                                placeholder="Select longitude column..."
                                optionsMaxHeight={130}
                                initialValue={null}
                                options={
                                  twbContext.selectedDataType === "point" &&
                                  twbContext.selectedTable
                                    ? twbContext.columns?.[
                                        `${twbContext.selectedTable}`
                                      ]
                                        ?.map((s) => ({ value: s, label: s }))
                                        .filter(
                                          (s) =>
                                            s.value !==
                                            twbContext.selectedLatitude
                                        )
                                    : []
                                }
                                onSelect={(event) => {
                                  const selectedValue = event.target.value;
                                  console.log(
                                    "selectedLongitude: ",
                                    selectedValue
                                  );
                                  setTwbContext({
                                    ...twbContext,
                                    selectedLongitude: selectedValue,
                                  });
                                }}
                              />
                            </Col>
                          </>
                        )}
                        {twbContext.selectedDataType === "geo" && (
                          <>
                            <Col>
                              <Form.Label sm="2">WKT</Form.Label>
                              <ComboBox
                                id="wktComboBox"
                                placeholder="Select wkt column..."
                                optionsMaxHeight={130}
                                initialValue={null}
                                options={
                                  twbContext.selectedDataType === "geo" &&
                                  twbContext.selectedTable
                                    ? twbContext.columns?.[
                                        `${twbContext.selectedTable}`
                                      ]?.map((s) => ({ value: s, label: s }))
                                    : []
                                }
                                onSelect={(event) => {
                                  const selectedValue = event.target.value;
                                  console.log("selectedWkt: ", selectedValue);
                                  setTwbContext({
                                    ...twbContext,
                                    selectedWkt: selectedValue,
                                  });
                                }}
                              />
                            </Col>
                          </>
                        )}
                      </Row>
                    </Container>
                  </Form.Group>
                </>
              )}

              {!twbContext && (
                <>
                  <h5>Basemap</h5>
                  <Form.Group as={Row} controlId="configBasemapUrl">
                    <Col sm="10">
                      <Form.Control
                        as="select"
                        onChange={handleBasemapUrlChange}
                        onKeyPress={handleKeypress}
                      >
                        <option value={basemapUrl}>
                          {basemapUrl === "dark-v11"
                            ? "Mapbox Dark"
                            : basemapUrl === "satellite-streets-v11"
                            ? "Mapbox Satellite Street View"
                            : basemapUrl === "OSM"
                            ? "OpenStreetMap"
                            : "Mapbox Dark"}
                        </option>
                        {basemapUrl !== "dark-v11" ? (
                          <option value="dark-v11">Mapbox Dark</option>
                        ) : (
                          ""
                        )}
                        {basemapUrl !== "xyz-service" ? (
                          <option value="xyz-service">Custom Basemap URL</option>
                        ) : (
                          ""
                        )}
                        {basemapUrl !== "satellite-streets-v11" ? (
                          <option value="satellite-streets-v11">
                            Mapbox Satellite Street View
                          </option>
                        ) : (
                          ""
                        )}
                        {basemapUrl !== "OSM" ? (
                          <option value="OSM">OpenStreetMap</option>
                        ) : (
                          ""
                        )}
                      </Form.Control>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} controlId="mapboxApiKey">
                    <Container>
                      <Row>
                        <Col>
                          <Form.Label sm="2">
                            Mapbox API Key (leave empty for default)
                          </Form.Label>
                          <Form.Control
                            type="text"
                            onChange={handleMapboxApiKeyChange}
                            value={mapboxApiKey}
                            onKeyPress={handleKeypress}
                          />
                        </Col>
                      </Row>
                    </Container>
                  </Form.Group>
                  <Form.Group as={Row} controlId="xyzTileServiceTemplate">
                    <Container>
                      <Row>
                        <Col>
                          <Form.Label sm="2">
                            XYZ Tile Service Template
                          </Form.Label>
                          <Form.Control
                            type="text"
                            onChange={handleXyzTileServiceTemplateChange}
                            value={xyzTileServiceTemplate}
                          />
                        </Col>
                      </Row>
                    </Container>
                  </Form.Group>
                </>
              )}
            </Form>
          )}
          {showAdvanced &&
            advancedConfig.map((item, index) => (
              <Form.Group as={Row}>
                <Form.Label column sm="2">
                  {item.displayName}
                  <OverlayTrigger
                    overlay={
                      <Tooltip id="tooltip-disabled">
                        Requires an extension reload before taking effect.
                      </Tooltip>
                    }
                  >
                    <QuestionCircle style={{ marginLeft: "5px" }} />
                  </OverlayTrigger>
                </Form.Label>
                <Form.Control
                  id={item.key}
                  as="input"
                  rows="1"
                  value={item.value}
                  style={{
                    border: "1px solid black",
                    margin: "15px",
                    marginBottom: "0px",
                    width: "100%",
                  }}
                  onChange={(e) => {
                    handleConfigItem(item.key, e.target.value);
                  }}
                />
              </Form.Group>
            ))}
        </div>
        {twbContext && (
          <div style={{ textAlign: "center", marginBottom: "0px" }}>
            <h5 style={{ fontSize: "12px" }}>v{EXTENSION_VERSION}</h5>
          </div>
        )}
        {!twbContext && (
          <div
            style={{
              marginBottom: "0px",
              display: "flex",
              flexDirection: "row",
            }}
          >
            <div
              style={{ width: "55%", textAlign: "right", marginRight: "0px" }}
            >
              <h5 style={{ fontSize: "12px" }}>v{EXTENSION_VERSION}</h5>
            </div>
            <div
              style={{ width: "45%", textAlign: "right", marginRight: "5px" }}
            >
              {!showAdvanced && (
                <a
                  href="#"
                  onClick={() => {
                    console.log("setting shwoAdvanced to true");
                    setShowAdvanced(true);
                  }}
                >
                  Advanced
                </a>
              )}
              {showAdvanced && (
                <a
                  href="#"
                  onClick={() => {
                    console.log("setting shwoAdvanced to true");
                    setShowAdvanced(false);
                  }}
                >
                  Go Back
                </a>
              )}
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {twbContext && twbContext.display && (
          <Button
            variant="primary"
            type="submit"
            disabled={
              !(
                (twbContext.selectedDataType === "point" &&
                  twbContext.selectedLatitude &&
                  twbContext.selectedLongitude) ||
                (twbContext.selectedDataType === "geo" &&
                  twbContext.selectedWkt)
              )
            }
            onClick={downloadWorkbookFile}
            block
          >
            Download Workbook File
          </Button>
        )}
        {!twbContext && (
          <Button variant="primary" type="submit" onClick={saveConfig} block>
            Save Configuration
          </Button>
        )}
      </Modal.Footer>
    </>
  );
};

export default Configure;
