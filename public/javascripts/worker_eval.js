
onmessage = function(source, input) {
    var output = {};
    eval(source);

    postMessage(output);
};
