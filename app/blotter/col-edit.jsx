import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-edit';
import {merge, compare} from '../object-util';
import ErrorBody from '../error-body';

export default React.createClass({
  handleMoveLeft(event) {
    if (this.props.onMoveLeft) {
      this.props.onMoveLeft(event);
    }
  },
  handleMoveRight(event) {
    if (this.props.onMoveRight) {
      this.props.onMoveRight(event);
    }
  },
  handleDeleteColumn() {
    if (this.props.onDelete) {
      this.props.onDelete();
    }
  },
  handleChild(child) {
    if(this.props.onChange){
      this.props.onChange({
        child: merge(this.props.value.child, child)
      });
    }
  },
  handleDeleteChild(){
    if(this.props.onChange){
      this.props.onChange({
        child: {}
      });
    }
  },
  handleWidth(event, eventKey){
    if(this.props.onChange){
      this.props.onChange({
        width:  parseInt(eventKey)
      });
    }
  },
  handleOffset(event, eventKey){
    if(this.props.onChange){
      this.props.onChange({
        offset: parseInt(eventKey)
      });
    }
  },
  render() {
    try{
      return (
        <Bootstrap.Col key={this.props.value.key} md={this.props.value.width} mdOffset={this.props.value.offset}>
          <Bootstrap.ButtonGroup>
            <Bootstrap.Button onClick={this.handleMoveLeft} bsSize="xsmall"><span className="glyphicon glyphicon-arrow-left" /></Bootstrap.Button>
            <Bootstrap.Button onClick={this.handleMoveRight} bsSize="xsmall"><span className="glyphicon glyphicon-arrow-right" /></Bootstrap.Button>
            <Bootstrap.DropdownButton
              title={"# " + this.props.value.width}
              id="width-menu"
              onSelect={this.handleWidth}
              bsSize="xsmall"
            >
              <Bootstrap.MenuItem eventKey="1">1</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="2">2</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="3">3</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="4">4</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="5">5</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="6">6</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="7">7</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="8">8</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="9">9</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="10">10</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="11">11</Bootstrap.MenuItem>
              <Bootstrap.MenuItem eventKey="12">12</Bootstrap.MenuItem>
            </Bootstrap.DropdownButton>
            <Bootstrap.Button onClick={this.handleDeleteColumn} bsSize="xsmall"><span className="glyphicon glyphicon-remove" /></Bootstrap.Button>
          </Bootstrap.ButtonGroup>
          <div style={{border: '2px dotted', 'borderRadius': '10px'}}>
            <Blot
              value={this.props.value.child}
              keygen={this.props.keygen}
              onChange={this.handleChild}
              onDelete={this.handleDeleteChild}
            />
          </div>
        </Bootstrap.Col>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
