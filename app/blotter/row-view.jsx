import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';

export default React.createClass({
  render() {
    return (
      <Bootstrap.Row key={this.props.value.key}>
        {this.props.value.child.map(column => {
          return <Blot key={column.key} value={column} />;
        })}
      </Bootstrap.Row>
    );
  }
});
