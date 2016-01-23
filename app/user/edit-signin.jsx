"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import zxcvbn from 'zxcvbn';
import PasswordTest from './password-test';
import formatMessage from 'format-message';
import GoogleOAuth from './google-oauth';
import If from '../if.jsx';
import * as journal from 'journal';

export default React.createClass({
  getInitialState: function(){
    return {
      username: this.props.user && this.props.user.signin.username ? this.props.user.username : '',
      currentPassword: '',
      password: '',
      passwordConfirm: '',
      passwordConfirmStatus: 'error',
      usernameRegistered: {
        registered: false
      }
    };
  },
  componentDidMount: function(){

    this.subscription = journal.subscribe({
      usernameRegistered: 'api/user/registered/{this.state.username}',
    }, state => {
      this.setState(state);
    }, this);
    // have to pass in this since the subscription depends on it
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  componentWillReceiveProps (nextProps) {
    if (nextProps.user && nextProps.user.signin.username) {
      this.setState({
        username: nextProps.user.signin.username
      });
    }else{
      this.setState({
        username: ''
      });
    }
  },
  handleUsername: function(event) {

    this.setState({
      username: event.target.value
    }, this.subscription.thisChanged);
    // the subscription depends on this.state.username
    // to see if the username is already registered

  },
  handleCurrentPassword: function(event) {
    this.setState({
      currentPassword: event.target.value
    });
  },
  handlePassword: function(event) {

    if (event.target.value === this.state.passwordConfirm && this.state.passwordScore >= 3) {
      this.setState({
        password: event.target.value,
        passwordConfirmStatus: 'success'
      });
    }else{
      this.setState({
        password: event.target.value,
        passwordConfirmStatus: 'error'
      });
    }
  },
  handlePasswordConfirm: function(event) {
    if (event.target.value === this.state.password && this.state.passwordScore >= 3) {
      this.setState({
        passwordConfirm: event.target.value,
        passwordConfirmStatus: 'success'
      });
    }else{
      this.setState({
        passwordConfirm: event.target.value,
        passwordConfirmStatus: 'error'
      });
    }
  },
  handlePasswordTest: function(score) {
    this.setState({
      passwordScore: score
    });
  },
  handleSubmit: function(event) {
    event.preventDefault();

    journal.report({
      action: 'api/user/' + this.props.user._id,
      data: {
        username: this.state.username,
        password: this.state.password
      }
    })
    .then(() => {
      return journal.report({
        action: '#/user/login',
        data: {
          username: this.state.username,
          password: this.state.password
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
  handleOAuth: function(code) {
    journal.report({
      action: 'api/user/' + this.props.user._id,
      data: {
        googleCode: code
      }
    })
    .then(() => {
      journal.report({
        action: '#/user/login',
        data: {
          googleCode: code
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
  render: function() {

    return (
      <div>
        <If condition={!!this.props.user}>
          <Bootstrap.Row>
            <Bootstrap.Col xsOffset={0} xs={11}>
              <b>
                <If condition={this.props.user && this.props.user.signin.username}>
                  {formatMessage({
                    id: 'current_username',
                    default: 'Currently signed in with username {username}'
                  }, {
                    username: this.props.user ? this.props.user.signin.username : ''
                  })}
                </If>
                <If condition={this.props.user && this.props.user.signin.google}>
                  {formatMessage({
                    id: 'current_google',
                    default: 'Currently signed using G+ Google'
                  })}
                </If>
              </b>
            </Bootstrap.Col>
          </Bootstrap.Row>
        </If>
        <br />
        <Bootstrap.Row>
          <Bootstrap.Col xsOffset={0} xs={11}>
          {formatMessage({
            id: 'username_signin_label',
            default: 'Use a username and password to Sign-In'
          })}
          </Bootstrap.Col>
        </Bootstrap.Row>
        <br />
        <Bootstrap.Row>
          <Bootstrap.Col xsOffset={1} xs={11}>
            <form onSubmit={this.handleSubmit}>
              <Bootstrap.Input
                onChange={this.handleUsername}
                type="text"
                label={formatMessage({
                  id: 'username_label',
                  default: 'Username'
                })}
                value={this.state.username}
              />
              <If condition={this.state.usernameRegistered.registered && this.state.username !== (this.props.user && this.props.user.signin.username ? this.props.user.signin.username : '')}>
                <Bootstrap.Alert bsStyle="danger">
                  This username is already registered with another account.
                </Bootstrap.Alert>
              </If>
              <Bootstrap.Input
                onChange={this.handlePassword}
                type="password"
                label={formatMessage({
                  id: 'password_label',
                  default: 'Password'
                })}
              />
              <PasswordTest password={this.state.password} onTest={this.handlePasswordTest} />
              <Bootstrap.Input
                disabled={!this.state.passwordScore || this.state.passwordScore < 3}
                onChange={this.handlePasswordConfirm}
                bsStyle={this.state.passwordConfirmStatus}
                type="password"
                label={formatMessage({
                  id: 'confirm_password_label',
                  default: 'Confirm Password'
                })}
                hasFeedback
              />
              <Bootstrap.ButtonInput
                type="submit"
                value={formatMessage({
                  id: 'set_password_button',
                  default: 'Set Sign-In'
                })}
                disabled={this.state.passwordConfirmStatus !== 'success'}
              />
            </form>
          </Bootstrap.Col>
        </Bootstrap.Row>
        <br />
        <Bootstrap.Row>
          <Bootstrap.Col xsOffset={0} xs={11}>
          {formatMessage({
            id: 'alternative_signin_label',
            default: 'Use a 3rd party to Sign-In'
          })}
          </Bootstrap.Col>
        </Bootstrap.Row>
        <br />
        <Bootstrap.Row>
          <Bootstrap.Col xsOffset={1} xs={11}>
            <GoogleOAuth onOAuth={this.handleOAuth} />
          </Bootstrap.Col>
        </Bootstrap.Row>
      </div>
    );
  }
});
