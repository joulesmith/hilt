import React from 'react';

import '../css/katex.min.css';
import marked from 'marked';
//import * as sanitizer from 'sanitizer';
import * as katex from 'katex';
import ErrorBody from '../error-body';

marked.setOptions({
  renderer: new marked.Renderer(),
  gfm: true,
  tables: true,
  breaks: false,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: false
});

export default React.createClass({
  render() {
    try{
      //var text = sanitizer.sanitize(this.props.text);


      var TeXInlineElements = [];
      var TexDisplayElements = [];

      // The use of \( or \[ to mark LaTeX acts as an extension to the
      // markdown format, since those characters would have other meanings
      // So all sections marked for LaTeX have to be removed so they don't
      // get converted to Markdown first.
      var noDisplay = this.props.value.replace(/\$\$(.+?)\$\$/g, function (x){
          TexDisplayElements.push(x.substring(2, x.length-2));
          return "TexDisplayElement";
      });

      var noInline = noDisplay.replace(/\$(.+?)\$/g, function (x){
          TeXInlineElements.push(x.substring(1, x.length-1));
          return "TeXInlineElement";
      });

      var markdowned = marked(noInline);
      var cur_inline = 0;
      var cur_display = 0;

      // Now put back the LaTeX sections so that MathJax will process them
      // into math
      var reTeX = markdowned.replace(/TexDisplayElement/gi, function (x){
          var tex = katex.renderToString(TexDisplayElements[cur_display], { displayMode: true });
          cur_display++;
          return tex;
      });

      reTeX = reTeX.replace(/TeXInlineElement/gi, function (x){
          var tex = katex.renderToString(TeXInlineElements[cur_inline], { displayMode: false });
          cur_inline++;
          return tex;
      });

      return (
        <div dangerouslySetInnerHTML={{__html: reTeX}} />
      );
    }catch(error){
      return <ErrorBody error={error}/>;
    }
  }
});
