"use strict";

import React from 'react';
import * as journal from 'journal';

import * as Bootstrap from 'react-bootstrap';
import Admin from './admin';
import If from '../if';
import * as merge from '../merge.jsx';
import SigninRequired from '../signin-required.jsx';

export default React.createClass({
  getInitialState: function(){
    return {
      editPassword: false,
      editLocale: false,

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
  handleEditAdmin: function() {
    this.setState({ editAdmin: !this.state.editAdmin })
  },
  register: function() {
    journal.report({
      action: '#/modal/register',
      data: {show: true}
    });
  },
  render: function() {
    var emails;

    if (!this.state.currentUser || !this.state.currentUser._id || this.state.currentUser.guest) {
      return <SigninRequired />;
    }

    var admin;
    if (this.state.admins && this.state.admins.id.length){
      var admins = [];

      if (this.state.editAdmin) {
        admins = this.state.admins.id.map(id => {
          return (
            <Admin id={id} key={id}/>
          );
        });
      }else{
        admin = <div />;
      }

      admin = (
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
            <Bootstrap.Button onClick={this.handleEditAdmin} bsStyle="link">
              Edit Administrative Settings
            </Bootstrap.Button>
            <Bootstrap.Panel collapsible expanded={this.state.editAdmin}>
              {admins}
            </Bootstrap.Panel>
          </Bootstrap.Col>
        </Bootstrap.Row>
      );
    }else{
      admin = <div />;
    }

    return (
      <Bootstrap.Grid>
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
            <h4>
              Administrative Settings
            </h4>
          </Bootstrap.Col>
        </Bootstrap.Row>
        {admin}
      </Bootstrap.Grid>
    );
  }
});
