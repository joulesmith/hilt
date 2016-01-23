"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import formatMessage from 'format-message';

export default React.createClass({
  getInitialState () {
    return {
      email: this.props.email ? this.props.email.email : '',
      emailSignInStep: false,
      emailStatus: 'error'
    };
  },
  handleEmail (event) {
    var email_regex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|gov|mil|biz|info|mobi|name|aero|jobs|museum)\b/;

    if (email_regex.test(event.target.value)) {
      this.setState({
        email: event.target.value,
        emailStatus: 'success'
      });
    }else{
      this.setState({
        email: event.target.value,
        emailStatus: 'error'
      });
    }
  },
  handleSigninStepCheckbox (event) {
    this.setState({
      emailSignInStep: !this.state.emailSignInStep
    });
  },
  handleSetEmail (event) {
    if (this.props.onChangeEmail) {

    }
  },
  render () {
    return (
      <div>
        <Bootstrap.Input
          onChange={this.handleEmail}
          value={this.state.email}
          type="email"
          label={formatMessage({
            id: 'email_label',
            default: 'Email',
            description: 'Label for the input box for user email'
          })}
          bsStyle={this.state.emailStatus}
          hasFeedback
        />
        <Bootstrap.Input
          onClick={this.handleSigninStepCheckbox}
          type="checkbox"
          label={formatMessage({
            id: 'email_multistep_label',
            default: 'Use for multi-step Sign-In',
            description: 'Checkbox for using this email as a step in the sign-in process.'
          })}
          checked={this.state.emailSignInStep}
        />
        <Bootstrap.Well>
          {formatMessage({
            id: 'email_multistep_info',
            default: 'Using email for a multi-step sign-in will send an email with a verification link upon every future sign-in attempt. This may help keep this account more secure, or at least as secure as your email account.',
          })}
        </Bootstrap.Well>
        <Bootstrap.ButtonInput
          onClick={this.handleSubmit}
          type="button"
          value="Set Email"
          disabled={this.state.emailStatus !== 'success'}
        />
        {this.props.email ? this.props.email.email : 'no email details'}
      </div>
    );
  }
});
