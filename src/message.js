import '../settings.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import chalk from 'chalk';
import crypto from 'crypto';
import { Jimp } from 'jimp';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import { parsePhoneNumber } from 'awesome-phonenumber';
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type';

import { writeExif } from '../lib/exif.js';
import { checkStatus } from './database.js';
import { getBuffer, fixBytes } from '../lib/function.js';
import { jidNormalizedUser, proto, getBinaryNodeChild, generateWAMessageContent, prepareWAMessageMedia, areJidsSameUser, extractMessageContent, generateMessageID, downloadContentFromMessage, generateWAMessageFromContent, jidDecode, generateWAMessage, getContentType, getDevice } from 'baileys';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const nazePath = fileURLToPath(new URL('../naze.js', import.meta.url));

let nazeHandler = null;
const botStartTime = Date.now();
const groupMetadataTimers = {};

/*
	* Create By Naze
	* Follow https://github.com/nazedev
	* Whatsapp : https://whatsapp.com/channel/0029VaWOkNm7DAWtkvkJBK43
*/

const reloadHandler = async () => {
	try {
		nazeHandler = (await import(`../naze.js?update=${Date.now()}`)).default;
	} catch (err) {
		console.error(chalk.redBright(`[ERROR] ${err}`));
	}
};

reloadHandler();

async function GroupUpdate(naze, m, store) {
	function clearParse(parse) {
		try {
			return JSON.parse(parse);
		} catch {
			return parse;
		}
	}
	if (!m.messageStubType || !m.isGroup) return
	if (global.db?.groups?.[m.chat] && store?.groupMetadata?.[m.chat]) {
		const admin = `@${m.sender.split('@')[0]}`
		const metadata = store.groupMetadata[m.chat];
		const normalizedTarget = clearParse(m.messageStubParameters[0]);
		const type = m.messageStubType;
		const messages = {
			1: 'mereset link grup!',
			21: `mengubah Subject Grup menjadi :\n*${normalizedTarget}*`,
			22: 'telah mengubah icon grup.',
			23: 'mereset link grup!',
			24: `mengubah deskripsi grup.\n\n${normalizedTarget}`,
			25: `telah mengatur agar *${normalizedTarget == 'on' ? 'hanya admin' : 'semua peserta'}* yang dapat mengedit info grup.`,
			26: `telah *${normalizedTarget == 'on' ? 'menutup' : 'membuka'}* grup!\nSekarang ${normalizedTarget == 'on' ? 'hanya admin yang' : 'semua peserta'} dapat mengirim pesan.`,
			29: `telah menjadikan @${normalizedTarget?.id?.split('@')?.[0]} sebagai admin.`,
			30: `telah memberhentikan @${normalizedTarget?.id?.split('@')?.[0]} dari admin.`,
			72: `mengubah durasi pesan sementara menjadi *@${normalizedTarget}*`,
			123: 'menonaktifkan pesan sementara.',
			132: 'mereset link grup!',
			172: `@${normalizedTarget?.pn?.split('@')?.[0]} meminta bergabung`,
		}
		if (naze.public && global.db?.groups?.[m.chat]?.setinfo && messages[type]) {
			await naze.sendMessage(m.chat, { text: `${admin} ${messages[type]}`, mentions: [m.sender, ...((normalizedTarget?.id || normalizedTarget)?.includes('@') ? [`${normalizedTarget.id || normalizedTarget}`] : [])].filter(Boolean)}, { ephemeralExpiration: m.expiration || m?.metadata?.ephemeralDuration || store?.messages[m.chat]?.array?.slice(-1)[0]?.metadata?.ephemeralDuration || 0 })
}
