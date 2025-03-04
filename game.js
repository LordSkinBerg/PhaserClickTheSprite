// Click the Sprite - A Phaser learning game
// This game demonstrates core Phaser concepts:
// - Game setup and configuration
// - Loading assets
// - Creating and manipulating sprites
// - Handling user input (clicks)
// - Updating game state (score)

// Wait for the DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Game configuration object
    const config = {
        type: Phaser.AUTO,         // Let Phaser decide whether to use WebGL or Canvas
        width: 800,                // Game width in pixels
        height: 600,               // Game height in pixels
        parent: 'game-container',  // ID of the DOM element to append the game canvas to
        backgroundColor: '#87CEEB', // Light blue background
        scene: {
            preload: preload,      // Function to load assets
            create: create,        // Function to create game objects
            update: update         // Function called on every frame update
        },
        physics: {
            default: 'arcade',     // Simple physics system
            arcade: {
                gravity: { y: 0 }, // No gravity
                debug: false       // No debug visuals
            }
        }
    };

    // Create a new Phaser game instance
    const game = new Phaser.Game(config);

    // Game variables
    let character;
    let scoreText;
    let score = 0;
    let clickTime = 0;
    
    // Preload function - loads assets before the game starts
    function preload() {
        // Load character sprite
        this.load.svg('character', 'assets/character.svg');
        // Load background
        this.load.svg('background', 'assets/background.svg');
    }

    // Create function - sets up the game objects
    function create() {
        // Add background
        this.add.image(400, 300, 'background');
        
        // Create the character sprite in the center of the screen
        character = this.add.sprite(400, 300, 'character').setScale(0.5);
        
        // Make the character interactive (clickable)
        character.setInteractive();
        
        // Add a pointerdown event listener (detects mouse clicks or touches)
        character.on('pointerdown', function(pointer) {
            // Increase score
            score += 1;
            
            // Update score text
            scoreText.setText('Score: ' + score);
            
            // Record click time for animation purposes
            clickTime = this.scene.time.now;
            
            // Temporarily scale down the character when clicked (visual feedback)
            this.setScale(0.45);
            
            // Add a tween to bounce the character back to normal size
            this.scene.tweens.add({
                targets: this,
                scale: 0.5,
                duration: 200,
                ease: 'Bounce.Out'
            });
            
            // Randomly move the character to a new position
            const newX = Phaser.Math.Between(100, 700);
            const newY = Phaser.Math.Between(100, 500);
            
            this.scene.tweens.add({
                targets: this,
                x: newX,
                y: newY,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        // Create score text
        scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#000',
            fontFamily: 'Arial'
        });
        
        // Add instructional text
        const instructionText = this.add.text(400, 550, 'Click on the character!', {
            fontSize: '24px',
            fill: '#000',
            fontFamily: 'Arial'
        });
        instructionText.setOrigin(0.5); // Center the text
    }

    // Update function - called on every frame
    function update() {
        // Add a gentle floating animation to the character
        // This is separate from the click animation
        const time = this.time.now;
        character.y += Math.sin(time / 500) * 0.5;
        
        // Rotate the character slightly based on time
        character.angle = Math.sin(time / 1000) * 5;
    }
});
