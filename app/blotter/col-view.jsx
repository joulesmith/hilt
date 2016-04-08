import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';

export default React.createClass({
  render() {
    return (
      <Bootstrap.Col key={this.props.value.key} md={this.props.value.width} mdOffset={this.props.value.offset}>
        <Blot value={this.props.value.child} />
      </Bootstrap.Col>
    );
  }
});
