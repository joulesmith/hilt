"use strict";

import React from 'react';

import {Input, ProgressBar, ButtonInput} from 'react-bootstrap';
import zxcvbn from 'zxcvbn';
import * as journal from '../journal';

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

  },
  handlePassword: function(event) {

    var result = zxcvbn(event.target.value);

    var warnings = result.feedback.suggestions;

    if (result.feedback.warning && result.feedback.warning !== '') {
        warnings.push(result.feedback.warning);
    }

    this.setState({
      password: event.target.value,
      passwordTest: {
        status: result.score >= 3 ? (result.score === 4 ? 'success' : 'warning') : 'danger',
        strength : result.score,
        warnings : warnings,
        crackTime : result.crack_times_display.offline_slow_hashing_1e4_per_second
      }
    });
  },
  handlePasswordConfirm: function(event) {
    if (event.target.value === this.state.password && (this.state.passwordTest.status === 'success' || this.state.passwordTest.status === 'warning')) {
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

      journal.report({
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
  handleGoogleOAuth: function(event) {
    // attach a callback function to this window which can be used to send back
    // the google oauth code
    window.googleCallback = function(err, code) {
      // when the callback is called, remove callback from window
      // therefore the callback can only be called once
      // (unless another copy was made before it is called)
      delete window.googleCallback;
      // bring focus back to original window
      window.focus();

      if (err && err !== '') {
        return journal.report({
          action: '#/error',
          data: err // is err the right kind of Error?
        });
      }

      journal.report({
        action: '#/user/login',
        data: {
          googleCode: code
        }
      })
      .catch(err => {
        journal.report({
          action: '#/error',
          data: err
        });
      });
    };

    journal.get('api/user/google/auth/url')
    .then(data => {
      // open child window to oauth url and give focus.
      var childWindow = window.open(data.url);
      childWindow.focus();
    });
  },
  render: function() {
    return (
      <form>
        <Input onChange={this.handleUsername} type="text" label="Username" placeholder="Username" />
        <Input onChange={this.handlePassword} type="password" label="Password" placeholder="Password"/>
        {(() => {
          if (!this.state.usernameRegistered) {
            return (
              <div>
                <ProgressBar bsStyle={this.state.passwordTest.status} active now={this.state.passwordTest.strength * 25} />
                <h6>Password Strength:<b> {this.state.passwordTest.strength} / 4</b></h6>
                <h6>Estimated Time to Crack:<b> {this.state.passwordTest.crackTime}</b></h6>
                {(() => {
                  if (this.state.passwordTest.warnings && this.state.passwordTest.warnings.length > 0) {
                    return (
                      <div className="alert alert-danger" role="alert">
                        {this.state.passwordTest.warnings.map((warning, index) => {
                          return (
                            <h6 key={index}>
                              <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                              <span className="sr-only">Suggestion: </span>
                              <span> {warning} </span>
                            </h6>
                          )
                        })}
                      </div>
                    );
                  }
                })()}
                <div style={this.state.passwordConfirm.style}>
                  <Input onChange={this.handlePasswordConfirm} bsStyle={this.state.passwordConfirm.status} type="password" label="Confirm Password" hasFeedback />
                </div>
                <ButtonInput onClick={this.handleRegister} type="button" value="Register" disabled={this.state.passwordConfirm.status !== 'success'}/>
              </div>
            );
          }

          return (<ButtonInput onClick={this.handleSignin} type="button" value="Sign-In" />);
        })()}
        <div>
          <div>or Sign-In With</div><br />
          <span onClick={this.handleGoogleOAuth} className="btn btn-default">
              <img src="./img/btn_google+_signin_small_transparent.png" alt="google plus sing-in" style={{display: 'inline-block'}}></img>
          </span>
        </div>
      </form>
    );
  }
});
