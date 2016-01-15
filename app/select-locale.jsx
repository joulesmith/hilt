"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import formatMessage from 'format-message';
import * as journal from 'journal';

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

  },
  render: function() {
    return (
      <div>
        <Bootstrap.Input value={this.state.locale} onChange={this.handleLocale} type="select" label="Language">
          <option value="en-US">English</option>
          <option value="fr">French</option>
        </Bootstrap.Input>
        <Bootstrap.Button onClick={this.handleSetLocale} >
        {formatMessage({
          id: 'change_locale_button',
          default: 'Change Language',
          description: 'Changes the localization used in the app to what is selected.'
        })}
        </Bootstrap.Button>
      </div>
    );
  }
});
