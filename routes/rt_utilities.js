

exports.findMinIndex = function(array, value) {
    var min = 0;
    var max = array.length;

    while(min < max) {
        var mid = Math.floor((max - min) / 2) + min;

        if (array[mid] < value) {
            min = mid + 1;
        }else{
            max = mid - 1;
        }
    }
}
