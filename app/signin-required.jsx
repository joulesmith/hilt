"use strict";

import React from 'react';
import * as journal from 'journal';
import * as Bootstrap from 'react-bootstrap';

export default React.createClass({
  register: function() {
    journal.report({
      action: '#/modal/register',
      data: {show: true}
    });
  },
  render: function() {

    return (
      <Bootstrap.Row>
        <Bootstrap.Col md={8} mdOffset={1}>
          Please <a style={{cursor:'pointer'}} onClick={this.register}>register or sign-in</a> to access settings.
        </Bootstrap.Col>
      </Bootstrap.Row>
    );
  }
});
