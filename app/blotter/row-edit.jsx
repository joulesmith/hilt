import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-edit';
import {merge, compare} from '../object-util';
import ErrorBody from '../error-body';

export default React.createClass({
  handleAddColumn() {
    var that = this;

    this.props.keygen().then(key => {
      that.props.value.child.push({
        type: 'col',
        key: key,
        width: 1,
        offset: 0,
        child: {}
      });

      if (that.props.onChange){
        that.props.onChange({
          child: that.props.value.child
        });
      }
    });
  },
  handleMoveUp(event) {
    if (this.props.onMoveUp) {
      this.props.onMoveUp();
    }
  },
  handleMoveDown(event) {
    if (this.props.onMoveDown) {
      this.props.onMoveDown();
    }
  },
  handleMoveLeft(key) {
    var index = -1;
    this.props.value.child.forEach((col, i) => {
      if (col.key === key){
        index = i;
      }
    });

    if (index === 0) {
      return;
    }

    // TODO: the column offsets may need to change to make the changes smoother
    var tmp = this.props.value.child[index];
    this.props.value.child[index] = this.props.value.child[index-1];
    this.props.value.child[index-1] = tmp;

    if (this.props.onChange){
      this.props.onChange({
        child: this.props.value.child
      });
    }
  },
  handleMoveRight(key) {
    var index = -1;
    this.props.value.child.forEach((col, i) => {
      if (col.key === key){
        index = i;
      }
    });

    if (index === this.props.value.child.length-1) {
      return;
    }

    var tmp = this.props.value.child[index];
    this.props.value.child[index] = this.props.value.child[index+1];
    this.props.value.child[index+1] = tmp;

    if (this.props.onChange){
      this.props.onChange({
        child: this.props.value.child
      });
    }
  },
  handleChangeColumn(key, value){
    var index = -1;
    this.props.value.child.forEach((col, i) => {
      if (col.key === key){
        index = i;
      }
    });

    this.props.value.child[index] = merge(this.props.value.child[index], value);

    if(this.props.onChange){
      this.props.onChange({
        child: this.props.value.child
      });
    }
  },
  handleDeleteColumn(key) {
    var index = -1;
    this.props.value.child.forEach((col, i) => {
      if (col.key === key){
        index = i;
      }
    });

    this.props.value.child.splice(index, 1);

    if(this.props.onChange){
      this.props.onChange({
        child: this.props.value.child
      });
    }
  },
  handleDeleteRow () {
    if (this.props.onDelete) {
      this.props.onDelete();
    }
  },
  render() {
    try{
      return (
        <div key={this.props.value.key} style={{width:'100%'}}>
          <table style={{width:'100%'}}>
            <tbody>
            <tr>
              <td style={{width:'50px'}}>
                <Bootstrap.ButtonGroup vertical>
                  <Bootstrap.Button onClick={this.handleMoveUp} bsSize="xsmall"><span className="glyphicon glyphicon-arrow-up" /></Bootstrap.Button>
                  <Bootstrap.Button onClick={this.handleMoveDown} bsSize="xsmall"><span className="glyphicon glyphicon-arrow-down" /></Bootstrap.Button>
                  <Bootstrap.Button onClick={this.handleAddColumn} bsSize="xsmall"><span className="glyphicon glyphicon-plus" /></Bootstrap.Button>
                  <Bootstrap.Button onClick={this.handleDeleteRow} bsSize="xsmall"><span className="glyphicon glyphicon-remove" /></Bootstrap.Button>
                </Bootstrap.ButtonGroup>
              </td>
              <td style={{minHeight: '200px', border: '4px outset'}}>
                <Bootstrap.Row>
                  {this.props.value.child.map(column => {
                    return <Blot
                      key={column.key}
                      value={column}
                      keygen={this.props.keygen}
                      onMoveLeft={() => {
                        this.handleMoveLeft(column.key);
                      }}
                      onMoveRight={() => {
                        this.handleMoveRight(column.key);
                      }}
                      onChange={value => {
                        this.handleChangeColumn(column.key, value);
                      }}
                      onDelete={() => {
                        this.handleDeleteColumn(column.key);
                      }}
                    />;
                  })}
                </Bootstrap.Row>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
