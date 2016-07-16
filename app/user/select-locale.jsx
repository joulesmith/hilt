"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import formatMessage from 'format-message';
import * as journal from 'journal';
import ErrorBody from '../error-body';

export default React.createClass({
  getInitialState: function() {
    return {
      locale: 'en-US'
    }
  },
  handleLocale: function(event) {
    this.setState({
      locale: event.target.value
    });
  },
  handleSetLocale: function(event) {
    journal.report({
      action: '#/locale',
      data: {
        locale: this.state.locale
      }
    });

    if (this.props.onChangeLocale) {
      this.props.onChangeLocale(this.state.locale);
    }

  },
  render: function() {
    try{
      return (
        <div>
          <Bootstrap.Input value={this.state.locale} onChange={this.handleLocale} type="select" label="Language">
            <option value="en-US">English</option>
            <option value="fr">French</option>
          </Bootstrap.Input>
          <Bootstrap.Button onClick={this.handleSetLocale} >
          {formatMessage({
            id: 'change_locale_button',
            default: 'Set Language',
            description: 'Changes the localization used in the app to what is selected.'
          })}
          </Bootstrap.Button>
        </div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
