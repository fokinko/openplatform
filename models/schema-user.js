// `User`
// `UserGroup`
// `UserNewsletter`

const Fs = require('fs');

NEWSCHEMA('User').make(function(schema) {

	schema.define('id', 'String(50)');
	schema.define('alias', 'String(50)');
	schema.define('firstname', 'Capitalize(50)', true);
	schema.define('lastname', 'Capitalize(50)', true);
	schema.define('language', 'Lower(2)');
	schema.define('group', 'String(60)');
	schema.define('email', 'Email', true);
	schema.define('phone', 'Phone');
	schema.define('login', 'String(100)', true);
	schema.define('password', 'String(50)', true);
	schema.define('applications', 'Object');
	schema.define('sounds', Boolean);
	schema.define('notifications', Boolean);
	schema.define('blocked', Boolean);
	schema.define('superadmin', Boolean);
	schema.define('welcome', Boolean);

	schema.setSave(function(error, model, options, callback) {

		var user = model.id ? USERS.findItem('id', model.id) : new OPENPLATFORM.User();

		if (!user) {
			error.push('error-invalid-userid');
			return callback();
		}

		user.firstname = model.firstname;
		user.lastname = model.lastname;
		user.email = model.email;
		user.phone = model.phone;
		user.login = model.login;
		user.group = model.group;
		user.language = model.language;
		user.search = (user.lastname + ' ' + user.firstname + ' ' + user.group).toSearch();
		user.alias = model.firstname + ' ' + model.lastname;

		if (!model.password.startsWith('****')) {
			user.password = model.password.hash('sha256');
			user.datepassword = F.datetime;
		}

		user.superadmin = model.superadmin;
		user.applications = model.applications;
		user.blocked = model.blocked;
		user.sounds = model.sounds;
		user.notifications = model.notifications;
		user.dateupdated = F.datetime;

		if (user.blocked)
			user.online = false;

		if (!user.id) {
			user.id = UID();
			user.internal = model.id.hash();
			user.secure();
			USERS.push(user);
		}

		if (model.welcome) {
			user.tokenizer();
			model.token = user.token;
			F.mail(model.email, '@(Welcome to OpenPlatform)', '~mails/registration', model, model.language);
		}

		OPENPLATFORM.users.save();
		callback(SUCCESS(true));
	});

	schema.setRemove(function(error, id, callback) {

		var index = USERS.findIndex('id', id);
		if (index === -1) {
			error.push('error-user-notfound');
			return callback();
		}

		var user = USERS[index];

		// Removes its notification file
		Fs.unlink(F.path.databases('notifications_{0}.json'.format(user.internal)), NOOP);

		USERS.splice(index, 1);
		OPENPLATFORM.users.save();
		callback(SUCCESS(true));
	});
});

NEWSCHEMA('UserGroup').make(function(schema) {

	schema.define('group_old', 'String(60)', true);
	schema.define('group_new', 'String(60)', true);

	schema.setSave(function(error, model, controller, callback) {
		var count = 0;

		for (var i = 0, length = USERS.length; i < length; i++) {
			var user = USERS[i];
			if (user.group !== model.group_old)
				continue;
			user.group = model.group_new;
			count++;
		}

		if (count)
			OPENPLATFORM.users.save();

		callback(SUCCESS(true, count));
	});
});

NEWSCHEMA('UserPermissions').make(function(schema) {

	schema.define('type', Number);
	schema.define('group', 'String(60)');
	schema.define('applications', Object);

	schema.setSave(function(error, model, controller, callback) {


		if (!model.applications)
			model.applications = {};

		var keys = Object.keys(model.applications);
		var count = 0;

		for (var i = 0, length = USERS.length; i < length; i++) {
			var user = USERS[i];

			if (model.group && model.group !== user.group)
				continue;

			// Sets
			if (model.type === 1) {
				count++;
				user.applications = U.clone(model.applications);
				continue;
			}

			keys.forEach(function(key) {
				var permissions = model.applications[key];

				// Extends
				if (model.type === 0) {
					if (!user.applications[key])
						user.applications[key] = [];
					permissions.forEach(permission => user.applications[key].push(permission));
					return;
				}

				// Removes
				if (model.type !== 2)
					return;


				if (!permissions.length) {
					delete user.applications[key];
					return;
				}

				permissions.forEach((permission) => user.applications[key] = user.applications[key].remove(permission));
			});

			count++;
		}

		if (count)
			OPENPLATFORM.users.save();

		callback(SUCCESS(true, count));
	});
});

// Internal newsletter (admin can send email)
NEWSCHEMA('UserNewsletter').make(function(schema) {

	schema.define('group', '[String]');            // User's group
	schema.define('body', 'String', true);         // A message
	schema.define('subject', 'String(100)');

	schema.setSave(function(error, model, controller, callback) {

		var html = F.view('~mails/newsletter');
		var group = model.group && model.group.length ? model.group : null;
		var messages = [];
		var count = 0;

		if (model.body.indexOf('<') === -1)
			model.body = model.body.replace(/\n/g, '<br />');

		for (var i = 0, length = USERS.length; i < length; i++) {
			var user = USERS[i];
			if (group && group.indexOf(user.group) === -1)
				continue;
			var mail = Mail.create(model.subject, html.format(model.body));
			mail.to(user.email);
			mail.from(F.config['mail.address.from']);
			messages.push(mail);
			count++;
		}

		messages.limit(15, (messages, next) => Mail.send2(messages, next));
		callback(SUCCESS(true, count));
	});
});
