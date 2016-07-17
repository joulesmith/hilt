
export function ellipses(verb){
  return (start, current) => {
    var diff = (current-start) % 1000;

    if (diff > 750) {
      return verb + '....';
    }

    if (diff > 500){
      return verb + '...';
    }

    if (diff > 250) {
      return verb + '..';
    }

    return verb + '.';
  }
}
