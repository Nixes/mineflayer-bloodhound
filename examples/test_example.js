var mineflayer = require('mineflayer');
var vec3 = require('vec3');
var bloodhoundPlugin = require('../')(mineflayer);

var bot = mineflayer.createBot({
  username: "Player",
});

bloodhoundPlugin(bot);

bot.on('onCorrelateAttack', function (hurtee,attacker,weapon) {
  if (weapon) {
    console.log("Entity: "+ (hurtee.displayName || hurtee.username ) + " attacked by: " + (attacker.displayName|| attacker.username) + " with: " + weapon.displayName);
  } else {
    console.log("Entity: "+ (hurtee.displayName || hurtee.username ) + " attacked by: " + (attacker.displayName|| attacker.username) );
  }
});
