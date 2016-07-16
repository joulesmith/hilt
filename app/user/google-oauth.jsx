"use strict";

import React from 'react';
import * as journal from '../journal';
import ErrorBody from '../error-body';

export default React.createClass({
  getInitialState: function(){
    return {
    };
  },
  handleGoogleOAuth: function(event) {
    var that = this;
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

      if (that.props && that.props.onOAuth) {
        // custom callback to get code
        that.props.onOAuth(code);
      }else{
        // default action is to use the code to log in
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
      }
    };

    journal.get({
      google: 'api/user/google-auth-url'
    }, state => {
      // open child window to oauth url and give focus.
      var childWindow = window.open(state.google.url);
      childWindow.focus();
    });
  },
  render: function() {
    try{
      return (
        <span onClick={this.handleGoogleOAuth} className="btn btn-default">
            <img src="./img/btn_google+_signin_small_transparent.png" alt="google plus sing-in" style={{display: 'inline-block'}}></img>
        </span>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
