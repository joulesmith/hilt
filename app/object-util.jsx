
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

  if (typeof obj1 !== 'object') {
    return obj1 === obj2;
  }

  for(var prop in obj1){
    if (!obj2[prop]){
      return false;
    }

    return compare(obj1[prop], obj2[prop]);
  }
}
