"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import formatMessage from 'format-message';
import * as journal from 'journal';

var email_regex = /\b[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+(?:[a-zA-Z]+)\b/;

export default React.createClass({
  getInitialState () {
    return {
      addressTmp: '',
      addressEdited: false,
      signinTmp: false,
      signinEdited: false,
      emailStatus: 'error',
      edited: false,
      processing: false
    };
  },
  componentDidMount: function(){
    this.subscription = journal.subscribe({
      email: 'api/email/{this.props.id}'
    }, state => {

      this.setState({
        email: state.email,
        addressTmp: state.email.address,
        addressEdited: false,
        signinTmp: state.email.signin,
        signinEdited: false,
        emailStatus: email_regex.test(state.email.address) ? 'success' : 'error',
        processing: false
      });
    }, this);
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  handleEmail (event) {
    if (email_regex.test(event.target.value)) {
      this.setState({
        addressTmp: event.target.value,
        emailStatus: 'success',
        addressEdited: event.target.value !== (this.state.email ? this.state.email.address : '')
      });
    }else{
      this.setState({
        addressTmp: event.target.value,
        emailStatus: 'error',
        addressEdited: event.target.value !== (this.state.email ? this.state.email.address : '')
      });
    }
  },
  handleSigninStepCheckbox (event) {
    this.setState({
      signinTmp: !this.state.signinTmp,
      signinEdited: this.state.signinTmp === (this.state.email ? this.state.email.signin : false)
    });
  },
  handleSetEmail (event) {
    var that = this;

    event.preventDefault();
    this.setState({
      processing: true
    }, () => {
      if (!that.props.id){
        // create
        journal.report({
          action: 'api/email/',
          data: {
            address: that.state.addressTmp,
            signin: that.state.signinTmp
          }
        })
        .then(email => {
          return journal.report({
            action: 'api/email/' + email.id + '/send-code'
          });
        })
        .catch(error => {
          return journal.report({
            action: '#/error',
            data: error
          });
        });
      }else {
        // update
        journal.report({
          action: 'api/email/' + that.props.id,
          data: {
            address: that.state.addressTmp,
            signin: that.state.signinTmp
          }
        })
        .catch(error => {
          return journal.report({
            action: '#/error',
            data: error
          });
        });
      }
    });

  },
  handleSendCode() {
    journal.report({
      action: 'api/email/' + this.props.id + '/send-code',
      data: {}
    });
  },
  render () {

    return (
      <form>
        <Bootstrap.Input
          onChange={this.handleEmail}
          value={this.state.addressTmp}
          type="email"
          label={formatMessage({
            id: 'email_label',
            default: 'Email',
            description: 'Label for the input box for user email'
          })}
          bsStyle={this.state.emailStatus}
          hasFeedback
          style={{backgroundColor : this.state.addressEdited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.ButtonInput
          onClick={this.handleSendCode}
          type="button"
          value={"Send Verification Code"}
        />
        <Bootstrap.Input
          onClick={this.handleSigninStepCheckbox}
          type="checkbox"
          label={<span style={{backgroundColor : this.state.signinEdited ? '#FFE5C4' : '#ffffff'}}>Use for multi-step Sign-In</span>}
          checked={this.state.signinTmp}
        />
        <Bootstrap.Well>
          {formatMessage({
            id: 'email_multistep_info',
            default: 'Using email for a multi-step sign-in will send an email with a verification link upon every future sign-in attempt. This may help keep this account more secure, or at least as secure as your email account.',
          })}
        </Bootstrap.Well>
        <Bootstrap.ButtonInput
          onClick={this.state.processing ? null : this.handleSetEmail}
          type="submit"
          value={this.state.processing ? "Processing..." : "Set Email"}
          disabled={this.state.processing || this.state.emailStatus !== 'success'}
          bsStyle={this.state.signinEdited || this.state.addressEdited ? "warning" : "default"}
        />
      </form>
    );
  }
});
