
export function shallow(obj1, obj2){
  var result = {};

  for(var prop in obj2){
    result[prop] = obj2[prop];
  }

  if (obj1) {
    for(var prop in obj1){
      if (!result[prop]){
        result[prop] = obj1[prop];
      }
    }
  }

  return result;
}
