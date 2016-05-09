"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from 'journal';
import OAuth from 'oauth';
import Loading from '../loading';

export default React.createClass({
  getInitialState () {
    return {
    };
  },
  componentWillMount: function(){

    this.subscription = journal.subscribe({
      oauth: 'api/email/google-auth-url'
    }, state => {
      this.setState(state);
    }, this);
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  handleOAuth(code){
    var that = this;

    if(this.props.onChange) {
      journal.report({
        action: 'api/email/google-auth-token',
        data: {
          code: code
        }
      })
      .then(tokens => {
        that.props.onChange({
          target: {
            value: tokens
          }
        })
      });
    }
  },
  render () {

    if (!this.state.oauth) {
      return (
        <Loading value="Google OAuth"/>
      );
    }

    if (this.props.label) {
      return (
        <div>
          <label>{this.props.label}</label><br />
          <OAuth
            url={this.state.oauth.url}
            onOAuth={this.handleOAuth}
            src="./img/btn_google+_signin_small_transparent.png"
            alt="gmail sign-in"
          ></OAuth>
        </div>
      );
    }

    return (
      <OAuth
        url={this.state.oauth.url}
        onOAuth={this.handleOAuth}
        src="./img/btn_google+_signin_small_transparent.png"
        alt="gmail sign-in"
      ></OAuth>
    );
  }
});
