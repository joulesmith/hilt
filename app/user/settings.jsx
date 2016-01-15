"use strict";

import React from 'react';
import * as journal from 'journal';

import * as Bootstrap from 'react-bootstrap';
import formatMessage from 'format-message';
import Password from './password';
import Email from './email';
import Phone from './phone';
import Address from './address';
import SelectLocale from '../select-locale';
import If from '../if';

export default React.createClass({
  getInitialState: function(){
    return {
      editPassword: false
    };
  },
  componentDidMount: function(){
    /*
    this.unsubscribe = journal.subscribe({
      user: '#/user/current',
      contact: 'api/model/contact/{user._id}'
    }, state => {
      this.setState(state)
    });*/
  },
  componentWillUnmount: function(){
    //this.unsubscribe();
  },
  handleChangeEmail: function() {
    /*journal.report({
      action: 'api/model/contact/' + this.state.user._id + '/update',
      data: {
        email: this.state.email
      }
    });*/
  },
  handleEditPassword: function(){
    this.setState({
      editPassword: !this.state.editPassword
    })
  },
  render: function() {

    return (
      <Bootstrap.Grid>
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
            <h4>Settings</h4>
          </Bootstrap.Col>
        </Bootstrap.Row>
        <Bootstrap.Row>
          <Bootstrap.Col xs={12} md={8} mdOffset={2}>
             <Bootstrap.ListGroup>
             <Bootstrap.ListGroupItem>
               <SelectLocale />
             </Bootstrap.ListGroupItem>
              <Bootstrap.ListGroupItem>
                <Bootstrap.Button onClick={this.handleEditPassword}>
                  {formatMessage({
                    id: 'change_signin_button',
                    default: 'Sign-In Options',
                    description: 'Opens editing of username/password or other sign-in methods'
                  })}
                  </Bootstrap.Button>
                <If condition={this.state.editPassword}>
                  <Password oldPassword={true} newPassword={true} userId={'sadasdasd'}/>
                </If>
              </Bootstrap.ListGroupItem>
              <Bootstrap.ListGroupItem>
                <Email />
              </Bootstrap.ListGroupItem>
              <Bootstrap.ListGroupItem>
                <Phone />
              </Bootstrap.ListGroupItem>
              <Bootstrap.ListGroupItem>
                <Address />
              </Bootstrap.ListGroupItem>
             </Bootstrap.ListGroup>
          </Bootstrap.Col>
        </Bootstrap.Row>
      </Bootstrap.Grid>
    );
  }
});
