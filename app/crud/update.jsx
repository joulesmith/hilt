import React from 'react';
import * as Bootstrap from 'react-bootstrap';
import * as journal from '../journal';
import { Router, Route, Link, hashHistory  } from 'react-router';
import {merge, compare} from '../object-util';
import FileUpload from '../file-upload';
import ConfirmReport from '../confirm-report-modal';
import SigninRequired from '../signin-required';
import ReportButton from '../report-button';
import ErrorBody from '../error-body';

export default React.createClass({
  getInitialState(){
    return {
      data: null,
      text: '',
      error: ''
    };
  },
  componentWillMount: function(){
    // subscribe to a specific profile
    this.subscription = journal.subscribe({
      crud: 'api/crud/{this.props.params.id}'
    }, state => {
      this.setState({
        data: state.crud.data || {},
        text: JSON.stringify(state.crud.data || {}),
        error: ''
      })
    }, this);
  },
  componentWillUnmount: function(){
    this.subscription.unsubscribe();
  },
  handleData(event){

    var obj;

    try{
      obj = JSON.parse(event.target.value);

      this.setState({
        data: obj,
        text: event.target.value,
        error: ''
      });
    }catch(error){
      this.setState({
        text: event.target.value,
        error: error
      });
    }



  },
  render() {
    try{
      if (!this.state || !this.state.data){
        return (<div></div>);
      }

      return (
        <div>
          <Bootstrap.Input type='textarea' value={this.state.text} onChange={this.handleData} />
          <ReportButton
            disabled={!!this.state.error}
            value='Save'
            progressValue='Saving...'
            bsStyle='default'
            report={{
              action: 'api/crud/' + this.props.params.id,
              data: {
                data: this.state.data
              }
            }}
          />
          <ConfirmReport
            value={'Delete'}
            progressValue={'Deleting...'}
            bsStyle={'default'}
            report={{
              action: 'api/crud/' + this.props.params.id + '/delete',
              data: {}
            }}
            resolve={() => {
              hashHistory.push("/crud/");
            }}
          />
          <ErrorBody error={this.state.error} />
        </div>
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
