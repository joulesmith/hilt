"use strict";

import http from 'axios';
import React from 'react';
import Radium from 'radium';
import * as Bootstrap from 'react-bootstrap';
import {report, subscribe} from 'journal';
import { hashHistory } from 'react-router';
import formatMessage from 'format-message';

export default React.createClass({
  getInitialState: function(){
    return {
      user: {
        username: 'no user'
      }
    };
  },
  componentWillMount: function(){
    this.subscription = subscribe({
      user: '#/user/current',
      admins: 'api/user/{user._id}/records/admin'
    }, state => {
      this.setState(state);
    });
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  register: function() {

    report({
      action: '#/modal/register',
      data: {show: true}
    });
  },
  logout: function() {
    report({
      action: '#/user/logout',
      data: {}
    });
  },
  admin() {
    hashHistory.push('admin-settings');
  },
  render: function() {

    var links;

    if (this.props.links){
      links = this.props.links.map((link, index) => {
        return <Bootstrap.NavItem key={index} href={link.href}>{link.name}</Bootstrap.NavItem>;
      });
    }else{
      links = [];
    }

    var userlinks;

    if (this.props.userlinks && this.state.user._id && !this.state.user.guest){
      userlinks = this.props.userlinks.map((link, index) => {
        return <Bootstrap.NavItem key={index} href={link.href}>{link.name}</Bootstrap.NavItem>;
      });
    }else{
      userlinks = [];
    }

    return (
      <Bootstrap.Navbar>
        <Bootstrap.Navbar.Header>
          {(brand => {
            if (brand){
              if (brand.imageUrl) {return (
                <Bootstrap.Navbar.Brand>
                  <a href={brand.url}>
                    <img src={brand.imageUrl} alt={brand.name} style={{height: '100%'}}/>
                  </a>
                </Bootstrap.Navbar.Brand>
              );}

              return (
                <Bootstrap.Navbar.Brand>
                  <a href={brand.url}>
                    {brand.name}
                  </a>
                </Bootstrap.Navbar.Brand>
              );
            }
          })(this.props.brand)}
          <Bootstrap.Navbar.Toggle/>
        </Bootstrap.Navbar.Header>
        <Bootstrap.Navbar.Collapse>
          <Bootstrap.Nav>
            {links}
            {userlinks}
          </Bootstrap.Nav>
          <Bootstrap.Nav pullRight>
            <Bootstrap.NavDropdown
              title="Account"
              id="basic-nav-dropdown"
            >
              {(() => {
                if (this.state.user._id && !this.state.user.guest) {
                  var menuItems;

                  if (this.props.usermenu){
                    menuItems = this.props.usermenu.map(function(item, index){
                      if (item.href){
                        return (
                          <Bootstrap.MenuItem key={index} href={item.href}>
                            {item.name}
                          </Bootstrap.MenuItem>
                        );
                      }else if(item.handler){
                        return (
                          <Bootstrap.MenuItem key={index} onSelect={item.handler}>
                            {item.name}
                          </Bootstrap.MenuItem>
                        );
                      }

                      return (
                        <Bootstrap.MenuItem key={index}>
                          {item.name}
                        </Bootstrap.MenuItem>
                      );
                    });
                  }else{
                    menuItems = [];
                  }

                  menuItems.push(
                    <Bootstrap.MenuItem key="-1" href='#/settings'>
                    {formatMessage({
                      id: 'settings_menu_button',
                      default: 'Settings'
                    })}
                    </Bootstrap.MenuItem>
                  );

                  if (this.state.admins && this.state.admins.id.length > 0) {
                    menuItems.push(
                      <Bootstrap.MenuItem key="-2" onSelect={this.admin}>
                      {formatMessage({
                        id: 'admin_menu_button',
                        default: 'Site Admin'
                      })}
                      </Bootstrap.MenuItem>
                    );
                  }

                  menuItems.push(
                    <Bootstrap.MenuItem key="-3" onSelect={this.logout}>
                    {formatMessage({
                      id: 'logout_menu_button',
                      default: 'Logout'
                    })}
                    </Bootstrap.MenuItem>
                  );

                  return menuItems;
                }

                return [
                  <Bootstrap.MenuItem key="0" onSelect={this.register}>
                  {formatMessage({
                    id: 'register_menu_button',
                    default: 'Register/Sign-In'
                  })}
                  </Bootstrap.MenuItem>
                ];
              })()}
            </Bootstrap.NavDropdown>
          </Bootstrap.Nav>
        </Bootstrap.Navbar.Collapse>
      </Bootstrap.Navbar>
    );
  }
});
