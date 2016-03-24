import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';

export default React.createClass({
  render() {
    return (
      <Bootstrap.Row key={this.props.element.key}>
        {this.props.element.child.map(column => {
          return <Blot key={column.key} element={column} />;
        })}
      </Bootstrap.Row>
    );
  }
});
