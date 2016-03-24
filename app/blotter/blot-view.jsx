import Text from './text-view';
import Col from './col-view';
import Row from './row-view';
import List from './list-view';

import React from 'react';
import * as Bootstrap from 'react-bootstrap';

var types = {
  text: Text,
  col: Col,
  row: Row,
  list: List
};

export default React.createClass({
  render() {

    if (!this.props.element || !this.props.element.type || !types[this.props.element.type]) {
      return <span>undefined element</span>;
    }

    return React.createElement(types[this.props.element.type], this.props);

  }
});
