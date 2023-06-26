const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  // Create a new thread
  test('Creating a new thread', function(done) {
    chai
      .request(server)
      .post('/api/threads/test')
      .send({
        text: 'Test thread',
        delete_password: 'test123'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

  // View the 10 most recent threads with 3 replies each
  test('Viewing the 10 most recent threads with 3 replies each', function(done) {
    chai
      .request(server)
      .get('/api/threads/{board}')
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

  // Delete a thread with the incorrect password
  test('Deleting a thread with the incorrect password', function(done) {
    chai
      .request(server)
      .delete('/api/threads/{board}')
      .send({
        thread_id: 'thread_id',
        delete_password: 'incorrect_password'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

  // Delete a thread with the correct password
  test('Deleting a thread with the correct password', function(done) {
    chai
      .request(server)
      .delete('/api/threads/{board}')
      .send({
        thread_id: 'thread_id',
        delete_password: 'correct_password'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

  // Report a thread
  test('Reporting a thread', function(done) {
    chai
      .request(server)
      .put('/api/threads/{board}')
      .send({
        report_id: 'thread_id'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });

  // Create a new reply
  test('Creating a new reply', function(done) {
    chai
      .request(server)
      .post('/api/replies/{board}')
      .send({
        text: 'Test reply',
        delete_password: 'test123',
        thread_id: 'thread_id'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

  // View a single thread with all replies
  test('Viewing a single thread with all replies', function(done) {
    chai
      .request(server)
      .get('/api/replies/{board}')
      .query({ thread_id: 'thread_id' })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

  // Delete a reply with the incorrect password
  test('Deleting a reply with the incorrect password', function(done) {
    chai
      .request(server)
      .delete('/api/replies/{board}')
      .send({
        thread_id: 'thread_id',
        reply_id: 'reply_id',
        delete_password: 'incorrect_password'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

  // Delete a reply with the correct password
  test('Deleting a reply with the correct password', function(done) {
    chai
      .request(server)
      .delete('/api/replies/{board}')
      .send({
        thread_id: 'thread_id',
        reply_id: 'reply_id',
        delete_password: 'correct_password'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

  // Report a reply
  test('Reporting a reply', function(done) {
    chai
      .request(server)
      .put('/api/replies/{board}')
      .send({
        thread_id: 'thread_id',
        reply_id: 'reply_id'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });
});