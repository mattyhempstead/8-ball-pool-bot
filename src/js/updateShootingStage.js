
/*
  I believe the cue has the possibility of interfering with this function.
  Further testing should be done.
*/


PLAYER_TURN_PIXEL = { x:475, y:16 };
OPPONENT_TURN_PIXEL = { x:690, y:16 };

// 0 - opponent is shooting
// 1 - player is shooting
// 2 - temporary waiting stage
shootingStage = 0; 


/**
 * Updates the shooting stage to reflect the player who is currently shooting
 */
function updateShootingStage() {    
  const playerTurnLoadingPixel = getPixel(PLAYER_TURN_PIXEL.x, PLAYER_TURN_PIXEL.y)
  const opponentTurnLoadingPixel = getPixel(OPPONENT_TURN_PIXEL.x, OPPONENT_TURN_PIXEL.y)

  // Transition from opponents turn to our turn
  // If opponents turn and we go green, it must be our turn to shoot
  if (shootingStage === 0 && playerTurnLoadingPixel[0] === 0 && playerTurnLoadingPixel[1] === 255 && playerTurnLoadingPixel[2] === 0) {
      console.log('opponent has finished turn')
      detectBalls();
      shootingStage = 2
      window.setTimeout(() => { 
          shootingStage = 1
          console.log('player is ready to shoot')
      }, 200)
  }

  // if currently our turn
  if (shootingStage === 1) {

      // if opponent is green, we must have finished our turn to shoot
      if (opponentTurnLoadingPixel[0] === 0 && opponentTurnLoadingPixel[1] === 255 && opponentTurnLoadingPixel[2] === 0) {
          console.log('player has finished turn')
        //   detectBalls();
          shootingStage = 2
          window.setTimeout(() => { 
              shootingStage = 0
              console.log('opponent is read to shoot')
          }, 200)
      }
      
      // otherwise if we are green, player must have potted a ball
      else if (playerTurnLoadingPixel[0] === 0 && playerTurnLoadingPixel[1] === 255 && playerTurnLoadingPixel[2] === 0) {
          console.log('player has potted a ball')
          detectBalls();
          shootingStage = 2
          window.setTimeout(() => { 
              shootingStage = 1
              console.log('player is ready to shoot')
          }, 200)
      }
  }

  document.getElementById('text').innerHTML = `${shootingStage}`

}
