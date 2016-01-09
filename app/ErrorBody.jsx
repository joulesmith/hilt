"use strict";

import React from 'react';
import './css/bootstrap.css';

export default React.createClass({
  getInitialState: function(){
    return {
      showStack: false
    };
  },
  handleShowStack: function(){
    this.setState({showStack: !this.state.showStack});
  },
  render: function() {
    var error = this.props.error;
    if (error.message) {
      if (error.stack) {
        if (this.state.showStack) {
          return (
            <div>
              <h6>
                  <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                  <span className="sr-only">Error:</span>
                  <span> {error.message} </span>
                  <span onClick={this.handleShowStack} style={{cursor:'pointer', textDecoration:'underline'}}>details</span>
              </h6>
              <pre>{error.stack}</pre>
            </div>
          );
        }

        return (
          <h6>
              <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
              <span className="sr-only">Error:</span>
              <span> {error.message} </span>
              <span onClick={this.handleShowStack} style={{cursor:'pointer', textDecoration:'underline'}}>details</span>
          </h6>
        );
      }

      return (
        <h6>
            <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
            <span className="sr-only">Error:</span>
            <span> {error.message} </span>
        </h6>
      );
    }

    return (
      <h6>
        <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
        <span className="sr-only">Unknown Error</span>
      </h6>
    );

  }
});
