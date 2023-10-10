import { Bot, InlineKeyboard } from "grammy";
import * as dotenv from 'dotenv';

dotenv.config(); // Load environment variables from the .env file

const botKey = process.env.TELEGRAM_API_KEY;

if (!botKey) {
  throw new Error("Telegram API key not found in the environment variables.");
}
//Initialize the bot
const bot = new Bot(botKey)

//variable initialization
let cookies = 0
let point = 1
let cookieCountMessageId:any = null
let buyUpgradesMessageId: any = null
let profileMessageId: any = null

let gameStarted = false

//set bot commands
const setCommands = async () => {
  await bot.api.setMyCommands([
    {command: 'reset', description: 'reset the game'},
    {command: 'play', description: 'initialize the play buttons'},
  ])
}
setCommands()


bot.command('start', (ctx) => {
  if(!gameStarted) {
    const welcomeMessage = `
    <b>Welcome to FleetCookies Game Bot! 🍪</b> 

    Click the 'Cookie' button to earn cookies you can use for later upgrades.

    Click /play to start the game!
    `
    ctx.reply(welcomeMessage, {parse_mode: 'HTML'})
    
    gameStarted = true
  }
  else{
    ctx.reply("The game has already started!");
  }
    
})

// Command to restart the game
bot.command('reset', async (ctx) => {
   // Delete all previous messages, including inline keyboard buttons
   if (cookieCountMessageId) {
    await bot.api.deleteMessage(ctx.chat.id, cookieCountMessageId);
    cookieCountMessageId = null;
  }
  if (buyUpgradesMessageId) {
    await bot.api.deleteMessage(ctx.chat.id, buyUpgradesMessageId);
    buyUpgradesMessageId = null;
  }
  if (profileMessageId) {
    await bot.api.deleteMessage(ctx.chat.id, profileMessageId);
    profileMessageId = null;
  }

  // Reset all game-related variables to their initial values
  cookies = 0;
  point = 1;
  upgradesOwned = [];
  gameStarted = false;

  // Reset the message IDs
  cookieCountMessageId = null;
  buyUpgradesMessageId = null;
  profileMessageId = null;

  // Send a message to inform the user that the game has been restarted
  ctx.reply('The game has been restarted! You can start a new game by clicking /start.');
});


//Buttons to be clicked
const keyboards = new InlineKeyboard()
  .row()
  .text('Cookie')
  .text('Check Stats')
  .row()
  .text('Buy Upgrades')
  

// Play command to initialize the game
bot.command('play', (ctx) => {
  ctx.reply('Options: ', {
    reply_markup: keyboards,
  })
})


// When "Cookie" button is clicked
bot.callbackQuery('Cookie', async (ctx) => {
  cookies += point;
  const username = ctx.from.username || 'User'

  // Check if ctx.chat exists before accessing its properties
  if (ctx.chat) {
    if (cookieCountMessageId) {
      const cookieCountText = `
*Hello ${username},*
        
You now have ${cookies} cookies!
      `;
      await bot.api.editMessageText(ctx.chat.id, cookieCountMessageId, cookieCountText, {
        parse_mode: 'Markdown',
      });
    } 
    else {
      const cookieCountText = `
*Hello ${username}*
        
You now have ${cookies} cookies!
      `;
      const message = await ctx.reply(cookieCountText, { parse_mode: 'HTML' });
      cookieCountMessageId = message.message_id;
    }

    //remove the upgrade message if it exists
    if(buyUpgradesMessageId){
      console.log(buyUpgradesMessageId)
      await bot.api.deleteMessage(ctx.chat.id, buyUpgradesMessageId)
      buyUpgradesMessageId = null
    }
    if(profileMessageId){
      console.log(profileMessageId)
      await bot.api.deleteMessage(ctx.chat.id, profileMessageId)
      profileMessageId = null
    }

  }
}

);



