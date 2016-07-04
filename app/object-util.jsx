
export function merge(obj1, obj2){
  var result = {};

  for(var prop in obj2){
    result[prop] = obj2[prop];
  }

  if (obj1) {
    for(var prop in obj1){
      if (typeof result[prop] === 'undefined'){
        result[prop] = obj1[prop];
      }
    }
  }

  return result;
}

export function compare(obj1, obj2){
  if (Array.isArray(obj1)){
    if (obj1.length !== obj2.length){
      return false;
    }

    var same = true;

    obj1.forEach((element, index) => {
      same = same && compare(element, obj2[index]);
    });

    return same;
  }

  if (typeof obj1 === 'object') {

    for(var prop in obj1){
      if (typeof obj2[prop] === 'undefined' || !compare(obj1[prop], obj2[prop])){
        return false;
      }
    }

    for(var prop in obj2){
      if (typeof obj1[prop] === 'undefined'){
        return false;
      }
    }

    return true;
  }

  return obj1 === obj2;

}
