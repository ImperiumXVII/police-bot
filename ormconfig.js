module.exports = {
	type: 'mysql',
	host: 'imperiumxvii.co.uk',
	port: 3306,
	username: 'lspdbot',
	password: process.env.SQL_PASSWORD,
	database: 'lspd',
	// logging: true,
	entities: [__dirname + '/build/entities/*.js'],
};
