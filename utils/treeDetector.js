function isWood(block){
    return block && (block.name.endsWith('_log') || block.name.endsWith('_wood'))
}

//TODO: needs fixing
function isNaturalWood(bot, block) {
   if(!isWood(block)) return false;
//    console.log(block)

   
   const below = bot.blockAt(block.position.offset(0, -1, 0));

   if(!below || !below.name.contains('dirt') && !below.name.contains('grass')) {
    return false;
   }

    const offsets = [
        [1,0,0], [-1,0,0],
        [0,0,1], [0,0,-1],
        [0,1,0]
    ]

    for (const [x,y,z] of offsets){
        const b = bot.blockAt(block.position.offset(x,y,z))
        if( b && (b.name.endsWith('_planks') || b.name.contains("stone"))) {
            return false;
        }
    }

    return true;
}

function findNearestTree(bot, maxDistance = 10) {
    return bot.findBlock({
        maxDistance,
        matching: block => isNaturalWood(bot,block)
    })
}

module.exports = {
    isNaturalWood,
    isWood,
    findNearestTree
}