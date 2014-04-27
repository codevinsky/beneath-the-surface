'use strict';
var Enemy = require('./enemy');
var Utils = require('../plugins/utils');
var GameManager = require('../plugins/GameManager');

var CommonCold = function(game, x, y) {
  Enemy.call(this, game, x, y, CommonCold.SIZE, CommonCold.COLOR,1);
  this.anchor.setTo(0.5, 0.5);

  this.game.physics.arcade.enableBody(this);

  this.automataOptions = {
    forces: {
      maxVelocity: 50
    },
    wander: {
      enabled: true 
    },
    flee: {
      target: GameManager.get('player'),
      enabled: true,
      viewDistance: 200
    },
    game: {
      debug: false
    }
  };
  
};

CommonCold.prototype = Object.create(Enemy.prototype);
CommonCold.prototype.constructor = CommonCold;

CommonCold.SIZE = 16;
CommonCold.COLOR = '#33d743';

CommonCold.prototype.update = function() {
  Enemy.prototype.update.call(this);
  // write your prefab's specific update code here
  
};

CommonCold.prototype.createTexture = function() {
  this.bmd.clear();
  CommonCold.drawBody(this.bmd.ctx, this.size, this.color);
  this.bmd.render();
  this.bmd.refreshBuffer();
};

CommonCold.drawBody = function(ctx, size, color, lineWidth) {
  lineWidth = lineWidth || 1;
  var lineColor = '#258c2f';
  ctx.lineWidth = lineWidth;
  ctx.fillStyle = color;
  ctx.strokeStyle = lineColor;
  
  ctx.beginPath();

  Utils.polygon(ctx, size/2, size/2, size/2 ,6,-Math.PI/2);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  Utils.polygon(ctx, size/2, size/2, size/2 ,6,-Math.PI/2);
  ctx.stroke();
};

module.exports = CommonCold;
