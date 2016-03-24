import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';

export default React.createClass({
  render() {
    return (
      <div key={this.props.element.key}>
        {this.props.element.child.map(row => {
          return <Blot key={row.key} element={row} />;
        })}
      </div>
    );
  }
});
