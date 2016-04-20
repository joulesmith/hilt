"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from 'journal';
import editor from '../editor';

export default React.createClass({
  getInitialState () {
    return {
    };
  },
  componentWillMount: function(){

    this.subscription = journal.subscribe({
      admin: 'api/admin/{this.props.id}',
      api: 'api'
    }, state => {
      if (!this.settingsEditor) {
        this.settingsEditor = editor(newSettings => {
          this.setState({
            settings: newSettings
          });
        });
      }

      if (state.admin) {
        this.setState({
          settings: this.settingsEditor.update(state.admin.settings),
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

    var settings = this.settingsEditor.compile();

    journal.report({
      action: 'api/admin/' + this.props.id + '/configure/',
      data: {
        settings: settings
      }
    });
  },
  render () {
    if (!this.state.settings || !this.state.api) {
      return (
        <div>Loading Admin Settings</div>
      );
    }

    return (
      <form>
        <Bootstrap.Input
          onChange={this.state.settings.user.clientId.handler}
          value={this.state.settings.user.clientId.current}
          type="text"
          label={this.state.api.user.settings.clientId}
          placeholder={this.state.settings.user.clientId.original}
          style={{backgroundColor : this.state.settings.user.clientId.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.Input
          onChange={this.state.settings.user.clientSecret.handler}
          value={this.state.settings.user.clientSecret.current}
          type="text"
          label={this.state.api.user.settings.clientSecret}
          placeholder={this.state.settings.user.clientSecret.original}
          style={{backgroundColor : this.state.settings.user.clientSecret.edited ? '#FFE5C4' : '#ffffff'}}
        />
        <Bootstrap.Input
          onChange={this.state.settings.email.fromAddress.handler}
          value={this.state.settings.email.fromAddress.current}
          type="text"
          label={this.state.api.email.settings.fromAddress}
          placeholder={this.state.settings.email.fromAddress.original}
          style={{backgroundColor : this.state.settings.email.fromAddress.edited ? '#FFE5C4' : '#ffffff'}}
        />
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
