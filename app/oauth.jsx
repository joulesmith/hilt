"use strict";

import React from 'react';
import ErrorBody from 'error-body';

export default React.createClass({
  getInitialState: function(){
    return {
    };
  },
  handleOAuth: function(event) {
    if (!this.props.url) {
      throw new Error("OAuth url was not given");
    }

    var that = this;
    // attach a callback function to this window which can be used to send back
    // the google oauth code
    window.oauthCallback = function(err, code) {
      // when the callback is called, remove callback from window
      // therefore the callback can only be called once
      // (unless another copy was made before it is called)
      delete window.oauthCallback;
      // bring focus back to original window
      window.focus();

      if (err && err !== '') {
        return journal.report({
          action: '#/error',
          data: err // is err the right kind of Error?
        });
      }

      if (that.props && that.props.onOAuth) {
        // custom callback to get code
        that.props.onOAuth(code);
      }
    };

    var childWindow = window.open(this.props.url);
    childWindow.focus();
  },
  render: function() {
    try{
      return (
        <span onClick={this.handleOAuth} className="btn btn-default">
            <img src={this.props.src || ''} alt={this.props.alt || 'oauth'} style={{display: 'inline-block'}}></img>
        </span>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
