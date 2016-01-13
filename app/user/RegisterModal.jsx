"use strict";

import React from 'react';
import * as journal from 'journal';

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
  componentWillMount: function(){
    this.unsubscribe = journal.subscribe({
      register: '#/modal/register',
      user: '#/user/current'
    }, state => {
      this.setState(state);

      if (state.user && state.user._id && !state.user.guest && this.state.register.show) {
        journal.report({
          action: '#/modal/register',
          data: {show: false}
        });
      }
    });
  },
  componentWillUnmount: function(){
    this.unsubscribe();
  },
  handleDismiss: function() {
    journal.report({
      action: '#/modal/register',
      data: {show: false}
    });
  },
  render: function() {

    return (
      <Modal show={this.state.register.show} onHide={this.handleDismiss}>
        <Modal.Header closeButton>
          <Modal.Title>Register/Sign-In</Modal.Title>
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
