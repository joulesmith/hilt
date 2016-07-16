"use strict";

import React from 'react';
import * as journal from 'journal';
import * as Bootstrap from 'react-bootstrap';
import ErrorBody from 'error-body';

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
              <span>Please <a style={{cursor:'pointer'}} onClick={this.register}>register or sign-in</a> to access {this.props.value}.</span>
            </div>
          </Bootstrap.Col>
        </Bootstrap.Row>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
