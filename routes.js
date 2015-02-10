/**
 *	Copyright (C) 2014 3D Repo Ltd
 *
 *	This program is free software: you can redistribute it and/or modify
 *	it under the terms of the GNU Affero General Public License as
 *	published by the Free Software Foundation, either version 3 of the
 *	License, or (at your option) any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU Affero General Public License for more details.
 *
 *	You should have received a copy of the GNU Affero General Public License
 *	along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var express = require('express');
var bCrypt = require('bcrypt-nodejs');
var log_iface = require('./js/core/logger.js');
var logger = log_iface.logger;
//var login = require('connect-ensure-login');
var config = require('app-config').config;
var package_json = require('./package.json');

var imgEncoder = require('./js/core/encoders/img_encoder.js');

var expressJwt = require('express-jwt');
var jwt = require('jsonwebtoken');

var secret = 'secret';

module.exports = function(){
	this.router = express.Router();

	// Check the user has access
	// 1. First check whether or not this is a specific project.
	//	  Does the user have access to it ?
	// 2. If not, is the user logged in ?
	// 3. Otherwise, unauthorized
	this.checkAccess = function(req, res, next) {
		var account = req.params["account"];
		var project = req.params["project"];

		if (req.params["format"])
			var format = req.params["format"].toLowerCase();
		else
			var format = null;

		if (account && project)
		{
			this.dbInterface.isPublicProject(account, project, function(err) {
				if(err && !req.session.user && !imgEncoder.isImage(format))
				{
					logger.log('debug', 'Not a public project and no user information.');
					return res.sendStatus(401);
				} else {
					next();
				}
			});
		} else {
			// No account and project specified, check user is logged in.
			if (!("user" in req.session)) {
				return res.sendStatus(401);
			} else {
				next();
			}
		}
	};

	this.dbInterface = require('./js/core/db_interface.js');

	this.getHandler  = require('./routes_get.js')(this.router, this.dbInterface, this.checkAccess);
	this.postHandler = require('./routes_post.js')(this.router, this.dbInterface, this.checkAccess);

	this.get = this.getHandler.get; // Re-route the call to the get handler.

	this.router.use(express.static('./submodules'));
	this.router.use(express.static('./public'));

	this.router.use(function(req, res, next)
	{
		logger.log('debug', req.originalUrl)
		next();
	});

	return this;
}
