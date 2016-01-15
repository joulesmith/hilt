"use strict";
import formatMessage from 'format-message';

import * as journal from './journal';
import enUS from './locales/en-US';

var locale = enUS;

// initial locale settings
/*  formatMessage.setup({

  });*/

journal.report({
  action: '#/locale',
  definition: data => {

    require(['./locales/' + data.locale + '.json'], function(translations){
      /*  formatMessage.setup({

        });*/
      journal.publish('#/action', data);
    });

  }
});
