export function queryActive (reqQuery) {
  let active;
  if (reqQuery === "true" || reqQuery === undefined) {
    active = true;
  } else if (reqQuery === "false") {
    active = false;
  } else {
    active = null;
  }
  return active;
}

export function queryNumbersArray (reqQuery) {
  const numbersArray = reqQuery
    .split(",")
    .map((value) => +value.trim())
    .filter((value) => !isNaN(value));
  return numbersArray;
}

export function queryStringsArray (reqQuery) {
  const stringsArray = reqQuery
    .split(",")
    .map(value => value.trim());
  return stringsArray;
}
