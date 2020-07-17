/*
  I believe the cue has the possibility of interfering with this function.
  Further testing should be done.
*/

GameState = class {
    constructor(gameLoop) {
        this.gameLoop = gameLoop;

        // 0 - opponent is shooting
        // 1 - player is shooting
        // 2 - temporary waiting stage
        this.shootingStage = 0;

    }

    updateShootingStage() {
        const playerTurnLoadingPixel = this.gameLoop.getPixel(PLAYER_TURN_PIXEL.x, PLAYER_TURN_PIXEL.y);
        const opponentTurnLoadingPixel = this.gameLoop.getPixel(OPPONENT_TURN_PIXEL.x, OPPONENT_TURN_PIXEL.y);
      
        // Transition from opponents turn to our turn
        // If opponents turn and we go green, it must be our turn to shoot
        if (this.shootingStage === 0 && playerTurnLoadingPixel[0] === 0 && playerTurnLoadingPixel[1] === 255 && playerTurnLoadingPixel[2] === 0) {
            console.log('opponent has finished turn');
            this.gameLoop.ballVision.detectBalls();
            this.shootingStage = 2;
            window.setTimeout(() => { 
                this.shootingStage = 1;
                console.log('player is ready to shoot');
            }, 200);
        }
      
        // if currently our turn
        if (this.shootingStage === 1) {
      
            // if opponent is green, we must have finished our turn to shoot
            if (opponentTurnLoadingPixel[0] === 0 && opponentTurnLoadingPixel[1] === 255 && opponentTurnLoadingPixel[2] === 0) {
                console.log('player has finished turn');
                // this.gameLoop.ballVision.detectBalls();
                this.shootingStage = 2;
                window.setTimeout(() => { 
                    this.shootingStage = 0;
                    console.log('opponent is read to shoot');
                }, 200);
            }
            
            // otherwise if we are green, player must have potted a ball
            else if (playerTurnLoadingPixel[0] === 0 && playerTurnLoadingPixel[1] === 255 && playerTurnLoadingPixel[2] === 0) {
                console.log('player has potted a ball');
                this.gameLoop.ballVision.detectBalls();
                this.shootingStage = 2;
                window.setTimeout(() => { 
                    this.shootingStage = 1;
                    console.log('player is ready to shoot');
                }, 200)
            }
        }
      
        document.getElementById('text').innerHTML = `${this.shootingStage}`;
    }
}
