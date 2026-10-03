const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const { PrismaClient } = require('@prisma/client');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { sanitizeContent } = require('../dist/utils/contentFilter');

const prisma = new PrismaClient();

async function fetchItunesTrack(title, artist, isVideo = false) {
  try {
    const cleanTitle = title.replace(/\(Video\)/i, '').replace(/\(From "[^"]+"\)/i, '').trim();
    const cleanArtist = artist.split('&')[0].trim();
    const query = encodeURIComponent(`${cleanTitle} ${cleanArtist}`);
    const mediaType = isVideo ? 'musicVideo' : 'music';
    const url = `https://itunes.apple.com/search?term=${query}&media=${mediaType}&limit=5`;
    
    console.log(`Searching iTunes: ${cleanTitle} by ${cleanArtist} (${mediaType})...`);
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const track = data.results[0];
      const coverUrl = track.artworkUrl100 
        ? track.artworkUrl100.replace('100x100bb', '600x600bb')
        : '';
      const audioUrl = track.previewUrl || '';
      return { coverUrl, audioUrl, title: track.trackName || title, artist: track.artistName || artist };
    }
  } catch (err) {
    console.warn(`iTunes search error for ${title}:`, err.message);
  }
  return null;
}

async function main() {
  console.log("==================================================");
  console.log("   HEALING SYSTEM & DATA ISSUES FOR REAL USERS    ");
  console.log("==================================================");

  // 1. END STALE LIVE SPEED DATING EVENTS
  console.log("\n1. Ending stale live speed dating events...");
  try {
    const endedEvents = await prisma.$executeRawUnsafe(`
      UPDATE live_speed_date_events
      SET status = 'ended'
      WHERE status = 'live' AND (id = 'evt_live_1789687700353_69ko' OR created_at < now() - INTERVAL '45 minutes');
    `);
    console.log(`✅ Stale live speed dating events ended: ${endedEvents}`);
  } catch (err) {
    console.error("Failed to update live_speed_date_events:", err.message);
  }

  // 2. HEAL MUTILATED MUSIC SHARE MESSAGES
  console.log("\n2. Healing mutilated music share messages...");
  const musicMsgs = await prisma.messages.findMany({
    where: {
      content: { contains: 'MUSIC_SHARE' }
    }
  });

  console.log(`Found ${musicMsgs.length} music share messages. Checking for corruption...`);
  let healedMusicCount = 0;

  for (const msg of musicMsgs) {
    if (!msg.content || !msg.content.includes('[Hidden Contact - Upgrade to Share]')) {
      continue;
    }

    console.log(`\nRepairing message ${msg.id}...`);
    let title = '';
    let artist = '';
    let isJson = false;

    if (msg.content.startsWith('[MUSIC_SHARE:%7B')) {
      // URL-encoded JSON format
      try {
        const jsonStr = decodeURIComponent(msg.content.slice('[MUSIC_SHARE:'.length, -1));
        const parsed = JSON.parse(jsonStr);
        title = parsed.title || '';
        artist = parsed.artist || '';
        isJson = true;
      } catch (e) {
        console.warn('Failed to parse URL-encoded JSON:', e.message);
      }
    } else if (msg.content.startsWith('[MUSIC_SHARE:{"')) {
      // Raw JSON format
      try {
        const jsonStr = msg.content.slice('[MUSIC_SHARE:'.length, -1);
        const parsed = JSON.parse(jsonStr);
        title = parsed.title || '';
        artist = parsed.artist || '';
        isJson = true;
      } catch (e) {
        console.warn('Failed to parse raw JSON:', e.message);
      }
    } else if (msg.content.startsWith('[MUSIC_SHARE:')) {
      // Colon-separated format: [MUSIC_SHARE:Title:Artist:CoverUrl:AudioUrl]
      const parts = msg.content.slice('[MUSIC_SHARE:'.length, -1).split(':');
      if (parts.length >= 2) {
        title = parts[0];
        artist = parts[1];
      }
    }

    if (!title) {
      console.warn(`Could not extract title from message ${msg.id}`);
      continue;
    }

    const isVideo = title.toLowerCase().includes('(video)');
    const itunesData = await fetchItunesTrack(title, artist, isVideo);

    if (itunesData && itunesData.audioUrl) {
      let newContent = '';
      if (isJson) {
        const payload = {
          title: itunesData.title || title,
          artist: itunesData.artist || artist,
          coverUrl: itunesData.coverUrl,
          audioUrl: itunesData.audioUrl,
          videoUrl: isVideo ? itunesData.audioUrl : ''
        };
        newContent = `[MUSIC_SHARE:${encodeURIComponent(JSON.stringify(payload))}]`;
      } else {
        newContent = `[MUSIC_SHARE:${itunesData.title || title}:${itunesData.artist || artist}:${encodeURIComponent(itunesData.coverUrl)}:${encodeURIComponent(itunesData.audioUrl)}]`;
      }

      await prisma.messages.update({
        where: { id: msg.id },
        data: { content: newContent }
      });
      console.log(`✅ Repaired message ${msg.id}: "${title}"`);
      healedMusicCount++;
    } else {
      console.warn(`Could not find fresh audio stream for "${title}" by "${artist}"`);
    }
  }

  console.log(`Total music messages healed: ${healedMusicCount}`);

  // 3. RESOLVE OPEN HARASSMENT REPORT
  console.log("\n3. Resolving harassment report for banned user...");
  try {
    const reportUpdate = await prisma.reports.updateMany({
      where: {
        status: 'open',
        users_reports_reported_idTousers: { is_banned: true }
      },
      data: {
        status: 'resolved'
      }
    });
    console.log(`✅ Resolved reports for banned users: ${reportUpdate.count}`);
  } catch (err) {
    console.error("Failed to update reports:", err.message);
  }

  // 4. SANITIZE SPAM MESSAGES (NIHARIKA)
  console.log("\n4. Sanitizing historical spam contact leaks in chat messages...");
  const spamMsgs = await prisma.messages.findMany({
    where: {
      OR: [
        { content: { contains: '78715 53438' } },
        { content: { contains: '@Nihasmiley1996' } }
      ]
    }
  });

  console.log(`Found ${spamMsgs.length} messages with contact leak strings.`);
  for (const sm of spamMsgs) {
    const sanitized = sanitizeContent(sm.content);
    if (sanitized !== sm.content) {
      await prisma.messages.update({
        where: { id: sm.id },
        data: { content: sanitized }
      });
      console.log(`✅ Sanitized message ${sm.id}`);
    }
  }

  console.log("\n🎉 Healing script complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma['$disconnect']());
