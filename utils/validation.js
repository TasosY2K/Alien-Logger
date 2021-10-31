function validateUsername(username) {
  if (username.length > 50 || username.length < 5) return false;
  let regx = /^[a-zA-Z0-9]*$/;
  return regx.test(username);
}

function validatePassword(password) {
  let regx = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,50}/;
  return regx.test(password);
}

function validateEmail(email) {
  let regx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regx.test(email);
}

module.exports = { validateUsername, validatePassword, validateEmail };
