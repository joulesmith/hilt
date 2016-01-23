"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import formatMessage from 'format-message';

export default React.createClass({
  getInitialState () {
    return {
      phoneSignInStep: false,
      phoneStatus : 'error'
    };
  },
  handlePhone (event) {

  },
  handleSigninStepCheckbox (event) {
    this.setState({
      phoneSignInStep: !this.state.phoneSignInStep
    });
  },
  render () {
    return (
      <div>
        <Bootstrap.Input
          onChange={this.handlePhone}
          value={this.state.phone}
          type="tel"
          label={formatMessage({
            id: 'phone_label',
            default: 'Phone',
            description: 'Label for the input box for user phone'
          })}
          bsStyle={this.state.phoneStatus}
          hasFeedback
        />
        <Bootstrap.Input
          onClick={this.handleSigninStepCheckbox}
          type="checkbox"
          label={formatMessage({
            id: 'phone_multistep_label',
            default: 'Use for multi-step Sign-In',
            description: 'Checkbox for using this phone as a step in the sign-in process.'
          })}
          checked={this.state.phoneSignInStep}
        />
        <Bootstrap.Well>
          {formatMessage({
            id: 'phone_multistep_info',
            default: 'Using a phone for a multi-step sign-in will send a sms text message with a verification code upon every future sign-in attempt. This may help keep this account more secure, or at least as secure as your phone.',
          })}
        </Bootstrap.Well>
        <Bootstrap.ButtonInput
          onClick={this.handleSubmit}
          type="button"
          value="Set Phone"
          disabled={this.state.phoneStatus !== 'success'}
        />
        {this.props.phone ? this.props.phone : 'no phone details'}
      </div>
    );
  }
});
