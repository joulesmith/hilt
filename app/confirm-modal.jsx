"use strict";

import React from 'react';
import {subscribe, publish} from 'journal';
import {Modal, Button} from 'react-bootstrap';
import ErrorBody from 'error-body';


export default React.createClass({
  getInitialState: function(){
    return {
      show: false
    };
  },
  handleRequest (event) {
    this.setState({show: true});
  },
  handleConfirm (event) {
    this.setState({show: false}, this.props.onConfirm);
  },
  handleDismiss: function() {
    this.setState({show: false});
  },
  render: function() {

    return (
      <span>
        <Button
          onClick={this.handleRequest}
        >
          {this.props.request}
        </Button>
        <Modal show={this.state.show} onHide={this.handleDismiss}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmation</Modal.Title>
          </Modal.Header>
          <Modal.Footer>
            <Button onClick={this.handleConfirm}>{this.props.request}</Button>
            <Button onClick={this.handleDismiss}>Cancel</Button>
          </Modal.Footer>
        </Modal>
      </span>
    );

  }
});
