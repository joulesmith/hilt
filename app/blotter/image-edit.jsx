import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import Blot from './blot-edit';
import {merge, compare} from '../object-util';

export default React.createClass({
  handleUrl(event){
    if(this.props.onChange){
      this.props.onChange({
        url: event.target.value
      });
    }
  },
  handleDescription(event){
    if(this.props.onChange){
      this.props.onChange({
        description: event.target.value
      });
    }
  },
  handleDelete(event){
    if (this.props.onDelete) {
      this.props.onDelete();
    }
  },
  render() {
    return (
      <div>
        <Bootstrap.Input
          type='text'
          value={this.props.value.url}
          onChange={this.handleUrl}
          label='Image URL'
        />
        <Bootstrap.Input
          type='text'
          value={this.props.value.description}
          onChange={this.handleDescription}
          label='Image Description'
        />
        <Bootstrap.Button onClick={this.handleDelete} bsSize="xsmall"><span className="glyphicon glyphicon-remove" /></Bootstrap.Button>
        <Bootstrap.Image src={this.props.value.url} alt={this.props.value.description} responsive/>
      </div>
    );
  }
});
