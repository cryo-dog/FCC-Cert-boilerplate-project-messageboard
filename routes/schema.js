const mongoose = require("mongoose");

const replySchema = new mongoose.Schema({
    "text": {
        type: String
    },
    "created_on": {
        type: Date,
        default: Date.now
    },
    "delete_password": {
        type: String,
        jsonIgnore: true
    },
    "reported": {
        type: Boolean,
        default: false,
        jsonIgnore: true
    }
});

const threadSchema = new mongoose.Schema({
    "text": {
      type: String,
      required: true
    },
    "board": {
        type: String,
        required: true
    },
    "created_on": {
        type: Date,
        default: Date.now
    },
    "bumbed_on": {
        type: Date,
        default: Date.now
    },
    "delete_password": {
        type: String,
        jsonIgnore: true
    },
    "replies": [replySchema],
    "reported": {
        type: Boolean,
        default: false,
        jsonIgnore: true
    }
});


const threadModel = mongoose.model("Thread", threadSchema)

module.exports = threadModel;