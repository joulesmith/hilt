"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from 'journal';
import editor from '../editor';
import ErrorBody from '../error-body';
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
    try{
      if (!this.state.settings) {
        return (
          <div>Loading Braintree Settings</div>
        );
      }

      return (
        <form>
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
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
