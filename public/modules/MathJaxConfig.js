
// this is not really a module, but will be patched in using a webpack loader
// MathJax will use this as its AuthorConfig
module.exports = {
    delayStartupUntil : "configured",
    skipStartupTypeset: true,
    extensions: ["tex2jax.js"],
    jax: ["input/TeX", "output/HTML-CSS"],
    tex2jax: {
      inlineMath: [ ['$','$'], ["\\(","\\)"] ],
      displayMath: [ ['$$','$$'], ["\\[","\\]"] ],
      processEscapes: true
    },
    "HTML-CSS": { availableFonts: ["TeX"] },
    AuthorInit : function() {
        MathJax.Ajax.config.root = "MathJax";
        MathJax.Hub.Configured();
    }
};
