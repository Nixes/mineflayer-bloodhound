var vec3 = require('vec3');
var eventEmitter = require('events').EventEmitter;

module.exports = init;

const max_melee_dist = 6; // the maxiumum reach of a melee attack (in blocks) for correlation
const max_delta_time = 10; // the maxiumum allowed delta time for attack correlation
const max_delta_yaw_per = 10; // maxiumum allowed difference between direction the attack came from and the direction a possible attacker was facing
const max_age_cleanup = 20; // the maxiumum age of an entry from the current time
const max_events_size_cleanup = 10; // maxiumum number of events in each array before triggering cleanup

function init(mineflayer) {
  function inject(bot) {
    // private variables
    let last_hurts = []; // {enity_hurt, time}
    let last_attacks = []; // {entity_attacking, time}

    bot.bloodhound = {};
    bot.bloodhound.yaw_correlation_enabled = false;

    /**
     * calculate head yaw equivalent between the attacker and victim in radians
     * @param attacker
     * @param victim
     * @returns {number}
     */
    function CalculateAttackYaw(attacker, victim) {
      let yaw = Math.atan2(victim.position.z - attacker.position.z, -(victim.position.x - attacker.position.x)); // one of these was inverted to change the direction of rotation
      yaw += Math.PI/2; // add +90 deg offset
      if (yaw < 0) yaw += 2*Math.PI; // convert angle to radians

      return yaw;
    }

    /**
     * returns true if the yaw of the attacker and the attack direction are under max_delta_yaw_per
     * @param attacker
     * @param victim
     * @returns {boolean}
     */
    function TestAttackYaw(attacker,victim) {
      let delta_attack_yaw_per = Math.abs(CalculateAttackYaw(attacker, victim) - attacker.headYaw) / (2 * Math.PI) * 100;
      //console.log("Delta Attack Yaw Per: "+ delta_attack_yaw_per);
      return delta_attack_yaw_per < max_delta_yaw_per;
    }

    /**
     * this function cleans up entries from last_hurts and last_attacks that are way too old
     */
    function CleanUpHurts() {
      const min_time = new Date() - max_age_cleanup;
      for (let i = last_hurts.length-1; i > 0 ; i--) { // running in reverse allows us to remove more than one element
        if (last_hurts[i].time < min_time) {
          last_hurts.splice(i,1);
        }
      }
    }

    function CleanUpAttacks () {
      const min_time = new Date() - max_age_cleanup;
      for (let i = last_attacks.length-1; i > 0 ; i--) {
        if (last_attacks[i].time < min_time) {
          last_attacks.splice(i,1);
        }
      }
    }

    /**
     * Cleans up hurts and attacks that were used in this run
     */
    function CleanUsedEvents() {
      // running in reverse allows us to remove more than one element
      for (let i = last_hurts.length-1; i > 0 ; i--) {
        if (last_hurts[i].used) {
          last_hurts.splice(i,1);
        }
      }

      for (let i = last_attacks.length-1; i > 0 ; i--) {
        if (last_attacks[i].used) {
          last_attacks.splice(i,1);
        }
      }
    }

    /**
     *
     * @param {number} hurt_index
     * @param {number} attack_index
     */
    function CorrelateAttack(hurt_index,attack_index) {
      const hurt = last_hurts[hurt_index];
      const attack = last_attacks[attack_index];

      // see if it was timed close enough to be related
      const delta_time = Math.abs(hurt.time - attack.time);
      if (delta_time > max_delta_time) { return; }
      //console.log("Matched Time: "+delta_time);

      // see if it was close enough to be related
      const melee_dist = hurt.entity.position.distanceTo(attack.entity.position);
      if (melee_dist > max_melee_dist) { return; }
      //console.log("Matched Distance: "+melee_dist);

      const weapon = attack.entity.heldItem;

      if (bot.bloodhound.yaw_correlation_enabled === true) {
        if (TestAttackYaw(attack.entity,hurt.entity)) {
          bot.emit("onCorrelateAttack",attack.entity,hurt.entity,weapon);
          // remove the matches, now no longer required
          last_hurts[hurt_index].used = true;
          last_attacks[attack_index].used = true;
        }
      } else {
        bot.emit("onCorrelateAttack",attack.entity,hurt.entity,weapon);
        // remove the matches, now no longer required
        last_hurts[hurt_index].used = true;
        last_attacks[attack_index].used = true;
      }
    }

    function CorrelateAttacks() {
      // perform cleanup if we've got quite too many
      if (last_hurts.length > max_events_size_cleanup) { CleanUpHurts(); }
      if (last_attacks.length > max_events_size_cleanup) { CleanUpAttacks(); }

      // make sure we have enough entries for cross correlation
      if (last_hurts.length === 0) {return;}
      if (last_attacks.length === 0) {return;}

      //console.log("last_hurts len: "+ last_hurts.length + " last_attacks len:" + last_attacks.length);

      // iterate over recent examples to find matches
      for (let hurt_index = 0; hurt_index < last_hurts.length;hurt_index++) {
        // skip hurts that have already been used
        if (last_hurts[hurt_index].used) continue;
        for (let attack_index = 0; attack_index < last_attacks.length; attack_index++) {
          // skip attacks that have already been used
          if (last_attacks[attack_index].used) continue;
          CorrelateAttack(hurt_index,attack_index);
        }
      }
      CleanUsedEvents();
    }

    /**
     *
     * @param entity
     * @param time
     * @return {{time: *, used: boolean, entity: *}}
     */
    function MakeEvent(entity, time) {
      return {"entity":entity,"time":time, used: false};
    }

    bot.on("entityHurt",function (entity) {
      //console.log("hurt");
      const time = new Date();
      last_hurts.push( MakeEvent(entity,time) );
      CorrelateAttacks();
    });

    bot.on("entitySwingArm",function (entity) {
      //console.log("armswing")
      const time = new Date();
      last_attacks.push( MakeEvent(entity,time) );
      CorrelateAttacks();
    });
  }
  return inject;
}
