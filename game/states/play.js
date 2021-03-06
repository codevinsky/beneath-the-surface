
  'use strict';
  var Player = require('../prefabs/player');
  var RedBloodCell = require('../prefabs/redBloodCell');
  var Hemoglobin = require('../prefabs/hemoglobin');
  var Oxygen = require('../prefabs/oxygen');
  var IntroManager = require('../plugins/IntroManager');
  var LevelManager = require('../plugins/LevelManager');
  var GameManager = require('../plugins/GameManager');

  function Play() {}
  Play.prototype = {
    create: function() {
      // inits
      GameManager.clearCache();
      this.score = 0;
      this.hemoCount = 0;
      this.hemoMax = 10;
      this.maxBloodcells = 5;
      this.levelCount = 1;
      this.level = LevelManager.get(this.levelCount);
      this._levelCache = null;
      this.introManager = new IntroManager(this.game);
      this.game.physics.startSystem(Phaser.Physics.ARCADE);
      GameManager.add('volume',1);

      

      // timers
      this.respawnTimer = 0;
      this.oxygenTimer = 0;

      // background
      this.background = this.game.add.sprite(0,0);
      this.background.width = this.game.width;
      this.background.height = this.game.height;
      
      //filters
      this.plasma = this.game.add.filter('Plasma', this.game.width, this.game.height);
      this.plasma.size = 0.003;
      this.plasma.blueShift = 0.0;
      this.plasma.greenShift = 0.0;
      this.plasma.redShift = 0.3;
      this.plasma.alpha = 0.15;
      this.background.filters = [this.plasma];

      

      
      // huds
      this.gamehud = Phaser.Plugin.HUDManager.create(this.game, this, 'gamehud');
      this.enemyhud = Phaser.Plugin.HUDManager.create(this.game, this, 'cellhud');
      this.friendlyhud = Phaser.Plugin.HUDManager.create(this.game, this, 'friendlyhud');



      // trackers
      this.hemoTracker = this.gamehud.addBar(this.game.width - 160, 20, 300, 20, this.hemoMax, 'hemoCount', this, '#c820ff','#761397' );
      this.hemoTracker.bar.anchor.setTo(0.5, 0.5);
      this.hemoTracker.bar.alpha = 0.5;
      this.game.add.existing(this.hemoTracker.bar);
      this.hemoTracker.bar.visible = false;

      

      // labels
      var style = { font: '18px Audiowide', fill: '#ffffff', align: 'center', stroke: '#333', strokeThickness: 3};
      this.hemoLabel = this.game.add.text(this.hemoTracker.bar.x, this.hemoTracker.bar.y, 'HEMOGLOBINS', {fill:'#761397', font:'bold 14px Audiowide'});
      this.hemoLabel.anchor.setTo(0.5, 0.5);
      this.hemoLabel.visible = false;

      

      this.scoreHUD = this.gamehud.addText(10, 10, 'Score: ', style, 'score', this);
      this.game.add.existing(this.scoreHUD.text);

      

      var levelStyle = { font: '36px Audiowide', fill: '#ffffff', align: 'center', stroke: '#333', strokeThickness: 3};
      var taglineStyle = { font: '24px Audiowide', fill: '#ffffff', align: 'center', stroke: '#333', strokeThickness: 3};
      this.levelLabel = this.game.add.text(this.game.width, 0, 'LEVEL: ' + this.level.id, levelStyle);
      this.levelLabel.alpha = 0.5;
      this.levelTagline = this.game.add.text(this.game.width, 0, '' + this.level.id, taglineStyle);
      this.levelTagline.alpha = 0.5;

      this.pausedText = this.game.add.group();
      var pausedLabel = this.game.add.text(this.game.width/2, this.game.height * 0.25, 'PAUSED', {
        fill: 'white', 
        stroke:'black', 
        font:'bold 24px Audiowide', 
        strokeThickness: 3
      });
      pausedLabel.anchor.setTo(0.5);
      var continueLabel = this.game.add.text(this.game.width/2, this.game.height * 0.25 + 30, 'Press Space to continue', {
        fill: 'white', 
        stroke:'black', 
        font:'12px Audiowide',
        strokeThickness: 1
      });
      continueLabel.anchor.setTo(0.5);
      this.pausedText.add(pausedLabel);
      this.pausedText.add(continueLabel);
      this.pausedText.visible = false;
      

      

      // sprites
      this.player = new Player(this.game, this.game.world.centerX, this.game.world.centerY, 16, 'white');
      this.game.add.existing(this.player);
      

      // groups
      this.oxygen = this.game.add.group();
      this.enemies = this.game.add.group();
      this.hemoglobins = this.game.add.group();
      this.redBloodCells = this.game.add.group();
      this.intros = this.game.add.group();
      this.swine = this.game.add.group();

      this.redBloodCells.add(this.player);


      // game manager populator
      GameManager.add('player', this.player);
      GameManager.add('enemies', this.enemies);
      GameManager.add('friendlies', this.redBloodCells);
      GameManager.add('oxygen', this.oxygen);
      GameManager.add('swine', this.swine);
      // init red bloodcells
      var i;
      for(i = 0; i < this.maxBloodcells; i++) {
        var friendly = new RedBloodCell(this.game, this.game.world.randomX, this.game.world.randomY, 16);
        this.redBloodCells.add(friendly);
      }

      // introduction queue
      
      this.introManager.queue('underMySkin');
      this.introManager.queue('whiteBloodCell');
      this.introManager.queue('redBloodCell');
      this.introManager.queue('oxygen');
      this.introManager.queue('commonCold');
      

      // sounds
      this.pickupSound = this.game.add.audio('hemoglobinPickup');

      // controls
      this.pauseKey = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
      this.pauseKey.onDown.add(this.togglePause, this);

      this.pauseKey = this.game.input.keyboard.addKey(Phaser.Keyboard.M);
      this.pauseKey.onDown.add(this.toggleMute, this);
      
      this.game.input.keyboard.addKeyCapture([Phaser.Keyboard.SPACEBAR, Phaser.Keyboard.W, Phaser.Keyboard.S, Phaser.Keyboard.A, Phaser.Keyboard.D]);

    },
    update: function() {
      this.plasma.update();
      if(this.introManager.length && !this.intros.getFirstExists(true)) {
          var intro = this.introManager.getNext();
          if (intro) {
            GameManager.pause();
            this.intros.add(intro);  
          }
        } 
      if (GameManager.getCurrentState() === GameManager.states.PAUSED) {
        this.pausedText.visible = true;
      } else {
        this.pausedText.visible = false;
          
          // spawn enemy
          if(this.respawnTimer < this.game.time.now && this.enemies.length < this.level.maxEnemies) {
            var reanimated = null;
            var targetEnemy = _.sample(this.level.enemyTypes);
            this.enemies.forEachDead(function(enemy) {
              if( targetEnemy.enemyClass.constructor === enemy.constructor) {
                reanimated = enemy;
                return false;
              }
            });
            if (!reanimated) {
              reanimated = new targetEnemy.enemyClass(this.game,0,0, targetEnemy.enemyClass.SIZE);
              this.enemies.add(reanimated);
            }

            reanimated.reset(this.game.world.randomX, this.game.world.randomY);
            reanimated.revive();
            this.introManager.queue(targetEnemy.id);
            this.respawnTimer = this.game.time.now + this.level.respawnRate;
          }

          // spawn oxygen
          if(this.oxygenTimer < this.game.time.now) {
            var oxygen = this.oxygen.getFirstExists(false);
            if(!oxygen) {
              oxygen = new Oxygen(this.game);
              this.oxygen.add(oxygen);
            }
            oxygen.revive();
            this.oxygenTimer = this.game.time.now + this.level.oxygenRate;
          }

          // show level label on new level
          if(this.level !== this._levelCache) {
            this.levelLabel.text = 'LEVEL: ' + this.level.id;
            this.levelTagline.text = this.level.tagline;
            this._levelCache = this.level;
            this.levelLabel.x = this.game.width;
            this.levelLabel.y = this.game.height / 2;
            this.levelTagline.x = this.game.width;
            this.levelTagline.y = this.game.height / 2 + 40;
            this.game.add.tween(this.levelLabel).to({x: -this.levelLabel.width}, 5000, Phaser.Easing.Linear.NONE, true);
            this.game.add.tween(this.levelTagline).to({x: -this.levelTagline.width}, 5000, Phaser.Easing.Linear.NONE, true);
            
          }

        // collisions  
        this.game.physics.arcade.overlap(this.player.bullets, this.enemies, this.enemyHit, null, this);
        this.game.physics.arcade.overlap(this.player, this.hemoglobins, this.hemoglobinHit, null, this);
        this.game.physics.arcade.overlap(this.player, this.enemies, this.playerHit, null, this);
      }
    },
    enemyHit: function(bullet, enemy) {
      bullet.kill();
      enemy.damage(1);
      if(enemy.health === 0) {
        enemy.kill();
        this.score++;
        //increase level
        if(this.level.maxEnemies <= this.enemies.countDead() && this.enemies.countLiving() === 0) {
          this.enemies.removeAll();
          this.levelCount++;
          this.level = LevelManager.get(this.levelCount);
        }
        if(this.redBloodCells.countLiving() - 1 < this.maxBloodcells && this.game.rnd.realInRange(0,1) < enemy.constructor.HEMOCHANCE) {
          this.hemoTracker.bar.visible = true;
          this.hemoLabel.visible = true;
          var hemo = this.hemoglobins.getFirstExists(false);
          if(!hemo) {
            hemo = new Hemoglobin(this.game, 0,0);
            this.hemoglobins.add(hemo);
          }
          this.respawnTimer = this.game.time.now + this.level.respawnRate;
          this.introManager.queue('hemo');
          hemo.reset(enemy.x, enemy.y);
          hemo.revive();
        }
      } else {

      }
    },
    hemoglobinHit: function(player, hemo) {
      if(this.redBloodCells.countLiving() - 1 < this.maxBloodcells) {
        hemo.kill();
        this.pickupSound.play('',0,GameManager.get('mute'));
        this.hemoCount++;
        if(this.hemoCount === this.hemoMax) {
          this.hemoCount = 0;
          var bloodCell = this.redBloodCells.getFirstExists(false);
          if(!bloodCell) {
            bloodCell = new RedBloodCell(this.game, 0,0);
            this.redBloodCells.add(bloodCell);
          }
          var spawnLocation = new Phaser.Point(this.game.world.randomX, this.game.world.randomY);
          bloodCell.reset(spawnLocation.x, spawnLocation.y, bloodCell.maxHealth);
          bloodCell.revive();
          player.health += bloodCell.health;
          
        }
      }
    },
    playerHit: function(player, enemy) {
      enemy.kill();
      console.log('player hit');
      
      if(this.redBloodCells.countLiving() > 1) {
        var friendly = null;
        var i = 0;
        while(friendly instanceof RedBloodCell === false || !friendly.exists) {
          friendly = this.redBloodCells.getAt(i);
          i++;
        }
        friendly.takeDamage();
      } else {
        player.kill();
        this.introManager.queue('death');
      }
    },
    togglePause: function() {
      if(!this.intros.getFirstExists(true)) {
        if(GameManager.getCurrentState() === GameManager.states.ACTIVE) {
          GameManager.pause();
        } else {
          GameManager.unpause();
        }
      }
    },
    toggleMute: function() {
      GameManager.set('mute', Number(!GameManager.get('mute')));
    }
  };
  
  module.exports = Play;