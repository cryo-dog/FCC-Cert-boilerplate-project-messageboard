const axios = require('axios'); // Import the axios library
const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;

function getUserInput(x) {
  return 'http://127.0.0.1:3000';
}

async function test1(x) {
  const date = new Date();
  let checkData;
  let parsed;
  let res;
  const text = `fcc_test_123`;
  const deletePassword = 'delete_me';
  const data = {text, delete_password: deletePassword };
  const url = getUserInput('url');
  console.log('>> URL for testing: ' + url);
  try {
    res = await axios.post(url + '/api/threads/fcc_test', data, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log("Result is: " + res);
    if (res.status === 200) {
      try {
      checkData = await axios.get(url + '/api/threads/fcc_test');
      } catch (e) {
        console.error("Check data failed: ", e);
      };
      parsed = checkData.data;
      try {
        assert.equal(parsed[0].text, text);
        assert.isNotNull(parsed[0]._id);
        assert.equal(new Date(parsed[0].created_on).toDateString(), date.toDateString());
        assert.equal(parsed[0].bumped_on, parsed[0].created_on);
        assert.isArray(parsed[0].replies);
      } catch (err) {
        throw new Error(err.response.data || err.message);
      }
    } else {
      throw new Error(`${res.status} ${res.statusText}`);
    }
  } catch (err) {
    throw new Error(err);
  }
}

test1(1);
