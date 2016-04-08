import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-view';

export default React.createClass({
  render() {
    return (
      <div key={this.props.value.key}>
        {this.props.value.child.map(row => {
          return <Blot key={row.key} value={row} />;
        })}
      </div>
    );
  }
});
