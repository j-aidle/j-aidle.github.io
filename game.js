var playButton;
var currentHealth = 3;
var lifeText = "";
var scoreText;
var score=0;
var music;

var scene1 = new Phaser.Class({

  Extends: Phaser.Scene,
  initialize: function() {
        Phaser.Scene.call(this, { "key": "scene1" });
  },
  init: function() {},

  preload: function() {
    this.load.image('arcade', 'assets/images/arcade.png');

    this.load.audio('sc', ['assets/audio/sc.mp3', 'assets/audio/sc.ogg']);
  },
  create: function() {
    const backgroundImg = this.add.image(0, 0, 'arcade').setOrigin(0, 0);
    backgroundImg.setScale(2, 1.2);
    currentHealth = 3;
    score=0;    
    const helloButton = this.add.text(300, 500, 'Play!', { fontSize: '32px',fill: '#0f0' });
    helloButton.setInteractive();

    music = this.sound.add('sc');

    music.play();

    this.input.once('pointerdown', function () {
            this.scene.start('scene2');
            music.stop();
        }, this);

  }
});

var scene2 = new Phaser.Class({

  Extends: Phaser.Scene,
  initialize: function() {
        Phaser.Scene.call(this, { "key": "scene2" });
  },
  preload: function() {
    // Image layers from Tiled can't be exported to Phaser 3 (as yet)
    // So we add the background image separately
    this.load.image('background', 'assets/images/background.png');
    // Load the tileset image file, needed for the map to know what
    // tiles to draw on the screen
    this.load.image('tiles', 'assets/tilesets/platformPack_tilesheet.png');
    // Even though we load the tilesheet with the spike image, we need to
    // load the Spike image separately for Phaser 3 to render it
    this.load.image('spike', 'assets/images/spike.png');
    // Load the export Tiled JSON
    this.load.tilemapTiledJSON('map', 'assets/tilemaps/level1.json');
    // Load player animations from the player spritesheet and atlas JSON
    this.load.atlas('player', 'assets/images/kenney_player.png',
      'assets/images/kenney_player_atlas.json');

    this.load.image('star', 'assets/images/star.png');
    this.load.image('portal', 'assets/images/portal.png');

    this.load.audio('sc2', ['assets/audio/sc2.mp3', 'assets/audio/sc2.ogg']);
  },

  create: function() {
    // Create a tile map, which is used to bring our level in Tiled
    // to our game world in Phaser
    const map = this.make.tilemap({ key: 'map' });
    // Add the tileset to the map so the images would load correctly in Phaser
    const tileset = map.addTilesetImage('kenney_simple_platformer', 'tiles');
    // Place the background image in our game world
    const backgroundImage = this.add.image(0, 0, 'background').setOrigin(0, 0);
    // Scale the image to better match our game's resolution
    backgroundImage.setScale(2.65, 1.2);
    // Add the platform layer as a static group, the player would be able
    // to jump on platforms like world collisions but they shouldn't move
    const platforms = map.createLayer('Platforms', tileset, 0, 200);
    // There are many ways to set collision between tiles and players
    // As we want players to collide with all of the platforms, we tell Phaser to
    // set collisions for every tile in our platform layer whose index isn't -1.
    // Tiled indices can only be >= 0, therefore we are colliding with all of
    // the platform layer
    platforms.setCollisionByExclusion(-1, true);

    music = this.sound.add('sc2');

    music.play();

    // Add the player to the game world
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setBounce(0.1); // our player will bounce from items
    //this.player.setCollideWorldBounds(true); // don't go out of the map
    this.physics.add.collider(this.player, platforms);

    this.cameras.main.setBounds(64, 0, 2560, 500);
    //this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
    this.cameras.main.startFollow(this.player);
    //this.cameras.main.setZoom(1.2);

    // Create the walking animation using the last 2 frames of
    // the atlas' first row
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNames('player', {
        prefix: 'robo_player_',
        start: 2,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1
    });

    // Create an idle animation i.e the first frame
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'player', frame: 'robo_player_0' }],
      frameRate: 10,
    });

    // Use the second frame of the atlas for jumping
    this.anims.create({
      key: 'jump',
      frames: [{ key: 'player', frame: 'robo_player_1' }],
      frameRate: 10,
    });

    // Enable user input via cursor keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create a sprite group for all spikes, set common properties to ensure that
    // sprites in the group don't move via gravity or by player collisions
    this.spikes = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.stars = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.portals = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Get the spikes from the object layer of our Tiled map. Phaser has a
    // createFromObjects function to do so, but it creates sprites automatically
    // for us. We want to manipulate the sprites a bit before we use them
    const spikeObjects = map.getObjectLayer('Spikes')['objects'];
    spikeObjects.forEach(spikeObject => {
      // Add new spikes to our sprite group
      const spike = this.spikes.create(spikeObject.x, spikeObject.y + 200 - spikeObject.height, 'spike').setOrigin(0, 0);
      // By default the sprite has loads of whitespace from the base image, we
      // resize the sprite to reduce the amount of whitespace used by the sprite
      // so collisions can be more precise
      spike.body.setSize(spike.width, spike.height - 20).setOffset(0, 20);
    });

    // Add collision between the player and the spikes
    this.physics.add.collider(this.player, this.spikes, this.playerHit, null, this);


    const starObjects = map.getObjectLayer('Stars')['objects'];
    starObjects.forEach(starObject => {
      // Add new spikes to our sprite group
      const star = this.stars.create(starObject.x, starObject.y + 200 - starObject.height, 'star').setOrigin(0, 0);
      // By default the sprite has loads of whitespace from the base image, we
      // resize the sprite to reduce the amount of whitespace used by the sprite
      // so collisions can be more precise
      star.body.setSize(star.width, star.height - 20).setOffset(0, 20);
    });

    const portalObjects = map.getObjectLayer('Door')['objects'];
    portalObjects.forEach(portalObject => {
      // Add new spikes to our sprite group
      const portal = this.portals.create(portalObject.x, portalObject.y + 200 - portalObject.height, 'portal').setOrigin(0, 0);
      // By default the sprite has loads of whitespace from the base image, we
      // resize the sprite to reduce the amount of whitespace used by the sprite
      // so collisions can be more precise
      portal.body.setSize(portal.width, portal.height - 20).setOffset(0, 20);
    });

    scoreText = this.add.text(50, 10, 'Score: 0', { fontSize: '32px', fill: '#000' });
    scoreText.setScrollFactor(0);
    lifeText = this.add.text(650,10,"Vida:"+currentHealth, { fontSize: '32px',fill: '#000000' });
    lifeText.setScrollFactor(0);

    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.player, this.portals, this.goToPortal, null, this);
    //this.physics.add.collider(this.player, this.portals, this.goToPortal, null, this);
    //this.physics.add.collider(this.player, this.portals, this.goToPortal);
  },

  update: function() {
    // Control the player with left or right keys
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
      if (this.player.body.onFloor()) {
        this.player.play('walk', true);
      }
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
      if (this.player.body.onFloor()) {
        this.player.play('walk', true);
      }
    } else {
      // If no keys are pressed, the player keeps still
      this.player.setVelocityX(0);
      // Only show the idle animation if the player is footed
      // If this is not included, the player would look idle while jumping
      if (this.player.body.onFloor()) {
        this.player.play('idle', true);
      }
    }

    // Player can jump while walking any direction by pressing the space bar
    // or the 'UP' arrow
    if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.body.onFloor()) {
      this.player.setVelocityY(-350);
      this.player.play('jump', true);
    }

    // If the player is moving to the right, keep them facing forward
    if (this.player.body.velocity.x > 0) {
      this.player.setFlipX(false);
    } else if (this.player.body.velocity.x < 0) {
      // otherwise, make them face the other side
      this.player.setFlipX(true);
    }
    if (currentHealth <0){
      score = 0;
      this.scene.start('scene1');
    }

  },

  playerHit: function(player, spike) {
    currentHealth -=1;
    //lifeText = null;
    //lifeText = this.add.text(300,100,"vida:"+currentHealth, { fill: '#000000' });
    lifeText.setText('Vida: ' + currentHealth);
    lifeText.fixedToCamera = true;
    // Set velocity back to 0
    player.setVelocity(0, 0);
    // Put the player back in its original position
    player.setX(100);
    player.setY(300);
    // Use the default `idle` animation
    //player.play('idle', true);
    // Set the visibility to 0 i.e. hide the player
    //player.setAlpha(0);
    // Add a tween that 'blinks' until the player is gradually visible
    //let tw = this.tweens.add({
    //  targets: player,
    //  alpha: 1,
    //  duration: 100,
    //  ease: 'Linear',
    //  repeat: 5,
    //});
  },

  collectStar: function(player, star)
  {

      score += 10;
      scoreText.setText('Score: ' + score);
      star.destroy();
  },

  goToPortal: function(player, portal)
  {
    this.scene.stop('scene2');
    music.stop();
    //this.scene.remove('scene2');
    portal.disableBody( true, true) ;
    this.scene.start('scene3');
  }
});


