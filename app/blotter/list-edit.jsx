import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-edit';

export default React.createClass({
  handleAddRow() {
    var that = this;

    this.props.keygen().then(key => {
      that.props.value.child.push({
        type: 'row',
        key: key,
        child: []
      });

      if (that.props.onChange){
        that.props.onChange({
          type: 'list',
          key: that.props.value.key,
          child: that.props.value.child
        });
      }
    });
  },
  handleMoveUp(key) {
    var index = -1;
    this.props.value.child.forEach((row, i) => {
      if (row.key === key){
        index = i;
      }
    });

    if (index === 0) {
      return;
    }

    var tmp = this.props.value.child[index];
    this.props.value.child[index] = this.props.value.child[index-1];
    this.props.value.child[index-1] = tmp;

    if (this.props.onChange){
      this.props.onChange({
        type: 'list',
        key: this.props.value.key,
        child: this.props.value.child
      });
    }
  },
  handleMoveDown(key) {
    var index = -1;
    this.props.value.child.forEach((row, i) => {
      if (row.key === key){
        index = i;
      }
    });

    if (index === this.props.value.child.length-1){
      return;
    }

    var tmp = this.props.value.child[index];
    this.props.value.child[index] = this.props.value.child[index+1];
    this.props.value.child[index+1] = tmp;

    if (this.props.onChange){
      this.props.onChange({
        type: 'list',
        key: this.props.value.key,
        child: this.props.value.child
      });
    }
  },
  handleChangeRow(key, value){
    var index = -1;
    this.props.value.child.forEach((row, i) => {
      if (row.key === key){
        index = i;
      }
    });

    this.props.value.child[index] = value;

    if(this.props.onChange){
      this.props.onChange({
        type: 'list',
        key: this.props.value.key,
        child: this.props.value.child
      });
    }
  },
  handleDeleteRow(key) {
    var index = -1;
    this.props.value.child.forEach((row, i) => {
      if (row.key === key){
        index = i;
      }
    });

    this.props.value.child.splice(index, 1);

    if (this.props.onChange){
      this.props.onChange({
        type: 'list',
        key: this.props.value.key,
        child: this.props.value.child
      });
    }
  },
  handleDeleteList(event) {
    if(this.props.onDelete) {
      this.props.onDelete();
    }
  },
  render() {
    return (
      <div key={this.props.value.key}>
        <Bootstrap.ButtonGroup>
          <Bootstrap.Button onClick={this.handleAddRow} bsSize="xsmall">Add Row</Bootstrap.Button>
          <Bootstrap.Button onClick={this.handleDeleteList} bsSize="xsmall">Delete List</Bootstrap.Button>
        </Bootstrap.ButtonGroup>
        {this.props.value.child.map((row, index) => {
          return <Blot
            key={row.key}
            value={row}
            keygen={this.props.keygen}
            onMoveUp={() => {
              this.handleMoveUp(row.key);
            }}
            onMoveDown={() => {
              this.handleMoveDown(row.key);
            }}
            onChange={value => {
              this.handleChangeRow(row.key, value);
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
