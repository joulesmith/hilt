"use strict";

import React from 'react';
import * as journal from 'journal';
import formatMessage from 'format-message';
import {Modal, Button} from 'react-bootstrap';
import RegisterBody from './register-body';
import SigninBody from './signin-body';

export default React.createClass({
  getInitialState: function(){
    return {
      signin: true,
      register: {
        show: false
      }
    };
  },
  componentWillMount: function(){
    this.subscription = journal.subscribe({
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
    this.subscription.unsubscribe();
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
          <Modal.Title>
          {formatMessage({
            id: 'signin_modal_title',
            default: 'Register/Sign-In',
            description: 'Title of register/signing modal (popup)'
          })}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(() => {
            if (!this.state.signin) {
              return (
                <div>
                  <div><p style={{cursor:'pointer'}} onClick={() => {this.setState({signin: true})}}>-> signin existing user?</p></div>
                  <RegisterBody />
                </div>
              );
            }

            return (
              <div>
                <div><p style={{cursor:'pointer'}} onClick={() => {this.setState({signin: false})}}>-> register new user?</p></div>
                <SigninBody />
              </div>
            );
          })()}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.handleDismiss}>
          {formatMessage({
            id: 'signin_modal_cancel',
            default: 'Cancel',
            description: 'Close signin modal without signing in.'
          })}
          </Button>
        </Modal.Footer>
      </Modal>
    );

  }
});
