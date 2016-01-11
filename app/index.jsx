import React from 'react';
import { Router, Route, Link, browserHistory  } from 'react-router';

import Navbar from 'Navbar';
import RegisterModal from './user/RegisterModal';

export default React.createClass({
  render() {

    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});
