
// // TEMP: First remove all existing overlay canvas's
// for (let oldOverlay of document.getElementsByClassName('overlay')) {
    
//     oldOverlay.parentNode.removeChild(oldOverlay)
// }


// Stop game loop before creating new one
if (typeof gameLoop !== 'undefined') gameLoop.stop();

gameLoop = new GameLoop();
gameLoop.loop();



// Determines whether or not player is in a game
// Only one of these points needs to be true for the player to be in a game
// The reason we have 2 is that the pool cue will occasionally cover up one of the points
// PLAYING_GAME_TEST_POINTS = [
//     // { x:523, y:60, r:79, g:75, b:95 },
//     // { x:631, y:60, r:84, g:81, b:100 }
//     { x:40, y:63, r:254, g:255, b:255 }
// ]
