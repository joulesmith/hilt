"use strict";

import React from 'react';
import { hashHistory } from 'react-router';
import {Input, ProgressBar, ButtonInput} from 'react-bootstrap';
import zxcvbn from 'zxcvbn';
import * as journal from '../journal';
import GoogleOAuth from './google-oauth';
import PasswordTest from './password-test';
import formatMessage from 'format-message';
import ErrorBody from '../error-body';

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
      password: '',
      rememberLogin: false,
      processing: false
    };
  },
  componentWillMount: function(){
    // subscribe to a specific profile
    this.subscription = journal.subscribe({
      username: 'api/user/registered/{this.state.username}'
    }, state => {
      this.setState({
        usernameRegistered: state.username.registered
      });
    }, this);

  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  handleUsername: function(event) {
    this.setState({
      username: event.target.value
    }, this.subscription.thisChanged);
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
    event.preventDefault();
    var that = this;

    this.setState({
      processing: true
    }, () => {
      journal.report({
        action: '#/user/register',
        data: {
          username: that.state.username,
          password: that.state.password
        }
      })
      .then(() => {

        return journal.report({
          action: '#/user/login',
          data: {
            username: that.state.username,
            password: that.state.password
          }
        });
      })
      .then(() => {
        that.setState({
          processing: false
        });
      })
      .catch(err => {
        that.setState({
          processing: false
        });

        journal.report({
          action: '#/error',
          data: err
        });
      });
    });



  },
  handleSignin: function(event) {
    event.preventDefault();
    var that = this;

    this.setState({
      processing: true
    }, () => {
      journal.report({
        action: '#/user/login',
        data: {
          username: that.state.username,
          password: that.state.password
        }
      })
      .then(() => {
        that.setState({
          processing: false
        });
      })
      .catch(err => {
        that.setState({
          processing: false
        });

        journal.report({
          action: '#/error',
          data: err
        });
      });
    });
  },
  render: function() {
    try{
      return (
        <form name="register">
          <Input
            onChange={this.handleUsername}
            type="text"
            label={formatMessage({
              id: 'username_label',
              default: 'Username'
            })}
            name="username"
          />
          <Input
            onChange={this.handlePassword}
            type="password"
            label={formatMessage({
              id: 'password_label',
              default: 'Password'
            })}
            name="password"
          />
          <PasswordTest password={this.state.password} onTest={this.handlePasswordTest}/>
          <Input
            disabled={!this.state.passwordScore || this.state.passwordScore < 3}
            onChange={this.handlePasswordConfirm}
            bsStyle={this.state.passwordConfirm.status}
            type="password"
            label={formatMessage({
              id: 'confirm_password_label',
              default: 'Confirm Password'
            })}
            hasFeedback
          />
          <ButtonInput
            onClick={this.state.processing ? null : this.handleRegister}
            type="submit"
            value={this.state.processing ? 'Processing...' : 'Register New Username'}
            disabled={this.state.processing || this.state.passwordConfirm.status !== 'success'}
          />
          <div>
            <div>
              {formatMessage({
                id: 'signin_alternatives',
                default: 'Or Register With:'
              })}
            </div>
            <br />
            <GoogleOAuth />
          </div>
        </form>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
