import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { Router, Route, Link, hashHistory  } from 'react-router';
import Blot from './blot-edit';
import {merge, compare} from '../object-util';
import FileUpload from '../file-upload';
import ConfirmReport from '../confirm-report-modal';
import SigninRequired from '../signin-required';
import ReportButton from '../report-button'

export default React.createClass({
  componentWillMount: function(){
    // subscribe to a specific profile
    this.subscription = journal.subscribe({
      blotter: 'api/blotter/{this.props.params.id}'
    }, state => {
      var bs = JSON.stringify(state.blotter);

      this.setState({
        blotter: state.blotter,
        localBlotter: JSON.parse(bs)
      });
    }, this);
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  keygen() {
    var that = this;

    return new Promise(function(resolve, reject){
      var key = that.state.localBlotter.key;

      that.setState({
        localBlotter: merge(that.state.localBlotter, {
          key: key + 1
        })
      });

      resolve(key);
    });
  },
  handleChild(child) {
    this.setState({
      localBlotter: merge(this.state.localBlotter, {
        main : merge(this.state.localBlotter.main, child)
      })
    });
  },
  handleDelete() {
    this.setState({
      localBlotter: merge(this.state.localBlotter, {
        main : {}
      })
    });
  },
  handleFileUpload(result){
    this.state.localBlotter.files.push(result);
    this.setState({
      localBlotter: merge(this.state.localBlotter, {
        files : this.state.localBlotter.files
      })
    });
  },
  handleDeleteFile(file){
    var index = -1;
    this.state.localBlotter.files.forEach((f,i) => {
      if (file._id === f._id){
        index = i;
      }
    });

    this.state.localBlotter.files.splice(index,1);
    this.setState({
      localBlotter: merge(this.state.localBlotter, {
        files : this.state.localBlotter.files
      })
    });
  },
  render() {

    if (!this.state || !this.state.localBlotter){
      return (<div></div>);
    }

    var synced = false;

    synced = compare(this.state.localBlotter, this.state.blotter);

    var saveStyle = synced ? "default" : "warning";

    return (
      <div>
        <Bootstrap.Row>
          <Bootstrap.Col md={11} mdOffset={1}>
            <Link to={'/blotter/' + this.state.localBlotter._id}>{this.state.localBlotter.name}</Link>
            <ReportButton
              value={'Save'}
              progressValue={'Saving...'}
              bsStyle={saveStyle}
              report={{
                action: 'api/blotter/' + this.props.params.id,
                data: this.state.localBlotter
              }}
            />
            <ConfirmReport
              value='Delete'
              progressValue={'Deleting...'}
              report={{
                action: 'api/blotter/' + this.props.params.id + '/delete',
                data: {}
              }}
              resolve={() => {
                hashHistory.push("/");
              }}
            />
          </Bootstrap.Col>
        </Bootstrap.Row>
        <Bootstrap.Row>
          <Bootstrap.Col md={11} mdOffset={1}>
            <FileUpload onUpload={this.handleFileUpload} />
            <ul>
            {this.state.localBlotter.files.map(file => {
              var url = 'api/file/' + file._id + '/filename/' + file.name;
              return (
                <li key={file._id}>
                  <a href={url}>{url}</a>
                  <Bootstrap.Button
                    onClick={() => {
                      this.handleDeleteFile(file);
                    }}
                    bsSize={'xsmall'}
                  >
                    <span className="glyphicon glyphicon-remove" />
                  </Bootstrap.Button>
                </li>
              );
            })}
            </ul>
          </Bootstrap.Col>
        </Bootstrap.Row>
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
