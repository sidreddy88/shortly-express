var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var url = require('./link');
var user = require('./user');

var UserUrl = db.Model.extend({
   tableName:"userUrls",
   hasTimestamps: true,
   Urls: function() {
   	 return this.hasMany(url);
   },
   Users : function () {
   	 return this.hasMany(user);
   }

});

module.exports = UserUrl;