const upgrades = [
  {name: 'Double', price: 5},
  {name: 'Powerbump', price: 10}
]
let upgradesOwned:any[] = []


// When "Buy Upgrades" button is clicked
bot.callbackQuery('Buy Upgrades', async (ctx) => {
  if (ctx.chat) {
    const username = ctx.from.username || 'User';

    // Delete the previous Buy Upgrades message if it exists
    if (buyUpgradesMessageId) {
      await bot.api.deleteMessage(ctx.chat.id, buyUpgradesMessageId);
      buyUpgradesMessageId = null;
    }

    const availableUpgrades = upgrades
      .filter((upgrade) => !upgradesOwned.includes(upgrade.name))
      .map((upgrade) => `${upgrade.name} - ${upgrade.price} cookies`);

    if (availableUpgrades.length > 0) {
      const upgradeMessage = `
      *Hello, ${username}!*

      *Available Upgrades:*

      ${availableUpgrades.join('\n')}

      Reply with the name of the upgrade you want to buy!
      `;

      // Send a new Buy Upgrades message
      const message = await ctx.reply(upgradeMessage, { parse_mode: 'Markdown' });
      buyUpgradesMessageId = message.message_id;
    } 
    else {
      ctx.reply("You've purchased all available upgrades");
    }

    if(cookieCountMessageId){
      console.log(cookieCountMessageId)
      await bot.api.deleteMessage(ctx.chat.id, cookieCountMessageId)
      cookieCountMessageId = null
    }
    if(profileMessageId){
      console.log(profileMessageId)
      await bot.api.deleteMessage(ctx.chat.id, profileMessageId)
      profileMessageId = null
    }
  
  }

});


const doublePoint = () => {
  point = 2
}

const powerBump = () => {
  point = 10
}

//when a message is clicked 
bot.on('message:text', async (ctx) => {
    const selectedUpgradeName = ctx.message.text.trim()
    const selectedUpgrade = upgrades.find((upgrade) => upgrade.name === selectedUpgradeName)
 
    if(selectedUpgrade) {
      if(cookies >= selectedUpgrade.price) {
        cookies -= selectedUpgrade.price
        upgradesOwned.push(selectedUpgrade.name)

        
        if(selectedUpgrade.name.toLowerCase() === 'double') {
          doublePoint() 
          ctx.reply(`
            You have successfully purchased${selectedUpgrade.name}!
            Your mining point has been doubled.
          `
          )
        }
        else if(selectedUpgrade.name.toLowerCase() === 'powerbump') {
          powerBump() 
          ctx.reply(`
            You have successfully purchased${selectedUpgrade.name}!
            Your mining point has been increased to 10.
          `
          )
        }
        
               
      } 
      else {
        ctx.reply("You don't have enough cookies to purchase this upgrade. Keep Mining!")
      }
    }
})




// When "Check Stats" button is clicked
bot.callbackQuery('Check Stats', async (ctx) => {
  if (ctx.chat) {
    const username = ctx.from.username || 'User';

    // Delete the previous Check Stats message if it exists
    if (profileMessageId) {
      await bot.api.deleteMessage(ctx.chat.id, profileMessageId);
      profileMessageId = null;
    }

    const profileText = `
      *Profile Information*

      *Username:* ${username}
      *Available Cookies:* ${cookies}
      *Upgrades Done:* ${upgradesOwned.length}
    `;

    // Send a new Check Stats message
    const message = await ctx.reply(profileText, { parse_mode: 'Markdown' });
    profileMessageId = message.message_id;


    if(cookieCountMessageId){
      console.log(cookieCountMessageId)
      await bot.api.deleteMessage(ctx.chat.id, cookieCountMessageId)
      cookieCountMessageId = null
    }

    if(buyUpgradesMessageId){
      console.log(buyUpgradesMessageId)
      await bot.api.deleteMessage(ctx.chat.id, buyUpgradesMessageId)
      buyUpgradesMessageId = null
    }
  }
});





bot.start()