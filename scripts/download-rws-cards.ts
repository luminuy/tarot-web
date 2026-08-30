import fs from "node:fs";
import path from "node:path";

const PUBLIC_CARDS_DIR = path.join(process.cwd(), "public", "cards");

if (!fs.existsSync(PUBLIC_CARDS_DIR)) {
  fs.mkdirSync(PUBLIC_CARDS_DIR, { recursive: true });
}

const USER_AGENT = "TarotSanctuaryApp/1.0 (https://localhost:3000; contact: developer@tarotapp.org) node-fetch/3.0";

async function main() {
  console.log("🔍 Fetching Rider-Waite 1909 Roses & Lilies category list from Wikimedia Commons...");
  const catUrl =
    "https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Rider-Waite_tarot_deck_(Roses_%26_Lilies)&cmlimit=100&format=json";

  const catRes = await fetch(catUrl, {
    headers: { "User-Agent": USER_AGENT },
  });
  const catData = await catRes.json();
  const members = catData.query?.categorymembers || [];

  const files = members.filter(
    (m: any) => m.title.startsWith("File:RWS1909") && m.title.endsWith(".jpeg")
  );

  console.log(`Found ${files.length} RWS 1909 card files. Fetching download URLs...`);

  for (const f of files) {
    const title: string = f.title;
    let targetName = "";

    const majorMatch = title.match(/RWS1909\s*-\s*(\d{2})\s/i);
    const suitMatch = title.match(/RWS1909\s*-\s*(Wands|Cups|Swords|Pentacles)\s*(\d{2})/i);

    if (majorMatch) {
      targetName = `major-${majorMatch[1]}.jpg`;
    } else if (suitMatch) {
      const suit = suitMatch[1].toLowerCase();
      const num = suitMatch[2];
      targetName = `${suit}-${num}.jpg`;
    }

    if (!targetName) {
      console.log(`Skipping non-card file: ${title}`);
      continue;
    }

    const targetPath = path.join(PUBLIC_CARDS_DIR, targetName);
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 5000) {
      console.log(`✓ ${targetName} already exists and valid.`);
      continue;
    }

    try {
      const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        title
      )}&prop=imageinfo&iiprop=url&format=json`;
      const infoRes = await fetch(infoUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      const infoData = await infoRes.json();
      const pageKey = Object.keys(infoData.query?.pages || {})[0];
      const directUrl = infoData.query?.pages?.[pageKey]?.imageinfo?.[0]?.url;

      if (!directUrl) {
        console.error(`Could not find direct URL for ${title}`);
        continue;
      }

      console.log(`⬇ Downloading ${targetName} from ${title}...`);
      const imgRes = await fetch(directUrl, {
        headers: { "User-Agent": USER_AGENT },
      });
      const arrayBuffer = await imgRes.arrayBuffer();
      if (arrayBuffer.byteLength < 1000) {
        console.error(`Warning: file too small for ${targetName} (${arrayBuffer.byteLength} bytes)`);
      }
      fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
      console.log(`✓ Saved ${targetName} (${(arrayBuffer.byteLength / 1024).toFixed(1)} KB)`);

      // Polite pause
      await new Promise((r) => setTimeout(r, 120));
    } catch (err) {
      console.error(`Error downloading ${targetName}:`, err);
    }
  }

  console.log("🎉 All Rider-Waite 1909 cards processed successfully!");
}

main().catch(console.error);
