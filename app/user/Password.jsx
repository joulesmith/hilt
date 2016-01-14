"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import zxcvbn from 'zxcvbn';
import PasswordTest from './password-test';

export default React.createClass({
  getInitialState: function(){
    return {
      oldPassword: '',
      password: '',
      passwordTest: {
        status: 'danger'
      },
      passwordConfirm: {
        status: 'error'
      },
    };
  },
  componentWillReceiveProps: nextProps => {

  },
  handleOldPassword: function(event) {
    this.setState({
      oldPassword: event.target.value
    });
  },
  handlePassword: function(event) {
    this.setState({
      password: event.target.value,
    });
  },
  handlePasswordConfirm: function(event) {
    if (event.target.value === this.state.password && this.state.passwordScore >= 3) {
      this.setState({
        passwordConfirm: {
          status: 'success'
        }
      });
    }else{
      this.setState({
        passwordConfirm: {
          status: 'error'
        }
      });
    }
  },
  handleEdit: function(event) {
    this.setState({
      edit: true
    });
  },
  handleCancel: function(event) {
    this.setState({
      edit: false
    });
  },
  handlePasswordTest: function(score) {
    this.setState({
      passwordScore: score
    });
  },
  render: function() {

    return (
      <div>
        <Bootstrap.Input onChange={this.handlePassword} type="password" label="New Password"/>
        <PasswordTest password={this.state.password} onTest={this.handlePasswordTest}/>
        <Bootstrap.Input onChange={this.handlePasswordConfirm} bsStyle={this.state.passwordConfirm.status} type="password" label="Confirm Password" hasFeedback />
      </div>
    );


  }
});
