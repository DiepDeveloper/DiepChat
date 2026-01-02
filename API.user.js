// ==UserScript==
// @name         Tank Image
// @description  Tank Image
// @match        https://diep.io/*
// @grant        none
// ==/UserScript==

Tank = {
    0: "Tank", 1: "Twin", 2: "Triplet", 3: "Triple Shot",
    4: "Quad Tank", 5: "Octo Tank", 6: "Sniper", 7: "Machine Gun",
    8: "Flank Guard", 9: "Tri-Angle", 10: "Destroyer", 11: "Overseer",
    12: "Overlord", 13: "Twin Flank", 14: "Penta Shot", 15: "Assassin",
    16: "Arena Closer", 17: "Necromancer", 18: "Triple Twin", 19: "Hunter",
    20: "Gunner", 21: "Stalker", 22: "Ranger", 23: "Booster",
    24: "Fighter", 25: "Hybrid", 26: "Manager", 27: "Mothership",
    28: "Predator", 29: "Sprayer", 31: "Trapper", 32: "Gunner Trapper",
    33: "Overtrapper", 34: "Mega Trapper", 35: "Tri-Trapper", 36: "Smasher",
    38: "Landmine", 39: "Auto Gunner", 40: "Auto 5", 41: "Auto 3",
    42: "Spread Shot", 43: "Streamliner", 44: "Auto Trapper", 45: "Dominator",
    46: "Dominator", 47: "Dominator", 48: "Battleship", 49: "Annihilator",
    50: "Auto Smasher", 51: "Spike", 52: "Factory", 53: "",
    54: "Skimmer", 55: "Rocketeer",  56: "Glider", 57: "Spike",
    58: "Auto Tank", 59: "Overseer Gunner", 60: "Dual-Barrel", 61: "Pellet Shot",
    62: "Shotgun", 63: "Glider", 64: "Firework"
}

function getTankImage(tankName) {
    const URL = 'https://diep.io/old-assets/assets/diep/tanks/tank_';
    let TankID = 0;
    for(const[ID,TankName] of Object.entries(Tank)) {if (TankName===tankName) {TankID=Number(ID); return `${URL}${TankID}.png`;}}
    return `${URL}${TankID}.png`;
}

async function updatePlayer_POST(FirstTime = false) {
    GM_xmlhttpRequest({
        method: 'POST',
		url: 'https://api.diep.network/updatePlayer',
        headers: { 'Content-Type': 'application/json' },
        data: JSON.stringify({
            discord_id: localStorage.getItem('discord_id'),
            discord_username: localStorage.getItem('discord_username'),
            name_color: localStorage.getItem('saved_name_color'),
            mode_selected: localStorage.getItem('selected_gamemode'),
            invitation_link: localStorage.getItem('invitation_link'),
            username: localStorage.getItem('player_name'),
            last_connexion: localStorage.getItem('last_connexion')
        }),
        onload: function(response) {
            if (response.status >= 200 && response.status < 300) { if (FirstTime) updatePlayer(); }
			else { console.log('Failed to send POST.updatePlayer', response.status, response.responseText); }
        },
        onerror: function(err) { console.log('Failed to send POST.updatePlayer', err); }
    });
}

async function initPlayer() {

    function allInfoAvailable() {
        const discord_id = localStorage.getItem('discord_id');
        const discord_username = localStorage.getItem('discord_username');
        const name_color = localStorage.getItem('saved_name_color');
        const mode_selected = localStorage.getItem('selected_gamemode');
        const invitation_link = localStorage.getItem('invitation_link');
        const username = localStorage.getItem('player_name');
        const last_connexion = localStorage.getItem('last_connexion');
        return (
			discord_id !== null &&
			discord_username !== null &&
			name_color !== null &&
			mode_selected !== null &&
			invitation_link &&
			username !== null &&
			last_connexion !== null
		);
    }

    async function update() {
        if (allInfoAvailable()) {await updatePlayer_POST(true);}
		else {setTimeout(update, 100);}
    }

    update();
}

function updatePlayer() {
	const keys = ['discord_id','discord_username','saved_name_color','invitation_link','player_name','last_connexion'];
	let previous = {};
	for (const key of keys) {previous[key] = localStorage.getItem(key);}
	let usernameLastSent = 0;
	let usernamePending = false;
	let usernameLastValue = previous['player_name'];

	setInterval(() => {
		let changed = false;
		let usernameChanged = false;
		for (const key of keys) {
			const current = localStorage.getItem(key);
			if (current !== previous[key]) {
				if (key === 'player_name') { usernameChanged = true; usernameLastValue = current; }
				else { changed = true; }
				previous[key] = current;
			}
		}

		if (changed) {updatePlayer_POST();}
		if (usernameChanged) {
			const now = Date.now();
			if (now - usernameLastSent >= 1000) { updatePlayer_POST(); usernameLastSent = now; usernamePending = false; }
			else { if (!usernamePending) {
					usernamePending = true;
					setTimeout(() => {
						updatePlayer_POST();
						usernameLastSent = Date.now();
						usernamePending = false;
					}, 1000 - (now - usernameLastSent));
				}
			}
		}
	}, 100);
}

