import React, { useState, useEffect } from "react";
import { Form, ListGroup } from "react-bootstrap";

const ComboBox = (props) => {
  const {
    options,
    onSelect,
    initialValue,
    placeholder,
    optionsMaxHeight,
    onFocus,
  } = props;
  const [inputValue, setInputValue] = useState(initialValue);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [hideListGroup, setHideListGroup] = useState(true);

  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setFilteredOptions(options);
  }, [options]);

  useEffect(() => {
    const handleClick = (event) => {
      if (event.target?.placeholder === placeholder) {
        setHideListGroup(false);
      } else {
        setHideListGroup(true);
      }
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  const handleInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
    setFilteredOptions(
      options.filter((option) =>
        option.label.toLowerCase().includes(value.toLowerCase())
      )
    );
    setHideListGroup(false);
  };

  const handleSelectOption = (option) => {
    console.log("handleSelectOption: ", option);
    setInputValue(option.label);
    onSelect({ target: { value: option.value } });
    setHideListGroup(true);
  };

  return (
    <div style={{ position: "relative" }}>
      <Form.Control
        type="text"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onClick={() => setHideListGroup(!hideListGroup)}
        onFocus={onFocus || (() => setHideListGroup(false))}
      />
      {!hideListGroup && (
        <ListGroup
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "100%",
            zIndex: 1000,
            maxHeight: `${optionsMaxHeight}px`,
            overflowY: "auto",
          }}
        >
          {filteredOptions.map((option) => (
            <ListGroup.Item
              key={option.value}
              action
              active={inputValue === option.label}
              onClick={(e) => {
                console.log("ListGroup.Item: ", e.target);
                handleSelectOption(option);
              }}
              onBlur={() => {
                setHideListGroup(true);
              }}
            >
              {option.label}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
};

export default ComboBox;
