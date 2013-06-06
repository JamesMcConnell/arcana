var db = require('./config/db-config');
module.exports = function (grunt) {
    grunt.registerTask('dbseed', 'seed the database', function () {
        grunt.task.run('adduser:admin:admin@arcana.com:jm71cl33:true');
        grunt.task.run('adduser:interneth3ro:interneth3ro@arcana.com:jm71cl33:false');
    });

    grunt.registerTask('adduser', 'add a user to the database', function (user, emailAddress, password, admin) {
        admin = (admin === "true");
        var user = new db.userModel({
            username: user,
            email: emailAddress,
            password: password,
            isAdmin: admin
        });

        var done = this.async();
        user.save(function (err) {
            if (err) {
                console.log('Error: ' + err);
                done(false);
            } else {
                console.log('Created user: ' + user.username);
                done();
            }
        });
    });
}

