import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { Router, Route, Link, browserHistory  } from 'react-router';
import Blot from './blot-edit';


export default React.createClass({
  componentWillMount: function(){
    // subscribe to a specific profile
    this.subscription = journal.subscribe({
      blotter: 'api/blotter/{this.props.params.id}'
    }, state => {
      var bs = JSON.stringify(state.blotter);

      this.setState({
        blotter: state.blotter,
        blotterString: bs,
        localBlotter: JSON.parse(bs)
      });
    }, this);
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  handleSave() {
    journal.report({
      action: 'api/blotter/' + this.props.params.id,
      data: this.state.localBlotter
    })
    .then(() => {
      this.setState({
        blotterString: JSON.stringify(this.state.localBlotter)
      });
    });
  },
  keygen() {
    var that = this;

    return new Promise(function(resolve, reject){
      var key = that.state.localBlotter.key;

      that.setState({
        localBlotter: {
          _id : that.state.localBlotter._id,
          name : that.state.localBlotter.name,
          main : that.state.localBlotter.main,
          key: key + 1
        }
      });

      resolve(key);
    });
  },
  handleChild(child) {
    this.setState({
      localBlotter: {
        _id : this.state.localBlotter._id,
        name : this.state.localBlotter.name,
        main : child,
        key: this.state.localBlotter.key
      }
    });
  },
  handleDelete() {
    this.setState({
      localBlotter: {
        _id : this.state.localBlotter._id,
        name : this.state.localBlotter.name,
        main : {},
        key: this.state.localBlotter.key
      }
    });
  },
  render() {

    if (!this.state || !this.state.localBlotter){
      return (<div></div>);
    }

    var synced = false;

    if (this.state.blotterString) {
      synced = JSON.stringify(this.state.localBlotter) === this.state.blotterString;
    }

    var saveStyle = synced ? "default" : "warning";

    return (
      <div>
        <Link to={'/blotter/' + this.state.localBlotter._id}>{this.state.localBlotter.name}</Link>
        <Bootstrap.Button onClick={this.handleSave} bsStyle={saveStyle}>Save</Bootstrap.Button>
        <Blot
          value={this.state.localBlotter.main}
          keygen={this.keygen}
          onChange={this.handleChild}
          onDelete={this.handleDelete}
        />
      </div>
    );
  }
});
