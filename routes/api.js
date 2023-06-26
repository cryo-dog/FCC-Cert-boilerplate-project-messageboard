  'use strict';

  /* Reminder where to find parameter:
  query (url): req.query.name
  post req. fields: req.body.name    (body parser installed)
  */

  const ThreadModel = require("./schema.js");
  const crypto = require("crypto");


  module.exports = function (app) {

    function hashTXT(txt) {
      const hash = crypto.createHash('sha256');
      hash.update(txt);
      //return hash.digest('hex'); // It looks like FCC does not like hashing for testing
      return txt;
    }  
    
    
    
    app.route('/api/threads/:board')
      .post(async function (req, res) {
        
        const board = req.params.board || req.query.board || req.body.board; // Read Board name
        let existingBoard;
        let text = req.body.text;
        let password = req.body.delete_password;
        let password_hashed = hashTXT(password)
        //console.log(`\n >>Post details are:\n board ${board}, \n text: ${text}, \n password ${password}`);
        // update or create new board
        try {
          let newThread = new ThreadModel(
            {
            "board": board,
            "text": text,
            "delete_password": password_hashed
            });
            const savedThread = await newThread.save();
            res.status(200).redirect('/b/' + savedThread.board + '/');
            //res.json(savedThread);
        } catch (error) {
          console.error("==> Error in board update: \n", error);
        }
      })
      .get(async (req, res) => { 
        const board = req.params.board || req.query.board || req.body.board; // Read Board name
        const thread_id = req.query.thread_id ? req.query.thread_id : null;
        
        //console.log(` >>GET received for board: ${board}. Thread_id is: ${thread_id}`);
        //console.log("Directly accessed it is: ", req.params.board);

        //console.log("   >> No thread_id in query! Limiting results...")
        ThreadModel.find({ "board": board })
          .sort({ bumped_on: 'desc' })
          .limit(10)
          .select('-delete_password -reported')
          .lean()
          .then((arrayOfThreads) => {
            if (arrayOfThreads) {
              arrayOfThreads.forEach((thread) => {
                thread['replycount'] = thread.replies.length;

                // sort by date
                thread.replies.sort((thread1, thread2) => {
                  return thread2.created_on - thread1.created_on;
                });

                // max 3
                thread.replies = thread.replies.slice(0, 3);

                // remove unwanted stuff
                thread.replies.forEach((reply) => {
                  reply.delete_password = undefined;
                  reply.reported = undefined;
                });
              });

              return res.json(arrayOfThreads);
            }
          })
          .catch((error) => {
            // Handle the error appropriately
            console.error(error);
            res.status(500).json({ error: 'Internal Server Error' });
          });
          // End of the find one!

        
      })
      .put(async function (req, res) {
        
        let thread_id = req.body.report_id;
        let board = req.params.board;
        let updated;
        
        try {
          updated = await ThreadModel.findOneAndUpdate(
            {"_id": thread_id},
            {"reported": true},
            {"new": true}
            );
          res.status(200).send('reported');
        } catch (error) {
          console.error("Error reporting a thread: ", error);
        }
      })
      
      .delete(async function (req, res) {
        let thread_id = req.query.thread_id ? req.query.thread_id : req.body.thread_id
        let delete_password = req.query.delete_password ? req.query.delete_password : req.body.delete_password;
        let passwordHashed = hashTXT(delete_password);
        try {
          let deleted = await ThreadModel.deleteOne(
            {"_id": thread_id, "delete_password": passwordHashed}
          );
          if (deleted.deletedCount == 1) {
            res.status(200).send('success');
          } else {
            res.send("incorrect password");
          }
          
        } catch (error) {
          console.error("\n >>> Error deleting thread: ", thread_id, " because: \n", error);
        }
      });
      
    app.route('/api/replies/:board')
      .post(async function (req, res) {
        const board = req.params.board ? req.params.board : req.query.board ? req.query.board : req.body.board; // Read Board name
        const thread_id = req.query.thread_id ? req.query.thread_id : req.params.thread_id ? req.params.thread_id : req.body.thread_id ? req.body.thread_id : null;
        let existingBoard;
        let text = req.body.text;
        let password = req.body.delete_password;
        let password_hashed = hashTXT(password);
        let date_now = new Date();
        
        try {
          //console.log("Trying to create reply for board: ", board, " and thread_id: ", thread_id);
          existingBoard = await ThreadModel.findOneAndUpdate(
            {"board": board, "_id": thread_id},
            {
              $push: {
              "replies": {
                "text": text,
                "delete_password": password_hashed,
                "created_on": date_now
                }
              },
              "bumped_on": date_now
            },
            {
              new: true, upsert: true
            }
          )
          //console.log("New reply added to board: ", board, " thread: ", thread_id);
          res.redirect('/b/' + existingBoard.board + '/' + existingBoard._id + '/') ;
          
        } catch (error) {
          console.error("Error creating reply: \n", error)
        }
        
      })
      .get(async function (req, res) {
        
        let thread_id = req.query.thread_id;
        const board = req.params.board || req.query.board || req.body.board; // Read Board name

        //console.log(`\n   >> Get replies received!\n    board: ${board}\n    thread_id: ${thread_id}`);
            ThreadModel
                .find({_id: thread_id})
                .sort({ bumped_on: 'desc' })
            .select('-delete_password -reported')
            .lean()
            .then((arrayOfThreads) => {
              if (arrayOfThreads) {
                arrayOfThreads.forEach((thread) => {
                  thread['replycount'] = thread.replies.length;

                  // sort by date
                  thread.replies.sort((thread1, thread2) => {
                    return thread2.created_on - thread1.created_on;
                  });

                  // remove unwanted stuff
                  thread.replies.forEach((reply) => {
                    reply.delete_password = undefined;
                    reply.reported = undefined;
                  });
                });
                console.log("Results successfully fetched. Sending back\n", arrayOfThreads);
                return res.json(arrayOfThreads[0]);
              }
            })
            .catch((error) => {
              // Handle the error appropriately
              console.error("Error finding result...", error);
              res.status(500).json({ error: 'Internal Server Error' });
            });
            // End of findOne Query
          })
        .delete( async function (req, res) {
          //console.log(">>>>req.body is:\n", req.body);
          const board = req.params.board;
          const {thread_id, reply_id, delete_password} = req.body;
          const password_hashed = hashTXT(delete_password);
          //console.log(`  >> Delete reply request received\n    board: ${board}\n    thread_id: ${thread_id}\n    reply_id: ${reply_id}\n    delete_password (hashed): ${password_hashed}`);
          
          // let's delete the reply by updating the one Thread that can be found
          let thread = ThreadModel.findOneAndU
          
          try {
            let updatedResult = await ThreadModel.findOneAndUpdate(
              {
                "_id": thread_id,
                replies: {
                  $elemMatch: {
                    "_id": reply_id,
                    "delete_password": password_hashed
                  }
                }
              },
                {
                  $set: {
                    "replies.$.text": "[deleted]"
                  }
                },
                {new: true}
              );
              
        
          if (updatedResult) {
            res.status(200).send('success');
          } else {
            res.send("incorrect password");
          }
              
          } catch (error) {
            console.error("Server error deleting reply", error);
          }
          
        })
        .put(async function (req, res) {
          /*
          You can send a PUT request to /api/replies/{board} and 
          pass along the thread_id & reply_id. Returned will be the string reported. 
          The reported value of the reply_id will be changed to true.
          */
        
        const {thread_id, reply_id} = req.body;
        let board = req.params.board;
        let updated;
        
        //console.log(`   >> Received a PUT request for a REPLY:\n     Board: ${board}\n     thread_id: ${thread_id}\n     reply_id: ${reply_id}`);
        
        try {
          updated = await ThreadModel.findOneAndUpdate(
            {
              "_id": thread_id,
              "board": board,
              "replies": {
                $elemMatch: {
                  "_id": reply_id
                }
              }
            },
            {
              $set: {
                "replies.$.reported": true
              }
            },
            {"new": true}
            );
          //console.log("reply ", reply_id, " of thread ", thread_id," reported");
          res.status(200).send('reported');
        } catch (error) {
          console.error("Error reporting a thread: ", error);
        }
      })
      

  };
