import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';

export default React.createClass({
  render() {
    return (
      <Bootstrap.Col key={this.props.element.key} xs={this.props.element.width} xsOffset={this.props.element.offset}>
        <Blot element={this.props.element.child} />
      </Bootstrap.Col>
    );
  }
});
