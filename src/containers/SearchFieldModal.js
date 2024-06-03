import { useState, useEffect } from "react";
import { Modal, Button, Form, FormGroup } from "react-bootstrap";

export default function SearchFieldModal({ options, onSelect, onClose }) {
  const [showModal, setShowModal] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  useEffect(() => {
    // filter the options by the search term
    const filteredOptions = options.filter(
      (option) => option.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1
    );

    setFilteredOptions(filteredOptions);
  }, [searchTerm]);

  // render starts here
  const filteredOptionsView = filteredOptions.map((option, index) => (
    <div
      key={index}
      onClick={() => {
        onSelect(option);
      }}
    >
      {option}
    </div>
  ));

  return (
    <>
      {/* <Button onClick={() => setShowModal(true)}>Search Field</Button> */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Search Field</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <FormGroup>
              <Form.Control
                type="text"
                placeholder="Enter field name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormGroup>
            <Form.Group>
              <div
                style={{
                  marginTop: "20px",
                  height: "200px",
                  overflowY: "auto",
                  cursor: "pointer",
                }}
              >
                {filteredOptionsView}
              </div>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowModal(false);
              onClose();
            }}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
