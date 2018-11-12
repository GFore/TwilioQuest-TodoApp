// Twilio Todo List program that CRUD's a todo list via text messaging

// USAGE:
// - must have node, express, body-parser, twilio, and ngrok installed
// - run from the command line: node index.js
// - run from another command line window: ngrok http 1337
//    to use a port other than 1337, update the 'http.createServer(app).listen'
//    statment below to match the new port number
// - following the ngrok command, copy the 'https:// ... .io' url
// - go to Twilio dashboard > Phone Numbers > Active Numbers
// - go to the phone number that will be used to run the todo list
// - under Messaging > A Message Comes In, choose Webhook and paste the ngrok url
// - append '/sms' to the end of the url after '.io' and click Save button

// Should now have an express app running in one window and ngrok running in another.
// Now, use the app by sending text messages from any cell phone to the Twilio phone number.
// Each message should be one of the following (not case sensitive):
//  - add <todo>      // replace <todo> with the actual todo, eg. add wash dog
//      REPLY TEXT: <todo> ADDED
//  - list            // any arguments after list are ignored
//      REPLY TEXT: 1. <todo1> 2. <todo2> 3. <todo3> etc  (or 'Your todo list is empty' if empty)
//  - remove #        // send 'list' first to get item numbers of the existing todos, then use the number for #
//      REPLY TEXT: Item # REMOVED  (or 'Your todo list is empty, nothing to remove' if empty)


const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();
app.use(bodyParser.urlencoded({extended : false}));

let todos = [];

app.post('/sms', (req, res) => {
  const twiml = new MessagingResponse();
  console.log(req.body.Body);
  let bod = req.body.Body;                        // save the body of the received msg
  let task = bod.split(' ')[0].toLowerCase();     // the first word in the body is the operation to perform
  // The rest of the msg is the todo (add), the item number (remove), or blank (add) 
  let todo = bod.split(' ').slice(1).join(' ');   
  console.log(`Task: ${task}`);
  console.log(`Todo: ${todo}`);

  // create the TWIML message to reply with for each case

  // first, handle cases where task isn't add, list, or remove 
  if (!["add", "list", "remove"].includes(task)) {
    twiml.message("Bad message - please start your msg with 'add', 'remove', or 'list'.");
  
  // next handle add
  } else if (task === 'add') {
      todos.push(todo);
      twiml.message(`${todo} ADDED`);
  
  // next handle remove
  } else if (task === 'remove') {
      // first thing in todo should be an int for the item to remove
      // but assume some extra text may follow the number, so use split
      // to target just the number
      if (todos.length > 0) {
        let rmvItem = Number(todo.split(' ')[0]) - 1;  // convert item number to index by subtracting 1
        todos.splice(rmvItem, 1);                      // use splice to remove one item from array
        twiml.message(`Item ${rmvItem+1} REMOVED`);   // +1 to convert back from index to item number
      } else {
        // the todos list is empty, so nothing to remove
        twiml.message(`Your todo list is empty, nothing to remove`);
      }
      
      // finally, handle list
  } else if (todos.length > 0) {
    let todoList = "";
    let cnt = 1;
    todos.forEach(x => {
      todoList += `${cnt}. ${x}\n`;
      cnt += 1;
    });
    twiml.message(todoList);
  } else {
    twiml.message(`Your todo list is empty`);
  }

  //twiml.message(`Hi! It looks like your phone number was born in ${req.body.FromCountry}`);

  res.writeHead(200, {'Content-Type': 'text/xml'});
  res.end(twiml.toString());
});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});


// code for sending SMS message from Twilio phone
// const accountSid = 'xxx'; // replace with Account SID from www.twilio.com/console
// const authToken = 'yyy';   // replace with Auth Token from www.twilio.com/console

// let twilio = require('twilio');
// let client = new twilio(accountSid, authToken);
// client.messages.create({
//     body: `Greetings! The current time is: ${Date.now()} 1BLY9ZYSFVXTW6I`,
//     to: '+12092104311',  // Text this number
//     from: '+1zzz' // replace with valid Twilio number to use as the sender
// })
// .then((message) => console.log(message.sid));