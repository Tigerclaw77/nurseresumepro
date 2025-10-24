// components/ConfirmExportModal.jsx
import React from "react";
import { Modal, Button } from "react-bootstrap";

const ConfirmExportModal = ({ show, onAddToCart, onDownload, onCancel }) => (
  <Modal show={show} onHide={onCancel} centered>
    <Modal.Header closeButton>
      <Modal.Title>Confirm Export</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      Would you like to save this to your cart for later access or just download it now?
    </Modal.Body>
    <Modal.Footer>
      <Button onClick={onAddToCart} variant="success">
        Add to Cart ($10)
      </Button>
      <Button onClick={onDownload} variant="primary">
        Download Without Saving
      </Button>
      <Button onClick={onCancel} variant="secondary">
        Cancel
      </Button>
    </Modal.Footer>
  </Modal>
);

export default ConfirmExportModal;
