"use strict";

import React from 'react';

import {Input, ProgressBar, ButtonInput} from 'react-bootstrap';
import zxcvbn from 'zxcvbn';
import * as journal from '../journal';
import GoogleOAuth from './GoogleOAuth';
import PasswordTest from './PasswordTest';

export default React.createClass({
  getInitialState: function(){
    return {
      passwordTest: {
        status: 'danger'
      },
      passwordConfirm: {
        status: 'error'
      },
      username : '',
      usernameRegistered: true,
      password: ''
    };
  },
  handleUsername: function(event) {
    if (event.target.value !== '') {
      journal.get('api/user/registered/' + event.target.value)
      .then(data => {
        this.setState({
          username: event.target.value,
          usernameRegistered : data.registered
        });
      })
      .catch(err => {
        journal.report({
          action: '#/error',
          data: err
        });
      });
    }else{
      this.setState({
        username: event.target.value
      });
    }

  },
  handlePassword: function(event) {
    this.setState({
      password: event.target.value,
    });
  },
  handlePasswordTest: function(score) {
    this.setState({
      passwordScore: score
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
  handleRegister: function(event) {
    var that = this;
    journal.report({
      action: '#/user/register',
      data: {
        username: this.state.username,
        password: this.state.password
      }
    })
    .then(function(){

      return journal.report({
        action: '#/user/login',
        data: {
          username: that.state.username,
          password: that.state.password
        }
      });
    })
    .catch(err => {
      journal.report({
        action: '#/error',
        data: err
      });
    });
  },
  handleSignin: function(event) {

    journal.report({
      action: '#/user/login',
      data: {
        username: this.state.username,
        password: this.state.password
      }
    })
    .catch(err => {
      journal.report({
        action: '#/error',
        data: err
      });
    });
  },
  render: function() {
    return (
      <form>
        <Input onChange={this.handleUsername} type="text" label="Username" placeholder="Username" />
        <Input onChange={this.handlePassword} type="password" label="Password" placeholder="Password"/>
        {(() => {
          if (this.state.username !== '') {
            if (!this.state.usernameRegistered) {
              return (
                <div>
                  <PasswordTest password={this.state.password} onTest={this.handlePasswordTest}/>
                  <div style={this.state.passwordConfirm.style}>
                    <Input onChange={this.handlePasswordConfirm} bsStyle={this.state.passwordConfirm.status} type="password" label="Confirm Password" hasFeedback />
                  </div>
                  <ButtonInput onClick={this.handleRegister} type="button" value="Register New Username" disabled={this.state.passwordConfirm.status !== 'success'}/>
                </div>
              );
            }
            return (<ButtonInput onClick={this.handleSignin} type="button" value="Sign-In With Existing Username" />);
          }

          return <div></div>;
        })()}
        <div>
          <div>or Sign-In With</div><br />
          <GoogleOAuth />
        </div>
      </form>
    );
  }
});
