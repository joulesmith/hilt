"use strict";

import React from 'react';
import {log, subscribe, publish} from 'journal';
import './css/bootstrap.css';
import {Modal, Button} from 'react-bootstrap';
import ErrorBody from 'ErrorBody';

// defines a custom error publishing action
/*
log({
  action: './error',
  data: (data, query) => {
    // add a time-stamp for how old this error is.
    data.timestamp = Date.now();

    publish('./error', data);

    if (query.lifetime) {
      //
      window.setTimeout(() => {publish('./error', null)}, query.lifetime * 1000);
    }
  }
});
*/

export default React.createClass({
  getInitialState: function(){
    return {
      showError: false
    };
  },
  componentDidMount: function(){
    this.unsubscribe = subscribe(state => {
      this.setState(state);
      this.setState({show: true});
    }, {
      error: './error'
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
