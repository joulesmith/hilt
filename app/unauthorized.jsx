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
    try{
      return (
        <Bootstrap.Row>
          <Bootstrap.Col xs={8} xsOffset={1}>
            <div>
              <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span><span>&emsp;</span>
              <span>The account signed in does not have access to {this.props.value}.</span>
            </div>
          </Bootstrap.Col>
        </Bootstrap.Row>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
