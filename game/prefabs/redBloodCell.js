'use strict';
var Cell = require('./cell');


var RedBloodCell = function(game, x, y, size, color, maxHealth) {
  this.GameManager = require('../plugins/GameManager');
  color = color || RedBloodCell.COLOR;
  size = size || RedBloodCell.SIZE;
  maxHealth = maxHealth || 3;
  Cell.call(this, game, x, y, size, color, maxHealth);

  this.canBeDamaged = true;
  this.panicTween = null;
  this.ouchSound = this.game.add.audio('ouch');
  this.oxygenSound = this.game.add.audio('oxygenPickup');
  this.deathSound = this.game.add.audio('cellDeath');
  this.alive = false;

  this.automataOptions = {
    seek: {
      target: (function() { return this.GameManager.get('oxygen'); }).bind(this),
      priority: 2,
      strength: 1.0,
      viewDistance: this.game.width
    },
    evade: {
      enabled: true,
      target: (function() { return this.GameManager.get('enemies');}).bind(this),
      strength: 1.0,
      viewDistance: 100,
      priority: 1
    },
    flee: {
      target: (function() { return this.GameManager.get('enemies');}).bind(this),
      priority: 1
    },
    wander: {
      strength: 1.0,
      enabled: true
    },
    game: {
      debug: false,
      wrapWorldBounds: false
    },
    forces: {
      maxVelocity: 200
    }
  };


  this.events.onRevived.add(this.onRevived, this);
  this.alive = true;

};

RedBloodCell.prototype = Object.create(Cell.prototype);
RedBloodCell.prototype.constructor = RedBloodCell;

RedBloodCell.SIZE = 16;
RedBloodCell.COLOR = '#fc8383';
RedBloodCell.ID = 'redBloodCell';

RedBloodCell.prototype.update = function() {
  Cell.prototype.update.call(this, (function() {
    if(this.health === this.maxHealth && this.options.seek.enabled) {
      this.automataOptions = {
        seek: {
          enabled: false
        }
      };
    } else if (this.health < this.maxHealth && !this.options.seek.enabled) {
      this.automataOptions = {
        seek: {
          enabled: true
        }
      };
    }
    if(this.canBeDamaged) {
      this.game.physics.arcade.overlap(this, this.GameManager.get('enemies'), this.takeDamage, null, this);  
    }
    this.game.physics.arcade.overlap(this, this.GameManager.get('oxygen'), this.oxygenPickup, null, this);
  }).bind(this));

};

RedBloodCell.prototype.oxygenPickup = function(cell, oxygen) {
  if(this.health < this.maxHealth) {
    oxygen.kill();
    this.health++;
    this.oxygenSound.play();
    this.GameManager.get('player').health++;
  }
  if(this.health === this.maxHealth) {
    this.automataOptions = {
      seek: {
        enabled: false
      }
    };
  }
};

RedBloodCell.prototype.takeDamage = function() {
  
  this.GameManager.get('player').damage();
  this.health--;
  if (this.health === 0) {
    this.kill();
    this.deathSound.play();
    this.healthHUD.bar.kill();
  } else {
    this.ouchSound.play();
    this.canBeDamaged = false;
    this.automataOptions = {
      seek: {
        enabled: true
      },
      flee: {
        enabled: true,
      },
      evade: {
        enabled: false
      },
      forces: {
        maxVelocity: 400
      },
    };

    this.panicTween = this.game.add.tween(this).to({tint: 0x333333 }, 500, Phaser.Easing.Linear.NONE, true, 0, 5, true);
    this.panicTween.onComplete.add(function() {
      this.canBeDamaged = true;
      this.automataOptions = {
        evade: {
          enabled: true
        },
        flee: {
          enabled: false
        },
        forces: {
          maxVelocity: 200
        }
      };
    }, this);
  }
};




RedBloodCell.drawBody = function(ctx, size) {
  var color = RedBloodCell.COLOR;
  var lineColor = '#9a0b0b';
  ctx.lineWidth = 2;
  ctx.fillStyle = color;
  ctx.strokeStyle = lineColor;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - ctx.lineWidth, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.closePath();

};

module.exports = RedBloodCell;
