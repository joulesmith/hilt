"use strict";

import React from 'react';
import * as journal from 'journal';

import * as Bootstrap from 'react-bootstrap';
import Admin from './admin';
import If from '../if';

import SigninRequired from '../signin-required.jsx';
import Unauthorized from '../unauthorized.jsx';
import Loading from '../loading';
import EditGoogle from './google';
import EditTwilio from './twilio';
import EditBraintree from './braintree';

export default React.createClass({
  getInitialState: function(){
    return {
    };
  },
  componentWillMount: function(){

    this.subscription = journal.subscribe({
      currentUser: '#/user/current',
      admins: 'api/user/{currentUser._id}/records/admin'
    }, state => {
      this.setState(state);
    });
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  handleEditGoogle: function() {
    this.setState({ editGoogle: !this.state.editGoogle })
  },
  handleEditTwilio: function() {
    this.setState({ editTwilio: !this.state.editTwilio })
  },
  handleEditBraintree: function() {
    this.setState({ editBraintree: !this.state.editBraintree })
  },
  render: function() {
    var emails;

    if (!this.state.currentUser || !this.state.currentUser._id || this.state.currentUser.guest) {
      return <SigninRequired value='Settings' />;
    }

    if (!this.state.admins) {
      return <Loading value="Admin"/>;
    }


    if (this.state.admins.id.length === 0) {
      return <Unauthorized value="Site Settings" />
    }

    var admins = this.state.admins.id.map(id => {
      var google, twilio, braintree;

      if (this.state.editGoogle) {
        google = <EditGoogle id={id} />;
      }else{
        google = <div />;
      }

      if (this.state.editTwilio) {
        twilio = <EditTwilio id={id} />;
      }else{
        twilio = <div />;
      }

      if (this.state.editBraintree) {
        braintree = <EditBraintree id={id} />;
      }else{
        braintree = <div />;
      }

      return (
        <Bootstrap.Grid key={id} >
          <Bootstrap.Row>
            <Bootstrap.Col xs={12} md={8} mdOffset={2}>
              <h4>
                Site Settings
              </h4>
            </Bootstrap.Col>
          </Bootstrap.Row>
          <Bootstrap.Row>
            <Bootstrap.Col xs={12} md={8} mdOffset={2}>
              <Bootstrap.Button onClick={this.handleEditGoogle} bsStyle="link">
                Edit Google
              </Bootstrap.Button>
              <Bootstrap.Panel collapsible expanded={this.state.editGoogle}>
                {google}
              </Bootstrap.Panel>
            </Bootstrap.Col>
          </Bootstrap.Row>
          <Bootstrap.Row>
            <Bootstrap.Col xs={12} md={8} mdOffset={2}>
              <Bootstrap.Button onClick={this.handleEditTwilio} bsStyle="link">
                Edit Twilio
              </Bootstrap.Button>
              <Bootstrap.Panel collapsible expanded={this.state.editTwilio}>
                {twilio}
              </Bootstrap.Panel>
            </Bootstrap.Col>
          </Bootstrap.Row>
          <Bootstrap.Row>
            <Bootstrap.Col xs={12} md={8} mdOffset={2}>
              <Bootstrap.Button onClick={this.handleEditBraintree} bsStyle="link">
                Edit Braintree
              </Bootstrap.Button>
              <Bootstrap.Panel collapsible expanded={this.state.editBraintree}>
                {braintree}
              </Bootstrap.Panel>
            </Bootstrap.Col>
          </Bootstrap.Row>
        </Bootstrap.Grid>
      );
    });

    return (
      <div>{admins}</div>
    );

  }
});
