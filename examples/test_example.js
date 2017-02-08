var mineflayer = require('mineflayer');
var vec3 = require('vec3');
var bloodhoundPlugin = require('../')(mineflayer);

var bot = mineflayer.createBot({
  username: "Player",
});

bloodhoundPlugin(bot);

// turn on yaw correlation, for better distinguishing of attacks within short radius
bot.bloodhound.yaw_correlation_enabled = true;

bot.on('onCorrelateAttack', function (attacker,victim,weapon) {
  if (weapon) {
    console.log("Entity: "+ (victim.displayName || victim.username ) + " attacked by: " + (attacker.displayName|| attacker.username) + " with: " + weapon.displayName);
  } else {
    console.log("Entity: "+ (victim.displayName || victim.username ) + " attacked by: " + (attacker.displayName|| attacker.username) );
  }
});
