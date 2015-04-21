var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var UserUrl = require('./userUrl');


var User = db.Model.extend({
   tableName:"users",
   hasTimestamps: true,
   Person: function() {
   	 this.belongsTo(UserUrl, 'userID');
   }
});

module.exports = User;