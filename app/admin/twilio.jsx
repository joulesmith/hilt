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
        <div>Loading Twilio Settings</div>
      );
    }

    return (
      <form>
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
