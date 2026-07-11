const config = await import('../config/prisma.js');
const prisma = config.prisma;

async function main() {
    const response = await fetch('https://api.riftcodex.com/cards');
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
    const data = await response.json();
    const { total, page, size, pages, items } = data || {};
    const cards = items || [];
    console.log(`Fetched cards: total=${total} page=${page}/${pages} size=${size}`);
  
    let imported = 0;
    for (const card of cards) {
        await prisma.set.upsert({
  where: {
    id: card.set.set_id
  },
  update: {
    label: card.set.label
  },
  create: {
    id: card.set.set_id,
    label: card.set.label
  }
});
        const savedCard = await prisma.card.upsert({
            where: { apiId: card.id },
            update: {
                name: card.name,
                cleanName: card.metadata?.clean_name,
                collectorNumber: card.collector_number,
                energy: card.attributes?.energy,
                might: card.attributes?.might,
                power: card.attributes?.power,
                imageUrl: card.media?.image_url,
                artist: card.media?.artist,
                accessibility: card.media?.accessibility_text,
                richText: card.text?.rich,
                plainText: card.text?.plain,
                flavorText: card.text?.flavour,
                updatedOn: card.metadata?.updated_on ? new Date(card.metadata.updated_on) : undefined
            },
            create: {
                apiId: card.id,
                riftboundId: card.riftbound_id,
                tcgplayerId: card.tcgplayer_id,
                name: card.name,
                cleanName: card.metadata?.clean_name,
                collectorNumber: card.collector_number,
                energy: card.attributes?.energy,
                might: card.attributes?.might,
                power: card.attributes?.power,
                type: card.classification?.type?.toUpperCase(),
                supertype: card.classification?.supertype,
                rarity: card.classification?.rarity?.toUpperCase(),
                imageUrl: card.media?.image_url,
                artist: card.media?.artist,
                accessibility: card.media?.accessibility_text,
                richText: card.text?.rich,
                plainText: card.text?.plain,
                flavorText: card.text?.flavour,
                orientation: card.orientation?.toUpperCase(),
                alternateArt: card.metadata?.alternate_art,
                overnumbered: card.metadata?.overnumbered,
                signature: card.metadata?.signature,
                updatedOn: card.metadata?.updated_on ? new Date(card.metadata.updated_on) : undefined,
                setId: card.set?.set_id
            }
        });

        // Domains: upsert and link
        for (const domain of card.classification?.domain || []) {
            const savedDomain = await prisma.domain.upsert({
                where: { name: domain },
                update: {},
                create: { name: domain }
            });

            try {
                await prisma.cardDomain.create({
                    data: { cardId: savedCard.id, domainId: savedDomain.id }
                });
            } catch (e) {
                console.warn(`Failed to link card ${savedCard.id} with domain ${savedDomain.id}: ${e.message}`);
            }
        }

        // Tags: upsert (no linking assumed here)
        for (const tag of card.tags || []) {
            await prisma.tag.upsert({
                where: { name: tag },
                update: {},
                create: { name: tag, official: true }
            });
        }

        imported++;
    }

    console.log(`Imported ${imported} cards`);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
