import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-edit';

export default React.createClass({
  getDefaultProps() {
    return {
      parent: null,
      element : {
        type: 'list',
        key: 0,
        child: []
      }
    };
  },
  componentWillMount() {
    this.setState({
      parent: this.props.parent,
      element: this.props.element
    });
  },
  handleAddRow(event) {
    var element = this.state.element;
    var that = this;

    this.props.keygen().then(key => {
      element.child.push({
        type: 'row',
        key: key,
        child: []
      });

      that.setState({
        element : element
      });
    });
  },
  handleMoveUp(key) {

  },
  handleMoveDown(key) {

  },
  handleDeleteRow(key) {
    var index = -1;
    this.state.element.child.forEach((row, i) => {
      if (row.key === key){
        index = i;
      }
    });

    this.state.element.child.splice(index, 1);

    this.setState({
      element: this.state.element
    });
  },
  handleDeleteList(event) {
    if(this.props.onDelete) {
      this.props.onDelete(event);
    }
  },
  render() {
    return (
      <div key={this.state.element.key}>
        <Bootstrap.ButtonGroup>
          <Bootstrap.Button onClick={this.handleDeleteList} bsSize="xsmall">Delete List</Bootstrap.Button>
          <Bootstrap.Button onClick={this.handleAddRow} bsSize="xsmall">Add Row</Bootstrap.Button>
        </Bootstrap.ButtonGroup>
        {this.state.element.child.map(row => {
          return <Blot
            key={row.key}
            element={row}
            keygen={this.props.keygen}
            onMoveUp={() => {
              this.handleMoveUp(row.key);
            }}
            onMoveDown={() => {
              this.handleMoveDown(row.key);
            }}
            onDelete={() => {
              this.handleDeleteRow(row.key);
            }}
          />;
        })}
      </div>
    );
  }
});
