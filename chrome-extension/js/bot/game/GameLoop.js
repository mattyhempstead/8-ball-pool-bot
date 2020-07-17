/*
    There will either be an uninterupted white circle with a white dot 
    in the middle,
    or there will be an uninterupted red circle with a red ascending 
    diagonal line in the middle.

    For the white circle, the centre dot will have a small line which
    extends in the direction the cue ball will follow.

    Seems to be radius of 10px
    Definely drawn as colour #FFF, yet the anti-aliasing means most pixels 
    are not exactly white.


*/

console.log('GameLoop.js');

GameLoop = class {
    constructor() {
        this.loopAnimationFrame = undefined;

        this.fps = {
            frameCount: 0,
            nextFrameTimestamp: 1000,
            fps: 0,
        };

        this.gameCanvas = undefined;
        this.gameCtx = undefined;
        this.gamePixelsPrevious = undefined; //new Uint8ClampedArray(gl.drawingBufferWidth * gl.drawingBufferHeight * 4)
        this.gamePixels = undefined;

        this.overlayCanvas = undefined;
        this.overlayCtx = undefined;

        this.initGameCanvas();
        this.initOverlayCanvas();

        this.ballVision = new BallVision(this);
        this.gameState = new GameState(this);

    }

    initGameCanvas = () => {
        this.gameCanvas = document.getElementById('engine');
        this.gameCtx = this.gameCanvas.getContext("webgl2")
                    || this.gameCanvas.getContext('webgl');

        if (!this.gameCtx.getContextAttributes().preserveDrawingBuffer) {
            throw Error("webgl canvas context has attribute preserveDrawingBuffer set false and is thus not readable.");
        }
        
        // Just in case this ever becomes true and I don't realise this is causing issues
        if (this.gameCtx.drawingBufferWidth != gw || this.gameCtx.drawingBufferHeight != gh) {
            throw Error("Internal game resolution is not the same as canvas resolution.");
        }

        this.gamePixels = new Uint8Array(
            4
          * this.gameCtx.drawingBufferWidth 
          * this.gameCtx.drawingBufferHeight
        );
    }

    /**
     * Init a canvas which covers the main 8-ball-pool web app.
     */
    initOverlayCanvas = () => {
        this.overlayCanvas = document.querySelector('canvas.overlay');
        if (this.overlayCanvas === null) {
            this.overlayCanvas = document.createElement('canvas');
            this.overlayCanvas.setAttribute('class', 'overlay');
            this.overlayCanvas.width = gw;
            this.overlayCanvas.height = gh;
            this.overlayCanvas.style.width = gw;
            this.overlayCanvas.style.height = gh;
            this.overlayCanvas.style.position = 'absolute';
            this.overlayCanvas.style.top = '0';
            this.overlayCanvas.style.left = '0';
            this.overlayCanvas.style['z-index'] = '3';
            this.overlayCanvas.style['pointer-events'] = 'none';
            this.gameCanvas.insertAdjacentElement('afterend', this.overlayCanvas);
        }
        this.overlayCtx = this.overlayCanvas.getContext('2d');
    }

    loop = (timestamp=0) => {
        // Store the previous frame game pixels before next read
        this.gamePixelsPrevious = new Uint8ClampedArray(this.gamePixels);
        
        // Read pool game canvas pixels
        this.gameCtx.readPixels(
            0,
            0,
            this.gameCtx.drawingBufferWidth,
            this.gameCtx.drawingBufferHeight,
            this.gameCtx.RGBA,
            this.gameCtx.UNSIGNED_BYTE,
            this.gamePixels
        );
    
        this.renderOverlay(timestamp);
    
        if (this.isPlayingGame()) {
    
            // Draw rect around pool table
            this.overlayCtx.strokeStyle = '#55ff55';
            this.overlayCtx.lineWidth = 4;
            this.overlayCtx.beginPath();
            this.overlayCtx.rect(
                tableRectInner.x,
                tableRectInner.y,
                tableRectInner.w,
                tableRectInner.h
            );
            this.overlayCtx.stroke()
    
            // Draw rect around pool table
            this.overlayCtx.strokeStyle = '#55ff55';
            this.overlayCtx.lineWidth = 4;
            this.overlayCtx.beginPath();
            this.overlayCtx.rect(
                tableRectOuter.x,
                tableRectOuter.y,
                tableRectOuter.w,
                tableRectOuter.h
            );
            this.overlayCtx.stroke();
    
            this.gameState.updateShootingStage();
    
            


            // Find the position of the aim circle
            // let aimCircle = findAimCircle();
        
            // // Extend the aim line
            // if (aimCircle) extendAimLine(aimCircle);
    
            // if (aimCircle) {
            //     // Draw red dot in center of aim circle
            //     drawCircle(aimCircle.x, aimCircle.y, 1, 'red');
            // }
        }
    
        this.loopAnimationFrame = window.requestAnimationFrame(this.loop);
    }

    /**
     * Render the game overlay
     */
    renderOverlay = (timestamp) => {
        this.overlayCtx.clearRect(0, 0, gw, gh);

        // Calculate and render fps
        this.fps.frameCount++;
        if (timestamp >= this.fps.nextFrameTimestamp) {
            this.fps.nextFrameTimestamp = timestamp + 1000;
            this.fps.fps = this.fps.frameCount;
            this.fps.frameCount = 0;
        }
        this.overlayCtx.font = "16px Arial";
        this.overlayCtx.fillStyle = '#00ff00';
        this.overlayCtx.fillText(this.fps.fps, 5, 20);
    
        // Draw a border to show cheat mode activated
        this.overlayCtx.strokeStyle = 'red';
        this.overlayCtx.lineWidth = 4;
        this.overlayCtx.beginPath();
        this.overlayCtx.rect(0, 0, gw, gh);
        this.overlayCtx.stroke();
    }

    /**
     * Returns the index in the gamePixels array of a given (x,y) coord on gameCanvas
     */
    getIndex = (x, y) => {
        return 4 * ((gh - y) * gw + x);
    }

    /**
     * Returns the pixel colour array of a given (x,y) coord on gameCanvas.
     * @returns {Array} [r,g,b] array
     */
    getPixel = (x, y) => {
        return [
            this.gamePixels[this.getIndex(x,y)],
            this.gamePixels[this.getIndex(x,y)+1],
            this.gamePixels[this.getIndex(x,y)+2]
        ];
    }

    /**
     * Returns how white/bright a pixel at (x,y) on gameCanvas is.
     * Index is assumed to be the index of the red value in the pixel.
     * Returns a number between 0 - 765 (lower is whiter)
     */
    getWhiteness = (index) => {
        return (
            this.gamePixels[index]
          + this.gamePixels[index + 1]
          + this.gamePixels[index + 2]
        );
    }

    /**
     * Returns whether player is current in a pool game.
     */
    isPlayingGame = () => {
        const testPixelA = this.getPixel(30, 77);
        const testPixelB = this.getPixel(30, 50);
        return (
            (testPixelA[0] >= 250 && testPixelA[1] >= 250 && testPixelA[2] >= 250)
         || (testPixelB[0] >= 250 && testPixelB[1] >= 250 && testPixelB[2] >= 250)
        );
    }


    renderAimLines = () => {
        
    }

}
