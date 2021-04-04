function validate_username(username) {
  if(username.length < 5 || username.length > 50) return false;
  let regx = /^[a-zA-Z0-9]*$/;
  return regx.test(username);
}

function validate_password(password) {
  if(password.length < 8 || password.length > 50) return false;
  let regx = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/;
  return regx.test(password);
}

function validate_email(email) {
  let regx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regx.test(email);
}

function checkUsername() {
  if (validate_username($('#username-validation').val())) {
      $('#username-validation-text').html("");
      return true;
    } else {
      $('#username-validation-text').html("Username must be 5-50 letters long and can't contain special characters");
      return false;
  }
}

function checkPassword() {
  if (validate_password($('#password-validation').val())) {
      $('#password-validation-text').html("");
      return true;
    } else {
      $('#password-validation-text').html("Password must contain at least one digit/lowercase/uppercase letter and be at least 8 characters long");
      return false;
  }
}

function checkEmail() {
  if (validate_email($('#email-validation').val())) {
      $('#email-validation-text').html("");
      return true;
    } else {
      $('#email-validation-text').html("Invalid email");
      return false;
  }
}

function checkConfirm() {
  if ($('#password-confirm').val() === $('#password-validation').val()) {
      $('#password-confirm-text').html("");
      return true;
    } else {
      $('#password-confirm-text').html("Passwords don't match");
      return false;
  }
}

function checkAll() {
  if (validate_username($('#username-validation').val()) && validate_email($('#email-validation').val()) && validate_password($('#password-validation').val()) && $('#password-confirm').val() === $('#password-validation').val()) {
    $('.register-submit').prop('disabled', false);
  } else {
    $('.register-submit').prop('disabled', true);
  }
}

function checkEmpty() {
  if ($('#login-page-username').val() == "" || $('#login-page-password').val() == "") {
    $('#login-page-submit').prop('disabled', true);
  } else {
    $('#login-page-submit').prop('disabled', false);
  }
}
