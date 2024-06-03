import React, { useState, useEffect, useRef } from "react";
import { parseFormula } from "./TableauExpression";

// Declare this so our linter knows that tableau is a global object
/* global tableau */

export const TwbContext = (props) => {
  const { twb, setCalculatedFields, setError } = props;

  const componentName = "TwbContext";
  const [twbFile, setTwbFile] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const contentHashRef = useRef();

  const getContentHash = async (content) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  };

  const getColumnContent = async (file) => {
    console.log("getColumnContent: ", file);
    const blob = new Blob([file], { type: file.type });
    const reader = new FileReader();
    reader.readAsText(blob);

    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const text = reader.result;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        console.log("xmlDoc: ", xmlDoc);
        const columns = [
          ...xmlDoc
            ?.getElementsByTagName("datasource")[1]
            ?.getElementsByTagName("column"),
        ];
        const calculatedColumns = columns?.filter((c) => {
          return (
            c.childNodes.length > 0 &&
            c.getAttribute("caption") !== null &&
            c.getAttribute("caption") !== "wkt" &&
            c.getAttribute("caption") !== "wktviewport"
          );
        });
        console.log("getColumnContent: ", calculatedColumns);
        resolve(calculatedColumns);
      };

      reader.onerror = () => {
        reject(reader.error);
      };
    });
  };

  const getCalculatedFields = async (calculatedColumns) => {
    console.log(">>>getCalculatedFields: ", calculatedColumns);
    let calcFields = {};

    await Promise.all(
      calculatedColumns.map(async (c) => {
        const name = c.getAttribute("caption");
        const formula = c.childNodes[1].getAttribute("formula");
        console.log("name: ", name);
        console.log("formula: ", formula);

        const result = await parseFormula(formula);
        console.log("parseFormula() result: ", result);
        calcFields[name] = {
          sql: result.sql,
          formula: formula,
        };

        if (result.error) {
          // push result.error to warnings
          console.log("result.error: ", result.error);
          setWarnings((warnings) => [...warnings, result.error]);
        }
      })
    );
    console.log("<<<getCalculatedFields: calcFields: ", calcFields);
    return calcFields;
  };

  useEffect(() => {
    console.log("TwbContext: twb change detected: ", twb);
    if (twb) {
      console.log("TwbContext: twb setTwbFile: ", twb);
      setTwbFile(twb);
    }
  }, [twb]);

  useEffect(() => {
    if (warnings.length > 0) {
      setError("Warning", warnings.join("\n"));
      setWarnings([]);
    }
  }, [warnings]);

  useEffect(() => {
    try {
      console.log("Checking for new data...", twbFile);
      if (twbFile) {
        console.log("Hash match to check if refresh is needed.");
        getColumnContent(twbFile)
          .then((c) => {
            console.log("received columnContent: c: ", c);
            getCalculatedFields(c)
              .then((cf) => {
                if (cf) {
                  console.log("setCalculatedFields: ", cf);
                  setCalculatedFields(cf);
                  alert("Metadata has been updated.");
                }
              })
              .catch((e) => {
                console.error(e.stack);
                setError(componentName, e.message);
              });
          })
          .catch((e) => {
            setError(componentName, e.message);
          });
      } else {
        console.log("No associated twb file.");
      }
    } catch (e) {
      setError(componentName, e.message);
    }
  }, [twbFile]);

  console.log("TwbContext: twbFile: ", twbFile);
  return <></>;
};
