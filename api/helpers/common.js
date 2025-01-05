const bcrypt = require("bcrypt");

function generateRandomDigit(n) {
  var add = 1,
    max = 12 - add; // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.

  if (n > max) {
    return generate(max) + generate(n - max);
  }

  max = Math.pow(10, n + add);
  var min = max / 10; // Math.pow(10, n) basically
  var number = Math.floor(Math.random() * (max - min + 1)) + min;

  return ("" + number).substring(add);
}
const userNameGenerator = (input, suggestionLength, randomDigitLength) => {
  const userNameArray = [];
  for (let i = 0; i <= suggestionLength; i++) {
    userNameArray.push(input.replace(/\s/g, "") + generateRandomDigit(randomDigitLength));
  }
  let uniqueUserName = userNameArray.reduce((acc, x) => {
    if (!acc.includes(x)) {
      acc.push(x);
    }
    return acc;
  }, []);
  return uniqueUserName;
};

const generatePassword = (password) => {
  // Generate a salt
  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  // Hash the password using the generated salt
  const hashedPassword = bcrypt.hashSync(password, salt);
  return hashedPassword;
};

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

const fetchCronSchedule = (cronExpression) => {
  //parsing cron for * * * * *
  let cronExpressionList = cronExpression.split(" ");
  let cronObj = {
    dayOfWeek: cronExpressionList[cronExpressionList.length - 1],
    month: cronExpressionList[cronExpressionList.length - 2],
    dayOfMonth: cronExpressionList[cronExpressionList.length - 3],
    hour: cronExpressionList[cronExpressionList.length - 4],
    minute: cronExpressionList[cronExpressionList.length - 5],
    second: cronExpressionList[cronExpressionList.length - 6],
  };
  //modifying for frontend
  cronObj["dayOfMonth"] = cronObj["dayOfMonth"].replace("*/", "");
  return cronObj;
};

module.exports = {
  fn: () => {},
  userNameGenerator,
  generatePassword,
  generateRandomDigit,
  escapeRegex,
  fetchCronSchedule,
};
