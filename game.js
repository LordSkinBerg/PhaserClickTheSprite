// main.js

// Wait for the DOM to be ready before starting the game
document.addEventListener('DOMContentLoaded', function () {
  // Phaser game configuration
  const config = {
    type: Phaser.AUTO,         // Automatically use WebGL or Canvas
    width: 800,                // Game width in pixels
    height: 600,               // Game height in pixels
    parent: 'game-container',  // Attach the game canvas to this DOM element
    backgroundColor: '#87CEEB',// Light blue background (for fallback or additional layers)
    scene: {
      preload: preload,        // Function to load assets
      create: create,          // Function to create game objects
      update: update           // Function called on every frame (if needed)
    },
    physics: {
      default: 'arcade',       // Simple arcade physics (not used heavily here)
      arcade: {
        gravity: { y: 0 },     // No gravity
        debug: false           // Disable debug visuals
      }
    }
  };

  // Create the Phaser game instance
  const game = new Phaser.Game(config);

  // Global game variables
  let savedText;      // Displays the count of sprites that were clicked ("saved")
  let countdownText;  // Displays remaining time
  let countdown = 20; // 60 seconds countdown

  // Preload assets: load two types of sprites and a background
  function preload() {
    this.load.svg('mascot', 'assets/mascot.svg');
    this.load.svg('character', 'assets/character.svg');
    this.load.svg('background', 'assets/background.svg');
  }

  // Create game objects and logic
  function create() {
    // Add the background image to the center of the canvas
    this.add.image(400, 300, 'background').setScale(4.5);

    // Initialize a counter for saved sprites (clicked and swirled off-screen)
    this.savedCount = 0;
    // Display the saved counter text in the top-left corner
    savedText = this.add.text(20, 20, 'Saved: 0', {
      font: '24px Yu Mincho',
      fill: '#000'
    });

    // Display the countdown timer in the top-right corner
    countdownText = this.add.text(600, 20, 'Time: 20', {
      font: '24px Yu Mincho',
      fill: '#000'
    });

    // Create a group to manage our spawned sprites
    this.spritesGroup = this.add.group();

    // Helper function to create a new sprite at a random position.
    // New sprites are spawned at a reduced initial scale (0.6) and slowly "inflate"
    // (scale increases from 0.6 to 0.72 over 15 seconds).
    const createRandomSprite = (scene) => {
      // Randomly choose between the two sprite types
      const spriteKey = Phaser.Math.Between(0, 1) === 0 ? 'mascot' : 'character';
      // Generate random x and y positions within defined bounds
      const x = Phaser.Math.Between(100, 700);
      const y = Phaser.Math.Between(100, 500);
      // Create the sprite with an initial scale of 0.6 (reduced size)
      let sprite = scene.add.sprite(x, y, spriteKey).setScale(0.2);
      // Enable input so the sprite can be clicked/tapped
      sprite.setInteractive();
      // Flag to prevent multiple click events on the same sprite
      sprite.clicked = false;

      // Tween: over 15 seconds, the sprite "inflates" (scale increases from 0.2 to 0.82)
      scene.tweens.add({
        targets: sprite,
        scale: { from: 0.2, to: 0.82 },
        duration: 15000,
        ease: 'Linear'
      });

      // Create a timer event: if the sprite is not clicked within 5 seconds, it will "pop"
      sprite.popTimer = scene.time.addEvent({
        delay: 5000,
        callback: function () {
          if (!sprite.clicked) {
            popSprite(sprite);
          }
        },
        callbackScope: scene
      });

      // Set up the click (pointerdown) event listener on the sprite
      sprite.on(
        'pointerdown',
        function () {
          if (sprite.clicked) return; // Prevent multiple clicks
          sprite.clicked = true;
          // Cancel the pop timer so the pop effect doesn’t trigger
          sprite.popTimer.remove();

          // Calculate random off-screen target coordinates for the swirl effect
          let targetX, targetY;
          const direction = Phaser.Math.Between(0, 3);
          switch (direction) {
            case 0: // fly off to the left
              targetX = -100;
              targetY = Phaser.Math.Between(0, 600);
              break;
            case 1: // fly off to the right
              targetX = 900;
              targetY = Phaser.Math.Between(0, 600);
              break;
            case 2: // fly off upwards
              targetX = Phaser.Math.Between(0, 800);
              targetY = -100;
              break;
            case 3: // fly off downwards
              targetX = Phaser.Math.Between(0, 800);
              targetY = 700;
              break;
          }
          // Tween: animate the swirl effect (rotation, movement, fade out)
          scene.tweens.add({
            targets: sprite,
            x: targetX,
            y: targetY,
            angle: sprite.angle + 720, // two full spins
            alpha: 0,
            duration: 500,
            ease: 'Cubic.easeOut',
            onComplete: function () {
              sprite.destroy();
              scene.savedCount++;
              savedText.setText('Saved: ' + scene.savedCount);
            },
            callbackScope: scene
          });
        },
        this
      );

      // Add the sprite to the group
      scene.spritesGroup.add(sprite);
    };

    // Initially spawn 15 sprites
    const initialSprites = 15;
    for (let i = 0; i < initialSprites; i++) {
      createRandomSprite(this);
    }

    // Every second, spawn only as many sprites as needed to bring the active count back up to 10.
    this.spawnTimer = this.time.addEvent({
      delay: 1000, // 1 second
      callback: () => {
        // Calculate how many sprites are missing (active sprites only)
        const activeCount = this.spritesGroup.getChildren().length;
        const missingCount = initialSprites - activeCount;
        for (let i = 0; i < missingCount; i++) {
          createRandomSprite(this);
        }
      },
      loop: true
    });

    // Countdown timer: update every second and end the game after 60 seconds
      this.countdownTimer = this.time.addEvent({
        delay: 1000,
        callback: () => {
          countdown--;
          countdownText.setText('Time: ' + countdown);
          if (countdown <= 0) {
            // Stop the countdown timer so it doesn't continue running
            this.countdownTimer.remove();
            endGame.call(this);
          }
        },
        loop: true
      });


    // Helper function: "pop" the sprite like a bubble when not clicked in time
      const scene = this; // capture the scene

      function popSprite(sprite) {
        // Use the captured scene variable instead of sprite.scene
        scene.tweens.add({
          targets: sprite,
          scale: sprite.scale * 1.2,
          alpha: 0,
          duration: 300,
          ease: 'Back.easeIn',
          onComplete: function () {
            sprite.destroy();
          }
        });
      }

    // Function to end the game: stops timers, disables interactions, and shows the final score with a Play Again button
    function endGame() {
      // Remove the spawn timer so no more sprites are created
      this.spawnTimer.remove();
      // Disable all remaining sprites' input events
      this.spritesGroup.getChildren().forEach((sprite) => {
        sprite.disableInteractive();
      });
          // Trigger the pop animation for all remaining sprites that haven't been clicked
          this.spritesGroup.getChildren().forEach((sprite) => {
            if (!sprite.clicked) {
              popSprite(sprite);
            }
          });
      // Display the Game Over message and final score
      const gameOverText = this.add.text(400, 300, 'Game Over\nSaved: ' + this.savedCount, {
        font: '32px Yu Mincho',
        fill: '#000',
        align: 'center'
      });
      gameOverText.setOrigin(0.5);

      // Add a "Play Again" button below the game over text
      const playAgainText = this.add.text(400, 400, 'Play Again', {
        font: '28px Yu Mincho',
        fill: '#007700',
        backgroundColor: '#ffffff',
        padding: { x: 10, y: 5 }
      });
      playAgainText.setOrigin(0.5);
      playAgainText.setInteractive({ useHandCursor: true });
        playAgainText.on('pointerdown', function () {
          this.scene.restart();
          countdown = 20; // Reset countdown for the new game
        }, this);
    }
  }


  // Update function: apply a gentle floating animation to every active sprite
  function update() {
    const time = this.time.now;
    this.spritesGroup.getChildren().forEach((sprite) => {
      // Apply a gentle floating (vertical bobbing) effect
      sprite.y += Math.sin(time / 500) * 0.5;
      // Apply a slight rotation effect
      sprite.angle = Math.sin(time / 1000) * 5;
    });
  }
});
