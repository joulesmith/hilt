"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import zxcvbn from 'zxcvbn';
import ErrorBody from '../error-body';

export default React.createClass({
  getInitialState: function(){
    return {
      password: '',
      passwordTest: {
        status: 'danger'
      },
      passwordConfirm: {
        status: 'error'
      },
    };
  },
  componentWillReceiveProps: function(nextProps) {
    if (this.props.password !== nextProps.password) {
      var result = zxcvbn(nextProps.password);
      var warnings = result.feedback.suggestions;

      if (result.feedback.warning && result.feedback.warning !== '') {
          warnings.push(result.feedback.warning);
      }


      this.setState({
        passwordTest: {
          status: result.score >= 3 ? (result.score === 4 ? 'success' : 'warning') : 'danger',
          strength : result.score,
          warnings : warnings,
          crackTime : result.crack_times_display.offline_slow_hashing_1e4_per_second
        }
      });

      if (nextProps.onTest) {
        nextProps.onTest(result.score);
      }
    }
  },
  render: function() {
    try{
      return (
        <div>
          <Bootstrap.ProgressBar bsStyle={this.state.passwordTest.status} active now={this.state.passwordTest.strength * 25} />
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
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
