"use strict";

import React from 'react';
import * as journal from 'journal';

import * as Bootstrap from 'react-bootstrap';
import formatMessage from 'format-message';
import SignIn from './edit-signin';
import Email from './edit-email';
import Phone from './edit-phone';
import Address from './edit-address';
import SelectLocale from './select-locale';
import If from '../if';
import * as merge from '../merge.jsx';


export default React.createClass({
  getInitialState: function(){
    return {
      editPassword: false,
      editLocale: false,

    };
  },
  componentDidMount: function(){

    this.subscription = journal.subscribe({
      currentUser: '#/user/current',
      // get full user details
      user: 'api/user/{currentUser._id}',
      // get email details
      emails: 'api/user/{currentUser._id}/records/email',
      phones: 'api/user/{currentUser._id}/records/phone'
    }, state => {
      this.setState(state)
    });
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  handleEditPassword: function(){
    this.setState({
      editPassword: !this.state.editPassword
    })
  },
  handleEditLocale: function() {
    this.setState({ editLocale: !this.state.editLocale })
  },
  handleEditEmail: function() {
    this.setState({ editEmail: !this.state.editEmail })
  },
  handleEditPhone: function() {
    this.setState({ editPhone: !this.state.editPhone })
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
      return (
        <Bootstrap.Row>
          <Bootstrap.Col md={8} mdOffset={1}>
            Please <a style={{cursor:'pointer'}} onClick={this.register}>register or sign-in</a> to access settings.
          </Bootstrap.Col>
        </Bootstrap.Row>
      );
    }

    if (this.state.editEmail){
      if (this.state.emails && this.state.emails.id.length){
        emails = this.state.emails.id.map(id => {
          return (
            <Email id={id} key = {id}/>
          );
        });
      }else{
        emails = <Email />
      }
    }else{
      emails = <div></div>;
    }

    return (
      <Bootstrap.Grid>
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
            <h4>
            {formatMessage({
              id: 'settings',
              default: 'Settings'
            })}
            </h4>
          </Bootstrap.Col>
        </Bootstrap.Row>
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
            <Bootstrap.Button onClick={this.handleEditLocale} bsStyle="link">
            {formatMessage({
              id: 'change_locale_button',
              default: 'Edit Locale',
              description: ''
            })}
            </Bootstrap.Button>
            <Bootstrap.Panel collapsible expanded={this.state.editLocale}>
              <SelectLocale />
            </Bootstrap.Panel>
          </Bootstrap.Col>
        </Bootstrap.Row>
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
            <Bootstrap.Button onClick={this.handleEditPassword} bsStyle="link">
            {formatMessage({
              id: 'change_signin_button',
              default: 'Edit Sign-In',
              description: 'Opens editing of username/password or other sign-in methods'
            })}
            </Bootstrap.Button>
            <Bootstrap.Panel collapsible expanded={this.state.editPassword}>
              <SignIn user={this.state.user}/>
            </Bootstrap.Panel>
          </Bootstrap.Col>
        </Bootstrap.Row>
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
            <Bootstrap.Button onClick={this.handleEditEmail} bsStyle="link">
            {formatMessage({
              id: 'change_email_button',
              default: 'Edit Email',
              description: ''
            })}
            </Bootstrap.Button>
            <Bootstrap.Panel collapsible expanded={this.state.editEmail}>
              {emails}
            </Bootstrap.Panel>
          </Bootstrap.Col>
        </Bootstrap.Row>
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
            <Bootstrap.Button onClick={this.handleEditPhone} bsStyle="link">
            {formatMessage({
              id: 'change_phone_button',
              default: 'Edit Phone',
              description: ''
            })}
            </Bootstrap.Button>
            <Bootstrap.Panel collapsible expanded={this.state.editPhone}>
              <Phone phone={this.state.phone} />
            </Bootstrap.Panel>
          </Bootstrap.Col>
        </Bootstrap.Row>
      </Bootstrap.Grid>
    );
  }
});
