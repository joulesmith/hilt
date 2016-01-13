"use strict";

import React from 'react';
import {subscribe, publish} from 'journal';
import {Modal, Button} from 'react-bootstrap';
import ErrorBody from 'ErrorBody';


export default React.createClass({
  getInitialState: function(){
    return {
      showError: false
    };
  },
  componentWillMount: function(){
    this.unsubscribe = subscribe({
      error: '#/error'
    }, state => {
      this.setState(state);
      this.setState({show: true});
    });
  },
  componentWillUnmount: function(){
    this.unsubscribe();
  },
  handleDismiss: function() {

    this.setState({show: false});
  },
  render: function() {

    return (
      <Modal show={this.state.show} onHide={this.handleDismiss}>
        <Modal.Header closeButton>
          <Modal.Title>Error</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ErrorBody error={this.state.error} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleDismiss}>Ok</Button>
        </Modal.Footer>
      </Modal>
    );

  }
});
