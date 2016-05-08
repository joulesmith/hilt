"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from 'journal';
import editor from '../editor';

import Gmail from './gmail';
import PhoneNumber from '../format/phone-number';

export default React.createClass({
  getInitialState () {
    return {
    };
  },
  componentWillMount: function(){
    this.settingsEditor = editor({
      // structure and labels of editable variables
      form: {
        user: {
          clientId: "Google Client ID",
          clientSecret: "Google Client Secret"
        },
        email: {
          gmail: "Gmail Account"
        },
        phone: {
          accountSid: 'Account SID',
          authToken: 'Auth Token',
          number: 'Phone Number'
        },
        payment: {
          sandbox : "Use Sandbox Environment",
          merchantId: 'Merchant ID',
          publicKey: 'Public Key',
          privateKey: 'Private Key'
        }
      },
      // callback for when there are edit events
      handler: newSettings => {
        this.setState({
          settings: newSettings
        });
      }
    });

    this.settingsEditor.update();

    this.subscription = journal.subscribe({
      admin: 'api/admin/{this.props.id}'
    }, state => {
      if (state.admin) {
        this.settingsEditor.update(state.admin.settings);

        this.setState({
          processing: false
        });
      }else{
        this.setState(state);
      }
    }, this);
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  handleSetConfiguration(event){
    event.preventDefault();

    // compile the edited object into pure object with current values
    var settings = this.settingsEditor.compile();

    journal.report({
      action: 'api/admin/' + this.props.id + '/configure/',
      data: {
        settings: settings
      }
    });
  },
  render () {

    if (!this.state.settings) {
      return (
        <div>Loading Admin Settings</div>
      );
    }

    return (
      <form>
        <h4>Google API</h4>
        <Bootstrap.Input
          onChange={this.state.settings.user.clientId.handler}
          value={this.state.settings.user.clientId.current}
          type="text"
          label={this.state.settings.user.clientId.label}
          placeholder={this.state.settings.user.clientId.original}
          style={{backgroundColor : this.state.settings.user.clientId.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.Input
          onChange={this.state.settings.user.clientSecret.handler}
          value={this.state.settings.user.clientSecret.current}
          type="text"
          label={this.state.settings.user.clientSecret.label}
          placeholder={this.state.settings.user.clientSecret.original}
          style={{backgroundColor : this.state.settings.user.clientSecret.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Gmail
          onChange={this.state.settings.email.gmail.handler}
          value={this.state.settings.email.gmail.current}
          type="text"
          label={this.state.settings.email.gmail.label}
          placeholder={this.state.settings.email.gmail.original}
          style={{backgroundColor : this.state.settings.email.gmail.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <h4>Twilio API</h4>
        <Bootstrap.Input
          onChange={this.state.settings.phone.accountSid.handler}
          value={this.state.settings.phone.accountSid.current}
          type="text"
          label={this.state.settings.phone.accountSid.label}
          placeholder={this.state.settings.phone.accountSid.original}
          style={{backgroundColor : this.state.settings.phone.accountSid.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.Input
          onChange={this.state.settings.phone.authToken.handler}
          value={this.state.settings.phone.authToken.current}
          type="text"
          label={this.state.settings.phone.authToken.label}
          placeholder={this.state.settings.phone.authToken.original}
          style={{backgroundColor : this.state.settings.phone.authToken.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <PhoneNumber
          onChange={this.state.settings.phone.number.handler}
          value={this.state.settings.phone.number.current}
          label={this.state.settings.phone.number.label}
          style={{backgroundColor : this.state.settings.phone.number.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <h4>Braintree API</h4>
        <Bootstrap.Input
          onChange={this.state.settings.payment.merchantId.handler}
          value={this.state.settings.payment.merchantId.current}
          type="text"
          label={this.state.settings.payment.merchantId.label}
          placeholder={this.state.settings.payment.merchantId.original}
          style={{backgroundColor : this.state.settings.payment.merchantId.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.Input
          onChange={this.state.settings.payment.publicKey.handler}
          value={this.state.settings.payment.publicKey.current}
          type="text"
          label={this.state.settings.payment.publicKey.label}
          placeholder={this.state.settings.payment.publicKey.original}
          style={{backgroundColor : this.state.settings.payment.publicKey.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.Input
          onChange={this.state.settings.payment.privateKey.handler}
          value={this.state.settings.payment.privateKey.current}
          type="password"
          label={this.state.settings.payment.privateKey.label}
          placeholder={this.state.settings.payment.privateKey.original}
          style={{backgroundColor : this.state.settings.payment.privateKey.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.Input
          onClick={event => {
            this.state.settings.payment.sandbox.handler(!this.state.settings.payment.sandbox.current)
          }}
          type="checkbox"
          label={<span style={{backgroundColor : this.state.settings.payment.sandbox.edited ? '#FFE5C4' : '#ffffff'}}>{this.state.settings.payment.sandbox.label}</span>}
          checked={this.state.settings.payment.sandbox.current}
          onChange={event => {}}
        />
        <hr />
        <Bootstrap.ButtonInput
          onClick={this.state.processing ? null : this.handleSetConfiguration}
          type="submit"
          value={this.state.processing ? "Processing..." : "Set Configuration"}
          disabled={this.state.processing}
          bsStyle={this.state.settings.edited ? "warning" : "default"}
        />
      </form>
    );
  }
});
