import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { Router, Route, Link, browserHistory  } from 'react-router';
import Blot from './blot-edit';


export default React.createClass({
  getInitialState: function(){
    return {
      blotter: {
        name : '',
        main : {}
      },
      key : 0
    };
  },
  componentWillMount: function(){
    // subscribe to a specific profile
    journal.get({
      blotter: 'api/blotter/{this.props.params.id}'
    }, state => {
      this.setState({
        blotter: state.blotter,
        key: state.blotter.key
      });
    }, this);
  },
  handleSave() {

    journal.report({
      action: 'api/blotter/' + this.props.params.id,
      data: this.state.blotter
    });
  },
  keygen() {
    var that = this;

    return new Promise(function(resolve, reject){
      var key = that.state.key;

      that.setState({
        key: key + 1
      });

      resolve(key);
    });
  },
  handleChange(main) {
    this.state.blotter.main = main;

    this.setState({
      blotter: this.state.blotter
    });
  },
  handleDelete() {
    this.state.blotter.main = {};

    this.setState({
      blotter: this.state.blotter
    });
  },
  render() {

    return (
      <div>
        <Link to={'/blotter/' + this.state.blotter._id}>{this.state.blotter.name}</Link>
        <Bootstrap.Button onClick={this.handleSave}>Save</Bootstrap.Button>
        <Blot
          element={this.state.blotter.main}
          keygen={this.keygen}
          onChange={this.handleChange}
          onDelete={this.handleDelete}
        />
      </div>
    );
  }
});
