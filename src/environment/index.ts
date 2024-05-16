export const environment = {
    url: process.env.FORUM_URL,
    discord_id: process.env.DISCORD_TOKEN, // this needs replacing with your bot token from discord.com/developers/applications
    username: process.env.FORUM_USERNAME,
    password: process.env.FORUM_PASSWORD, // this needs replacing with the password of the 'Police Administration' account
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
    'Police Detective II (Supervisor)',
    'Police Detective III',
    'Police Sergeant I (Probationary)',
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
    'https://police.lsgov.us/images/ranks/RESERVEOFCR2-JAN2022.png',
    'https://police.lsgov.us/images/ranks/RESERVEOFCR1-JAN2022.png',
    'https://police.lsgov.us/images/ranks/PO1-JAN2022.png',
    'https://police.lsgov.us/images/ranks/PO2-JAN2022.png',
    'https://police.lsgov.us/images/ranks/PO3-JAN2022.png',
    'https://police.lsgov.us/images/ranks/PO31-JAN2022.png',
    'https://police.lsgov.us/images/ranks/PO31-JAN2022.png',
    'https://police.lsgov.us/images/ranks/DET1-JAN2022.jpg',
    'https://police.lsgov.us/images/ranks/DET2-JAN2022.jpg',
    'https://police.lsgov.us/images/ranks/SEPT-2023-DET2-SPVR.jpg',
    'https://police.lsgov.us/images/ranks/SEPT-2023-DET3.jpg',
    'https://police.lsgov.us/images/ranks/SEPT-2023-PROBSGT.jpg',
    'https://police.lsgov.us/images/ranks/AUG2023-SGT1.jpg',
    'https://police.lsgov.us/images/ranks/AUG2023-SGT2.jpg',
    'https://police.lsgov.us/images/ranks/AUG2023-LT1.jpg',
    'https://police.lsgov.us/images/ranks/AUG2023-LT2.jpg',
    'https://police.lsgov.us/images/ranks/CPT1-JAN2022.png',
    'https://police.lsgov.us/images/ranks/CPT2-JAN2022.png',
    'https://police.lsgov.us/images/ranks/CPT3-JAN2022.png',
    'https://police.lsgov.us/images/ranks/CMDR-JAN2022.jpg',
    'https://police.lsgov.us/images/ranks/DEPCHIEF-JAN2022.jpg',
    'https://police.lsgov.us/images/ranks/ASSTCHIEF-JAN2022.jpg',
    'https://police.lsgov.us/images/ranks/CHIEF-JAN2022.jpg',
    'https://police.lsgov.us/images/ranks/LSFD-LSN-JAN2022.png',
    'https://police.lsgov.us/images/ranks/LSFD-LSN-JAN2022.png',
];
