require('dotenv').config()

const mineflayer = require("mineflayer");
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { GoalFollow, GoalNear } = goals

const State = require('./enums/states.js')
const {
  isWood,
  isNaturalWood,
  findNearestTree
} = require('./utils/treeDetector.js')

const bed = (b) => b.name.endsWith('_bed');
// const woodBlock = (b) => b.name.endsWith('_log') || b.name.endsWith('_wood');

var settings = {
    username: "woodchopper",
    host: process.env.SERVER_NAME,
};

const bot = mineflayer.createBot(settings);

bot.loadPlugin(pathfinder);

let mode = State.IDLE





bot.once('spawn', ()=> {
    const mcData = require('minecraft-data')(bot.version)
    bot.movements = new Movements(bot, mcData)
})

bot.on('physicsTick', async () => {
    try{
        await switchState()
    } catch (e){
        console.error(e);
    }
})
//TODO: needs optimisation
bot.on('time', async () =>  {
    if (bot.time.isDay) return;
    if (bot.isSleeping) return;

    const nearBed = bot.findBlock({
        matching: bed,
        maxDistance:64
    })

    // console.log(nearBed)

    if(!bed) {
        bot.chat('No bed found!')
    }

    try {
        await bot.sleep(nearBed)
        bot.chat('Sleeping!')
    } catch {
        bot.chat('Cannot sleep!')
    }
})

bot.on('chat', async (username, message)=> {
    if(username === bot.username) return;

    if(message === 'follow'){
        mode = State.FOLLOW;
        const player = bot.players[username]?.entity;
        if(!player) {
            bot.chat(`Cannot find ${username}!`)
            return;
        }
        bot.pathfinder.setGoal(new GoalFollow(player, 5), true)
        bot.chat(`Following ${username}!`)
    }

    if(message === 'stop'){
        mode = State.IDLE;
        bot.pathfinder.setGoal(null)
        bot.chat('Stopped')
    }

    if(message === 'chop'){
        mode = State.CHOP_TREE;
        bot.chat('Chopping trees!')
        chopLoop()
    }

    if(message === 'drop') {
        dropAll();
    }

    if(message === 'findtree'){
        const tree = findNearestTree(bot);
        bot.chat(tree)
    }
})

async function chopLoop(){
    while(mode === State.CHOP_TREE){
        const block = bot.findBlock({
            matching: isWood,
            maxDistance: 32
        })

        if(!block){
            bot.chat('Cannot find a tree nearby!')
            sleep(3000)
            continue
        }

        await chopTree(block)
        sleep(800)
    }
}

async function chopTree (block) {
    let current = block;

    while( current && isWood(current) && mode===State.CHOP_TREE) {
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


function sleep(ms){
    return new Promise(resolve => setTimeout(resolve,ms))
}

async function switchState() {
    switch (mode) {
        case State.IDLE:
            return

        case State.CHOP_TREE:
            return chopTree()

        case State.EAT:
            return eat()

        case State.SLEEP:
            return sleep()
    }
}
