import React from 'react';
import * as Bootstrap from 'react-bootstrap';

export default React.createClass({
  render() {
    return <Bootstrap.Image src={this.props.value.url} alt={this.props.value.description} responsive/>;
  }
});
