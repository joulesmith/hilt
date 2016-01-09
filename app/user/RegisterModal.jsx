"use strict";

import React from 'react';
import {log, subscribe} from 'journal';

import {Modal, Button} from 'react-bootstrap';
import RegisterBody from './RegisterBody';



export default React.createClass({
  getInitialState: function(){
    return {
      register: {
        show: false
      }
    };
  },
  componentDidMount: function(){
    this.unsubscribe = subscribe(state => {
      this.setState(state);
    }, {
      register: './register'
    });
  },
  componentWillUnmount: function(){
    this.unsubscribe();
  },
  handleDismiss: function() {
    log({
      action: './register',
      data: {show: false}
    });
  },
  render: function() {

    return (
      <Modal show={this.state.register.show} onHide={this.handleDismiss}>
        <Modal.Header closeButton>
          <Modal.Title>Register</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <RegisterBody />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleDismiss}>Cancel</Button>
        </Modal.Footer>
      </Modal>
    );

  }
});