var scene3 = new Phaser.Class({

  Extends: Phaser.Scene,
  initialize: function() {
        Phaser.Scene.call(this, { "key": "scene3" });
  },
  preload: function() {
    // Image layers from Tiled can't be exported to Phaser 3 (as yet)
    // So we add the background image separately
    this.load.image('background', 'assets/images/background.png');
    // Load the tileset image file, needed for the map to know what
    // tiles to draw on the screen
    this.load.image('tiles', 'assets/tilesets/platformPack_tilesheet.png');
    // Even though we load the tilesheet with the spike image, we need to
    // load the Spike image separately for Phaser 3 to render it
    this.load.image('spike', 'assets/images/spike.png');
    // Load the export Tiled JSON
    this.load.tilemapTiledJSON('map2', 'assets/tilemaps/level2.json');
    // Load player animations from the player spritesheet and atlas JSON
    this.load.atlas('player', 'assets/images/kenney_player.png',
      'assets/images/kenney_player_atlas.json');

    this.load.image('star', 'assets/images/star.png');
    this.load.image('meta', 'assets/images/meta.png');
    
    this.load.audio('sc3', ['assets/audio/sc3.mp3', 'assets/audio/sc3.ogg']);
  },

  create: function() {
    // Create a tile map, which is used to bring our level in Tiled
    // to our game world in Phaser
    const map = this.make.tilemap({ key: 'map2' });
    // Add the tileset to the map so the images would load correctly in Phaser
    const tileset = map.addTilesetImage('kenney_simple_platformer', 'tiles');
    // Place the background image in our game world
    const backgroundImage = this.add.image(0, 0, 'background').setOrigin(0, 0);
    // Scale the image to better match our game's resolution
    backgroundImage.setScale(2.65, 1.2);
    // Add the platform layer as a static group, the player would be able
    // to jump on platforms like world collisions but they shouldn't move
    const platforms = map.createLayer('Platforms', tileset, 0, 200);
    // There are many ways to set collision between tiles and players
    // As we want players to collide with all of the platforms, we tell Phaser to
    // set collisions for every tile in our platform layer whose index isn't -1.
    // Tiled indices can only be >= 0, therefore we are colliding with all of
    // the platform layer
    platforms.setCollisionByExclusion(-1, true);

    music = this.sound.add('sc3');

    music.play();

    // Add the player to the game world
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setBounce(0.1); // our player will bounce from items
    //this.player.setCollideWorldBounds(true); // don't go out of the map
    this.physics.add.collider(this.player, platforms);

    this.cameras.main.setBounds(64, 0, 2560, 500);
    //this.cameras.main.startFollow(this.player, true, 0.2, 0.2);
    this.cameras.main.startFollow(this.player);
    //this.cameras.main.setZoom(1.2);
    // Create the walking animation using the last 2 frames of
    // the atlas' first row
    this.anims.create({
      key: 'walk',
      frames: this.anims.generateFrameNames('player', {
        prefix: 'robo_player_',
        start: 2,
        end: 3,
      }),
      frameRate: 10,
      repeat: -1
    });

    // Create an idle animation i.e the first frame
    this.anims.create({
      key: 'idle',
      frames: [{ key: 'player', frame: 'robo_player_0' }],
      frameRate: 10,
    });

    // Use the second frame of the atlas for jumping
    this.anims.create({
      key: 'jump',
      frames: [{ key: 'player', frame: 'robo_player_1' }],
      frameRate: 10,
    });

    // Enable user input via cursor keys
    this.cursors = this.input.keyboard.createCursorKeys();

    // Create a sprite group for all spikes, set common properties to ensure that
    // sprites in the group don't move via gravity or by player collisions
    this.spikes = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.stars = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    this.metes = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Get the spikes from the object layer of our Tiled map. Phaser has a
    // createFromObjects function to do so, but it creates sprites automatically
    // for us. We want to manipulate the sprites a bit before we use them
    const spikeObjects = map.getObjectLayer('Spikes')['objects'];
    spikeObjects.forEach(spikeObject => {
      // Add new spikes to our sprite group
      const spike = this.spikes.create(spikeObject.x, spikeObject.y + 200 - spikeObject.height, 'spike').setOrigin(0, 0);
      // By default the sprite has loads of whitespace from the base image, we
      // resize the sprite to reduce the amount of whitespace used by the sprite
      // so collisions can be more precise
      spike.body.setSize(spike.width, spike.height - 20).setOffset(0, 20);
    });

    // Add collision between the player and the spikes
    this.physics.add.collider(this.player, this.spikes, this.playerHit, null, this);


    const starObjects = map.getObjectLayer('Stars')['objects'];
    starObjects.forEach(starObject => {
      // Add new spikes to our sprite group
      const star = this.stars.create(starObject.x, starObject.y + 200 - starObject.height, 'star').setOrigin(0, 0);
      // By default the sprite has loads of whitespace from the base image, we
      // resize the sprite to reduce the amount of whitespace used by the sprite
      // so collisions can be more precise
      star.body.setSize(star.width, star.height - 20).setOffset(0, 20);
    });

    const metaObjects = map.getObjectLayer('Meta')['objects'];
    metaObjects.forEach(metaObject => {
      // Add new spikes to our sprite group
      const meta = this.metes.create(metaObject.x, metaObject.y + 200 - metaObject.height, 'meta').setOrigin(0, 0);
      // By default the sprite has loads of whitespace from the base image, we
      // resize the sprite to reduce the amount of whitespace used by the sprite
      // so collisions can be more precise
      meta.body.setSize(meta.width, meta.height - 20).setOffset(0, 20);
    });

    scoreText = this.add.text(50, 10, 'Score:'+score, { fontSize: '32px', fill: '#000' });
    scoreText.setScrollFactor(0);
    lifeText = this.add.text(650,10,"Vida:"+currentHealth, { fontSize: '32px',fill: '#000000' });
    lifeText.setScrollFactor(0);

    this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
    this.physics.add.overlap(this.player, this.metes, this.goToEnd, null, this);
  },

  update: function() {
    // Control the player with left or right keys
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-200);
      if (this.player.body.onFloor()) {
        this.player.play('walk', true);
      }
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(200);
      if (this.player.body.onFloor()) {
        this.player.play('walk', true);
      }
    } else {
      // If no keys are pressed, the player keeps still
      this.player.setVelocityX(0);
      // Only show the idle animation if the player is footed
      // If this is not included, the player would look idle while jumping
      if (this.player.body.onFloor()) {
        this.player.play('idle', true);
      }
    }

    // Player can jump while walking any direction by pressing the space bar
    // or the 'UP' arrow
    if ((this.cursors.space.isDown || this.cursors.up.isDown) && this.player.body.onFloor()) {
      this.player.setVelocityY(-350);
      this.player.play('jump', true);
    }

    // If the player is moving to the right, keep them facing forward
    if (this.player.body.velocity.x > 0) {
      this.player.setFlipX(false);
    } else if (this.player.body.velocity.x < 0) {
      // otherwise, make them face the other side
      this.player.setFlipX(true);
    }
    if (currentHealth <0){
      score = 0;
      this.scene.start('scene1');
    }

  },

  playerHit: function(player, spike) {
    currentHealth -=1;
    //lifeText = null;
    //lifeText = this.add.text(300,100,"vida:"+currentHealth, { fill: '#000000' });
    lifeText.setText('Vida: ' + currentHealth);
    lifeText.fixedToCamera = true;
    // Set velocity back to 0
    player.setVelocity(0, 0);
    // Put the player back in its original position
    player.setX(100);
    player.setY(300);
    // Use the default `idle` animation
    //player.play('idle', true);
    // Set the visibility to 0 i.e. hide the player
    //player.setAlpha(0);
    // Add a tween that 'blinks' until the player is gradually visible
    //let tw = this.tweens.add({
    //  targets: player,
    //  alpha: 1,
    //  duration: 100,
    //  ease: 'Linear',
    //  repeat: 5,
    //});
  },

  collectStar: function(player, star)
  {

      score += 10;
      scoreText.setText('Score: ' + score);
      star.destroy();
  },

  goToEnd: function(player, meta)
  {
    this.scene.stop('scene2');
    music.stop();  
    //this.scene.remove('scene3');
    meta.disableBody( true, true) ;
    this.scene.start('scene4');
  }
});

var scene4 = new Phaser.Class({

  Extends: Phaser.Scene,
  initialize: function() {
        Phaser.Scene.call(this, { "key": "scene4" });
  },
  init: function() {},

  preload: function() {
    //this.load.image('arcade', 'assets/images/arcade.png');
    this.load.audio('sc', ['assets/audio/sc.mp3', 'assets/audio/sc.ogg']);
  },
  create: function() {
    //const backgroundImg = this.add.image(0, 0, 'arcade').setOrigin(0, 0);
    //backgroundImg.setScale(2, 1.2);
    this.add.text(300, 450, 'Puntuació:'+score, { fontSize: '32px',fill: '#0f0' });
    const inici = this.add.text(300, 550, 'Anar a inici', { fontSize: '32px',fill: '#0f0' });
    inici.setInteractive();
    music = this.sound.add('sc');

    music.play();

    this.input.once('pointerdown', function () {
          this.scene.start('scene1');
          music.stop();
        }, this);

  }
});

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 2850,
  heigth: 600,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [scene1,scene2,scene3,scene4],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 450 },
    },
  }
};

const game = new Phaser.Game(config);