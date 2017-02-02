var mineflayer = require('mineflayer');
var vec3 = require('vec3');
var bloodhoundPlugin = require('../')(mineflayer);

var bot = mineflayer.createBot({
  username: "Player",
});

bloodhoundPlugin(bot);

bot.on('onCorrelateAttack', function (victim,attacker,weapon) {
  if (weapon) {
    console.log("Entity: "+ (victim.displayName || victim.username ) + " attacked by: " + (attacker.displayName|| attacker.username) + " with: " + weapon.displayName);
  } else {
    console.log("Entity: "+ (victim.displayName || victim.username ) + " attacked by: " + (attacker.displayName|| attacker.username) );
  }
});
