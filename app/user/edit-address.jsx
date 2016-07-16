"use strict";

import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import ErrorBody from '../error-body';

export default React.createClass({
  render: () => {
    try{
      return (
        <div>Address</div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
