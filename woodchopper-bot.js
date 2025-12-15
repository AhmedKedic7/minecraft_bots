require('dotenv').config()

const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { GoalFollow, GoalNear } = goals

var settings = {
    username: "woodchopper",
    host: process.env.SERVER_NAME,
};

const bot = mineflayer.createBot(settings);

bot.loadPlugin(pathfinder);

let mode = 'idle'

// const woodBlock = (b) => b.name.endsWith('_log') || b.name.endsWith('_wood');



bot.once('spawn', ()=> {
    const mcData = require('minecraft-data')(bot.version)
    bot.movements = new Movements(bot, mcData)
})

bot.on('time', async () =>  {
    if (!bot.time.isNight) return;
    if (bot.isSleeping) return;

    const bed = bot.findBlock({
        matching: '_bed'
    })

    if(!bed) {
        bot.chat('No bed found!')
    }

    try {
        await bot.sleep(bed)
        bot.chat('Sleeping!')
    } catch {
        bot.chat('Cannot sleep!')
    }
})

bot.on('chat', async (username, message)=> {
    if(username === bot.username) return;

    if(message === 'follow'){
        mode = 'follow';
        const player = bot.players[username]?.entity;
        if(!player) {
            bot.chat(`Cannot find ${username}!`)
            return;
        }
        bot.pathfinder.setGoal(new GoalFollow(player, 5), true)
        bot.chat(`Following ${username}!`)
    }

    if(message === 'stop'){
        mode = 'idle';
        bot.pathfinder.setGoal(null)
        bot.chat('Stopped')
    }

    if(message === 'chop'){
        mode = 'chop';
        bot.chat('Chopping trees!')
        chopLoop()
    }

    if(message === 'drop') {
        dropAll();
    }
})

async function chopLoop(){
    while(mode === 'chop'){
        const block = bot.findBlock({
            matching: isWood,
            maxDistance: 32
        })

        if(!block){
            bot.chat('Cannot find a tree nearby!')
            sleep(3000)
            continue
        }

        chopTree(block)
        sleep(800)
    }
}

async function chopTree (block) {
    let current = block;

    while( current && isWood(current)) {
        await bot.pathfinder.goto(
            new GoalNear(current.position.x, current.position.y, current.position.z, 1)
        )
        try {
            await bot.dig(current)
        } catch (e){
            bot.chat('Cant chop!')
            break
        }
        current = bot.blockAt(current.position.offset(0, 1, 0))
    }
    bot.chat('Tree chopped succesfully')
    chopTree(block)
}

//old method for chopping the tree
// async function chopNearestTree() {
//     if(mode !== 'chop') return;

//     const block = bot.findBlock({
//         matching: woodBlock,
//         maxDistance: 32
//     })

//     let current = block;

//     if(!block){
//         bot.chat('No tree found!')
//         return;
//     }

//     await bot.pathfinder.goto(
//         new GoalNear(block.position.x, block.position.y, block.position.z,1)
//     )

//     try{
//         await bot.dig(block)
//         bot.chat('Tree chopped!')

//     } catch {
//         bot.chat('Failed to chop!')
//     }
    
//     current = bot.blockAt(current.position.offset(0,1,0));
// }


async function dropAll() {
    bot.chat('Dropping items!')
    for(const item of bot.inventory.items()){
        try{
            await bot.tossStack(item);
        } catch {}
    }
    bot.chat('Done')
} 


function isWood(block){
    return block && (block.name.endsWith('_log') || block.name.endsWith('_wood'))
}

function sleep(ms){
    return new Promise(resolve => setTimeout(resolve,ms))
}
