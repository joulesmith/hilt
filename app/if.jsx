"use strict";

import React from 'react';
import ErrorBody from 'error-body';

export default React.createClass({
  render: function() {
    try{
      if (this.props.condition){
        return <div>{this.props.children}</div>;
      }

      return <div></div>;
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
