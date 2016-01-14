"use strict";

import React from 'react';

export default React.createClass({
  render: function() {

    return (
      <div className="row">
        <div className="col-sm-offset-4 col-sm-4 row alert alert-danger" role="alert">
            <h6>
                <span className="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span>
                <span className="sr-only">Error:</span>
                <span> The given url could not be found in this application.</span>
            </h6>
        </div>
      </div>
    );
  }
});
