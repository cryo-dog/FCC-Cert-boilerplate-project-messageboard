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
    return hash.digest('hex');
  }  
  
  
  
  app.route('/api/threads/:board')
    .post(async function (req, res) {
      
      const board = req.param.board ? req.param.board : req.query.board ? req.query.board : req.body.board; // Read Board name
      let existingBoard;
      let text = req.body.text;
      let password = req.body.delete_password;
      let password_hashed = hashTXT(password)
      console.log(`\n >>Post details are board ${board}, \n text: ${text}, \n password ${password}`);
      // update or create new board
      try {
        let newThread = new ThreadModel(
          {
          "board": board,
          "text": text,
          "delete_password": password_hashed
          });
          const savedThread = await newThread.save();
          res.redirect('/b/' + savedThread.board + '/' + savedThread.id);
        
      } catch (error) {
        console.error("==> Error in board update: \n", error);
      }
    })
    .get(async (req, res) => { 
      const board = req.params.board ? req.params.board : req.query.board ? req.query.board : req.body.board; // Read Board name
      console.log(req.params.board);
      console.log(` >>GET received for board: ${board}, and ??? `);
      
      ThreadModel.find({ board: board })
        .sort({ bumbed_on: 'desc' })
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
      
    })
    // Needs to be changed as it is only about adding the "reported" flag
    /*.put(async function (req, res) {
      console.log("Body: ", req.body);
      console.log("params: ", req.query);
      let putter;
      let ipHashed = hashTXT(req.res.ip);
      let thread_id = req.query.thread_id ? req.query.thread_id : req.body.thread_id
      try {
        putter = await ReportModel.create({
          "ip": ipHashed
        });
        console.log("Thread ", thread_id, " reported");
        res.status(200).send('reported');
      } catch (error) {
        console.error("Error reporting a thread: ", error);
      }
    })*/ 
    .delete(async function (req, res) {
      let thread_id = req.query.thread_id ? req.query.thread_id : req.body.thread_id
      let board = req.query.board ? req.query.board : req.body.board;
      let delete_password = req.query.delete_password ? req.query.delete_password : req.body.delete_password;
      let passwordHashed = hashTXT(delete_password);
      console.log("TiD: ", thread_id, ", Board: ", board, " delete_password hashed: ",passwordHashed);
    });
    
  app.route('/api/replies/:board')
    .post(async function (req, res) {
      const board = req.params.board ? req.params.board : req.query.board ? req.query.board : req.body.board; // Read Board name
      const thread_id = req.body.thread_id;
      const text = req.body.text;
      
      let password = req.body.delete_password;
      let password_hashed = hashTXT(password)
      
      let existingBoard;
      
      
      console.log(`\n >>Post details are board ${board}, \n text: ${text}, \n password ${password}`);
      
      try {
        console.log("Trying to create reply for board: ", board, " and thread_id: ", thread_id);
        existingBoard = await ThreadModel.findOneAndUpdate(
          {"board": board, "_id": thread_id},
          {
            $push: {
            "replies": {
              "text": text,
              "delete_password": password_hashed,
              }
            },
            "bumbed_on": new Date()
          },
          {
            new: true, upsert: true
          }
        )
        console.log("New reply added to board: ", board, " thread: ", thread_id);
        
        res.json(existingBoard);
        
      } catch (error) {
        console.error("Error creating reply: \n", error)
      }
      
    })
    

};
