const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {

  let threadIDs = [];
  let replyID;
  let threadID;
  let replies = [];

  before(function(done) {
    let completedOperations = 0; // Counter for completed asynchronous operations
    let imax = 2; // Threads
    let jmax = 3; // Replies
    // Before each test, create 5 threads with 2 replies each
    for (let i = 0; i < imax; i++) {
      chai
        .request(server)
        .post('/api/threads/test/')
        .send({
          text: "Testcase Text",
          delete_password: "deleteMe"
        })
        .end((err, res) => {
          if (err) {
            done(err);
          } else {
            chai
              .request(server)
              .get(`/api/threads/test/`)
              .end(function(err, res) {
                if (err) {
                  done(err);
                } else {
                  const jsonData = JSON.parse(res.text);
                  const threadID = jsonData[0]._id;
  
                  for (let j = 0; j < jmax; j++) {
                    chai
                      .request(server)
                      .post('/api/replies/test/')
                      .send({
                        text: "Test reply text",
                        delete_password: "deleteMe"
                      })
                      .end((err, res) => {
                        if (err) {
                          done(err);
                        } else {
                          chai
                            .request(server)
                            .get(`/api/threads/test/`)
                            .end(function(err, res) {
                              if (err) {
                                done(err);
                              } else {
                                const jsonData2 = JSON.parse(res.text);
                                replyID = jsonData2[0].replies[0]._id;
                                completedOperations++;
  
                                if (completedOperations === imax * jmax) {
                                  // All asynchronous operations completed
                                  done();
                                }
                              }
                            });
                        }
                      });
                  }
                }
              });
          }
        });
    }
  });
  

  // Create a new thread
  test('Creating a new thread', function(done) {
    chai
      .request(server)
      .post('/api/threads/test/')
      .send({
        text: 'Test thread',
        delete_password: 'test'
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
      .get('/api/threads/test/')
      .end(function(err, res) {
        try {
          assert.equal(res.status, 200);
          assert.isAtMost(threads.length, 10);
          for (let i = 0; i < threads.length; i++) {
            assert.containsAllKeys(threads[i], ["_id", "text", "created_on", "bumped_on", "replies"]);
            assert.isAtMost(threads[i].replies.length, 3);
            assert.notExists(threads[i].delete_password);
            assert.notExists(threads[i].reported);
            for (let j = 0; j < threads[i].replies.length; j++) {
              assert.notExists(threads[i].replies[j].delete_password);
              assert.notExists(threads[i].replies[j].reported);
            }
          }
        } catch (err) {
          done(err);
          throw new Error(err.responseText || err.message);
        }
        done();
      });
  });

  // Report a thread
  test('Reporting a thread', function(done) {
    chai
      .request(server)
      .put('/api/threads/test/')
      .send({
        thread_id: threadID
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
      .post('/api/replies/test/')
      .send({
        text: 'Test reply',
        delete_password: 'deleteMe',
        thread_id: threadID
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
      .query({ thread_id: threadID })
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
        thread_id: threadID,
        reply_id: replyID
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'reported');
        done();
      });
  });


    // Delete a reply with the incorrect password
    test('Deleting a reply with the incorrect password', function(done) {
      chai
        .request(server)
        .delete('/api/replies/{board}')
        .send({
          thread_id: threadID,
          reply_id: replyID,
          delete_password: 'incorrect_password'
        })
        .end(function(err, res) {
          assert.equal(res.text(), "incorrect_password");
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
          thread_id: threadID,
          reply_id: replyID,
          delete_password: "deleteMe"
        })
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
      .delete('/api/threads/test/')
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
      .delete('/api/threads/test/')
      .send({
        thread_id: threadID,
        delete_password: 'deleteMe'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200);
        // Add assertions for the response data
        done();
      });
  });

});