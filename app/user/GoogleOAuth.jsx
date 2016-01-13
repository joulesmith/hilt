"use strict";

import React from 'react';
import * as journal from '../journal';

export default React.createClass({
  getInitialState: function(){
    return {
    };
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
      <span onClick={this.handleGoogleOAuth} className="btn btn-default">
          <img src="./img/btn_google+_signin_small_transparent.png" alt="google plus sing-in" style={{display: 'inline-block'}}></img>
      </span>
    );
  }
});
