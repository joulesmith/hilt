"use strict";

import React from 'react';

import {Input, ProgressBar, ButtonInput} from 'react-bootstrap';
import zxcvbn from 'zxcvbn';

export default React.createClass({
  getInitialState: function(){
    return {
      passwordTest: {
        style: {
          display: 'none'
        },
        status: 'danger'
      },
      passwordConfirm: {
        style: {
          display: 'initial'
        },
        status: 'error'
      },
      user : {
        username : '',
        password: ''
      }
    };
  },
  handleUsername: function(event) {
    this.setState({
      user: {
        username: event.target.value
      }
    });
  },
  handlePassword: function(event) {
    var result = zxcvbn(event.target.value);

    var warnings = result.feedback.suggestions;

    if (result.feedback.warning && result.feedback.warning !== '') {
        warnings.push(result.feedback.warning);
    }

    this.setState({
      user: {
        password: event.target.value
      },
      passwordTest: {
        style: {
          display: 'initial' // shows the results
        },
        status: result.score >= 3 ? (result.score === 4 ? 'success' : 'warning') : 'danger',
        strength : result.score,
        warnings : warnings,
        crackTime : result.crack_times_display.offline_slow_hashing_1e4_per_second
      }
    });
  },
  handlePasswordConfirm: function(event) {
    if (event.target.value === this.state.user.password && (this.state.passwordTest.status === 'success' || this.state.passwordTest.status === 'warning')) {
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
  handleSubmit: function(event) {

  },
  render: function() {
    return (
      <form>
        <Input onChange={this.handleUsername} type="text" label="Username" placeholder="Username" />
        <Input onChange={this.handlePassword} type="password" label="Password" />
        <div style={this.state.passwordTest.style}>
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
        </div>
        <div style={this.state.passwordConfirm.style}>
          <Input onChange={this.handlePasswordConfirm} bsStyle={this.state.passwordConfirm.status} type="password" label="Confirm Password" hasFeedback />
        </div>
        <ButtonInput onChange={this.handleSubmit} type="submit" value="Submit Button" />
      </form>
    );
  }
});
