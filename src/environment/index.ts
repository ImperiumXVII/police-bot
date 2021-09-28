export const environment = {
	url: 'https://pd.lsgov.us/forum/',
	discord_id: process.env.DISCORD_TOKEN, // this needs replacing with your bot token from discord.com/developers/applications
	username: 'Police Administration',
	password: process.env.DISCORD_PASSWORD, // this needs replacing with the password of the 'Police Administration' account
} as const;

export const lspd_logo = 'https://i.imgur.com/BpXDfPE.png';

export const rankNames = [
	'Police Reserve Officer Level II',
	'Police Reserve Officer Level I',
	'Police Officer I',
	'Police Officer II',
	'Police Officer III',
	'Police Officer III+1',
	'Senior Lead Officer',
	'Police Detective I',
	'Police Detective II',
	'Police Detective III',
	'Police Sergeant I',
	'Police Sergeant II',
	'Police Lieutenant I',
	'Police Lieutenant II',
	'Police Captain I',
	'Police Captain II',
	'Police Captain III',
	'Police Commander',
	'Deputy Chief',
	'Assistant Chief',
	'Chief of Police',
	'TEMS Paramedic',
	'TEMS Paramedic Specialist',
];

export const rankImages = [
	'https://pd.lsgov.us/forum/images/ranks/18PoliceOfficerI.png',
	'https://pd.lsgov.us/forum/images/ranks/18PoliceOfficerII.png',
	'https://pd.lsgov.us/forum/images/ranks/18PoliceOfficerI.png',
	'https://pd.lsgov.us/forum/images/ranks/18PoliceOfficerII.png',
	'https://pd.lsgov.us/forum/images/ranks/18PoliceOfficerIII.png',
	'https://pd.lsgov.us/forum/images/ranks/18PoliceOfficerIII+1.png',
	'https://pd.lsgov.us/forum/images/ranks/18PoliceOfficerIII+1.png',
	'https://pd.lsgov.us/forum/images/ranks/18DetectiveI.png',
	'https://pd.lsgov.us/forum/images/ranks/18DetectiveII.png',
	'https://pd.lsgov.us/forum/images/ranks/18DetectiveIII.png',
	'https://pd.lsgov.us/forum/images/ranks/18SergeantI.png',
	'https://pd.lsgov.us/forum/images/ranks/18SergeantII.png',
	'https://pd.lsgov.us/forum/images/ranks/18LieutenantI.png',
	'https://pd.lsgov.us/forum/images/ranks/18LieutenantII.png',
	'https://pd.lsgov.us/forum/images/ranks/18CaptainI.png',
	'https://pd.lsgov.us/forum/images/ranks/18CaptainII.png',
	'https://pd.lsgov.us/forum/images/ranks/18CaptainIII.png',
	'https://pd.lsgov.us/forum/images/ranks/18Commander.png',
	'https://pd.lsgov.us/forum/images/ranks/18DeputyChief.png',
	'https://pd.lsgov.us/forum/images/ranks/18AssistantChief.png',
	'https://pd.lsgov.us/forum/images/ranks/18Chief.png',
	'https://pd.lsgov.us/forum/images/ranks/19LSFD.png',
	'https://pd.lsgov.us/forum/images/ranks/19LSFD.png',
];
