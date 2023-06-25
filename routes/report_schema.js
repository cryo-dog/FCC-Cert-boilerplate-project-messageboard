const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
    "ip": {
        type: String
    }
});


const reportModel = mongoose.model("Reports", reportSchema);

module.exports = reportModel;