# mineflayer-bloodhound

Is a [mineflayer](https://github.com/PrismarineJS/mineflayer) plugin that allows the bot to find who is responsible for damage to another entity.

A simple example of its usage can be found in the /examples folder

Attack type support:
- [x] melee damage (swords, punching etc.)
- [ ] projectiles (arrows, potions etc.) - planned

Bloodhound is not 100% reliable and is at the mercy of bot and player latency in many circumstances. Any ideas for more events to track and ideas for improvements to the correlation system are most welcome.

## Configuration
To reduce false positives in close quarters combat with multiple entities enable yaw correlation with
```js
bot.bloodhound.yaw_correlation_enabled = true;
```
this has the disadvantage of producing slightly more false negatives when the attacking entity has high latency.
