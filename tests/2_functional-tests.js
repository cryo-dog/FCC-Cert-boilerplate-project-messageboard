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
                  threadID = jsonData[0]._id;
  
                  for (let j = 0; j < jmax; j++) {
                    chai
                      .request(server)
                      .post('/api/replies/test/')
                      .send({
                        text: "Test reply text",
                        delete_password: "deleteMe",
                        thread_id: threadID
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
                                
                                completedOperations++;
  
                                if (completedOperations === imax * jmax) {
                                  // All asynchronous operations completed
                                  const jsonData2 = JSON.parse(res.text);
                                  replyID = jsonData2[0].replies[0]._id;
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
  test('Create a New Thread', (done) => {
    chai
      .request(server)
      .post('/api/threads/test/')
      .send({
        text: 'Functional Test Thread',
        delete_password: "testPass"
      })
      .end( (err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.type, 'text/html')
        done()
      })
})

      
  
 // View the 10 most recent threads with 3 replies each
   test('Viewing the 10 most recent threads with 3 replies each', (done) => {
		chai.request(server)
		.get('/api/threads/test/')
		.send()
		.end((err, res) => {
			assert.isArray(res.body);
      assert.isAtMost(res.body.length, 10);
			let firstThread = res.body[0];
			assert.isUndefined(firstThread.delete_password);
			assert.isAtMost(firstThread.replies.length, 3);
			done()
		})
	})

  
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
  test('Create a New Reply', (done) => {
    chai
      .request(server)
      .post('/api/replies/test/')
      .send({
        text: 'Functional Test Thread',
        delete_password: "testPass",
        thread_id: threadID
      })
      .end( (err, res) => {
        assert.equal(res.status, 200)
        assert.equal(res.type, 'text/html')
        done()
      })
  })


  // View a single thread with all replies
  test('Viewing a single thread with all replies', (done) => {
    chai
      .request(server)
      .get('/api/replies/test/')
      .query({ thread_id: threadID })
      .end( (err, res) => {
        assert.equal(res.status, 200)
        assert.containsAllKeys(res.body, ["board", "_id", "bumped_on", "replies"])
        assert.isAbove(res.body.replies.length, 0)
        done()
      })
  });



  // Report a reply
  test('Reporting a reply', function(done) {
    chai
      .request(server)
      .put('/api/replies/test/')
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
    test('Deleting a reply with the incorrect password', (done) => {
      chai
        .request(server)
        .delete('/api/replies/test/')
        .send({
          thread_id: threadID,
          reply_id: replyID,
          delete_password: 'incorrect_password'
        })
        .end( (err, res) => {
          assert.equal(res.text, "incorrect password")
          done()
        })
    });
  
    // Delete a reply with the correct password
    test('Deleting a reply with the correct password', (done) => {
      chai
        .request(server)
        .delete('/api/replies/test/')
        .send({
          thread_id: threadID,
          reply_id: replyID,
          delete_password: "deleteMe"
        })
        .end(function(err, res) {
          assert.equal(res.status, 200)
          assert.equal(res.text, "success")
          done()
        })
    })

    
  // Delete a thread with the incorrect password
  test('Deleting a thread with the incorrect password', (done) => {
    chai
      .request(server)
      .delete('/api/threads/test/')
      .send({
        thread_id: threadID,
        delete_password: 'incorrect_password'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200)
        assert.equal(res.text, "incorrect password")
        done()
      });
  });

  // Delete a thread with the correct password
  test('Deleting a thread with the correct password', (done) => {
    chai
      .request(server)
      .delete('/api/threads/test/')
      .send({
        thread_id: threadID,
        delete_password: 'deleteMe'
      })
      .end(function(err, res) {
        assert.equal(res.status, 200)
        assert.equal(res.text, "success")
        done()
      });
  });

  

});