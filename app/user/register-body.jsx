"use strict";

import React from 'react';

import {Input, ProgressBar, ButtonInput} from 'react-bootstrap';
import zxcvbn from 'zxcvbn';
import * as journal from '../journal';
import GoogleOAuth from './google-oauth';
import PasswordTest from './password-test';
import formatMessage from 'format-message';

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
      rememberLogin: false
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
        <Input
          onChange={this.handleUsername}
          type="text"
          label={formatMessage({
            id: 'username_label',
            default: 'Username'
          })}
        />
        <Input
          onChange={this.handlePassword}
          type="password"
          label={formatMessage({
            id: 'password_label',
            default: 'Password'
          })}
        />
        {(() => {
          if (this.state.username !== '') {
            if (!this.state.usernameRegistered) {
              return (
                <div>
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
                    onClick={this.handleRegister}
                    type="button"
                    value={formatMessage({
                      id: 'new_username_button',
                      default: 'Register New Username'
                    })}
                    disabled={this.state.passwordConfirm.status !== 'success'}
                  />
                </div>
              );
            }
            return (
              <ButtonInput
                onClick={this.handleSignin}
                type="button"
                value={formatMessage({
                  id: 'signin_username_button',
                  default: 'Sign-In With Existing Username'
                })}
              />
            );
          }

          return <div></div>;
        })()}
        <div>
          <div>
            {formatMessage({
              id: 'signin_alternatives',
              default: 'Or Sign-In With:'
            })}
          </div>
          <br />
          <GoogleOAuth />
        </div>
      </form>
    );
  }
});
