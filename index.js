var vec3 = require('vec3');
var eventEmitter = require('events').EventEmitter;

module.exports = init;

var max_melee_dist = 6; // the maxiumum reach of a melee attack (in blocks) for correlation
var max_delta_time = 10; // the maxiumum allowed delta time for attack correlation

var max_delta_yaw_per = 10; // maxiumum allowed difference between direction the attack came from and the direction a possible attacker was facing

var max_age_cleanup = 20; // the maxiumum age of an entry from the current time


function init(mineflayer) {

    function inject(bot) {
      // private variables
      var last_hurts = []; // {enity_hurt, time}
      var last_attacks = []; // {entity_attacking, time}

      bot.bloodhound = {};
      bot.bloodhound.yaw_correlation_enabled = false;

      // calculate head yaw equivalent between the attacker and victim in radians
      function CalculateAttackYaw(attacker, victim) {
        var yaw = Math.atan2( victim.position.z - attacker.position.z , -(victim.position.x - attacker.position.x) ); // one of these was inverted to change the direction of rotation
        yaw += Math.PI/2; // add +90 deg offset
        if (yaw < 0) yaw += 2*Math.PI; // convert angle to radians

        return yaw;
      }

      // returns true if the yaw of the attacker and the attack direction are under max_delta_yaw_per
      function TestAttackYaw(attacker,victim) {
        var delta_attack_yaw_per = Math.abs( CalculateAttackYaw(attacker,victim) - attacker.headYaw ) / (2*Math.PI) * 100;
        console.log("Delta Attack Yaw Per: "+ delta_attack_yaw_per);
        if (delta_attack_yaw_per < max_delta_yaw_per) {
          return true;
        }
        return false;
      }

      // this function cleans up entries from last_hurts and last_attacks that are way too old
      function CleanUpHurts() {
        var min_time = new Date() - max_age_cleanup;
        for (var i = last_hurts.length-1; i > 0 ; i--) { // running in reverse allows us to remove more than one element
          if (last_hurts[i].time < min_time) {
            last_hurts.splice(i,1);
          }
        }

      }

      function CleanUpAttacks () {
        var min_time = new Date() - max_age_cleanup;
        for (var i = last_attacks.length-1; i > 0 ; i--) {
          if (last_attacks[i].time < min_time) {
            last_attacks.splice(i,1);
          }
        }
      }

      function CorrelateAttacks() {
        // perform cleanup if we've got quite too many
        if (last_hurts.length > 10) { CleanUpHurts(); }
        if (last_attacks.length > 10) { CleanUpAttacks(); }

        // make sure we have enough entries for cross correlation
        if (last_hurts.length === 0) {return;}
        if (last_attacks.length === 0) {return;}

        //console.log("last_hurts len: "+ last_hurts.length + " last_attacks len:" + last_attacks.length);

        // iterate over recent examples to find matches
        for (var i = 0; i < last_hurts.length;i++) {
          var hurt = last_hurts[i];
          for (var j = 0; j < last_attacks.length; j++) {
            var attack = last_attacks[j];

            // see if it was timed close enough to be related
            var delta_time = Math.abs(hurt.time - attack.time);
            if (delta_time < max_delta_time) {
              //console.log("Matched Time: "+delta_time);
              // see if it was close enough to be related
              var melee_dist = hurt.entity.position.distanceTo(attack.entity.position);
              if (melee_dist < max_melee_dist) {
                var weapon = attack.entity.heldItem;

                if (bot.bloodhound.yaw_correlation_enabled === true) {
                  if (TestAttackYaw(attack.entity,hurt.entity)) {
                    bot.emit("onCorrelateAttack",attack.entity,hurt.entity,weapon);
                    // remove the matches, now no longer required
                    last_hurts.splice(i,1);
                    last_attacks.splice(j,1);
                  }
                } else {
                  //console.log("Matched Distance: "+melee_dist);
                  bot.emit("onCorrelateAttack",attack.entity,hurt.entity,weapon);
                  // remove the matches, now no longer required
                  last_hurts.splice(i,1);
                  last_attacks.splice(j,1);
                }

              }
            }

          }
        }
      }

      bot.on("entityHurt",function (entity) {
        //console.log("hurt");
        var time = new Date();
        last_hurts.push( {"entity":entity,"time":time} );
        CorrelateAttacks();
      });

      bot.on("entitySwingArm",function (entity) {
        //console.log("armswing")
        var time = new Date();
        last_attacks.push( {"entity":entity,"time":time} );
        CorrelateAttacks();
      });
    }
    return inject;
}
