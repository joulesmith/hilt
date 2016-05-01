"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import formatMessage from 'format-message';
import * as journal from 'journal';
import editor from '../editor';
import Loading from '../loading';
import If from '../if';

var email_regex = /\b[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+(?:[a-zA-Z]+)\b/;

export default React.createClass({
  getInitialState () {
    return {
      emailStatus: 'error',
      processing: false
    };
  },
  componentWillMount: function(){
    this.editor = editor(
      // structure and labels of editable variables
      {
        address: "Email Address",
        signin: "Use for multi-step sign-in",
        verified: ''
      },
      // callback for when there are edit events
      newEmail => {
        this.setState({
          email: newEmail,
          emailStatus: email_regex.test(newEmail.address.current) ? 'success' : 'error',
        });
      }
    );

    this.subscription = journal.subscribe({
      email: 'api/email/{this.props.id}'
    }, state => {

      this.setState({
        email: this.editor.update(state.email),
        emailStatus: 'success',
        processing: false
      });

    }, this);
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
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
          data: that.editor.compile()
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
          data: that.editor.compile()
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

    if (!this.state.email) {
      return <Loading value="Email"/>;
    }

    return (
      <form>
        <Bootstrap.Input
          onChange={this.state.email.address.handler}
          value={this.state.email.address.current}
          type="email"
          label={this.state.email.address.label}
          bsStyle={this.state.emailStatus}
          hasFeedback
          style={{backgroundColor : this.state.email.address.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.ButtonInput
          onClick={this.handleSendCode}
          type="button"
          value={this.state.email.verified.current ? "Email Verified" : "Send Verification Code"}
          disabled={this.state.email.verified.current}
        />
        <Bootstrap.Input
          onClick={event => {
            this.state.email.signin.handler({
              target: {
                value: !this.state.email.signin.current
              }
            })
          }}
          type="checkbox"
          label={<span style={{backgroundColor : this.state.email.signin.edited ? '#FFE5C4' : '#ffffff'}}>{this.state.email.signin.label}</span>}
          checked={this.state.email.signin.current}
          onChange={event => {}}
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
          bsStyle={this.state.email.edited ? "warning" : "default"}
        />
      </form>
    );
  }
});
