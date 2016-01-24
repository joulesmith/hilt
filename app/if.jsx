"use strict";

import React from 'react';

export default React.createClass({
  render: function() {
    if (this.props.condition){
      return <div>{this.props.children}</div>;
    }

    return <div></div>;
  }
});