function getNewMessages() {
	if (window.diepChatWS && window.diepChatWS.readyState === 1) return;
	let ws;
	try { ws = new WebSocket('wss://api.diep.network'); window.diepChatWS = ws; } catch (e) { return; }
	ws.onopen = () => { try { startMainSendLoop(ws); } catch (e) {} };
	ws.onclose = () => { try { stopMainSendLoop(); } catch (e) {} setTimeout(getNewMessages, 10); };
	ws.onerror = (e) => { console.warn('WebSocket error', e); };
	ws.onmessage = async (event) => {
		try {
			let data = event.data;
			if (data instanceof Blob) { data = await data.text(); }
			const info = JSON.parse(data);
			try { updatePresenceFromMessage(info); } catch (e) {}

			const discord_id = info.discord_id;
			const content = info.content;
			if (discord_id && content) {
				const user = info.user || {
					discord_id: discord_id,
					username: info.username || null,
					name_color: info.name_color || null,
					invitation_link: info.invitation_link || null,
					mode_selected: info.mode_selected || null
				};
				displayServerMessage(user, content);
			}
		} catch (e) { console.warn('Error processing server message.', e); }
	};
}

const STYLE_ID = 'diep-chat-style';
const CONTAINER_ID = 'diep-chat-overlay';

window.__Presence = window.__Presence || new Map();
window.__LastMessage = window.__LastMessage || new Map();

let MainInterval = null;
function startMainSendLoop(ws) {
	try {
		if (!ws || ws.readyState !== 1) return;
		if (MainInterval) clearInterval(MainInterval);
		MainInterval = setInterval(() => {
			try {
				const discord_id = localStorage.getItem('discord_id');
				if (!discord_id) return;
				const payload = {
					type: 'status',
					discord_id: discord_id,
					username: localStorage.getItem('player_name') || '',
					discord_username: localStorage.getItem('discord_username') || '',
					name_color: localStorage.getItem('saved_name_color') || '',
					mode_selected: localStorage.getItem('selected_gamemode') || '',
					invitation_link: localStorage.getItem('invitation_link') || ''
				};
				if (window.diepChatWS && window.diepChatWS.readyState === 1) {
					window.diepChatWS.send(JSON.stringify(payload));
				}
			} catch (e) {}
		}, 1000);
	} catch (e) {}
}

function stopMainSendLoop() {
	try { if (MainInterval) { clearInterval(MainInterval); MainInterval = null; } } catch (e) {}
}
function updatePresenceFromMessage(info) {
	try {
		if (!info) return;
		const discord_id = info.discord_id || null;
		if (discord_id) {
			window.__Presence.set(String(discord_id), Date.now());
			window.__LastMessage.set(String(discord_id), { payload: info, lastUpdated: Date.now() });
		}
	} catch (e) {}
}

function displayServerMessage(user, content) {
	let container = document.getElementById(CONTAINER_ID);
	if (!container) { if (typeof createContainer === 'function') container = createContainer(); if (!container) return; }
	container.style.display = 'block';

	if (typeof setChatVisibility === 'function') setChatVisibility(true);
	const messages = container.querySelector('.chat-messages');
	const messagesDiv = document.createElement('div');
	const span = document.createElement('span');

	span.textContent = `${user.username || 'An unnamed tank'}: `;
	let color = user.name_color;
	if (typeof color === 'string' && /^\s*\[\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\]\s*$/.test(color)) { const arr = color.match(/\d+/g); if (arr && arr.length === 3) { color = `rgb(${arr[0]},${arr[1]},${arr[2]})`; } }
	span.style.color = color || '#fff';
	span.style.textShadow = '-1px 0 #000, 0 1px #000, 1px 0 #000, 0 -1px #000';
	span.style.fontWeight = 'bold';
	span.style.position = 'relative';

	messagesDiv.appendChild(span);
	messagesDiv.appendChild(document.createTextNode(content));
	messagesDiv.style.margin = '2px 0';
	messagesDiv.style.wordBreak = 'break-word';
	messages.appendChild(messagesDiv);
	messages.scrollTop = messages.scrollHeight;
	
	try { const discord_id = user && (user.discord_id);
		if (discord_id) {
			messagesDiv.style.cursor = 'pointer';
			messagesDiv.addEventListener('click', () => { try { showPlayerInfo(String(discord_id)); } catch (e) { console.warn('showPlayerInfo error.', e); } });
		}
	} catch (e) {}
}
